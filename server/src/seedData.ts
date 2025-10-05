// This file contains the initial data that will be seeded into the database.
// It's a direct copy of the data previously in `constants.ts`.
import { User, Role, Section, Topic, Question, SpeechAct, Assessment, AssessmentType, Difficulty } from '../../types';

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