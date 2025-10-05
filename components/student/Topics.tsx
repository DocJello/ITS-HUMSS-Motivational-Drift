import React from 'react';
import { PageTitle } from '../shared/PageTitle';
import { Button } from '../shared/Button';
import { AssessmentAttempt, Assessment, Topic } from '../../types';

interface TopicsProps {
    onStartAssessment: (assessmentId: string) => void;
    studentAttempts: AssessmentAttempt[];
    assessments: Assessment[];
    topics: Topic[];
}

const StartButton: React.FC<{isLocked: boolean, onClick: () => void}> = ({ isLocked, onClick }) => {
    const button = (
        <Button onClick={onClick} disabled={isLocked} className="mt-4 px-4 py-2 text-sm w-full justify-center">
            {isLocked ? 'Locked' : 'Start Assessment'}
        </Button>
    );

    if (isLocked) {
        return (
            <div className="relative group">
                {button}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 z-10">
                    Score 80% or higher on the Formative assessment to unlock.
                </div>
            </div>
        );
    }
    return button;
};


const Topics: React.FC<TopicsProps> = ({ onStartAssessment, studentAttempts, assessments, topics }) => {
    
    const getHighestScore = (assessmentId: string | undefined): number => {
        if (!assessmentId) return 0;

        const scores = studentAttempts
            .filter(a => a.assessmentId === assessmentId && a.score !== undefined)
            .map(a => a.score!);
        
        return scores.length > 0 ? Math.max(...scores) : 0;
    };

    const publishedTopics = topics
        .filter(t => t.isPublished)
        .sort((a, b) => a.title.localeCompare(b.title));

    let areSubsequentTopicsLocked = false;

    return (
        <div className="space-y-8">
            <PageTitle title="Topics & Assessments" subtitle="Explore topics and test your knowledge." />
            {publishedTopics.length === 0 && (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">No Topics Available</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Your teacher has not published any topics yet. Please check back later.</p>
                </div>
            )}
            {publishedTopics.map(topic => {
                const isCurrentTopicLocked = areSubsequentTopicsLocked;

                const formativeAssessment = assessments.find(a => a.id === topic.formativeAssessmentId);
                const summativeAssessment = assessments.find(a => a.id === topic.summativeAssessmentId);
                
                if (!formativeAssessment || !summativeAssessment) return null;

                const highestFormativeScore = getHighestScore(topic.formativeAssessmentId);
                const isSummativeLocked = highestFormativeScore < 80;

                const highestSummativeScore = getHighestScore(topic.summativeAssessmentId);
                if (highestSummativeScore < 80) {
                    areSubsequentTopicsLocked = true;
                }

                return (
                    <div key={topic.id} className="relative">
                        {isCurrentTopicLocked && (
                             <div className="absolute inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900/80 z-10 flex flex-col items-center justify-center rounded-lg p-4 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <p className="text-white font-bold mt-2 text-lg">Locked</p>
                                <p className="text-gray-200 text-sm">You must score at least 80% on the previous Mastery Test to unlock this topic.</p>
                            </div>
                        )}
                        <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 ${isCurrentTopicLocked ? 'blur-sm pointer-events-none' : ''}`}>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{topic.title}</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{topic.learningMaterials}</p>
                            <div className="flex flex-wrap gap-4 mb-6">
                                {topic.externalLinks.map(link => (
                                    <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium">
                                        🔗 {link.name}
                                    </a>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{formativeAssessment.title}</h3>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mb-2">PRACTICE (Not Graded)</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Take this as many times as you need. Score 80% or higher to unlock the Mastery Test.</p>
                                    <Button onClick={() => onStartAssessment(formativeAssessment.id)} variant="secondary" className="mt-4 px-4 py-2 text-sm w-full justify-center">Start Practice</Button>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{summativeAssessment.title}</h3>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">MASTERY TEST (Graded)</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Your score on this test will be recorded. Make sure you are prepared!</p>
                                    <StartButton isLocked={isSummativeLocked} onClick={() => onStartAssessment(summativeAssessment.id)} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Topics;