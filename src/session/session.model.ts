import { Schema, Document } from 'mongoose';

export interface Session {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionDocument = Session & Document;

export const SessionSchema = new Schema<Session>({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
