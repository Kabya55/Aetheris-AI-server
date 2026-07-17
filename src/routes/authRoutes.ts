import { Router } from 'express';
import { registerUser, loginUser, googleLogin } from '../controllers/authController';

const router = Router();

router.post('/register', registerUser as any);
router.post('/login', loginUser as any);
router.post('/google-mock', googleLogin as any);

export default router;
