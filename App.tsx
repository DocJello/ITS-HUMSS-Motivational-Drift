import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, AssessmentAttempt, Assessment, Topic } from './types';
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [fetchedUsers, fetchedAttempts, fetchedAssessments, fetchedTopics] = await Promise.all([
                    api.fetchUsers(),
                    api.fetchAttempts(),
                    api.fetchAssessments(),
                    api.fetchTopics()
                ]);
                setUsers(fetchedUsers);
                setAllAttempts(fetchedAttempts);
                setAssessments(fetchedAssessments);
                setTopics(fetchedTopics);
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
        const updatedAttempts = [...allAttempts, attempt];
        await api.saveAttempts(updatedAttempts);
        setAllAttempts(updatedAttempts);
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


    const renderDashboard = () => {
        if (!currentUser || isLoading) return null;
        
        const commonProps = {
            user: currentUser,
            onLogout: handleLogout,
        };

        switch (currentUser.role) {
            case Role.Admin:
                return <AdminDashboard {...commonProps} allAttempts={allAttempts} users={users} onUpdateUsers={handleUsersUpdate} />;
            case Role.Teacher:
                return <TeacherDashboard 
                    {...commonProps} 
                    user={currentUser} 
                    allAttempts={allAttempts} 
                    assessments={assessments} 
                    onUpdateAssessments={handleAssessmentsUpdate} 
                    topics={topics}
                    onUpdateTopics={handleTopicsUpdate}
                />;
            case Role.Student:
                return <StudentDashboard 
                    {...commonProps} 
                    allAttempts={allAttempts} 
                    onAddAttempt={addNewAttempt} 
                    assessments={assessments}
                    topics={topics}
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
