import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

describe('Projects & Tasks API Endpoints', () => {
  let token: string;
  let userId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const email = `proj_user_${Date.now()}@teamflow.dev`;
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Project Tester',
      email,
      password: 'Password123!'
    });
    token = regRes.body.data.token;
    userId = regRes.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@teamflow.dev' } }
    });
    await prisma.$disconnect();
  });

  it('POST /api/projects - should create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Project Flow',
        description: 'Testing project creation and membership'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Project Flow');
    projectId = res.body.data.id;
  });

  it('POST /api/projects/:projectId/tasks - should create a task in project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Integration Test Task',
        description: 'Testing task creation endpoint',
        priority: 'HIGH'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Integration Test Task');
    taskId = res.body.data.id;
  });

  it('PATCH /api/tasks/:id/status - should update task status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'IN_PROGRESS'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('GET /api/search - should perform search and return matched tasks', async () => {
    const res = await request(app)
      .get('/api/search?q=Integration')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toBeDefined();
  });
});
