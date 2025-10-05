import React, { useState, useEffect, useCallback } from 'react';
import { Question, SpeechAct, User, AnswerLog, MotivationLevel, AssessmentAttempt, AssessmentType, Assessment } from '../../types';
import { Button } from '../shared/Button';
import { nanoid } from 'nanoid';

interface AssessmentPlayerProps {
    user: User;
    assessmentId: string;
    questions: Question[];
    onComplete: (attempt: AssessmentAttempt) => Promise<void>;
    onExit: () => void;
    assessments: Assessment[];
}

const MotivationSurvey: React.FC<{ onSubmit: (level: MotivationLevel) => void }> = ({ onSubmit }) => {
    const [level, setLevel] = useState<MotivationLevel | null>(null);
    return (
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Check-in</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">How motivated are you feeling right now?</p>
            <div className="space-y-4">
                {Object.values(MotivationLevel).map(value => (
                    <button key={value} onClick={() => setLevel(value)} className={`w-full p-4 rounded-lg text-left transition-all duration-200 border-2 ${level === value ? 'bg-indigo-500 border-indigo-500 text-white scale-105 shadow-lg' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-indigo-100 dark:hover:bg-gray-600'}`}>
                        {value}
                    </button>
                ))}
            </div>
            <div className="mt-8">
                <Button onClick={() => level && onSubmit(level)} disabled={!level}>Continue</Button>
            </div>
        </div>
    );
};


const AssessmentPlayer: React.FC<AssessmentPlayerProps> = ({ user, assessmentId, questions, onComplete, onExit, assessments }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<SpeechAct | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [hintsRequested, setHintsRequested] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [lastQuestionEndTime, setLastQuestionEndTime] = useState(Date.now());
    const [currentAttempt, setCurrentAttempt] = useState<AssessmentAttempt>({
        id: nanoid(), studentId: user.id, assessmentId,
        startTime: new Date().toISOString(), endTime: null,
        answers: [], motivationSurveys: [],
    });
    const [showSurvey, setShowSurvey] = useState(false);
    
    const assessment = assessments.find(a => a.id === assessmentId);
    const task = questions[currentIndex];

    useEffect(() => {
        setStartTime(Date.now());
        setSelected(null);
        setShowHint(false);
        setHintsRequested(0);
    }, [currentIndex]);
    
    const advance = async (updatedAttempt: AssessmentAttempt) => {
        setShowSurvey(false);
        setLastQuestionEndTime(Date.now());

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const finalAttempt = {...updatedAttempt, endTime: new Date().toISOString()};
            
            if (assessment?.type === AssessmentType.Summative || assessment?.type === AssessmentType.Formative) {
                const correctCount = finalAttempt.answers.filter(a => a.isCorrect).length;
                const totalQuestions = questions.length > 0 ? questions.length : 1;
                finalAttempt.score = Math.round((correctCount / totalQuestions) * 100);
            }

            await onComplete(finalAttempt);
        }
    };
    
    const handleSurveySubmit = (level: MotivationLevel) => {
        const updatedAttempt = {
            ...currentAttempt,
            motivationSurveys: [
                ...currentAttempt.motivationSurveys,
                { questionIndex: currentIndex, level }
            ]
        };
        setCurrentAttempt(updatedAttempt);
        advance(updatedAttempt);
    };

    const handleSubmit = () => {
        if (!selected) return;

        const timeOnTask = (Date.now() - startTime) / 1000;
        const pauseTime = (Date.now() - lastQuestionEndTime - (timeOnTask * 1000)) / 1000;
        
        const answerLog: AnswerLog = {
            questionId: task.id,
            selectedAnswer: selected,
            isCorrect: selected === task.correctAnswer,
            timeOnTask,
            hintsRequested,
            pauseTime: Math.max(0, pauseTime),
        };
        
        const updatedAttempt = {...currentAttempt, answers: [...currentAttempt.answers, answerLog]};
        setCurrentAttempt(updatedAttempt);

        if ((currentIndex + 1) % 3 === 0 && (currentIndex + 1) < questions.length) {
            setShowSurvey(true);
        } else {
            advance(updatedAttempt);
        }
    };
    
    const handleHint = useCallback(() => {
        if (!showHint) {
            setHintsRequested(prev => prev + 1);
            setShowHint(true);
        }
    }, [showHint]);

    if (showSurvey) {
        return <MotivationSurvey onSubmit={handleSurveySubmit} />;
    }

    if (!task) {
        return (
             <div className="w-full max-w-3xl p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl relative text-center">
                 <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Error</h2>
                 <p className="text-gray-600 dark:text-gray-300 mt-4">This assessment has no questions. Please ask your teacher to add questions to it.</p>
                 <div className="mt-6">
                    <Button onClick={onExit} variant="secondary">Return to Topics</Button>
                 </div>
             </div>
        )
    }

    return (
        <div className="w-full max-w-3xl p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl relative">
            <button onClick={onExit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">&times;</button>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Question {currentIndex + 1} of {questions.length}</h2>
                 <Button onClick={handleHint} variant="secondary" className="px-4 py-2 text-sm">
                    💡 Request Hint ({hintsRequested})
                </Button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-6">
                <p className="text-gray-600 dark:text-gray-300 italic mb-2">Scenario:</p>
                <p className="text-lg text-gray-800 dark:text-gray-100">{task.scenario}</p>
            </div>
            {showHint && (
                 <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg mb-6" role="alert">
                    <p className="font-bold">Hint</p>
                    <p>{task.hint}</p>
                </div>
            )}
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{task.questionText}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {task.options.map(option => (
                    <button key={option} onClick={() => setSelected(option)} className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${selected === option ? 'bg-indigo-500 border-indigo-500 text-white scale-105 shadow-lg' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-indigo-100 dark:hover:bg-gray-600'}`}>
                        {option}
                    </button>
                ))}
            </div>
            <div className="mt-8 text-right">
                <Button onClick={handleSubmit} disabled={!selected}>Submit Answer</Button>
            </div>
        </div>
    );
};

export default AssessmentPlayer;