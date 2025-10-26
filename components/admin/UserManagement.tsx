import React, { useState, useRef } from 'react';
import { SECTIONS } from '../../constants';
import { PageTitle } from '../shared/PageTitle';
import { Button } from '../shared/Button';
import { User, Role } from '../../types';
import { nanoid } from 'nanoid';

interface UserManagementProps {
    users: User[];
    onUpdateUsers: (updatedUsers: User[]) => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [bulkAddUsers, setBulkAddUsers] = useState<Partial<User>[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getSectionDisplay = (user: User) => {
        if (user.role === Role.Student && user.sectionId) {
            return SECTIONS.find(s => s.id === user.sectionId)?.name || 'Unknown';
        }
        if (user.role === Role.Teacher && user.sectionIds && user.sectionIds.length > 0) {
            return user.sectionIds.map(id => SECTIONS.find(s => s.id === id)?.name).filter(Boolean).join(', ');
        }
        return 'N/A';
    };


    const openModalForNew = () => {
        setEditingUser(null);
        setFormData({ role: Role.Student, sectionId: SECTIONS[0]?.id });
        setIsModalOpen(true);
    };

    const openModalForEdit = (user: User) => {
        setEditingUser(user);
        setFormData(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        if(name === 'role') {
            delete newFormData.sectionId;
            delete newFormData.sectionIds;
            if (value === Role.Student) newFormData.sectionId = SECTIONS[0]?.id;
            if (value === Role.Teacher) newFormData.sectionIds = [];
        }
        setFormData(newFormData);
    };
    
    const handleTeacherSectionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData({ ...formData, sectionIds: selectedIds });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        let updatedUsers;
        if (editingUser) {
            updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u);
        } else {
            const newUser: User = {
                id: `user_${nanoid(5)}`,
                username: formData.username || '',
                name: formData.name || '',
                role: formData.role || Role.Student,
                sectionId: formData.role === Role.Student ? formData.sectionId : undefined,
                sectionIds: formData.role === Role.Teacher ? formData.sectionIds : undefined,
            };
            updatedUsers = [...users, newUser];
        }
        await onUpdateUsers(updatedUsers);
        closeModal();
    };
    
    const handleBulkUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // In a real application, you would use a library like 'xlsx' to parse the file.
        // Here, we simulate the parsing result for demonstration purposes.
        console.log("Simulating parsing of file:", file.name);
        const mockParsedUsers = [
            { name: 'Maria Clara', username: 'mclara', sectionName: 'Grade 11 - HUMSS A' },
            { name: 'Juan Crisostomo', username: 'jcibarra', sectionName: 'Grade 11 - HUMSS A' },
            { name: 'Elias Salvador', username: 'esalvador', sectionName: 'Grade 11 - HUMSS B' },
        ];
        
        const newUsers = mockParsedUsers.map(u => {
            const section = SECTIONS.find(s => s.name === u.sectionName);
            return {
                name: u.name,
                username: u.username,
                role: Role.Student,
                sectionId: section?.id,
            };
        }).filter(u => u.sectionId); // Filter out users with invalid sections

        setBulkAddUsers(newUsers);
        setIsBulkModalOpen(true);
        
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    };
    
    const handleConfirmBulkAdd = async () => {
        const newUsersWithIds = bulkAddUsers.map(u => ({
            ...u,
            id: `user_${nanoid(5)}`,
        })) as User[];
        await onUpdateUsers([...users, ...newUsersWithIds]);
        setIsBulkModalOpen(false);
        setBulkAddUsers([]);
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <PageTitle title="User Management" subtitle="View and manage all users in the system." />
                <div className="flex gap-4 flex-wrap">
                    <Button onClick={openModalForNew}>Add Individual User</Button>
                    <Button onClick={handleBulkUploadClick} variant="secondary">Bulk Add Students</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style={{ display: 'none' }} />
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Section(s)</th>
                            <th scope="col" className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user: User) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 dark:text-white">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 dark:text-gray-300">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 dark:text-gray-300">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                         user.role === 'Admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                         user.role === 'Teacher' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' :
                                         'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                     }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 dark:text-gray-300">{getSectionDisplay(user)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                    <button onClick={() => openModalForEdit(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md transform transition-all">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                <input type="text" name="name" id="name" required value={formData.name || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                             <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                <input type="text" name="username" id="username" required value={formData.username || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select name="role" id="role" required value={formData.role || ''} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value={Role.Student}>Student</option>
                                    <option value={Role.Teacher}>Teacher</option>
                                    <option value={Role.Admin}>Admin</option>
                                </select>
                            </div>
                            {formData.role === Role.Student && (
                                <div>
                                    <label htmlFor="sectionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
                                    <select name="sectionId" id="sectionId" value={formData.sectionId || ''} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {formData.role === Role.Teacher && (
                                <div>
                                    <label htmlFor="sectionIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sections</label>
                                    <select
                                        multiple
                                        name="sectionIds"
                                        id="sectionIds"
                                        value={formData.sectionIds || []}
                                        onChange={handleTeacherSectionsChange}
                                        className="mt-1 block w-full h-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple sections.</p>
                                </div>
                            )}
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isBulkModalOpen && (
                 <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Confirm New Students</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">The following {bulkAddUsers.length} students will be added to the system. Please review before confirming.</p>
                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Section</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {bulkAddUsers.map((user, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{user.name}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{user.username}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{SECTIONS.find(s => s.id === user.sectionId)?.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-4 pt-6">
                            <Button type="button" variant="secondary" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                            <Button type="button" onClick={handleConfirmBulkAdd}>Confirm and Add Students</Button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default UserManagement;
