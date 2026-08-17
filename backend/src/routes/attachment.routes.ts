import { Router } from 'express';
import multer from 'multer';
import { AttachmentController } from '../controllers/attachment.controller';
import { authenticate } from '../middleware/auth.middleware';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router({ mergeParams: true });

router.get('/attachments/local/:fileName', AttachmentController.serveLocalFile);

router.use(authenticate);

router.post('/tasks/:taskId/attachments', upload.single('file'), AttachmentController.uploadAttachment);
router.get('/tasks/:taskId/attachments', AttachmentController.getAttachments);
router.delete('/attachments/:id', AttachmentController.deleteAttachment);

export default router;
