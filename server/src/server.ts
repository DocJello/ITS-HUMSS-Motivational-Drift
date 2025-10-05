
// The previous attempt to use named imports for express types was causing type
// conflicts. This has been reverted to a default import, and all Request/Response
// types are now fully qualified (e.g., `express.Request`) to ensure correctness.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase, query } from './db';
import { User, Role } from '../../types';

const app: express.Express = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// USERS
app.get('/api/users', async (req: express.Request, res: express.Response) => {
    try {
        const { rows } = await query('SELECT id, username, role, name, section_id as "sectionId", section_ids as "sectionIds" FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/users', async (req: express.Request, res: express.Response) => {
    const users: User[] = req.body;
    try {
        await query('BEGIN');
        await query('DELETE FROM users');
        for (const user of users) {
            await query('INSERT INTO users (id, username, role, name, section_id, section_ids) VALUES ($1, $2, $3, $4, $5, $6)', 
                [user.id, user.username, user.role, user.name, user.sectionId, user.sectionIds]
            );
        }
        await query('COMMIT');
        res.status(200).send('Users updated');
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to update users' });
    }
});

app.post('/api/reset-student-data', async (req: express.Request, res: express.Response) => {
    try {
        await query('BEGIN');
        await query('DELETE FROM assessment_attempts');
        await query('DELETE FROM users WHERE role = $1', [Role.Student]);
        await query('COMMIT');
        res.status(200).send('Student data reset');
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to reset student data' });
    }
});

// TOPICS
app.get('/api/topics', async (req: express.Request, res: express.Response) => {
    try {
        const { rows } = await query(`
            SELECT 
                id, title, 
                learning_materials as "learningMaterials", 
                external_links as "externalLinks",
                is_published as "isPublished",
                formative_assessment_id as "formativeAssessmentId",
                summative_assessment_id as "summativeAssessmentId"
            FROM topics
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/topics', async (req: express.Request, res: express.Response) => {
    const topics = req.body;
    try {
        await query('BEGIN');
        await query('DELETE FROM topics');
        for (const topic of topics) {
            await query('INSERT INTO topics (id, title, learning_materials, external_links, is_published, formative_assessment_id, summative_assessment_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [topic.id, topic.title, topic.learningMaterials, JSON.stringify(topic.externalLinks), topic.isPublished, topic.formativeAssessmentId, topic.summativeAssessmentId]
            );
        }
        await query('COMMIT');
        res.status(200).send('Topics updated');
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to update topics' });
    }
});


// QUESTIONS
app.get('/api/questions', async (req: express.Request, res: express.Response) => {
    try {
        const { rows } = await query(`
            SELECT 
                id, scenario, question_text as "questionText",
                options, correct_answer as "correctAnswer", hint,
                topic_id as "topicId", difficulty, rationale,
                creator_id as "creatorId"
            FROM questions
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// ASSESSMENTS
app.get('/api/assessments', async (req: express.Request, res: express.Response) => {
    try {
        const { rows } = await query(`
            SELECT id, title, type, topic_id as "topicId", question_ids as "questionIds"
            FROM assessments
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/assessments', async (req: express.Request, res: express.Response) => {
    const assessments = req.body;
    try {
        await query('BEGIN');
        await query('DELETE FROM assessments');
        for (const assessment of assessments) {
             await query('INSERT INTO assessments (id, title, type, topic_id, question_ids) VALUES ($1, $2, $3, $4, $5)',
                [assessment.id, assessment.title, assessment.type, assessment.topicId, assessment.questionIds]
            );
        }
        await query('COMMIT');
        res.status(200).send('Assessments updated');
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to update assessments' });
    }
});

// ATTEMPTS
app.get('/api/attempts', async (req: express.Request, res: express.Response) => {
    try {
        const { rows } = await query(`
            SELECT 
                id, student_id as "studentId", assessment_id as "assessmentId",
                start_time as "startTime", end_time as "endTime",
                answers, motivation_surveys as "motivationSurveys", score
            FROM assessment_attempts
        `);
        // Convert times to ISO strings for consistency
        const results = rows.map(row => ({
            ...row,
            startTime: row.startTime.toISOString(),
            endTime: row.endTime ? row.endTime.toISOString() : null,
        }))
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/attempts', async (req: express.Request, res: express.Response) => {
    const attempt = req.body;
    try {
        await query('INSERT INTO assessment_attempts (id, student_id, assessment_id, start_time, end_time, answers, motivation_surveys, score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [attempt.id, attempt.studentId, attempt.assessmentId, attempt.startTime, attempt.endTime, JSON.stringify(attempt.answers), JSON.stringify(attempt.motivationSurveys), attempt.score]
        );
        res.status(201).json(attempt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save attempt' });
    }
});

// --- SERVE FRONTEND ---
const clientBuildPath = path.join(__dirname, '../../dist');
app.use(express.static(clientBuildPath));

app.get('*', (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// --- START SERVER ---
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});