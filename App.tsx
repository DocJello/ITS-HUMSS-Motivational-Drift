import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, AssessmentAttempt, Assessment, Topic, Question, AuditLog } from './types';
import * as api from './utils/api';
import LoginPage from './LoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import { nanoid } from 'nanoid';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allAttempts, setAllAttempts] = useState<AssessmentAttempt[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [fetchedUsers, fetchedAttempts, fetchedAssessments, fetchedTopics, fetchedQuestions, fetchedLogs] = await Promise.all([
                api.fetchUsers(),
                api.fetchAttempts(),
                api.fetchAssessments(),
                api.fetchTopics(),
                api.fetchQuestions(),
                api.fetchAuditLogs()
            ]);
            setUsers(fetchedUsers);
            setAllAttempts(fetchedAttempts);
            setAssessments(fetchedAssessments);
            setTopics(fetchedTopics);
            setQuestions(fetchedQuestions);
            setAuditLogs(fetchedLogs);
        } catch (error) {
            console.error("Failed to load app data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        
        loadData();
    }, [loadData]);
    
    const logAction = useCallback(async (action: string, details?: string) => {
        if (!currentUser) return;
        const newLog: AuditLog = {
            id: nanoid(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            action,
            details,
        };
        const updatedLogs = await api.addAuditLog(newLog);
        setAuditLogs(updatedLogs);
    }, [currentUser]);


    // FIX: Changed return type to boolean to match LoginPage props.
    const handleLogin = (username: string, role: Role): boolean => {
        const user = users.find(u => u.username === username && u.role === role);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            // We can't use logAction here as currentUser is not set yet.
            // A direct call is necessary.
            const newLog: AuditLog = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                userId: user.id,
                userName: user.name,
                action: 'SYSTEM_LOGIN',
                details: `${user.role} user logged in.`,
            };
            api.addAuditLog(newLog).then(setAuditLogs);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        logAction('SYSTEM_LOGOUT', `${currentUser?.role} user logged out.`);
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
        logAction('USER_MANAGEMENT_UPDATE', `User list was updated. Total users: ${updatedUsers.length}`);
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
        await logAction('DATA_RESET', 'All student accounts and attempt data were deleted.');
        // Refetch data to update the UI across the app
        const [fetchedUsers, fetchedAttempts] = await Promise.all([
            api.fetchUsers(),
            api.fetchAttempts(),
        ]);
        setUsers(fetchedUsers);
        setAllAttempts(fetchedAttempts);
    };

    const handleRestoreData = async (data: any) => {
        await api.restoreAllData(data);
        await logAction('DATA_IMPORT', `Data restored from backup file. ${data.users.length} users, ${data.attempts.length} attempts.`);
        await loadData();
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
                    assessments={assessments}
                    topics={topics}
                    questions={questions}
                    onRestoreData={handleRestoreData}
                    auditLogs={auditLogs}
                    logAction={logAction}
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