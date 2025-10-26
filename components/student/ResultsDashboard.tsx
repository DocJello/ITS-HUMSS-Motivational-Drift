import React, { useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AssessmentAttempt, AssessmentType, Assessment, Topic, Question } from '../../types';
import { PageTitle } from '../shared/PageTitle';
import { inferMotivationState, motivationToNumber, analyzeMotivationDrift } from '../../utils/helpers';

interface ResultsDashboardProps {
    studentAttempts: AssessmentAttempt[];
    assessments: Assessment[];
    topics: Topic[];
    questions: Question[];
}

const ProgressBar: React.FC<{ score: number }> = ({ score }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
        <div 
            className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full" 
            style={{ width: `${score}%` }}
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Score: ${score}%`}
        ></div>
    </div>
);


const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ studentAttempts, assessments, topics, questions }) => {
    const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

    const radarChartData = useMemo(() => {
        const publishedSummativeAssessments = topics
            .filter(t => t.isPublished && t.summativeAssessmentId)
            .map(t => assessments.find(a => a.id === t.summativeAssessmentId))
            .filter((a): a is Assessment => a !== undefined);

        return publishedSummativeAssessments.map(assessment => {
            const topic = topics.find(t => t.id === assessment.topicId);
            const attempt = studentAttempts.find(a => a.assessmentId === assessment.id);
            return {
                topic: topic?.title.split(':')[1].trim() || 'Unknown',
                score: attempt?.score || 0,
                fullMark: 100,
            };
        });
    }, [studentAttempts, assessments, topics]);
    
    const selectedAttempt = useMemo(() => {
        if (!selectedAttemptId) return null;
        return studentAttempts.find(a => a.id === selectedAttemptId);
    }, [selectedAttemptId, studentAttempts]);
    
    const selectedAttemptDetails = useMemo(() => {
        if (!selectedAttempt) return null;
        const assessment = assessments.find(a => a.id === selectedAttempt.assessmentId);
        if (!assessment) return null;

        const attemptQuestions = assessment.questionIds.map(qid => {
            const question = questions.find(q => q.id === qid);
            const answerLog = selectedAttempt.answers.find(a => a.questionId === qid);
            return { question, answerLog };
        });

        return {
            assessmentTitle: assessment.title,
            questions: attemptQuestions,
        };
    }, [selectedAttempt, assessments, questions]);

    const motivationChartData = useMemo(() => {
        if (!selectedAttempt) return [];

        return selectedAttempt.answers.map((ans, index) => {
            const dataPoint = {
                task: index + 1,
                isCorrect: ans.isCorrect ? 1 : 0,
                timeOnTask: ans.timeOnTask,
                hintsRequested: ans.hintsRequested,
            };
            return {
                task: `Q ${index + 1}`,
                'Inferred Motivation': motivationToNumber(inferMotivationState(dataPoint)),
            };
        });
    }, [selectedAttempt]);
    
    const recommendations = useMemo(() => {
        if (studentAttempts.length === 0) return null;

        const summativeAttempts = studentAttempts.filter(a => {
            const assessment = assessments.find(ass => ass.id === a.assessmentId);
            return assessment?.type === AssessmentType.Summative && a.score !== undefined;
        });

        if (summativeAttempts.length === 0) {
            return {
                title: "Start Your First Mastery Test!",
                points: ["Complete your first summative assessment to unlock personalized recommendations and track your progress."]
            }
        }

        const avgScore = summativeAttempts.reduce((acc, a) => acc + a.score!, 0) / summativeAttempts.length;

        const scoresByTopic = radarChartData.filter(d => d.score > 0);
        const lowestScoreTopic = scoresByTopic.length > 0 ? scoresByTopic.sort((a, b) => a.score - b.score)[0] : null;

        const driftAnalyses = studentAttempts.map(a => analyzeMotivationDrift(a).summary);
        const driftCounts = driftAnalyses.reduce((acc, summary) => {
            acc[summary] = (acc[summary] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});
        
        const hasSignificantDrift = (driftCounts['Significant Drift'] || 0) > 0;
        const hasMinorDrift = (driftCounts['Minor Drift'] || 0) > 0;

        let points: string[] = [];
        
        if (avgScore < 80) {
            points.push(`Your average score is ${avgScore.toFixed(0)}%. Let's work on boosting that! Reviewing the learning materials before taking a test can make a big difference.`);
            if (lowestScoreTopic && lowestScoreTopic.score < 80) {
                points.push(`You seem to be finding '${lowestScoreTopic.topic}' challenging. We recommend reviewing the external video links for this topic and then trying the practice assessment again.`);
            }
        } else {
            points.push(`Excellent work! Your average score of ${avgScore.toFixed(0)}% shows you have a strong grasp of the material. Keep up the great momentum!`);
            if (lowestScoreTopic && lowestScoreTopic.score < 85) {
                points.push(`To achieve full mastery, you could put some extra focus on '${lowestScoreTopic.topic}'. A quick review might be all you need.`);
            }
        }

        if (hasSignificantDrift) {
            points.push("It looks like your motivation sometimes drops during longer tests. To stay engaged, try breaking up your study sessions with short breaks, and remind yourself of your learning goals before you start.");
        } else if (hasMinorDrift) {
            points.push("We've noticed a slight dip in motivation in some sessions. Remember to use the 'Pomodoro Technique'—it can be a great way to maintain focus and energy.");
        } else {
            points.push("Your motivation has been very consistent. This is a key factor in successful learning, so fantastic job on staying focused!");
        }

        return {
            title: "Recommendation",
            points
        };

    }, [studentAttempts, radarChartData, assessments]);


    return (
        <div className="space-y-8">
            <PageTitle title="My Results" subtitle="Track your progress and motivation." />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Summative Performance</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="topic" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]}/>
                            <Radar name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <p className="text-base text-gray-800 dark:text-gray-200 mt-4 text-center">
                        This radar chart provides a visual summary of your mastery across different topics. Each point on the chart represents your score on a summative test for a specific subject area. A larger, more balanced shape indicates strong and consistent performance across the board.
                    </p>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Assessment History</h3>
                    <ul className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                        {studentAttempts.length > 0 ? [...studentAttempts].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(attempt => {
                            const assessment = assessments.find(a => a.id === attempt.assessmentId);
                            return (
                                <li key={attempt.id} onClick={() => setSelectedAttemptId(attempt.id)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedAttemptId === attempt.id ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{assessment?.title}</span>
                                        {assessment?.type === AssessmentType.Summative && attempt.score !== undefined && <span className="font-bold text-lg text-green-600 dark:text-green-400">{attempt.score}%</span>}
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(attempt.startTime).toLocaleString()}</span>
                                       {assessment?.type === AssessmentType.Summative && attempt.score !== undefined && <div className="w-24"><ProgressBar score={attempt.score} /></div>}
                                    </div>
                                </li>
                            )
                        }) : <p className="text-center text-gray-500 dark:text-gray-400">No assessments completed yet.</p>}
                    </ul>
                </div>
            </div>

            {selectedAttempt && (
                 <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Motivation Analysis: <span className="text-indigo-600 dark:text-indigo-400">{assessments.find(a => a.id === selectedAttempt.assessmentId)?.title}</span></h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={motivationChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="task" />
                            <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tickFormatter={(val) => ['Low', 'Med', 'High'][val-1]}/>
                            <Tooltip formatter={(value: number) => value.toFixed(2)} />
                            <Legend />
                            <Line type="monotone" dataKey="Inferred Motivation" stroke="#4f46e5" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            
            {selectedAttemptDetails && (
                <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Question Review: <span className="text-indigo-600 dark:text-indigo-400">{selectedAttemptDetails.assessmentTitle}</span></h3>
                    <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
                        {selectedAttemptDetails.questions.map(({ question, answerLog }, index) => {
                            if (!question || !answerLog) return null;
                            const isCorrect = answerLog.isCorrect;
                            return (
                                <div key={question.id} className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">Question {index + 1}:</p>
                                    <p className="italic text-gray-700 dark:text-gray-300">"{question.scenario}"</p>
                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{question.questionText}</p>
                                    <p className="mt-2 text-sm">Your answer: <span className="font-semibold">{answerLog.selectedAnswer}</span> {isCorrect ? <span className="text-green-600">✓ Correct</span> : <span className="text-red-600">✗ Incorrect</span>}</p>
                                    {!isCorrect && (
                                        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                                            <p className="text-sm">Correct answer: <span className="font-semibold">{question.correctAnswer}</span></p>
                                            <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Rationale:</span> {question.rationale}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {recommendations && (
                <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{recommendations.title}</h2>
                    <ul className="list-disc list-inside space-y-3 text-gray-800 dark:text-gray-200">
                        {recommendations.points.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                </div>
            )}

        </div>
    );
};

export default ResultsDashboard;
