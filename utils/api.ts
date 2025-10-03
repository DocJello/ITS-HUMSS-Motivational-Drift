import { USERS, MOCK_ATTEMPTS, ASSESSMENTS, TOPICS } from '../constants';
import { User, AssessmentAttempt, Assessment, Topic } from '../types';

const LS_USERS = 'allMotivationUsers';
const LS_ATTEMPTS = 'allMotivationAttempts';
const LS_ASSESSMENTS = 'allMotivationAssessments';
const LS_TOPICS = 'allMotivationTopics';

const initializeData = () => {
    if (!localStorage.getItem(LS_USERS)) {
        localStorage.setItem(LS_USERS, JSON.stringify(USERS));
    }
    if (!localStorage.getItem(LS_ATTEMPTS)) {
        localStorage.setItem(LS_ATTEMPTS, JSON.stringify(MOCK_ATTEMPTS));
    }
    if (!localStorage.getItem(LS_ASSESSMENTS)) {
        localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(ASSESSMENTS));
    }
    if (!localStorage.getItem(LS_TOPICS)) {
        localStorage.setItem(LS_TOPICS, JSON.stringify(TOPICS));
    }
};

initializeData();

// --- API Functions ---

// Users
export const fetchUsers = (): Promise<User[]> => {
    const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
    return Promise.resolve(users);
};

export const updateUsers = (updatedUsers: User[]): Promise<void> => {
    localStorage.setItem(LS_USERS, JSON.stringify(updatedUsers));
    return Promise.resolve();
};

// Attempts
export const fetchAttempts = (): Promise<AssessmentAttempt[]> => {
    const attempts = JSON.parse(localStorage.getItem(LS_ATTEMPTS) || '[]');
    return Promise.resolve(attempts);
};

export const saveAttempts = (updatedAttempts: AssessmentAttempt[]): Promise<void> => {
    localStorage.setItem(LS_ATTEMPTS, JSON.stringify(updatedAttempts));
    return Promise.resolve();
};

// Assessments
export const fetchAssessments = (): Promise<Assessment[]> => {
    const assessments = JSON.parse(localStorage.getItem(LS_ASSESSMENTS) || '[]');
    return Promise.resolve(assessments);
};

export const updateAssessments = (updatedAssessments: Assessment[]): Promise<void> => {
    localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(updatedAssessments));
    return Promise.resolve();
};

// Topics
export const fetchTopics = (): Promise<Topic[]> => {
    const topics = JSON.parse(localStorage.getItem(LS_TOPICS) || '[]');
    return Promise.resolve(topics);
};

export const updateTopics = (updatedTopics: Topic[]): Promise<void> => {
    localStorage.setItem(LS_TOPICS, JSON.stringify(updatedTopics));
    return Promise.resolve();
};
