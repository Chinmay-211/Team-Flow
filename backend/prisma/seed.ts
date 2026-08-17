import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TeamFlow Database Seeding...');

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Lead',
      email: 'admin@teamflow.dev',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Kumar',
      email: 'rahul@teamflow.dev',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    }
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@teamflow.dev',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    }
  });

  console.log(`✅ Created 3 seed users: admin@teamflow.dev, rahul@teamflow.dev, priya@teamflow.dev`);

  // 2. Create Project 1: TeamFlow Core Platform
  const project1 = await prisma.project.create({
    data: {
      name: 'TeamFlow Core Platform',
      description: 'Full-Stack React 19, Node.js REST API & PostgreSQL Collaboration Engine',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: Role.OWNER },
          { userId: rahul.id, role: Role.ADMIN },
          { userId: priya.id, role: Role.MEMBER }
        ]
      }
    }
  });

  // Create Project 2: AWS Infrastructure & CI/CD
  const project2 = await prisma.project.create({
    data: {
      name: 'AWS Infrastructure & Cloud Native',
      description: 'ECS Fargate, ALB, S3, OpenSearch, Redis, SNS and SQS Notification Pipeline',
      ownerId: rahul.id,
      members: {
        create: [
          { userId: rahul.id, role: Role.OWNER },
          { userId: admin.id, role: Role.ADMIN },
          { userId: priya.id, role: Role.MEMBER }
        ]
      }
    }
  });

  console.log(`✅ Created 2 projects with members`);

  // 3. Create Tasks for Project 1
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Implement JWT Authentication & Refresh Middleware',
      description: 'Build stateless JWT verification middleware with bcrypt password hashing in Express.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdBy: admin.id,
      assignedTo: rahul.id
    }
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Build Responsive Kanban Board UI',
      description: 'Create glassmorphism Kanban columns for TODO, IN_PROGRESS, DONE with drag & status updates.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      createdBy: rahul.id,
      assignedTo: priya.id
    }
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Integrate Redis Dashboard Caching',
      description: 'Cache aggregate user metrics with 60s TTL and event-driven invalidation.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      createdBy: admin.id,
      assignedTo: rahul.id
    }
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Add File Attachment Support to Tasks',
      description: 'Allow users to upload PDFs, images, and docs to Amazon S3 with presigned download URLs.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      createdBy: priya.id,
      assignedTo: admin.id
    }
  });

  const task5 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Write Jest Integration Test Suite',
      description: 'Create test coverage for registration, login, task updates, and project authorization.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      createdBy: admin.id,
      assignedTo: priya.id
    }
  });

  // Create Tasks for Project 2
  const task6 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Configure Amazon OpenSearch Indexing',
      description: 'Create teamflow-content index with multi-match search and PostgreSQL FTS fallback.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      createdBy: rahul.id,
      assignedTo: admin.id
    }
  });

  const task7 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Setup Amazon SNS Topic & SQS Queue Pipeline',
      description: 'Fan-out event notifications from SNS topic teamflow-events to SQS worker queue.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      createdBy: rahul.id,
      assignedTo: rahul.id
    }
  });

  const task8 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Create ECS Fargate Task Definitions & Dockerfiles',
      description: 'Multi-stage Docker builds for API service and Worker service with CloudWatch logs.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdBy: admin.id,
      assignedTo: rahul.id
    }
  });

  const task9 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Configure Application Load Balancer Health Check',
      description: 'Map ALB target group to GET /health endpoint for automatic task recycling.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      createdBy: priya.id,
      assignedTo: priya.id
    }
  });

  const task10 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Enforce IAM Least Privilege Roles',
      description: 'Define separate IAM task roles for API service and SQS worker background task.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      createdBy: rahul.id,
      assignedTo: admin.id
    }
  });

  console.log(`✅ Created 10 sample tasks across both projects`);

  // 4. Create Sample Comments
  await prisma.comment.create({
    data: {
      taskId: task1.id,
      userId: rahul.id,
      content: 'JWT authentication middleware implemented and tested with 7d expiration!'
    }
  });

  await prisma.comment.create({
    data: {
      taskId: task2.id,
      userId: priya.id,
      content: 'Kanban board UI styling updated with glassmorphism panels and responsive layout.'
    }
  });

  await prisma.comment.create({
    data: {
      taskId: task7.id,
      userId: admin.id,
      content: 'Verified SQS notification worker long polling loop and idempotent record insertion.'
    }
  });

  console.log(`✅ Created sample comments`);

  // 5. Create Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: rahul.id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned to You',
        message: 'Admin Lead assigned you: "Implement Redis Dashboard Caching"',
        isRead: false
      },
      {
        userId: priya.id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned to You',
        message: 'Rahul Kumar assigned you: "Build Responsive Kanban Board UI"',
        isRead: false
      },
      {
        userId: admin.id,
        type: 'COMMENT_ADDED',
        title: 'New Comment on Task',
        message: 'Rahul Kumar commented on "Configure Amazon OpenSearch Indexing"',
        isRead: true
      }
    ]
  });

  console.log(`✅ Created sample notifications`);

  // 6. Create Activities
  await prisma.activity.createMany({
    data: [
      {
        projectId: project1.id,
        userId: admin.id,
        action: 'PROJECT_CREATED',
        entityType: 'project',
        entityId: project1.id,
        metadata: { name: project1.name }
      },
      {
        projectId: project1.id,
        userId: rahul.id,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'task',
        entityId: task1.id,
        metadata: { oldStatus: 'IN_PROGRESS', newStatus: 'DONE', title: task1.title }
      },
      {
        projectId: project2.id,
        userId: priya.id,
        action: 'TASK_CREATED',
        entityType: 'task',
        entityId: task9.id,
        metadata: { title: task9.title }
      }
    ]
  });

  console.log(`✅ Created sample activities`);
  console.log('🚀 TeamFlow Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
