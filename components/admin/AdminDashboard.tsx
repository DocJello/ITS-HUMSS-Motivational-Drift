import React, { useState } from 'react';
import { User, AssessmentAttempt } from '../../types';
import Sidebar from '../shared/Sidebar';
import UserManagement from './UserManagement';
import ModelPerformance from './ModelPerformance';

interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
    allAttempts: AssessmentAttempt[];
    users: User[];
    onUpdateUsers: (updatedUsers: User[]) => Promise<void>;
    onResetStudentData: () => Promise<void>;
}

const NAV_ITEMS = [
    { name: 'Model Performance', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { name: 'User Management', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, allAttempts, users, onUpdateUsers, onResetStudentData }) => {
    const [activePage, setActivePage] = useState('Model Performance');

    const renderContent = () => {
        switch (activePage) {
            case 'User Management':
                return <UserManagement users={users} onUpdateUsers={onUpdateUsers} onResetStudentData={onResetStudentData} />;
            case 'Model Performance':
                return <ModelPerformance allAttempts={allAttempts} />;
            default:
                return <ModelPerformance allAttempts={allAttempts} />;
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