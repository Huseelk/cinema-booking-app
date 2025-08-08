import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly apiUrl = 'http://localhost:3000/bookings';

  constructor(private http: HttpClient) {}

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  getBookingsByUser(userId: string): Observable<Booking[]> {
    if (!userId || userId.trim() === '') {
      return throwError(() => new Error('Invalid user ID provided'));
    }

    return this.http
      .get<Booking[]>(`${this.apiUrl}?userId=${userId}`)
      .pipe(catchError(this.handleError));
  }

  getBooking(id: string | number): Observable<Booking> {
    if ((typeof id === 'number' && id <= 0) || (typeof id === 'string' && id.trim() === '')) {
      return throwError(() => new Error('Invalid booking ID provided'));
    }

    return this.http.get<Booking>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  createBooking(booking: Omit<Booking, 'id'>): Observable<Booking> {
    if (!this.validateBooking(booking)) {
      return throwError(() => new Error('Invalid booking data provided'));
    }

    const bookingData = {
      ...booking,
      bookingTime: booking.bookingTime || new Date().toISOString(),
    };

    return this.http.post<Booking>(this.apiUrl, bookingData).pipe(catchError(this.handleError));
  }

  updateBooking(booking: Booking): Observable<Booking> {
    if (
      booking.id === undefined ||
      booking.id === null ||
      (typeof booking.id === 'number' && booking.id <= 0) ||
      (typeof booking.id === 'string' && booking.id.trim() === '')
    ) {
      return throwError(() => new Error('Invalid booking ID for update'));
    }

    if (!this.validateBooking(booking)) {
      return throwError(() => new Error('Invalid booking data provided'));
    }

    return this.http
      .put<Booking>(`${this.apiUrl}/${booking.id}`, booking)
      .pipe(catchError(this.handleError));
  }

  deleteBooking(id: string | number): Observable<void> {
    if ((typeof id === 'number' && id <= 0) || (typeof id === 'string' && id.trim() === '')) {
      return throwError(() => new Error('Invalid booking ID provided'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  private validateBooking(booking: Partial<Booking>): boolean {
    return !!(
      booking &&
      booking.showtimeId &&
      booking.showtimeId &&
      booking.seatIds &&
      booking.seatIds.length &&
      booking.userId &&
      booking.userId.trim() &&
      booking.bookingTime &&
      booking.bookingTime.trim() &&
      booking.totalPrice &&
      booking.totalPrice
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    errorMessage = `Client Error: ${error.error?.message || error.message}`;

    console.error('BookingService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
