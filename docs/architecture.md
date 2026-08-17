# TeamFlow — Architecture Specification & AWS Cloud Design

TeamFlow is designed as a cloud-native, microservice-inspired enterprise team collaboration platform built specifically for modern production environments and AWS Cloud deployments.

---

## 1. High-Level System Architecture Diagram

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
                   | (SQS Consumer)             |
                   +-------------+--------------+
                                 |
                                 v
                    (Notification & DB Updates)
```

---

## 2. Component Design & Responsibility Matrix

### A. Frontend Application (React 19 + Vite)
- Single Page Application offering responsive Kanban boards, dashboards, and modal dialogs.
- Features automatic JWT header injection via Axios interceptors.
- Implements fallback states and caching indicators for Redis and OpenSearch.

### B. API Service (Node.js / Express / TypeScript on ECS Fargate)
- Handles HTTP requests across REST endpoints.
- Implements JWT authentication, bcrypt password hashing, input validation (Zod), and role-based access control (`OWNER`, `ADMIN`, `MEMBER`).
- Publishes events to SNS Topic upon critical domain mutations.

### C. Caching Layer (Redis)
- Caches high-frequency user dashboard metric aggregates (`dashboard:user:<id>`, 60s TTL).
- Caches search queries (`search:<hash>`, 120s TTL).
- Handles graceful fallback: if Redis becomes unreachable, API queries execute directly against PostgreSQL without crashing.

### D. Global Search Engine (Amazon OpenSearch)
- Indexes project names, task titles, task descriptions, and comments in `teamflow-content` index.
- Provides multi-match fuzzy search.
- Falls back to PostgreSQL Full-Text Search if OpenSearch is unconfigured or unreachable.

### E. Attachment Storage (Amazon S3)
- Stores task file attachments securely using private S3 bucket storage.
- Generates 1-hour presigned URLs for client downloads.
- Falls back to local disk storage (`uploads/`) for zero-dependency local development.

### F. Event-Driven Messaging (Amazon SNS → Amazon SQS)
- **SNS Topic** (`teamflow-events`): Acts as fan-out publisher for domain events (`TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `COMMENT_ADDED`, `ATTACHMENT_UPLOADED`).
- **SQS Queue** (`teamflow-notifications`): Subscribed to SNS topic. Buffers event messages for asynchronous worker consumption.

### G. Background Worker Service (Node.js on ECS Fargate)
- Runs continuous SQS long-polling worker loop.
- Processes notification payloads idempotently and creates notification database records.
