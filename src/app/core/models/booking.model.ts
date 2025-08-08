export interface Booking {
  id: string | number;
  showtimeId: number;
  seatIds: string[];
  userId: string;
  bookingTime: string;
  totalPrice: number;
}
