import { Router } from 'express';
import { Role } from '@prisma/client';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeProjectRole } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { addMemberSchema, createProjectSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/', ProjectController.getProjects);
router.post('/', validate(createProjectSchema), ProjectController.createProject);

router.get('/:id', authorizeProjectRole([Role.OWNER, Role.ADMIN, Role.MEMBER]), ProjectController.getProjectById);
router.put('/:id', authorizeProjectRole([Role.OWNER, Role.ADMIN]), ProjectController.updateProject);
router.delete('/:id', authorizeProjectRole([Role.OWNER]), ProjectController.deleteProject);

router.get('/:id/members', authorizeProjectRole([Role.OWNER, Role.ADMIN, Role.MEMBER]), ProjectController.getMembers);
router.post('/:id/members', authorizeProjectRole([Role.OWNER, Role.ADMIN]), validate(addMemberSchema), ProjectController.addMember);
router.delete('/:id/members/:userId', authorizeProjectRole([Role.OWNER, Role.ADMIN]), ProjectController.removeMember);

export default router;
