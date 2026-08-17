import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { addCommentSchema } from '../utils/validators';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/tasks/:taskId/comments', CommentController.getComments);
router.post('/tasks/:taskId/comments', validate(addCommentSchema), CommentController.addComment);

export default router;
