import React, { useState, useRef } from 'react';
import { PageTitle } from '../shared/PageTitle';
import { Button } from '../shared/Button';
import { User, AssessmentAttempt, Assessment, Topic, Question } from '../../types';

interface RecordManagementProps {
    users: User[];
    onResetStudentData: () => Promise<void>;
    allAttempts: AssessmentAttempt[];
    assessments: Assessment[];
    topics: Topic[];
    questions: Question[];
    onRestoreData: (data: any) => Promise<void>;
    logAction: (action: string, details?: string) => Promise<void>;
}

const RecordManagement: React.FC<RecordManagementProps> = ({ 
    users, onResetStudentData, allAttempts, assessments, topics, questions, onRestoreData, logAction 
}) => {
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = async () => {
        setIsResetting(true);
        try {
            await onResetStudentData();
            setIsResetModalOpen(false);
        } catch (error) {
            console.error("Failed to reset student data", error);
            alert("An error occurred while resetting student data.");
        } finally {
            setIsResetting(false);
        }
    };
    
    const handleExport = () => {
        const backupData = {
            users,
            attempts: allAttempts,
            assessments,
            topics,
            questions,
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `its-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        logAction('DATA_EXPORT', `Exported all data to its-backup-${timestamp}.json`);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Failed to read file");
                const data = JSON.parse(text);
                if (data.users && data.attempts && data.assessments && data.topics && data.questions) {
                    if (window.confirm("Are you sure you want to import this data? This will overwrite all existing data.")) {
                        await onRestoreData(data);
                        alert("Data imported successfully!");
                    }
                } else {
                    alert("Invalid backup file format. The file must contain users, attempts, assessments, topics, and questions.");
                }
            } catch (error) {
                console.error("Failed to import data:", error);
                alert("Failed to import data. Please ensure it's a valid JSON backup file.");
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="space-y-8">
            <PageTitle title="Record Management" subtitle="Manage system-wide data backups, restoration, and resets." />
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Data Backup & Restore</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Export all system data (users, attempts, assessments, etc.) into a single JSON file for backup purposes. This file can be imported later to restore the system to a previous state.
                </p>
                <div className="flex gap-4 flex-wrap">
                    <Button onClick={handleExport} variant="secondary">Export All Data</Button>
                    <Button onClick={handleImportClick} variant="secondary">Import Data from File</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-300 dark:border-red-700">
                <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">System Reset</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    This is a destructive action. Resetting will permanently delete all student accounts and their associated assessment attempts from the database. Admin and Teacher accounts will remain untouched. This cannot be undone.
                </p>
                <Button onClick={() => setIsResetModalOpen(true)} variant="danger">Reset Student Data</Button>
            </div>

            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md transform transition-all text-center">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Data Reset</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to proceed? This will permanently delete all student accounts and all of their assessment attempts. This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsResetModalOpen(false)} disabled={isResetting}>
                                Cancel
                            </Button>
                            <Button type="button" variant="danger" onClick={handleReset} disabled={isResetting}>
                                {isResetting ? 'Resetting...' : 'Confirm Reset'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecordManagement;
