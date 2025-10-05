export enum Role {
  Admin = "Admin",
  Teacher = "Teacher",
  Student = "Student",
}

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
  sectionId?: string; // For students
  sectionIds?: string[]; // For teachers
}

export enum SpeechAct {
  Commissive = "Commissive",
  Declarative = "Declarative",
  Directive = "Directive",
  Expressive = "Expressive",
  Representative = "Representative",
}

export enum Difficulty {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
}

export const POINTS = {
    [Difficulty.Easy]: 1,
    [Difficulty.Medium]: 2,
    [Difficulty.Hard]: 3,
};

export interface Question {
  id: string;
  scenario: string;
  questionText: string;
  options: SpeechAct[];
  correctAnswer: SpeechAct;
  hint: string;
  topicId: string;
  difficulty: Difficulty;
  rationale: string;
  creatorId: string;
}

export enum AssessmentType {
    Formative = "Formative",
    Summative = "Summative",
}

export interface Assessment {
    id: string;
    title: string;
    type: AssessmentType;
    topicId: string;
    questionIds: string[];
}

export interface Section {
    id: string;
    name: string;
}

export interface Topic {
    id:string;
    title: string;
    learningMaterials: string;
    externalLinks: { name: string; url: string }[];
    isPublished: boolean;
    formativeAssessmentId?: string;
    summativeAssessmentId?: string;
}

export interface AnswerLog {
  questionId: string;
  selectedAnswer: SpeechAct;
  isCorrect: boolean;
  timeOnTask: number; // in seconds
  hintsRequested: number;
  pauseTime: number; // in seconds
}

export enum MotivationLevel {
  High = "Highly Motivated",
  Medium = "Moderately Motivated",
  Low = "Low Motivation",
}

export interface AssessmentAttempt {
  id: string;
  studentId: string;
  assessmentId: string;
  startTime: string;
  endTime: string | null;
  answers: AnswerLog[];
  motivationSurveys: { questionIndex: number; level: MotivationLevel }[];
  score?: number; // for formative and summative
}

export interface InferredDataPoint {
  task: number;
  isCorrect: number; // 1 for correct, 0 for incorrect
  timeOnTask: number;
  hintsRequested: number;
  inferredState: MotivationLevel;
  groundTruth?: MotivationLevel;
}