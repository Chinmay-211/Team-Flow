import { Router } from 'express';
import { Role } from '@prisma/client';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeProjectRole } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskAssigneeSchema, updateTaskStatusSchema } from '../utils/validators';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Project tasks endpoints: /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', authorizeProjectRole([Role.OWNER, Role.ADMIN, Role.MEMBER]), TaskController.getTasksByProject);
router.post('/projects/:projectId/tasks', authorizeProjectRole([Role.OWNER, Role.ADMIN, Role.MEMBER]), validate(createTaskSchema), TaskController.createTask);

// Direct task endpoints: /api/tasks/:id
router.get('/tasks/:id', TaskController.getTaskById);
router.put('/tasks/:id', TaskController.updateTask);
router.delete('/tasks/:id', TaskController.deleteTask);
router.patch('/tasks/:id/status', validate(updateTaskStatusSchema), TaskController.updateStatus);
router.patch('/tasks/:id/assignee', validate(updateTaskAssigneeSchema), TaskController.updateAssignee);

export default router;
