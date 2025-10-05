import { InferredDataPoint, MotivationLevel, AssessmentAttempt } from '../types';

// HMM Simulation Logic
export const inferMotivationState = (data: Omit<InferredDataPoint, 'inferredState'>): MotivationLevel => {
    const { isCorrect, timeOnTask, hintsRequested } = data;
    
    // Low Motivation Indicators
    if (!isCorrect && (timeOnTask > 15 || hintsRequested > 0)) {
        return MotivationLevel.Low;
    }
    if (timeOnTask > 20) {
        return MotivationLevel.Low;
    }

    // High Motivation Indicators
    if (isCorrect && timeOnTask < 7 && hintsRequested === 0) {
        return MotivationLevel.High;
    }

    // Otherwise, Medium
    return MotivationLevel.Medium;
};

export const motivationToNumber = (level: MotivationLevel): number => {
    switch(level) {
        case MotivationLevel.High: return 3;
        case MotivationLevel.Medium: return 2;
        case MotivationLevel.Low: return 1;
        default: return 0;
    }
};

export const analyzeMotivationDrift = (attempt: AssessmentAttempt | undefined): { summary: string; insight: string } => {
    if (!attempt || attempt.answers.length < 3) {
        return { summary: 'Not Enough Data', insight: 'Student has not completed enough of an assessment for analysis.' };
    }

    const inferredStates = attempt.answers.map((ans, index) => {
        const dataPoint = { task: index + 1, isCorrect: ans.isCorrect ? 1 : 0, timeOnTask: ans.timeOnTask, hintsRequested: ans.hintsRequested };
        return inferMotivationState(dataPoint);
    });

    const numericStates = inferredStates.map(motivationToNumber);
    const firstHalfAvg = numericStates.slice(0, Math.ceil(numericStates.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(numericStates.length / 2);
    const secondHalfAvg = numericStates.slice(Math.ceil(numericStates.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(numericStates.length / 2);

    const drift = secondHalfAvg - firstHalfAvg;

    if (drift < -0.75) {
        return { summary: 'Significant Drift', insight: 'Motivation dropped noticeably. Consider reviewing the second half of the material.' };
    }
    if (drift < -0.3) {
        return { summary: 'Minor Drift', insight: 'Slight decrease in engagement. Check for difficult questions towards the end.' };
    }
    if (drift > 0.5) {
        return { summary: 'Improved Engagement', insight: 'Student became more engaged over time. Positive reinforcement may be effective.' };
    }
    return { summary: 'Stable Motivation', insight: 'Engagement levels remained consistent throughout the assessment.' };
};