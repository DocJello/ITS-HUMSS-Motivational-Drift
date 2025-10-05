import React, { useMemo } from 'react';
import { PageTitle } from '../shared/PageTitle';
import { Question, POINTS, Topic, User } from '../../types';

interface QuestionBankProps {
    topics: Topic[];
    questions: Question[];
    users: User[];
}

const QuestionBank: React.FC<QuestionBankProps> = ({ topics, questions, users }) => {
    
    const questionsWithDetails = useMemo(() => {
        return questions.map(q => {
            const topic = topics.find(t => t.id === q.topicId);
            const creator = users.find(u => u.id === q.creatorId);
            return { ...q, topicTitle: topic?.title || 'Unknown', creatorName: creator?.name || 'Unknown' };
        });
    }, [topics, questions, users]);

    // FIX: Add explicit type for grouped questions to help TypeScript inference.
    type QuestionWithDetails = (typeof questionsWithDetails)[number];

    const groupedQuestions = useMemo(() => {
        return questionsWithDetails.reduce((acc, q) => {
            (acc[q.topicTitle] = acc[q.topicTitle] || []).push(q);
            return acc;
        }, {} as Record<string, QuestionWithDetails[]>);
    }, [questionsWithDetails]);

    return (
        <div className="space-y-6">
            <PageTitle title="Question Bank" subtitle="Browse all available questions, grouped by topic." />
            <div className="space-y-8">
                {/* FIX: Explicitly type `questions` to resolve property access error. */}
                {Object.entries(groupedQuestions).map(([topicTitle, questions]: [string, QuestionWithDetails[]]) => (
                    <div key={topicTitle} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                         <h3 className="px-6 py-4 text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">{topicTitle}</h3>
                         <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/2">Question</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creator</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Difficulty (Points)</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {questions.map(q => (
                                    <tr key={q.id}>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            <p className="italic">"{q.scenario}"</p>
                                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{q.questionText}</p>
                                            <p className="mt-2 text-xs text-green-600 dark:text-green-400">Answer: {q.correctAnswer}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{q.creatorName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {q.difficulty} ({POINTS[q.difficulty]}pt)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuestionBank;