import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PageTitle } from '../shared/PageTitle';
import { AssessmentAttempt, InferredDataPoint, Section, MotivationLevel, Assessment, User } from '../../types';
import { inferMotivationState, motivationToNumber } from '../../utils/helpers';

interface SectionInsightsProps {
    allAttempts: AssessmentAttempt[];
    teacherSections: Section[];
    assessments: Assessment[];
    users: User[];
}

const SectionInsights: React.FC<SectionInsightsProps> = ({ allAttempts, teacherSections, assessments, users }) => {
    const [selectedSectionId, setSelectedSectionId] = useState<string>(teacherSections[0]?.id || '');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(assessments[0]?.id || '');
    
    const studentsInSection = useMemo(() => {
        return users.filter(u => u.sectionId === selectedSectionId).map(u => u.id);
    }, [selectedSectionId, users]);

     const sectionSummaries = useMemo(() => {
        return teacherSections.map(section => {
            const studentIdsInSection = users.filter(u => u.sectionId === section.id).map(u => u.id);
            const attemptsForSection = allAttempts.filter(a => studentIdsInSection.includes(a.studentId));
            
            if (attemptsForSection.length === 0) {
                return { sectionName: section.name, motivation: { High: 0, Medium: 0, Low: 0 }, total: 0 };
            }

            const motivationCounts = {
                [MotivationLevel.High]: 0,
                [MotivationLevel.Medium]: 0,
                [MotivationLevel.Low]: 0,
            };

            let totalInferences = 0;

            attemptsForSection.forEach(attempt => {
                attempt.answers.forEach((ans) => {
                    const dataPoint = { task: 0, isCorrect: ans.isCorrect ? 1:0, timeOnTask: ans.timeOnTask, hintsRequested: ans.hintsRequested };
                    const inferredState = inferMotivationState(dataPoint);
                    motivationCounts[inferredState]++;
                    totalInferences++;
                });
            });
            
            return {
                sectionName: section.name,
                motivation: {
                    High: totalInferences > 0 ? (motivationCounts[MotivationLevel.High] / totalInferences) * 100 : 0,
                    Medium: totalInferences > 0 ? (motivationCounts[MotivationLevel.Medium] / totalInferences) * 100 : 0,
                    Low: totalInferences > 0 ? (motivationCounts[MotivationLevel.Low] / totalInferences) * 100 : 0,
                },
                total: totalInferences,
            };
        });
    }, [allAttempts, teacherSections, users]);


    const chartData = useMemo(() => {
      const attemptsForSelection = allAttempts.filter(a => a.assessmentId === selectedAssessmentId && studentsInSection.includes(a.studentId));
      if(attemptsForSelection.length === 0) return [];
      
      const allInferredData = attemptsForSelection.flatMap(attempt => attempt.answers.map((ans, index) => {
          const dataPoint: Omit<InferredDataPoint, 'inferredState'> = {
              task: index + 1,
              isCorrect: ans.isCorrect ? 1 : 0,
              timeOnTask: ans.timeOnTask,
              hintsRequested: ans.hintsRequested,
          };
          const inferredState = inferMotivationState(dataPoint);
          return { ...dataPoint, inferredState };
      }));

      const dataByTask: {[key: number]: { total: number, count: number }} = {};
      
      allInferredData.forEach(d => {
          if (!dataByTask[d.task]) dataByTask[d.task] = { total: 0, count: 0 };
          dataByTask[d.task].total += motivationToNumber(d.inferredState);
          dataByTask[d.task].count++;
      });

      return Object.keys(dataByTask).map(taskIdStr => {
          const taskId = parseInt(taskIdStr, 10);
          const data = dataByTask[taskId];
          return {
              task: `Q ${taskId}`,
              'Avg. Inferred Motivation': data.count > 0 ? data.total / data.count : null,
          };
      }).sort((a,b) => parseInt(a.task.split(' ')[1]) - parseInt(b.task.split(' ')[1]));

  }, [allAttempts, selectedAssessmentId, studentsInSection]);

    return (
        <div className="space-y-6">
            <PageTitle title="Class Insights" subtitle="Analyze motivation drift trends for your sections." />
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Overall Section Motivation</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    A summary of inferred motivation levels based on all recent assessment data for each section.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sectionSummaries.map(summary => (
                        <div key={summary.sectionName} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200">{summary.sectionName}</h3>
                            {summary.total > 0 ? (
                                <div className="mt-2 space-y-2">
                                    <div className="flex w-full h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-label={`Motivation for ${summary.sectionName}`}>
                                        <div className="bg-green-500" style={{ width: `${summary.motivation.High}%` }} title={`High Motivation: ${summary.motivation.High.toFixed(0)}%`}></div>
                                        <div className="bg-yellow-500" style={{ width: `${summary.motivation.Medium}%` }} title={`Medium Motivation: ${summary.motivation.Medium.toFixed(0)}%`}></div>
                                        <div className="bg-red-500" style={{ width: `${summary.motivation.Low}%` }} title={`Low Motivation: ${summary.motivation.Low.toFixed(0)}%`}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                                        <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>High: {summary.motivation.High.toFixed(0)}%</span>
                                        <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>Med: {summary.motivation.Medium.toFixed(0)}%</span>
                                        <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>Low: {summary.motivation.Low.toFixed(0)}%</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No data available.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Section</label>
                    <select id="section-select" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {teacherSections.map(section => (<option key={section.id} value={section.id}>{section.name}</option>))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="assessment-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Assessment</label>
                    <select id="assessment-select" value={selectedAssessmentId} onChange={(e) => setSelectedAssessmentId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {assessments.map(ass => (<option key={ass.id} value={ass.id}>{ass.title}</option>))}
                    </select>
                </div>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Motivation Drift Analysis per Assessment</h2>
                <div className="h-80">
                    {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="task" />
                        <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tickFormatter={(val) => ['Low', 'Med', 'High'][val-1]}/>
                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                        <Legend />
                        <Line type="monotone" dataKey="Avg. Inferred Motivation" stroke="#4f46e5" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            {teacherSections.length > 0 ? 'No assessment data for this section.' : 'You are not assigned to any sections.'}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Implications & Strategies</h2>
                <p className="text-gray-800 dark:text-gray-200 mb-4">
                    A downward trend in the chart above can indicate 'motivation drift,' where students become less engaged as the assessment progresses. This can be caused by fatigue, difficulty, or a feeling of low self-efficacy. Early detection allows for timely intervention.
                </p>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Strategies to Advise Students:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-800 dark:text-gray-200">
                    <li><b>The Pomodoro Technique:</b> Encourage focused work in short 25-minute bursts, followed by a 5-minute break. This can prevent burnout during study sessions.</li>
                    <li><b>Set Micro-Goals:</b> Instead of tackling a large topic, advise students to set small, achievable goals, like "mastering one type of speech act." This builds momentum and confidence.</li>
                    <li><b>Self-Reflection:</b> Prompt students to briefly think about why a topic is interesting or relevant to them before they begin. Connecting material to personal interests boosts intrinsic motivation.</li>
                    <li><b>Vary Study Methods:</b> Suggest alternating between reading, watching videos, and doing practice problems to keep study sessions dynamic and engaging.</li>
                </ul>
            </div>
        </div>
    );
};

export default SectionInsights;
