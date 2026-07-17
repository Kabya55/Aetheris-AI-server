import { Router } from 'express';
import { getTrips, getTripById, createTrip, deleteTrip, getUserTrips } from '../controllers/tripController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTrips as any);
router.get('/user', protect as any, getUserTrips as any);
router.get('/:id', getTripById as any);
router.post('/', protect as any, createTrip as any);
router.delete('/:id', protect as any, deleteTrip as any);

export default router;
