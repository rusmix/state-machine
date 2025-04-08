import { Schema, Document, Types } from 'mongoose';

export type ControlledItemType = 'analog' | 'discrete';

export interface ControlledItem {
  id: number;
  session_id: number;
  name: string;
  type: ControlledItemType;
  analog_value?: number;
  discrete_value?: number;
  toggles?: number[];
  dependencyItems?: number[];
}

export type ControlledItemDocument = ControlledItem & Document;

export const ControlledItemSchema = new Schema<ControlledItem>({
  id: { type: Number, required: true, unique: true },
  session_id: { type: Number, required: true }, // Сессия, с которой связано устройство
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['discrete', 'analog'],
    required: true,
  },
  analog_value: { type: Number },
  discrete_value: { type: Number },
  toggles: [{ type: Number, ref: 'Toggle' }], // Используем id числовые
  dependencyItems: [{ type: Number, ref: 'ControlledItem' }], //можно ли сделать вот так
});
