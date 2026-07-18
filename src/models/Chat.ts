import { Schema, model } from 'mongoose';

const chatSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = model('Chat', chatSchema);
