# TeamFlow — REST API Reference Documentation

All request payloads are `application/json`. Authenticated routes require an `Authorization: Bearer <token>` header.

---

## 1. Authentication APIs

### Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Body**:
  ```json
  {
    "name": "Rahul Kumar",
    "email": "rahul@teamflow.dev",
    "password": "Password123!"
  }
  ```
- **Response**: `201 Created` with JWT token and user object.

### Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Body**:
  ```json
  {
    "email": "admin@teamflow.dev",
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK` with JWT token and user object.

### Get Authenticated User (`/me`)
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`

---

## 2. Project & Member APIs

### List User Projects
- **Method**: `GET`
- **Path**: `/api/projects`

### Create Project
- **Method**: `POST`
- **Path**: `/api/projects`
- **Body**:
  ```json
  {
    "name": "AWS Migration 2026",
    "description": "Migrate workload to ECS Fargate and Redis"
  }
  ```

### Get Project Details (with Members & Tasks)
- **Method**: `GET`
- **Path**: `/api/projects/:id`

### Add Member to Project
- **Method**: `POST`
- **Path**: `/api/projects/:id/members`
- **Body**:
  ```json
  {
    "email": "rahul@teamflow.dev",
    "role": "MEMBER"
  }
  ```

---

## 3. Task APIs

### List Project Tasks
- **Method**: `GET`
- **Path**: `/api/projects/:projectId/tasks`

### Create Task
- **Method**: `POST`
- **Path**: `/api/projects/:projectId/tasks`
- **Body**:
  ```json
  {
    "title": "Configure OpenSearch Cluster",
    "description": "Set up index mapping for full-text search",
    "status": "TODO",
    "priority": "HIGH",
    "assignedTo": "user-uuid"
  }
  ```

### Update Task Status (Kanban Drop Action)
- **Method**: `PATCH`
- **Path**: `/api/tasks/:id/status`
- **Body**:
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```

### Update Task Assignee
- **Method**: `PATCH`
- **Path**: `/api/tasks/:id/assignee`
- **Body**:
  ```json
  {
    "assignedTo": "user-uuid"
  }
  ```

---

## 4. Attachment & Search APIs

### Upload Task Attachment
- **Method**: `POST`
- **Path**: `/api/tasks/:taskId/attachments`
- **Content-Type**: `multipart/form-data`
- **Field**: `file` (PDF, PNG, JPG, DOCX, TXT)

### Search Tasks, Projects & Comments
- **Method**: `GET`
- **Path**: `/api/search?q=AWS`
- **Response**: Returns matched documents with highlighted snippets & Redis caching status indicator (`_cached`).
