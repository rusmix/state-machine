import { Schema, Document } from 'mongoose';

export type DataType = 'discrete' | 'analog';
export type ToggleType = 'switch' | 'item';

export interface IToggle {
  id: number;
  local_id: number;
  data_type: DataType;
  session_id: number;
  position_preset?: number;
  discrete_value?: number;
  analog_value?: number;
  dependency_toggles?: number[];
  toggle_type: ToggleType;
}

export type ToggleDocument = IToggle & Document;

export const ToggleSchema = new Schema<IToggle>({
  id: { type: Number, required: true, unique: true },
  local_id: { type: Number, required: true },
  data_type: { type: String, enum: ['discrete', 'analog'], required: true },
  toggle_type: { type: String, enum: ['switch', 'item'], required: true },
  session_id: { type: Number, required: true, ref: 'Session' },
  position_preset: {
    type: Number,
    required: function () {
      return this.data_type === 'discrete';
    },
  },
  discrete_value: {
    type: Number,
    required: function () {
      return this.data_type === 'discrete';
    },
  },
  analog_value: {
    type: Number,
    required: function () {
      return this.data_type === 'analog';
    },
  },
  dependency_toggles: [{ type: Number, ref: 'Toggle' }],
});
