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

// Helper function to build multi-row insert queries
const buildMultiRowInsert = <T extends object>(table: string, columns: (keyof T)[], data: T[]) => {
    // FIX: Automatically convert camelCase property names to snake_case for PostgreSQL column names.
    const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const columnNames = columns.map(col => toSnakeCase(String(col))).join(', ');
    
    const values: any[] = [];
    let paramCounter = 1;
    const valuePlaceholders = data.map(row => {
        const rowPlaceholders = columns.map(col => {
            const value = row[col];
            // Ensure undefined values are converted to null for SQL compatibility.
            values.push(value === undefined ? null : value);
            return `$${paramCounter++}`;
        });
        return `(${rowPlaceholders.join(', ')})`;
    }).join(', ');

    const queryText = `INSERT INTO ${table} (${columnNames}) VALUES ${valuePlaceholders}`;
    return { queryText, values };
}

const seedDatabase = async () => {
    const { rows } = await query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count, 10) > 0) {
        console.log('Database already seeded.');
        return;
    }

    console.log('Seeding database with efficient multi-row inserts...');
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // SECTIONS
            const sectionsQuery = buildMultiRowInsert('sections', ['id', 'name'], SECTIONS);
            await client.query(sectionsQuery.queryText, sectionsQuery.values);

            // USERS
            const usersQuery = buildMultiRowInsert('users', ['id', 'username', 'role', 'name', 'sectionId', 'sectionIds'], USERS);
            await client.query(usersQuery.queryText, usersQuery.values);
            
            // TOPICS
            const topicValues = TOPICS.map(t => ({...t, externalLinks: JSON.stringify(t.externalLinks)}));
            const topicsQuery = buildMultiRowInsert('topics', ['id', 'title', 'learningMaterials', 'externalLinks', 'isPublished', 'formativeAssessmentId', 'summativeAssessmentId'], topicValues);
            await client.query(topicsQuery.queryText, topicsQuery.values);

            // QUESTIONS
            const questionsQuery = buildMultiRowInsert('questions', ['id', 'scenario', 'questionText', 'options', 'correctAnswer', 'hint', 'topicId', 'difficulty', 'rationale', 'creatorId'], QUESTION_BANK);
            await client.query(questionsQuery.queryText, questionsQuery.values);

            // ASSESSMENTS
            const assessmentsQuery = buildMultiRowInsert('assessments', ['id', 'title', 'type', 'topicId', 'questionIds'], ASSESSMENTS);
            await client.query(assessmentsQuery.queryText, assessmentsQuery.values);

            await client.query('COMMIT');
            console.log('Database seeded successfully.');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
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
        // Cast process to any to avoid type error on 'exit'.
        (process as any).exit(1);
    }
};