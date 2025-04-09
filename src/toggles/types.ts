import { DataType, ToggleType } from './toggles.model';

export interface IToggleInitial {
  local_id: number;
  data_type: DataType;
  session_id: number;
  position_preset?: number;
  discrete_value?: number;
  analog_value?: number;
  dependency_toggles?: number[];
  toggle_type: ToggleType;
}
