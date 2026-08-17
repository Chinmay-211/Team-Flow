# TeamFlow — Full-Stack Team Collaboration Platform

> **Interview-Grade Full-Stack & AWS Cloud Project**  
> Built for **React.js + Node.js + AWS Developer** technical demonstrations.

TeamFlow is a full-stack enterprise collaboration platform combining the Kanban task workflow of **Trello**, project management features of **Jira**, and event-driven notifications of **Slack**. It features React 19, Node.js (Express & TypeScript), PostgreSQL (Prisma ORM), Redis caching, Amazon S3 attachments, Amazon OpenSearch global search, Amazon SNS → SQS event-driven notification workers, and containerized deployment manifests for AWS ECS Fargate, ALB, IAM, and CloudWatch.

---

## Architecture Diagram

```text
                                  +-------------------+
                                  | React Frontend    |
                                  | (Vite + React 19) |
                                  +---------+---------+
                                            |
                                            v
                               +--------------------------+
                               | Application Load Balancer|
                               +------------+-------------+
                                            |
                                            v
                            +-------------------------------+
                            | ECS Fargate API Service       |
                            | (Express.js / TypeScript)     |
                            +----+-------+---------+--------+
                                 |       |         |
                 +---------------+       |         +---------------+
                 |                       |                         |
                 v                       v                         v
        +-----------------+     +-----------------+     +--------------------+
        | PostgreSQL      |     | Redis           |     | Amazon OpenSearch  |
        | (Prisma ORM)    |     | (Cache Layer)   |     | (Search Index)     |
        +-----------------+     +-----------------+     +--------------------+
                 ^                       |
                 | (Attachment Meta)     v
                 |              +-----------------+
        +--------+--------+     | Amazon S3       |
        | Amazon S3       |     | (File Uploads)  |
        | (Direct/Signed) |     +-----------------+
        +-----------------+

                  API Action (e.g. Task Assigned)
                                 |
                                 v
                         +---------------+
                         |  Amazon SNS   |
                         +-------+-------+
                                 |
                                 v
                         +---------------+
                         |  Amazon SQS   |
                         +-------+-------+
                                 |
                                 v
                   +----------------------------+
                   | ECS Fargate Worker Service |
                   | (ECS SQS Consumer)         |
                   +-------------+--------------+
                                 |
                                 v
                    (Notification & DB Updates)
```

---

## Feature Matrix

- 🔐 **JWT Authentication & RBAC**: Password hashing via `bcrypt`, statelessly signed JWT tokens, and project-level authorization (`OWNER`, `ADMIN`, `MEMBER`).
- 📋 **Interactive Kanban Board**: Dynamic status columns (`TODO`, `IN_PROGRESS`, `DONE`) with real-time status transitions and activity logs.
- ⚡ **Redis Caching**: Dashboard aggregate caching (60s TTL) and Search query caching (120s TTL) with graceful fallback if Redis is offline.
- 🔎 **Amazon OpenSearch & FTS**: Multi-match fuzzy search across tasks, projects, and comments with PostgreSQL FTS fallback.
- 📁 **Amazon S3 File Attachments**: Task attachment uploads with 1-hour presigned download URLs and local disk storage fallback.
- 🔔 **SNS → SQS Event Bus & SQS Worker**: Asynchronous background worker consuming SQS queues fan-out from SNS topics (`TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `COMMENT_ADDED`).
- 🐳 **Docker & Docker Compose Ready**: Includes multi-stage Dockerfiles for API, Worker, and Frontend, plus `docker-compose.yml` for local execution.
- ☁️ **AWS Infrastructure Specs**: Task definitions for ECS Fargate, ALB target groups, IAM least-privilege policies, and CloudWatch logging manifests.

---

## Technology Stack

- **Frontend**: React 19, Vite, TypeScript, React Router v7, Axios, Lucide React, Glassmorphic CSS.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Zod, Bcrypt.js, JsonWebToken, Winston.
- **Databases & Cache**: PostgreSQL 16, Redis 7.
- **AWS Services & SDKs**: AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/client-sns`, `@aws-sdk/client-sqs`, `@aws-sdk/s3-request-presigner`), `@opensearch-project/opensearch`.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- Docker & Docker Compose (or local PostgreSQL)

### 1. Installation
Clone the repository and install root dependencies:
```bash
git clone https://github.com/your-org/teamflow.git
cd teamflow
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run with Docker Compose
Start PostgreSQL, Redis, Backend API, Worker, and Frontend:
```bash
docker compose up --build
```
Access the application at:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **ALB Health Check**: `http://localhost:3000/health`

---

## Seed Data & Demo Accounts

To run the database migrations and populate seed data:
```bash
npm run db:migrate
npm run db:seed
```

### Pre-configured Interview Demo Accounts
All seed accounts use password: `Password123!`

| Role | Email | Name |
| :--- | :--- | :--- |
| **Owner / Lead** | `admin@teamflow.dev` | Admin Lead |
| **Admin** | `rahul@teamflow.dev` | Rahul Kumar |
| **Member** | `priya@teamflow.dev` | Priya Sharma |

---

## Interview Demonstration Flow (Step-by-Step)

During a candidate technical interview, demonstrate these steps:

1. **Demo 1 — React & Auth**: Open `http://localhost:5173/login`, click the **Admin** preset button, and log in. Show the responsive dark-mode Dashboard.
2. **Demo 2 — Task Management & Kanban**: Navigate to **Projects** → "TeamFlow Core Platform". Move a task card from `TODO` to `IN_PROGRESS`.
3. **Demo 3 — SNS / SQS Notification Flow**: Open task details, assign "Add File Attachment Support" to `rahul@teamflow.dev`. In a separate incognito window, log in as `rahul@teamflow.dev` to see the notification badge 🔔.
4. **Demo 4 — Amazon S3 File Upload**: Inside task detail modal, click **Upload File** and attach a PDF or image. Verify presigned URL download link.
5. **Demo 5 — OpenSearch & Redis Caching**: Type `AWS Redis` in the top search bar. Highlight the `⚡ Redis Cache: HIT/MISS` badge.
6. **Demo 6 — AWS Infrastructure & Code Review**: Show `infrastructure/ecs/`, `infrastructure/iam/`, and `docs/interview-questions.md`.

---

## AWS Services Architecture & Rationale

- **Amazon S3**: Used for storing file attachments. Prevents database bloat and offloads heavy file serving via presigned URLs.
- **Amazon Redis**: Used for caching high-frequency dashboard metrics and search queries, reducing DB CPU load.
- **Amazon OpenSearch**: Enables fast, fuzzy multi-match full-text search across titles, descriptions, and comments.
- **Amazon SNS & SQS**: Implements asynchronous event messaging. API publishes domain events to SNS, fan-out delivers to SQS queue, and SQS worker processes notifications out-of-band.
- **Amazon ECS Fargate**: Serverless container orchestration for API and Worker services without EC2 OS management.
- **Application Load Balancer (ALB)**: Layer 7 load balancing with target group health checks (`GET /health`).
- **AWS IAM**: Enforces least-privilege execution roles for containers.
- **Amazon CloudWatch**: Centralized structured JSON logging for monitoring and debugging.

---

## Documentation Links

- [Project Working & System Mechanics](docs/project-working.md)
- [Architecture Blueprint](docs/architecture.md)
- [REST API Specifications](docs/api.md)
