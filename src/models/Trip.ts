import { Schema, model } from 'mongoose';

const tripSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Adventure', 'Cultural', 'Relaxing', 'Nature', 'Luxury', 'Budget'],
      default: 'Adventure',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional so we can seed general system itineraries
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Trip = model('Trip', tripSchema);
