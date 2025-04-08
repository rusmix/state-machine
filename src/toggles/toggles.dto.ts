export class CreateToggleDto {
  id: number;
  type: 'discrete' | 'analog';
  session_id: number;
  positions?: number; // Только для дискретного переключателя
}
