export interface Showtime {
  id: number;
  movieId: number;
  roomId: number;
  startTime: string;
  endTime: string;
  date: string;
  price: number;
  formattedPrice: string;
  bookedSeats: string[];
  getAvailableSeatsCount?: number;
}

export interface ShowtimeWithMovie {
  id: number;
  movieId: number;
  roomId: number;
  startTime: string;
  endTime: string;
  date: string;
  price: number;
  bookedSeats: string[];
  getAvailableSeatsCount?: number;
  formattedPrice: string;
  movie: {
    id: string | number;
    title: string;
    description: string;
    duration: number;
    posterUrl: string;
  };
}
