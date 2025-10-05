import React, { useState } from 'react';
import { User, AssessmentAttempt, Section, Assessment, Topic, Question } from '../../types';
import Sidebar from '../shared/Sidebar';
import QuestionBank from './QuestionBank';
import AssessmentManagement from './AssessmentManagement';
import Sections from './Sections';
import SectionInsights from './SectionInsights';
import LessonManagement from './LessonManagement';
import { SECTIONS } from '../../constants';

interface TeacherDashboardProps {
    user: User;
    users: User[];
    onLogout: () => void;
    allAttempts: AssessmentAttempt[];
    assessments: Assessment[];
    onUpdateAssessments: (updatedAssessments: Assessment[]) => Promise<void>;
    topics: Topic[];
    onUpdateTopics: (updatedTopics: Topic[]) => Promise<void>;
    questions: Question[];
}

const NAV_ITEMS = [
    { name: 'Sections', icon: 'M17.598 11.642a7.5 7.5 0 10-11.196 0 9.75 9.75 0 00-2.31 6.093 1.5 1.5 0 001.5 1.505h14.012a1.5 1.5 0 001.5-1.505 9.75 9.75 0 00-2.31-6.093zM12 10.5a3 3 0 110-6 3 3 0 010 6z' },
    { name: 'Lesson Management', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25' },
    { name: 'Question Bank', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10' },
    { name: 'Assessments', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Insights', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.517l2.74-1.22m0 0l-3.94-3.939M21 12l-3.94-3.939' },
];

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, users, onLogout, allAttempts, assessments, onUpdateAssessments, topics, onUpdateTopics, questions }) => {
    const [activePage, setActivePage] = useState('Sections');

    const teacherSections = SECTIONS.filter(s => user.sectionIds?.includes(s.id));

    const renderContent = () => {
        switch (activePage) {
            case 'Sections':
                return <Sections allAttempts={allAttempts} teacherSections={teacherSections} assessments={assessments} topics={topics} users={users} />;
            case 'Lesson Management':
                return <LessonManagement topics={topics} onUpdateTopics={onUpdateTopics} assessments={assessments} />;
            case 'Question Bank':
                return <QuestionBank topics={topics} questions={questions} users={users} />;
            case 'Assessments':
                return <AssessmentManagement assessments={assessments} onUpdateAssessments={onUpdateAssessments} topics={topics} questions={questions} />;
            case 'Insights':
                return <SectionInsights allAttempts={allAttempts} teacherSections={teacherSections} assessments={assessments} users={users} />;
            default:
                return <Sections allAttempts={allAttempts} teacherSections={teacherSections} assessments={assessments} topics={topics} users={users} />;
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

export default TeacherDashboard;