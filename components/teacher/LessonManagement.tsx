import React, { useState } from 'react';
import { PageTitle } from '../shared/PageTitle';
import { Button } from '../shared/Button';
import { Topic, Assessment, AssessmentType } from '../../types';
import { nanoid } from 'nanoid';

interface LessonManagementProps {
    topics: Topic[];
    onUpdateTopics: (updatedTopics: Topic[]) => Promise<void>;
    assessments: Assessment[];
}

const LessonManagement: React.FC<LessonManagementProps> = ({ topics, onUpdateTopics, assessments }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [formData, setFormData] = useState<Partial<Topic>>({});

    const formativeAssessments = assessments.filter(a => a.type === AssessmentType.Formative);
    const summativeAssessments = assessments.filter(a => a.type === AssessmentType.Summative);

    const openModalForNew = () => {
        setEditingTopic(null);
        setFormData({
            title: '',
            learningMaterials: '',
            externalLinks: [{ name: '', url: '' }],
            isPublished: false,
        });
        setIsModalOpen(true);
    };

    const openModalForEdit = (topic: Topic) => {
        setEditingTopic(topic);
        setFormData(JSON.parse(JSON.stringify(topic))); // Deep copy
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTopic(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLinkChange = (index: number, field: 'name' | 'url', value: string) => {
        const newLinks = [...(formData.externalLinks || [])];
        newLinks[index][field] = value;
        setFormData(prev => ({ ...prev, externalLinks: newLinks }));
    };

    const addLink = () => {
        setFormData(prev => ({ ...prev, externalLinks: [...(prev.externalLinks || []), { name: '', url: '' }] }));
    };

    const removeLink = (index: number) => {
        setFormData(prev => ({ ...prev, externalLinks: (prev.externalLinks || []).filter((_, i) => i !== index) }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        let updatedTopics;
        if (editingTopic) {
            updatedTopics = topics.map(t => t.id === editingTopic.id ? { ...t, ...formData } as Topic : t);
        } else {
            const newTopic: Topic = {
                id: `topic_${nanoid(8)}`,
                title: formData.title || 'New Topic',
                learningMaterials: formData.learningMaterials || '',
                externalLinks: formData.externalLinks?.filter(l => l.name && l.url) || [],
                isPublished: formData.isPublished || false,
                formativeAssessmentId: formData.formativeAssessmentId,
                summativeAssessmentId: formData.summativeAssessmentId,
            };
            updatedTopics = [...topics, newTopic];
        }
        await onUpdateTopics(updatedTopics);
        closeModal();
    };

    const togglePublished = async (topic: Topic) => {
        const updatedTopics = topics.map(t => t.id === topic.id ? { ...t, isPublished: !t.isPublished } : t);
        await onUpdateTopics(updatedTopics);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Lesson Management" subtitle="Create, edit, and publish lessons for students." />
                <Button onClick={openModalForNew}>Create New Lesson</Button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lesson Title</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {topics.map(topic => (
                            <tr key={topic.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{topic.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${topic.isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                        {topic.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => togglePublished(topic)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                        {topic.isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button onClick={() => openModalForEdit(topic)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all max-h-screen overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingTopic ? 'Edit Lesson' : 'Create New Lesson'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Title</label>
                                <input type="text" name="title" id="title" required value={formData.title || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="learningMaterials" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Learning Materials (Description)</label>
                                <textarea name="learningMaterials" id="learningMaterials" rows={3} value={formData.learningMaterials || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">External Video Links</h4>
                                <div className="space-y-2">
                                    {(formData.externalLinks || []).map((link, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input type="text" placeholder="Link Name (e.g., YouTube Video)" value={link.name} onChange={(e) => handleLinkChange(index, 'name', e.target.value)} className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                            <input type="url" placeholder="https://..." value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                            <Button type="button" variant="danger" onClick={() => removeLink(index)} className="px-3 py-2 text-sm">X</Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="secondary" onClick={addLink} className="text-sm py-1 px-3">Add Link</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="formativeAssessmentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Formative Assessment</label>
                                    <select name="formativeAssessmentId" id="formativeAssessmentId" value={formData.formativeAssessmentId || ''} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 sm:text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="">None</option>
                                        {formativeAssessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="summativeAssessmentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Summative Assessment</label>
                                    <select name="summativeAssessmentId" id="summativeAssessmentId" value={formData.summativeAssessmentId || ''} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 sm:text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="">None</option>
                                        {summativeAssessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit">Save Lesson</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonManagement;
