import { Response } from 'express';
import { Trip } from '../models/Trip';
import { AuthRequest } from '../middleware/authMiddleware';
import { autoTagTrip } from '../services/geminiService';

export async function getTrips(req: AuthRequest, res: Response): Promise<void> {
  const { q, category, priceMin, priceMax, ratingMin, sortBy, page = '1', limit = '12' } = req.query;

  try {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Standard MongoDB Mode
    const queryObj: any = { isPublic: true };
    if (q) {
      queryObj.$or = [
        { title: { $regex: q as string, $options: 'i' } },
        { location: { $regex: q as string, $options: 'i' } },
        { description: { $regex: q as string, $options: 'i' } },
      ];
    }
    if (category) queryObj.category = category as string;
    if (priceMin || priceMax) {
      queryObj.price = {};
      if (priceMin) queryObj.price.$gte = Number(priceMin);
      if (priceMax) queryObj.price.$lte = Number(priceMax);
    }
    if (ratingMin) {
      queryObj.rating = { $gte: Number(ratingMin) };
    }

    let sortObj: any = { createdAt: -1 };
    if (sortBy === 'priceAsc') {
      sortObj = { price: 1 };
    } else if (sortBy === 'priceDesc') {
      sortObj = { price: -1 };
    } else if (sortBy === 'rating') {
      sortObj = { rating: -1 };
    } else if (sortBy === 'title') {
      sortObj = { title: 1 };
    }

    const total = await Trip.countDocuments(queryObj);
    const trips = await Trip.find(queryObj)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    res.json({
      trips,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Fetch trips error:', error);
    res.status(500).json({ message: 'Server error fetching trips', error: error.message });
  }
}

export async function getTripById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    const relatedTrips = await Trip.find({
      _id: { $ne: trip._id },
      isPublic: true,
      $or: [
        { category: trip.category },
        { location: { $regex: trip.location.split(',')[0] || '', $options: 'i' } }
      ]
    })
    .limit(4);

    res.json({ trip, relatedTrips });
  } catch (error: any) {
    console.error('Fetch trip error:', error);
    res.status(500).json({ message: 'Server error fetching trip details', error: error.message });
  }
}

export async function createTrip(req: AuthRequest, res: Response): Promise<void> {
  const { title, shortDescription, description, location, category, price, startDate, endDate, imageUrl, tags } = req.body;

  if (!title || !shortDescription || !description || !location || !price || !startDate || !endDate) {
    res.status(400).json({ message: 'Please provide all required fields' });
    return;
  }

  try {
    // AI Tagging engine (Automatic classification & keyword tagging)
    let autoTags: string[] = [];
    try {
      autoTags = await autoTagTrip(title, description);
    } catch (tagErr) {
      console.warn('AI tagging failed, using empty array', tagErr);
    }

    const combinedTags = Array.from(new Set([...(tags || []), ...autoTags]));

    const trip = await Trip.create({
      title,
      shortDescription,
      description,
      location,
      category,
      price: Number(price),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      imageUrl,
      createdBy: req.user ? req.user.id : undefined,
      tags: combinedTags,
      isPublic: true,
    });

    res.status(201).json(trip);
  } catch (error: any) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Server error creating trip', error: error.message });
  }
}

export async function deleteTrip(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    if (req.user?.role !== 'admin' && (!trip.createdBy || trip.createdBy.toString() !== req.user?.id)) {
      res.status(403).json({ message: 'Not authorized to delete this trip' });
      return;
    }

    await trip.deleteOne();
    res.json({ message: 'Trip removed successfully' });
  } catch (error: any) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Server error deleting trip', error: error.message });
  }
}

export async function getUserTrips(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'User context is missing' });
    return;
  }

  try {
    const trips = await Trip.find({ createdBy: req.user.id });
    res.json(trips);
  } catch (error: any) {
    console.error('Fetch user trips error:', error);
    res.status(500).json({ message: 'Server error fetching user trips', error: error.message });
  }
}
