import { Pool } from 'pg';
import dotenv from 'dotenv';
import { USERS, SECTIONS, TOPICS, QUESTION_BANK, ASSESSMENTS } from './seedData';
import { Role } from '../../types';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

const createTables = async () => {
    const createSectionsTable = `
        CREATE TABLE IF NOT EXISTS sections (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );
    `;
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            section_id VARCHAR(255) REFERENCES sections(id),
            section_ids TEXT[]
        );
    `;
    const createTopicsTable = `
        CREATE TABLE IF NOT EXISTS topics (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            learning_materials TEXT,
            external_links JSONB,
            is_published BOOLEAN DEFAULT false,
            formative_assessment_id VARCHAR(255),
            summative_assessment_id VARCHAR(255)
        );
    `;
     const createQuestionsTable = `
        CREATE TABLE IF NOT EXISTS questions (
            id VARCHAR(255) PRIMARY KEY,
            scenario TEXT NOT NULL,
            question_text TEXT NOT NULL,
            options TEXT[] NOT NULL,
            correct_answer VARCHAR(255) NOT NULL,
            hint TEXT,
            topic_id VARCHAR(255) NOT NULL,
            difficulty VARCHAR(50) NOT NULL,
            rationale TEXT,
            creator_id VARCHAR(255) NOT NULL
        );
    `;
    const createAssessmentsTable = `
         CREATE TABLE IF NOT EXISTS assessments (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            topic_id VARCHAR(255) NOT NULL,
            question_ids TEXT[]
        );
    `;
    const createAttemptsTable = `
        CREATE TABLE IF NOT EXISTS assessment_attempts (
            id VARCHAR(255) PRIMARY KEY,
            student_id VARCHAR(255) NOT NULL,
            assessment_id VARCHAR(255) NOT NULL,
            start_time TIMESTAMPTZ NOT NULL,
            end_time TIMESTAMPTZ,
            answers JSONB,
            motivation_surveys JSONB,
            score INTEGER
        );
    `;

    try {
        await query(createSectionsTable);
        await query(createUsersTable);
        await query(createTopicsTable);
        await query(createQuestionsTable);
        await query(createAssessmentsTable);
        await query(createAttemptsTable);
        console.log('Tables created successfully (if they did not exist).');
    } catch (err) {
        console.error('Error creating tables:', err);
        throw err;
    }
};

const seedDatabase = async () => {
    const { rows } = await query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count, 10) > 0) {
        console.log('Database already seeded.');
        return;
    }

    console.log('Seeding database...');
    try {
        // SECTIONS
        for (const section of SECTIONS) {
            await query('INSERT INTO sections (id, name) VALUES ($1, $2)', [section.id, section.name]);
        }
        // USERS
        for (const user of USERS) {
            await query('INSERT INTO users (id, username, role, name, section_id, section_ids) VALUES ($1, $2, $3, $4, $5, $6)', 
                [user.id, user.username, user.role, user.name, user.sectionId, user.sectionIds]
            );
        }
        // TOPICS
        for (const topic of TOPICS) {
            await query('INSERT INTO topics (id, title, learning_materials, external_links, is_published, formative_assessment_id, summative_assessment_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [topic.id, topic.title, topic.learningMaterials, JSON.stringify(topic.externalLinks), topic.isPublished, topic.formativeAssessmentId, topic.summativeAssessmentId]
            );
        }
        // QUESTIONS
        for (const q of QUESTION_BANK) {
             await query('INSERT INTO questions (id, scenario, question_text, options, correct_answer, hint, topic_id, difficulty, rationale, creator_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [q.id, q.scenario, q.questionText, q.options, q.correctAnswer, q.hint, q.topicId, q.difficulty, q.rationale, q.creatorId]
            );
        }
        // ASSESSMENTS
        for (const assessment of ASSESSMENTS) {
            await query('INSERT INTO assessments (id, title, type, topic_id, question_ids) VALUES ($1, $2, $3, $4, $5)',
                [assessment.id, assessment.title, assessment.type, assessment.topicId, assessment.questionIds]
            );
        }

        console.log('Database seeded successfully.');
    } catch (err) {
        console.error('Error seeding database:', err);
        throw err;
    }
};

export const initializeDatabase = async () => {
    try {
        await createTables();
        await seedDatabase();
    } catch (err) {
        console.error('Failed to initialize database:', err);
        // FIX: Cast process to any to avoid type error on 'exit'.
        (process as any).exit(1);
    }
};