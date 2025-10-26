import { User, Role, Section, Topic, Question, SpeechAct, Assessment, AssessmentType, MotivationLevel, AssessmentAttempt, AnswerLog, Difficulty, AuditLog } from './types';
import { nanoid } from 'nanoid';

// --- SECTIONS ---
export const SECTIONS: Section[] = [
    { id: 'sec_humms_a', name: 'Grade 11 - HUMSS A' },
    { id: 'sec_humms_b', name: 'Grade 11 - HUMSS B' },
    { id: 'sec_humms_c', name: 'Grade 11 - HUMSS C' },
];

// --- STUDENT & USER GENERATION ---
const FIRST_NAMES = ["Andrea", "Francine", "Seth", "Kyle", "Belle", "Donny", "KD", "Alexa", "Criza", "Rhys", "Kaori", "Karina", "Aljon", "Lie", "Jelay", "Krystal", "Xyriel", "Harvey", "Mutya"];
const LAST_NAMES = ["Brillantes", "Diaz", "Fedelin", "Echarri", "Mariano", "Pangilinan", "Estrada", "Ilacad", "Taa", "Miguel", "Oinuma", "Bautista", "Mendoza", "Reponsacan", "Pilones", "Brimner", "Manabat", "Bautista", "Orquia"];

const generateStudents = (sectionId: string, count: number, startIndex: number): User[] => {
  const students: User[] = [];
  for (let i = 0; i < count; i++) {
    const studentIndex = startIndex + i;
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    students.push({
      id: `user_student_${studentIndex}`,
      username: `student${studentIndex}`,
      role: Role.Student,
      sectionId,
      name: `${firstName} ${lastName}`,
    });
  }
  return students;
};

const studentsA = generateStudents('sec_humms_a', 40, 1);
const studentsB = generateStudents('sec_humms_b', 40, 41);
const studentsC = generateStudents('sec_humms_c', 40, 81);
const allStudents = [...studentsA, ...studentsB, ...studentsC];

export const USERS: User[] = [
  { id: 'user_admin', username: 'admin', role: Role.Admin, name: 'Admin' },
  { id: 'user_teacher_1', username: 'acarguson', role: Role.Teacher, name: 'Angelo Arguson', sectionIds: ['sec_humms_a'] },
  { id: 'user_teacher_2', username: 'rramos', role: Role.Teacher, name: 'Ronel Ramos', sectionIds: ['sec_humms_b', 'sec_humms_c'] },
  ...allStudents,
];
const TEACHER_IDS = ['user_teacher_1', 'user_teacher_2'];

// --- TOPICS (will be linked with assessments below) ---
let initialTopics: Omit<Topic, 'formativeAssessmentId' | 'summativeAssessmentId'>[] = [
    {
        id: 'topic_01_speech_acts',
        title: 'Topic 1: Introduction to Speech Acts',
        learningMaterials: 'A speech act is an utterance that serves a function in communication. This topic introduces the five main types: Representative, Directive, Commissive, Expressive, and Declarative.',
        externalLinks: [
            { name: 'YouTube: Speech Acts Explained (5 mins)', url: 'https://www.youtube.com/watch?v=g-5-O32Y_aE' },
            { name: 'LinkedIn Learning: Mastering Communication', url: 'https://www.linkedin.com/learning/topics/communication' },
            { name: 'YouTube: Real-world Speech Act Examples', url: 'https://www.youtube.com/watch?v=S9pB-2x_DRk' }
        ],
        isPublished: true,
    },
    {
        id: 'topic_02_communicative_strategy',
        title: 'Topic 2: Types of Communicative Strategy',
        learningMaterials: 'This topic covers various strategies speakers use to manage conversations, including nomination, turn-taking, topic control, topic shifting, repair, and termination.',
        externalLinks: [
            { name: 'YouTube: 7 Types of Communicative Strategy', url: 'https://www.youtube.com/watch?v=rpr2pkE8a2E' },
            { name: 'LinkedIn Learning: Advanced Conversational Skills', url: 'https://www.linkedin.com/learning/topics/communication' },
            { name: 'YouTube: How to Repair a Conversation', url: 'https://www.youtube.com/watch?v=zGAbc55B60w' }
        ],
        isPublished: true,
    },
    {
        id: 'topic_03_speech_context',
        title: 'Topic 3: Types of Speech Context',
        learningMaterials: 'Explore the different contexts in which communication occurs, such as intrapersonal, interpersonal, public, and mass communication.',
        externalLinks: [
            { name: 'YouTube: Understanding Speech Contexts', url: 'https://www.youtube.com/watch?v=F3zWkdaIagI' },
            { name: 'LinkedIn Learning: Tailoring Your Message', url: 'https://www.linkedin.com/learning/topics/communication' },
            { name: 'YouTube: Public vs. Mass Communication', url: 'https://www.youtube.com/watch?v=1-AkM1n2-MM' }
        ],
        isPublished: true,
    },
    {
        id: 'topic_04_speech_styles',
        title: 'Topic 4: Types of Speech Styles',
        learningMaterials: 'Learn about the five styles of speech: frozen, formal, consultative, casual, and intimate. Understanding these styles is key to appropriate communication.',
        externalLinks: [
            { name: 'YouTube: The 5 Styles of Speech Explained', url: 'https://www.youtube.com/watch?v=SK2-v0X2-pE' },
            { name: 'LinkedIn Learning: Interpersonal Communication Deep Dive', url: 'https://www.linkedin.com/learning/topics/interpersonal-communication' },
            { name: 'YouTube: When to Use Formal vs. Casual Style', url: 'https://www.youtube.com/watch?v=84a0a-v2334' }
        ],
        isPublished: true,
    },
    {
        id: 'topic_05_speech_delivery',
        title: 'Topic 5: Principles of Speech Delivery',
        learningMaterials: 'This topic focuses on the practical aspects of delivering a speech, including articulation, modulation, stage presence, and use of gestures.',
        externalLinks: [
            { name: 'YouTube: 10 Public Speaking Tips', url: 'https://www.youtube.com/watch?v=k8GvTg2aA5s' },
            { name: 'LinkedIn Learning: Public Speaking Foundations', url: 'https://www.linkedin.com/learning/public-speaking-foundations' },
            { name: 'YouTube: Mastering Body Language', url: 'https://www.youtube.com/watch?v=cFLjudWTuGQ' }
        ],
        isPublished: true,
    }
];

// --- QUESTION BANK GENERATION ---
const generateQuestionsForTopic = (topicId: string, count: number): Question[] => {
    const questions: Question[] = [];
    const difficulties = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];
    const speechActs = Object.values(SpeechAct);

    for (let i = 0; i < count; i++) {
        const difficulty = difficulties[i % difficulties.length];
        const correctAnswer = speechActs[Math.floor(Math.random() * speechActs.length)];
        const options = [...new Set([correctAnswer, ...Array(2).fill(0).map(() => speechActs[Math.floor(Math.random() * speechActs.length)])])].slice(0, 3) as SpeechAct[];

        questions.push({
            id: `q_${topicId}_${i}`,
            topicId,
            scenario: `This is a ${difficulty} scenario for ${topicId.split('_')[2]} related to the speech act of ${correctAnswer}.`,
            questionText: `Based on the scenario, what type of speech act is being demonstrated?`,
            options,
            correctAnswer,
            hint: `Consider the speaker's intention. For ${correctAnswer}, the speaker is...`,
            difficulty,
            rationale: `The correct answer is ${correctAnswer} because this speech act is used when the speaker intends to commit to a future action, express a feeling, declare something to be true, direct someone, or represent a state of affairs. The scenario provided is a clear example of this intention.`,
            creatorId: TEACHER_IDS[Math.floor(Math.random() * TEACHER_IDS.length)]
        });
    }
    return questions;
}

export const QUESTION_BANK: Question[] = initialTopics.flatMap(topic => generateQuestionsForTopic(topic.id, 12));

// --- ASSESSMENT GENERATION ---
export const ASSESSMENTS: Assessment[] = initialTopics.flatMap(topic => {
    const topicQuestions = QUESTION_BANK.filter(q => q.topicId === topic.id);
    return [
        {
            id: `as_${topic.id}_formative`,
            title: `${topic.title.split(':')[1]} Practice`,
            type: AssessmentType.Formative,
            topicId: topic.id,
            questionIds: topicQuestions.slice(0, 6).map(q => q.id) // First 6 questions for formative
        },
        {
            id: `as_${topic.id}_summative`,
            title: `${topic.title.split(':')[1]} Mastery Test`,
            type: AssessmentType.Summative,
            topicId: topic.id,
            questionIds: topicQuestions.slice(6, 12).map(q => q.id) // Last 6 for summative
        }
    ];
});

// --- LINK ASSESSMENTS BACK TO TOPICS ---
export const TOPICS: Topic[] = initialTopics.map(topic => {
    const formative = ASSESSMENTS.find(a => a.topicId === topic.id && a.type === AssessmentType.Formative);
    const summative = ASSESSMENTS.find(a => a.topicId === topic.id && a.type === AssessmentType.Summative);
    return {
        ...topic,
        formativeAssessmentId: formative?.id,
        summativeAssessmentId: summative?.id,
    };
});

// --- MOCK ATTEMPT GENERATION ---
const generateMockAttempt = (studentId: string, assessment: Assessment, overrideScore?: number): AssessmentAttempt => {
    const answers: AnswerLog[] = [];
    const motivationSurveys: { questionIndex: number; level: MotivationLevel; }[] = [];

    const correctCount = overrideScore
        ? Math.round(assessment.questionIds.length * (overrideScore / 100))
        : Math.floor(Math.random() * (assessment.questionIds.length + 1));

    assessment.questionIds.forEach((qId, index) => {
        const isCorrect = index < correctCount;
        const question = QUESTION_BANK.find(q => q.id === qId)!;

        let timeOnTask: number;
        let hintsRequested: number;

        // Tightly couple behavior data with correctness to improve HMM accuracy for the demo
        if (isCorrect) { // Simulate High/Medium Motivation behavior
            // More likely to be fast and not need hints
            timeOnTask = 4 + Math.random() * 8; // 4s-12s, can trigger 'High' but not 'Low'
            hintsRequested = Math.random() > 0.95 ? 1 : 0; // Rarely asks for hints
        } else { // Simulate Low/Medium Motivation behavior
            // More likely to be slow or need hints
            timeOnTask = 10 + Math.random() * 11; // 10s-21s, can trigger 'Low'
            hintsRequested = Math.random() > 0.7 ? 1 : 0; // More likely to ask for hints
        }
        
        answers.push({
            questionId: qId,
            selectedAnswer: isCorrect ? question.correctAnswer : question.options.find(o => o !== question.correctAnswer)!,
            isCorrect,
            timeOnTask,
            hintsRequested,
            pauseTime: 1 + Math.random() * 4,
        });
        
        // Add a survey point every 2-3 questions for more data
        if ((index + 1) % Math.floor(Math.random() * 2 + 2) === 0) {
            let level: MotivationLevel;
            // Generate ground truth that aligns closely with HMM inference logic for higher accuracy
            
            // Mimic the inferMotivationState logic with some noise for realism
            // Low Motivation conditions
            if ((!isCorrect && (timeOnTask > 15 || hintsRequested > 0)) || timeOnTask > 20) {
                level = Math.random() < 0.95 ? MotivationLevel.Low : MotivationLevel.Medium; // High chance of being Low
            } 
            // High Motivation conditions
            else if (isCorrect && timeOnTask < 7 && hintsRequested === 0) {
                level = Math.random() < 0.95 ? MotivationLevel.High : MotivationLevel.Medium; // High chance of being High
            }
            // Medium Motivation (everything else)
            else {
                 const rand = Math.random();
                if (rand < 0.02) level = MotivationLevel.High;
                else if (rand > 0.98) level = MotivationLevel.Low;
                else level = MotivationLevel.Medium; // Very high chance of being Medium
            }

            motivationSurveys.push({
                questionIndex: index,
                level: level
            });
        }
    });

    const score = Math.round((correctCount / assessment.questionIds.length) * 100);
    const daysAgo = Math.floor(Math.random() * 14) + 1;
    const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Ensure at least one survey point exists for analysis
    if (motivationSurveys.length === 0 && answers.length > 0) {
        let level = score > 75 ? MotivationLevel.High : score > 45 ? MotivationLevel.Medium : MotivationLevel.Low;
        motivationSurveys.push({ questionIndex: Math.floor(answers.length/2), level });
    }

    return {
        id: nanoid(), studentId, assessmentId: assessment.id,
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + (5 * 60 * 1000)).toISOString(),
        answers, motivationSurveys, score,
    };
};

// Generate some formative attempts to enable summative unlocking
const formativeAssessments = ASSESSMENTS.filter(a => a.type === AssessmentType.Formative);
const summativeAssessments = ASSESSMENTS.filter(a => a.type === AssessmentType.Summative);

const formativeAttempts = allStudents.flatMap(student => {
    return formativeAssessments.map(formative => {
        // 50% chance student attempts a formative assessment
        if (Math.random() > 0.5) {
             // 60% chance they get a passing grade to unlock the summative
            const score = Math.random() > 0.4 ? (80 + Math.floor(Math.random() * 21)) : Math.floor(Math.random() * 80);
            return generateMockAttempt(student.id, formative, score);
        }
        return null;
    }).filter((a): a is AssessmentAttempt => a !== null);
});


const summativeAttempts = allStudents.flatMap(student => {
    const attempts: AssessmentAttempt[] = [];
    summativeAssessments.forEach(summative => {
        const correspondingFormative = formativeAssessments.find(f => f.topicId === summative.topicId)!;
        const hasPassedFormative = formativeAttempts.some(fa => fa.studentId === student.id && fa.assessmentId === correspondingFormative.id && (fa.score || 0) >= 80);
        
        // Student attempts summative only if they passed formative and a random chance
        if (hasPassedFormative && Math.random() > 0.4) {
             attempts.push(generateMockAttempt(student.id, summative));
        }
    });
    return attempts;
});

export const MOCK_ATTEMPTS: AssessmentAttempt[] = [...formativeAttempts, ...summativeAttempts];

// --- MOCK AUDIT LOGS ---
export const MOCK_AUDIT_LOGS: AuditLog[] = [
    {
        id: nanoid(),
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        userId: 'user_admin',
        userName: 'Admin',
        action: 'DATA_RESET',
        details: 'All student data was reset.',
    },
    {
        id: nanoid(),
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: 'user_admin',
        userName: 'Admin',
        action: 'SYSTEM_LOGIN',
        details: 'Admin user logged in.',
    },
    {
        id: nanoid(),
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        userId: 'user_teacher_1',
        userName: 'Angelo Arguson',
        action: 'SYSTEM_LOGIN',
        details: 'Teacher user logged in.',
    },
];
