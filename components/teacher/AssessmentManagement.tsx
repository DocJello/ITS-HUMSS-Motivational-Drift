import React, { useState, useMemo } from 'react';
import { PageTitle } from '../shared/PageTitle';
import { Assessment, AssessmentType, Question, Topic } from '../../types';
import { Button } from '../shared/Button';
import { nanoid } from 'nanoid';

interface AssessmentManagementProps {
    assessments: Assessment[];
    onUpdateAssessments: (updatedAssessments: Assessment[]) => Promise<void>;
    topics: Topic[];
    questions: Question[];
}

const AssessmentManagement: React.FC<AssessmentManagementProps> = ({ assessments, onUpdateAssessments, topics, questions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
    const [formData, setFormData] = useState<Partial<Assessment>>({});

    const availableQuestions = useMemo(() => {
        if (!formData.topicId) return [];
        const selectedIds = new Set(formData.questionIds || []);
        return questions.filter(q => q.topicId === formData.topicId && !selectedIds.has(q.id));
    }, [formData.topicId, formData.questionIds, questions]);

    const currentQuestions = useMemo((): Question[] => {
        if (!formData.questionIds) return [];
        return formData.questionIds.map(id => questions.find(q => q.id === id)).filter((q): q is Question => q !== undefined);
    }, [formData.questionIds, questions]);

    const getTopicTitle = (topicId: string) => {
        return topics.find(t => t.id === topicId)?.title || 'Unknown Topic';
    };
    
    const addQuestion = (questionId: string) => {
        setFormData(prev => ({ ...prev, questionIds: [...(prev.questionIds || []), questionId] }));
    };

    const removeQuestion = (questionId: string) => {
        setFormData(prev => ({ ...prev, questionIds: (prev.questionIds || []).filter(id => id !== questionId) }));
    };


    const openModalForNew = () => {
        setEditingAssessment(null);
        setFormData({
            title: '',
            type: AssessmentType.Formative,
            topicId: topics[0]?.id || '',
            questionIds: []
        });
        setIsModalOpen(true);
    };

    const openModalForEdit = (assessment: Assessment) => {
        setEditingAssessment(assessment);
        setFormData(JSON.parse(JSON.stringify(assessment))); // Deep copy to avoid direct state mutation
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAssessment(null);
        setFormData({});
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        // Reset questions when topic changes to ensure relevance
        if (name === 'topicId' && editingAssessment?.topicId !== value) {
            newFormData.questionIds = []; 
        }
        setFormData(newFormData);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        let updatedAssessments;
        if (editingAssessment) {
            updatedAssessments = assessments.map(a => a.id === editingAssessment.id ? { ...a, ...formData } as Assessment : a);
        } else {
            const newAssessment: Assessment = {
                id: `as_${nanoid(8)}`,
                title: formData.title || 'New Assessment',
                type: formData.type || AssessmentType.Formative,
                topicId: formData.topicId || '',
                questionIds: formData.questionIds || [],
            };
            updatedAssessments = [...assessments, newAssessment];
        }
        await onUpdateAssessments(updatedAssessments);
        closeModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Assessment Management" subtitle="View, create, and edit all assessments." />
                <Button onClick={openModalForNew}>Create New Assessment</Button>
            </div>
             <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Topic</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"># of Questions</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {assessments.map(assessment => (
                            <tr key={assessment.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{assessment.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                         assessment.type === AssessmentType.Summative ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                     }`}>
                                        {assessment.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getTopicTitle(assessment.topicId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{assessment.questionIds.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModalForEdit(assessment)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-3xl transform transition-all">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assessment Title</label>
                                <input type="text" name="title" id="title" required value={formData.title || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                    <select name="type" id="type" required value={formData.type || ''} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 sm:text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value={AssessmentType.Formative}>Formative</option>
                                        <option value={AssessmentType.Summative}>Summative</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="topicId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topic</label>
                                    <select name="topicId" id="topicId" required value={formData.topicId || ''} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 sm:text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </select>
                                </div>
                            </div>
                           
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Questions ({currentQuestions.length})</h4>
                                    <ul className="h-48 overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 space-y-1">
                                        {currentQuestions.length > 0 ? currentQuestions.map(q => (
                                            <li key={q.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded shadow-sm">
                                                <span className="text-xs truncate pr-2">{q.scenario}</span>
                                                <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                                            </li>
                                        )) : <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">No questions selected.</p>}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Questions ({availableQuestions.length})</h4>
                                    <ul className="h-48 overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 space-y-1">
                                        {availableQuestions.length > 0 ? availableQuestions.map(q => (
                                            <li key={q.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded shadow-sm">
                                                <span className="text-xs truncate pr-2">{q.scenario}</span>
                                                <button type="button" onClick={() => addQuestion(q.id)} className="text-green-500 hover:text-green-700 text-xs font-semibold">Add</button>
                                            </li>
                                        )) : <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">No more questions for this topic.</p>}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit">Save Assessment</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentManagement;