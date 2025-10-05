import React, { useState, useEffect } from 'react';
import { User, Role, AssessmentAttempt, Assessment, Topic, Question } from './types';
import * as api from './utils/api';
import LoginPage from './LoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allAttempts, setAllAttempts] = useState<AssessmentAttempt[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [fetchedUsers, fetchedAttempts, fetchedAssessments, fetchedTopics, fetchedQuestions] = await Promise.all([
                    api.fetchUsers(),
                    api.fetchAttempts(),
                    api.fetchAssessments(),
                    api.fetchTopics(),
                    api.fetchQuestions(),
                ]);
                setUsers(fetchedUsers);
                setAllAttempts(fetchedAttempts);
                setAssessments(fetchedAssessments);
                setTopics(fetchedTopics);
                setQuestions(fetchedQuestions);
            } catch (error) {
                console.error("Failed to load app data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const handleLogin = (username: string, role: Role): boolean => {
        const user = users.find(u => u.username === username && u.role === role);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };
    
    const addNewAttempt = async (attempt: AssessmentAttempt) => {
        const savedAttempt = await api.saveNewAttempt(attempt);
        setAllAttempts(prevAttempts => [...prevAttempts, savedAttempt]);
    };

    const handleUsersUpdate = async (updatedUsers: User[]) => {
        await api.updateUsers(updatedUsers);
        setUsers(updatedUsers);
    };

    const handleAssessmentsUpdate = async (updatedAssessments: Assessment[]) => {
        await api.updateAssessments(updatedAssessments);
        setAssessments(updatedAssessments);
    };
    
    const handleTopicsUpdate = async (updatedTopics: Topic[]) => {
        await api.updateTopics(updatedTopics);
        setTopics(updatedTopics);
    };
    
    const handleResetStudentData = async () => {
        await api.deleteAllStudentData();
        // Refetch data to update the UI across the app
        const [fetchedUsers, fetchedAttempts] = await Promise.all([
            api.fetchUsers(),
            api.fetchAttempts(),
        ]);
        setUsers(fetchedUsers);
        setAllAttempts(fetchedAttempts);
    };


    const renderDashboard = () => {
        if (!currentUser || isLoading) return null;
        
        const commonProps = {
            user: currentUser,
            onLogout: handleLogout,
        };

        switch (currentUser.role) {
            case Role.Admin:
                return <AdminDashboard 
                    {...commonProps} 
                    allAttempts={allAttempts} 
                    users={users} 
                    onUpdateUsers={handleUsersUpdate} 
                    onResetStudentData={handleResetStudentData}
                />;
            case Role.Teacher:
                return <TeacherDashboard 
                    {...commonProps} 
                    user={currentUser} 
                    users={users}
                    allAttempts={allAttempts} 
                    assessments={assessments} 
                    onUpdateAssessments={handleAssessmentsUpdate} 
                    topics={topics}
                    onUpdateTopics={handleTopicsUpdate}
                    questions={questions}
                />;
            case Role.Student:
                return <StudentDashboard 
                    {...commonProps} 
                    allAttempts={allAttempts} 
                    onAddAttempt={addNewAttempt} 
                    assessments={assessments}
                    topics={topics}
                    questions={questions}
                />;
            default:
                return null;
        }
    };

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900">
            {renderDashboard()}
        </div>
    );
};

export default App;