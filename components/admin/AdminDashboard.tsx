import React, { useState } from 'react';
import { User, AssessmentAttempt, Assessment, Topic, Question, AuditLog } from '../../types';
import Sidebar from '../shared/Sidebar';
import UserManagement from './UserManagement';
import ModelPerformance from './ModelPerformance';
import RecordManagement from './RecordManagement';
import AuditTrail from './AuditTrail';

interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
    allAttempts: AssessmentAttempt[];
    users: User[];
    onUpdateUsers: (updatedUsers: User[]) => Promise<void>;
    onResetStudentData: () => Promise<void>;
    assessments: Assessment[];
    topics: Topic[];
    questions: Question[];
    onRestoreData: (data: any) => Promise<void>;
    auditLogs: AuditLog[];
    logAction: (action: string, details?: string) => Promise<void>;
}

const NAV_ITEMS = [
    { name: 'Model Performance', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { name: 'User Management', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Record Management', icon: 'M3.375 19.5h17.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125zM16.5 7.875h.008v.008h-.008V7.875zM12.75 7.875h.008v.008h-.008V7.875zM9 7.875h.008v.008H9V7.875z' },
    { name: 'Audit Trail', icon: 'M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6H6v2.25H3.75V6zm0 6H6v2.25H3.75V12zm0 6H6v2.25H3.75V18z' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const { user, onLogout } = props;
    const [activePage, setActivePage] = useState('Model Performance');

    const renderContent = () => {
        switch (activePage) {
            case 'User Management':
                return <UserManagement 
                    users={props.users} 
                    onUpdateUsers={props.onUpdateUsers} 
                />;
            case 'Model Performance':
                return <ModelPerformance allAttempts={props.allAttempts} />;
            case 'Record Management':
                return <RecordManagement {...props} />;
            case 'Audit Trail':
                return <AuditTrail auditLogs={props.auditLogs} />;
            default:
                return <ModelPerformance allAttempts={props.allAttempts} />;
        }
    };

    return (
        <div className="flex h-screen">
            <Sidebar user={user} navItems={NAV_ITEMS} activeItem={activePage} setActiveItem={setActivePage} onLogout={onLogout} />
            <main className="flex-1 p-8 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;
