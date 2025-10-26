import React, { useState, useMemo } from 'react';
import { PageTitle } from '../shared/PageTitle';
import { AssessmentAttempt, AssessmentType, Section, Assessment, Topic, User } from '../../types';
import { analyzeMotivationDrift } from '../../utils/helpers';

interface SectionsProps {
    allAttempts: AssessmentAttempt[];
    teacherSections: Section[];
    assessments: Assessment[];
    topics: Topic[];
    users: User[];
}

const Sections: React.FC<SectionsProps> = ({ allAttempts, teacherSections, assessments, topics, users }) => {
    const [selectedSectionId, setSelectedSectionId] = useState<string>(teacherSections[0]?.id || '');

    const studentsInSection = useMemo(() => {
        return users.filter(u => u.sectionId === selectedSectionId);
    }, [selectedSectionId, users]);
    
    const summativeAssessments = useMemo(() => {
        return assessments.filter(a => a.type === AssessmentType.Summative);
    }, [assessments]);

    const getStudentPerformance = (studentId: string) => {
        const studentAttempts = allAttempts.filter(a => a.studentId === studentId);
        
        const performance = summativeAssessments.map(assessment => {
            const attempt = studentAttempts.find(a => a.assessmentId === assessment.id);
            return {
                assessmentId: assessment.id,
                assessmentTitle: topics.find(t=>t.id === assessment.topicId)?.title.split(':')[1] || 'Unknown',
                score: attempt?.score,
                completed: attempt ? new Date(attempt.endTime!).toLocaleDateString() : 'Not Taken'
            };
        });
        
        const latestAttempt = studentAttempts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
        const motivationAnalysis = analyzeMotivationDrift(latestAttempt);
        
        return { performance, motivationAnalysis };
    };
    
    return (
        <div className="space-y-6">
            <PageTitle title="Class Sections" subtitle="View student performance by section." />
            
            <div>
                <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Section</label>
                <select
                    id="section-select"
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {teacherSections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Student Performance in {teacherSections.find(s=>s.id === selectedSectionId)?.name}</h3>
                <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                    {studentsInSection.map(student => {
                        const { performance, motivationAnalysis } = getStudentPerformance(student.id);
                        return (
                             <div key={student.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{student.name}</h4>
                                        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            {performance.map(perf => (
                                                 <li key={perf.assessmentId} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{perf.assessmentTitle}:</span>
                                                    {perf.score !== undefined ? 
                                                        <span className={`ml-2 font-bold ${perf.score >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{perf.score}%</span> : 
                                                        <span className="ml-2 text-gray-700 dark:text-gray-300">--</span>
                                                    }
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 float-right mt-1">{perf.completed}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="md:col-span-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200">Motivation Analysis</h5>
                                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{motivationAnalysis.summary}</p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{motivationAnalysis.insight}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                 {studentsInSection.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 pt-8">No students in this section.</p>}
                 {teacherSections.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 pt-8">You are not assigned to any sections.</p>}
            </div>
        </div>
    );
};

export default Sections;
