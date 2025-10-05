import React, { useState, useEffect } from 'react';
import { User, AssessmentAttempt, Question, Assessment, Topic } from '../../types';
import Sidebar from '../shared/Sidebar';
import Topics from './Topics';
import ResultsDashboard from './ResultsDashboard';
import AssessmentPlayer from './AssessmentPlayer';
import { Button } from '../shared/Button';
import { nanoid } from 'nanoid';

interface StudentDashboardProps {
    user: User;
    onLogout: () => void;
    allAttempts: AssessmentAttempt[];
    onAddAttempt: (attempt: AssessmentAttempt) => Promise<void>;
    assessments: Assessment[];
    topics: Topic[];
    questions: Question[];
}

interface Reminder {
    id: string;
    text: string;
}

const NAV_ITEMS = [
    { name: 'Topics & Assessments', icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-1.07-1.07a50.57 50.57 0 013.728-3.728l1.07 1.07m13.342 0l1.07-1.07a50.57 50.57 0 013.728 3.728l-1.07 1.07' },
    { name: 'My Results', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
];

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, allAttempts, onAddAttempt, assessments, topics, questions }) => {
    const [activePage, setActivePage] = useState('Topics & Assessments');
    const [currentAssessment, setCurrentAssessment] = useState<{assessmentId: string, questions: Question[]} | null>(null);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [newReminderText, setNewReminderText] = useState('');

    const studentAttempts = allAttempts.filter(a => a.studentId === user.id);
    const reminderStorageKey = `studyReminders_${user.id}`;

    useEffect(() => {
        const storedReminders = localStorage.getItem(reminderStorageKey);
        if (storedReminders) {
            setReminders(JSON.parse(storedReminders));
        }
    }, [reminderStorageKey]);

    const addReminder = (e: React.FormEvent) => {
        e.preventDefault();
        if (newReminderText.trim() === '') return;
        const newReminder = { id: nanoid(), text: newReminderText.trim() };
        const updatedReminders = [...reminders, newReminder];
        setReminders(updatedReminders);
        localStorage.setItem(reminderStorageKey, JSON.stringify(updatedReminders));
        setNewReminderText('');
    };

    const deleteReminder = (id: string) => {
        const updatedReminders = reminders.filter(r => r.id !== id);
        setReminders(updatedReminders);
        localStorage.setItem(reminderStorageKey, JSON.stringify(updatedReminders));
    };

    const startAssessment = (assessmentId: string) => {
        const assessment = assessments.find(a => a.id === assessmentId);
        if (assessment) {
            const assessmentQuestions = assessment.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[];
            setCurrentAssessment({ assessmentId, questions: assessmentQuestions });
        }
    };
    
    const onAssessmentComplete = async (attempt: AssessmentAttempt) => {
        await onAddAttempt(attempt);
        setCurrentAssessment(null);
        setActivePage('My Results');
    }

    const renderContent = () => {
        if (currentAssessment) {
            return <AssessmentPlayer 
                user={user}
                assessmentId={currentAssessment.assessmentId} 
                questions={currentAssessment.questions} 
                onComplete={onAssessmentComplete} 
                onExit={() => setCurrentAssessment(null)}
                assessments={assessments}
            />;
        }

        switch (activePage) {
            case 'Topics & Assessments':
                return <Topics onStartAssessment={startAssessment} studentAttempts={studentAttempts} assessments={assessments} topics={topics} />;
            case 'My Results':
                return <ResultsDashboard studentAttempts={studentAttempts} assessments={assessments} topics={topics} questions={questions} />;
            default:
                return <Topics onStartAssessment={startAssessment} studentAttempts={studentAttempts} assessments={assessments} topics={topics} />;
        }
    };
    
     if (currentAssessment) {
        return (
             <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                {renderContent()}
            </div>
        )
    }

    const studyRemindersComponent = (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg mb-8 border border-yellow-200 dark:border-yellow-800/50">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">My Study Reminders</h3>
            <div className="space-y-2 mb-4">
                {reminders.length > 0 ? (
                    reminders.map(reminder => (
                        <div key={reminder.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{reminder.text}</p>
                            <button onClick={() => deleteReminder(reminder.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Done</button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">You have no active reminders. Add one below!</p>
                )}
            </div>
            <form onSubmit={addReminder} className="flex gap-2">
                <input
                    type="text"
                    value={newReminderText}
                    onChange={(e) => setNewReminderText(e.target.value)}
                    placeholder="e.g., Review Topic 3 before Friday"
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button type="submit" variant="secondary" className="px-4 py-2 text-sm">Add</Button>
            </form>
        </div>
    );

    return (
        <div className="flex h-screen">
            <Sidebar user={user} navItems={NAV_ITEMS} activeItem={activePage} setActiveItem={setActivePage} onLogout={onLogout} />
            <main className="flex-1 p-8 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                {!currentAssessment && studyRemindersComponent}
                {renderContent()}
            </main>
        </div>
    );
};

export default StudentDashboard;