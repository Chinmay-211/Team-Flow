import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

describe('Auth API Endpoints', () => {
  const testUser = {
    name: 'Test Candidate',
    email: `test_${Date.now()}@teamflow.dev`,
    password: 'Password123!'
  };
  let token: string;

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@teamflow.dev' } }
    });
    await prisma.$disconnect();
  });

  it('POST /api/auth/register - should register new user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('POST /api/auth/login - should authenticate existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('GET /api/auth/me - should return authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email.toLowerCase());
  });
});
