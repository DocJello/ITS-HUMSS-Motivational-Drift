// All data has been moved to the backend and will be seeded into the database.
// This file is kept for potential future constants, but the mock data has been removed.
// The SECTIONS data is also now served from the backend, but we can keep it here for client-side reference if needed.
import { Section } from './types';

export const SECTIONS: Section[] = [
    { id: 'sec_humms_a', name: 'Grade 11 - HUMSS A' },
    { id: 'sec_humms_b', name: 'Grade 11 - HUMSS B' },
    { id: 'sec_humms_c', name: 'Grade 11 - HUMSS C' },
];
