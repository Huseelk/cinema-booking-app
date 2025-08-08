export interface Seat {
  seatId: string;
  row: string;
  number: number;
}

export interface SeatWithAvailability extends Seat {
  isAvailable: boolean;
}

export interface Room {
  id: number;
  name: string;
  color: string;
  rows: number;
  seatsPerRow: number;
  seats: Seat[];
}
