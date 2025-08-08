import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { Observable, take } from 'rxjs';
import { Booking } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { ShowtimeService } from '../../../core/services/showtime.service';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss'],
})
export class BookingListComponent implements OnInit {
  bookings$!: Observable<Booking[]>;
  selectedDetailsId = signal<string | number | null>(null);

  private bookingService = inject(BookingService);
  private showtimeService = inject(ShowtimeService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadBookings();
  }

  private loadBookings(): void {
    /* TODO: Replace with actual user ID from auth service */
    this.bookings$ = this.bookingService.getBookingsByUser('user123');
  }

  onToggleDetails(bookingId: string | number): void {
    this.selectedDetailsId.update((current) => (current === bookingId ? null : bookingId));
  }

  onCancel(booking: Booking): void {
    const id = booking.id;

    this.bookingService
      .deleteBooking(id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.showtimeService
            .removeShowtimeBookedSeats(booking.showtimeId, booking.seatIds)
            .pipe(take(1))
            .subscribe({
              next: () => {
                this.snackBar.open(`Booking #${id} cancelled`, 'Close', { duration: 3000 });

                this.loadBookings();
              },
              error: () => {
                this.snackBar.open(
                  'Cancelled booking, but failed to free seats. Please refresh.',
                  'Close',
                  { duration: 4000 },
                );

                this.loadBookings();
              },
            });
        },
        error: (error) => {
          this.snackBar.open(error.message || 'Failed to cancel booking', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  trackByBookingId(index: number, item: Booking): string | number {
    return item.id || index;
  }
}
