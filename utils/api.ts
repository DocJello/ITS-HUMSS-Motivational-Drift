import { User, AssessmentAttempt, Assessment, Topic, Role } from '../types';
import { USERS, MOCK_ATTEMPTS, ASSESSMENTS, TOPICS } from '../constants';

// --- IMPORTANT ---
// To connect to your backend, replace `null` with the URL of your deployed Render service.
// Example: 'https://your-backend-name.onrender.com'
const API_BASE_URL = https://its-humss-backend.onrender.com; 

// --- LocalStorage Logic (used when API_BASE_URL is null) ---

const getData = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}"`, error);
        return defaultValue;
    }
};

const setData = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage for key "${key}"`, error);
    }
};

const USERS_KEY = 'its_users';
const ATTEMPTS_KEY = 'its_attempts';
const ASSESSMENTS_KEY = 'its_assessments';
const TOPICS_KEY = 'its_topics';


// --- API Logic (used when API_BASE_URL is set) ---
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
}

// --- Unified API Functions ---

// Users
export const fetchUsers = (): Promise<User[]> => {
    if (!API_BASE_URL) {
        return Promise.resolve(getData<User[]>(USERS_KEY, USERS));
    }
    return fetch(`${API_BASE_URL}/api/users`).then(handleResponse<User[]>);
};

export const updateUsers = (updatedUsers: User[]): Promise<void> => {
    if (!API_BASE_URL) {
        setData(USERS_KEY, updatedUsers);
        return Promise.resolve();
    }
    return fetch(`${API_BASE_URL}/api/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUsers),
    }).then(() => Promise.resolve());
};

export const deleteAllStudentData = (): Promise<void> => {
    if (!API_BASE_URL) {
        const currentUsers = getData<User[]>(USERS_KEY, USERS);
        const nonStudentUsers = currentUsers.filter(user => user.role !== Role.Student);
        setData(USERS_KEY, nonStudentUsers);
        setData(ATTEMPTS_KEY, []);
        return Promise.resolve();
    }
    return fetch(`${API_BASE_URL}/api/student-data`, {
        method: 'DELETE',
    }).then(() => Promise.resolve());
};


// Attempts
export const fetchAttempts = (): Promise<AssessmentAttempt[]> => {
    if (!API_BASE_URL) {
        return Promise.resolve(getData<AssessmentAttempt[]>(ATTEMPTS_KEY, MOCK_ATTEMPTS));
    }
    return fetch(`${API_BASE_URL}/api/attempts`).then(handleResponse<AssessmentAttempt[]>);
};

export const saveNewAttempt = (newAttempt: AssessmentAttempt): Promise<AssessmentAttempt> => {
    if (!API_BASE_URL) {
        const allAttempts = getData<AssessmentAttempt[]>(ATTEMPTS_KEY, MOCK_ATTEMPTS);
        const updatedAttempts = [...allAttempts, newAttempt];
        setData(ATTEMPTS_KEY, updatedAttempts);
        return Promise.resolve(newAttempt);
    }
    return fetch(`${API_BASE_URL}/api/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttempt),
    }).then(handleResponse<AssessmentAttempt>);
};

// Assessments
export const fetchAssessments = (): Promise<Assessment[]> => {
    if (!API_BASE_URL) {
        return Promise.resolve(getData<Assessment[]>(ASSESSMENTS_KEY, ASSESSMENTS));
    }
    return fetch(`${API_BASE_URL}/api/assessments`).then(handleResponse<Assessment[]>);
};

export const updateAssessments = (updatedAssessments: Assessment[]): Promise<void> => {
    if (!API_BASE_URL) {
        setData(ASSESSMENTS_KEY, updatedAssessments);
        return Promise.resolve();
    }
    return fetch(`${API_BASE_URL}/api/assessments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssessments),
    }).then(() => Promise.resolve());
};

// Topics
export const fetchTopics = (): Promise<Topic[]> => {
    if (!API_BASE_URL) {
        return Promise.resolve(getData<Topic[]>(TOPICS_KEY, TOPICS));
    }
    return fetch(`${API_BASE_URL}/api/topics`).then(handleResponse<Topic[]>);
};

export const updateTopics = (updatedTopics: Topic[]): Promise<void> => {
    if (!API_BASE_URL) {
        setData(TOPICS_KEY, updatedTopics);
        return Promise.resolve();
    }
    return fetch(`${API_BASE_URL}/api/topics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTopics),
    }).then(() => Promise.resolve());
};
