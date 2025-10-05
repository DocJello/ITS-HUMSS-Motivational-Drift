import React from 'react';
import { User } from '../../types';

interface NavItem {
    name: string;
    icon: string; // SVG path
}

interface SidebarProps {
    user: User;
    navItems: NavItem[];
    activeItem: string;
    setActiveItem: (item: string) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, navItems, activeItem, setActiveItem, onLogout }) => {
    return (
        <div className="w-64 bg-white dark:bg-gray-800 flex flex-col h-full shadow-lg">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user.name}</h2>
                <span className="text-sm text-indigo-500 dark:text-indigo-400 font-semibold">{user.role}</span>
            </div>
            <nav className="flex-grow p-3">
                <ul>
                    {navItems.map(item => (
                        <li key={item.name}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setActiveItem(item.name); }}
                                className={`flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${activeItem === item.name ? 'bg-indigo-600 text-white' : 'text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-700'}`}
                            >
                                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                                <span className={`font-medium ${activeItem !== item.name ? 'text-gray-600 dark:text-gray-300' : ''}`}>{item.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                     <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3 0l3-3m0 0l-3-3m3 3H9"></path></svg>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;