# TeamFlow — Project Working & System Mechanics

> **Ponytail Architecture & Technical Operations Overview**  
> Direct, no-fluff guide explaining how TeamFlow works end-to-end across frontend, backend, background workers, databases, and local/AWS cloud integrations.

---

## 1. System Overview

TeamFlow is a full-stack, cloud-native team collaboration platform combining Kanban task management, project administration, file attachments, and event-driven notifications.

```text
[ React 19 Frontend ]  --->  [ Nginx Proxy (Port 5173 -> 80) ]
                                           |
                                    /api   v
                             [ Express API (Port 3000) ]
                                |          |          |
                                v          v          v
                          [ PostgreSQL ] [ Redis ] [ OpenSearch / S3 ]
                                |
                           Event Published
                                |
                         [ Amazon SNS ]
                                |
                         [ Amazon SQS ]
                                |
                     [ Background Worker ]  ---> [ Create DB Notifications ]
```

---

## 2. Component Mechanics

### A. Frontend (`frontend/`)
- **Technology**: React 19, Vite, TypeScript, Nginx (in container), Tailwind CSS / Glassmorphism.
- **Routing & Proxying**: Nginx acts as the container entrypoint listening on port `80` (mapped to host `5173`). Nginx serves static SPA assets and proxies `/api/*` traffic directly to `http://backend:3000/api/`.
- **API Communication**: `frontend/src/services/api.ts` uses Axios with interceptors to automatically append `Authorization: Bearer <token>` headers from `localStorage`.
- **Input & Theme Polish**: Global CSS rules in `src/index.css` enforce dark mode input contrast (`#020617` background, `#f8fafc` text) and handle browser autofill overrides.

### B. Backend API (`backend/`)
- **Technology**: Node.js, Express, TypeScript, Prisma ORM, Zod, Bcrypt.js, JsonWebToken.
- **Authentication**: JWT-based authentication. Users log in or register; passwords are hashed using bcrypt with salt factor 10.
- **Data Access**: Prisma ORM connects to PostgreSQL 16 (`DATABASE_URL`). Schema definitions live in `backend/prisma/schema.prisma`.
- **Caching**: `backend/src/config/redis.ts` caches dashboard aggregate metrics (60s TTL) and search results (120s TTL).
- **Search**: `backend/src/services/search.service.ts` queries Amazon OpenSearch index `teamflow-content`.
- **File Storage**: `backend/src/services/attachment.service.ts` uploads task files to Amazon S3 and generates 1-hour presigned download URLs.

### C. Background Worker (`worker/`)
- **Technology**: Node.js, TypeScript, Prisma ORM, AWS SQS SDK.
- **Operation**: Polls Amazon SQS queue for incoming domain events (`TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `COMMENT_ADDED`).
- **Processing**: Reads event payloads, creates `Notification` rows in PostgreSQL, and logs activity entries.

---

## 3. End-to-End Data Flows

### Flow 1: User Login & Session Handling
1. User submits credentials on `/login`.
2. Frontend posts to `POST /api/auth/login`.
3. Express verifies email via Prisma and checks bcrypt password hash.
4. Express signs a JWT payload containing `{ userId, email }`.
5. Frontend stores JWT token in `localStorage` and redirects to `/dashboard`.

### Flow 2: Task Status Update & Event Pipeline
1. User drags task to `DONE` on Kanban board.
2. Frontend sends `PATCH /api/tasks/:id/status` with `{ status: "DONE" }`.
3. Backend updates task record via Prisma.
4. Backend publishes event payload to Amazon SNS (`teamflow-events`).
5. Amazon SNS fans out message to Amazon SQS (`teamflow-notifications`).
6. Background Worker polls SQS, consumes the message, and inserts a `Notification` record in PostgreSQL for relevant project members.

### Flow 3: File Attachment Upload
1. User attaches a document inside `TaskDetailModal`.
2. Frontend sends `POST /api/tasks/:id/attachments` with `multipart/form-data`.
3. Backend uploads file to S3 bucket `teamflow-attachments-bucket`.
4. Backend generates an S3 presigned URL for direct secure downloading and saves attachment metadata in PostgreSQL.

---

## 4. Local Fallbacks & Ceilings (Ponytail Notes)

To allow seamless local development without requiring live AWS credentials, the application implements intentional local fallbacks:

- 🔖 **S3 Storage Fallback**:  
  *Ponytail Note*: If AWS S3 credentials are not set, attachments write directly to local disk directory `uploads/`.  
  *Ceiling*: Local disk storage is single-instance only; scale to AWS S3 multi-tenant bucket for production deployment.

- 🔖 **SQS / SNS Messaging Fallback**:  
  *Ponytail Note*: If SQS queue URLs are omitted, the Worker service operates in local standby monitoring mode without crashing.  
  *Ceiling*: Local fallback bypasses out-of-band message processing; configure AWS SQS for production event processing.

- 🔖 **OpenSearch Search Fallback**:  
  *Ponytail Note*: If OpenSearch node URL is unconfigured, the search service automatically degrades to PostgreSQL Full-Text Search (`ILIKE`/Prisma filtering).  
  *Ceiling*: Relational SQL text search degrades at scale; migrate to Amazon OpenSearch for fuzzy multi-field indexing.

- 🔖 **Redis Caching Fallback**:  
  *Ponytail Note*: If Redis is unreachable, cache functions wrap in `try/catch` and execute DB queries directly without breaking requests.  
  *Ceiling*: Bypassing Redis increases DB CPU load under heavy concurrency.

---

## 5. Containerization & Database Auto-Bootstrapping

The project is fully containerized using **Docker Compose** (`docker-compose.yml`):

1. **`postgres`**: PostgreSQL 16 Alpine database container.
2. **`redis`**: Redis 7 Alpine caching container.
3. **`backend`**: Node.js Express service running `sh -c "npx prisma db push && npx tsx prisma/seed.ts && node dist/server.js"`. Automatically initializes SQL tables and seeds demo users (`admin@teamflow.dev`, `rahul@teamflow.dev`, `priya@teamflow.dev`).
4. **`worker`**: Background SQS consumer service.
5. **`frontend`**: Nginx container serving compiled React SPA bundle and proxying `/api` routes.
