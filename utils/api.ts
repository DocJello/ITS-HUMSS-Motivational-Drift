import { User, AssessmentAttempt, Assessment, Topic, Question } from '../types';

// NOTE: This file is completely rewritten to fetch data from the backend API.
// The base URL will be relative, so it works in production when the client is served by the server.
const API_BASE = '/api'; 

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
};

// Users
export const fetchUsers = (): Promise<User[]> => {
    return fetch(`${API_BASE}/users`).then(handleResponse<User[]>);
};

export const updateUsers = (updatedUsers: User[]): Promise<void> => {
    return fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUsers),
    }).then(res => {
        if (!res.ok) throw new Error('Failed to update users');
    });
};

export const deleteAllStudentData = (): Promise<void> => {
    return fetch(`${API_BASE}/reset-student-data`, {
        method: 'POST'
    }).then(res => {
        if (!res.ok) throw new Error('Failed to reset student data');
    });
};

// Attempts
export const fetchAttempts = (): Promise<AssessmentAttempt[]> => {
    return fetch(`${API_BASE}/attempts`).then(handleResponse<AssessmentAttempt[]>);
};

export const saveNewAttempt = (newAttempt: AssessmentAttempt): Promise<AssessmentAttempt> => {
    return fetch(`${API_BASE}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttempt),
    }).then(handleResponse<AssessmentAttempt>);
};

// Questions
export const fetchQuestions = (): Promise<Question[]> => {
    return fetch(`${API_BASE}/questions`).then(handleResponse<Question[]>);
};

// Assessments
export const fetchAssessments = (): Promise<Assessment[]> => {
    return fetch(`${API_BASE}/assessments`).then(handleResponse<Assessment[]>);
};

export const updateAssessments = (updatedAssessments: Assessment[]): Promise<void> => {
     return fetch(`${API_BASE}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssessments),
    }).then(res => {
        if (!res.ok) throw new Error('Failed to update assessments');
    });
};

// Topics
export const fetchTopics = (): Promise<Topic[]> => {
    return fetch(`${API_BASE}/topics`).then(handleResponse<Topic[]>);
};

export const updateTopics = (updatedTopics: Topic[]): Promise<void> => {
    return fetch(`${API_BASE}/topics`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(updatedTopics),
   }).then(res => {
       if (!res.ok) throw new Error('Failed to update topics');
   });
};