import { User, AssessmentAttempt, Assessment, Topic, Question, Role, AuditLog } from '../types';
import { USERS, MOCK_ATTEMPTS, ASSESSMENTS, TOPICS, QUESTION_BANK, MOCK_AUDIT_LOGS } from '../constants';

// To allow for mutation during the session, we'll work with copies of the mock data.
let localUsers: User[] = JSON.parse(JSON.stringify(USERS));
let localAttempts: AssessmentAttempt[] = JSON.parse(JSON.stringify(MOCK_ATTEMPTS));
let localAssessments: Assessment[] = JSON.parse(JSON.stringify(ASSESSMENTS));
let localTopics: Topic[] = JSON.parse(JSON.stringify(TOPICS));
let localQuestions: Question[] = JSON.parse(JSON.stringify(QUESTION_BANK));
let localAuditLogs: AuditLog[] = JSON.parse(JSON.stringify(MOCK_AUDIT_LOGS));

const delay = (ms: number = 50) => new Promise(res => setTimeout(res, ms));

// Users
export const fetchUsers = async (): Promise<User[]> => {
    await delay();
    // Return a deep copy to prevent direct mutation of the "database"
    return JSON.parse(JSON.stringify(localUsers));
};

export const updateUsers = async (updatedUsers: User[]): Promise<void> => {
    await delay();
    localUsers = updatedUsers;
};

export const deleteAllStudentData = async (): Promise<void> => {
    await delay(100);
    // Reset to initial state, but without students and their attempts
    localUsers = JSON.parse(JSON.stringify(USERS.filter(u => u.role !== Role.Student)));
    localAttempts = [];
};

export const restoreAllData = async (data: any): Promise<void> => {
    await delay();
    if (data.users && data.attempts && data.assessments && data.topics && data.questions) {
        localUsers = data.users;
        localAttempts = data.attempts;
        localAssessments = data.assessments;
        localTopics = data.topics;
        localQuestions = data.questions;
    } else {
        throw new Error("Invalid backup file format.");
    }
};

// Attempts
export const fetchAttempts = async (): Promise<AssessmentAttempt[]> => {
    await delay();
    return JSON.parse(JSON.stringify(localAttempts));
};

export const saveNewAttempt = async (newAttempt: AssessmentAttempt): Promise<AssessmentAttempt> => {
    await delay();
    localAttempts.push(newAttempt);
    return JSON.parse(JSON.stringify(newAttempt));
};

// Questions
export const fetchQuestions = async (): Promise<Question[]> => {
    await delay();
    return JSON.parse(JSON.stringify(localQuestions));
};

// Assessments
export const fetchAssessments = async (): Promise<Assessment[]> => {
    await delay();
    return JSON.parse(JSON.stringify(localAssessments));
};

export const updateAssessments = async (updatedAssessments: Assessment[]): Promise<void> => {
     await delay();
     localAssessments = updatedAssessments;
};

// Topics
export const fetchTopics = async (): Promise<Topic[]> => {
    await delay();
    return JSON.parse(JSON.stringify(localTopics));
};

export const updateTopics = async (updatedTopics: Topic[]): Promise<void> => {
    await delay();
    localTopics = updatedTopics;
};

// Audit Logs
export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
    await delay();
    return JSON.parse(JSON.stringify(localAuditLogs));
};

export const addAuditLog = async (newLog: AuditLog): Promise<AuditLog[]> => {
    await delay();
    localAuditLogs.unshift(newLog); // Add to the beginning of the array
    return JSON.parse(JSON.stringify(localAuditLogs));
};
