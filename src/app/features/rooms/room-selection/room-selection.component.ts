import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import { Room, Seat, SeatWithAvailability } from '../../../core/models/room.model';
import { ShowtimeWithMovie } from '../../../core/models/showtime.model';
import { BookingService } from '../../../core/services/booking.service';
import { RoomService } from '../../../core/services/room.service';
import { ShowtimeService } from '../../../core/services/showtime.service';

@Component({
  selector: 'app-room-selection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatGridListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './room-selection.component.html',
  styleUrls: ['./room-selection.component.scss'],
})
export class RoomSelectionComponent implements OnInit {
  readonly router = inject(Router);
  private readonly roomService = inject(RoomService);
  private readonly bookingService = inject(BookingService);
  private readonly showtimeService = inject(ShowtimeService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private destroy$ = new Subject<void>();

  roomId = signal<number | null>(null);
  showtimeId = signal<number | null>(null);
  showtime = signal<ShowtimeWithMovie | null>(null);
  selectedRoom = signal<Room | null>(null);
  availableSeats = signal<SeatWithAvailability[]>([]);
  isLoading = signal(false);
  isBooking = signal(false);
  errorMessage = signal<string | null>(null);
  selectionWarning = signal<string | null>(null);

  bookingForm: FormGroup;

  selectedSeats = signal<string[]>([]);

  canSelectMoreSeats = computed(() => {
    return true;
  });

  totalPrice = computed(() => {
    const showtime = this.showtime();
    if (!showtime) return 0;
    return this.selectedSeats().length * showtime.price;
  });

  constructor() {
    this.bookingForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const roomIdParam = params.get('roomId');
      const showtimeIdParam = params.get('showtimeId');

      if (roomIdParam && showtimeIdParam) {
        this.roomId.set(parseInt(roomIdParam, 10));
        this.showtimeId.set(parseInt(showtimeIdParam, 10));

        this.loadShowtimeAndRoom();
      } else {
        this.errorMessage.set('Room ID and Showtime ID are required');
      }
    });
  }

  private loadShowtimeAndRoom(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const showtimeId = this.showtimeId();
    const roomId = this.roomId();

    if (!showtimeId || !roomId) {
      this.errorMessage.set('Invalid showtime or room ID');
      this.isLoading.set(false);
      return;
    }

    Promise.all([
      this.showtimeService.getShowtime(showtimeId).toPromise(),
      this.roomService.getRoom(roomId).toPromise(),
    ])
      .then(([showtime, room]) => {
        if (showtime && room) {
          this.showtime.set(showtime);
          this.selectedRoom.set(room);

          this.calculateAvailableSeats(room.seats, showtime.bookedSeats);

          this.isLoading.set(false);
        } else {
          throw new Error('Failed to load showtime or room data');
        }
      })
      .catch((error) => {
        this.errorMessage.set(error.message || 'Failed to load data');
        this.isLoading.set(false);
        this.snackBar.open('Failed to load data', 'Close', { duration: 3000 });
      });
  }

  private calculateAvailableSeats(allSeats: Seat[], bookedSeats: string[]): void {
    const seatsWithAvailability: SeatWithAvailability[] = allSeats.map((seat) => ({
      ...seat,
      isAvailable: !bookedSeats.includes(seat.seatId),
    }));
    this.availableSeats.set(seatsWithAvailability);
  }

  private clearSeatsFormArray(): void {
    this.bookingForm.setControl('seats', this.fb.array([]));
    this.selectedSeats.set([]);
  }

  isSeatSelected(index: number): boolean {
    const seat = this.availableSeats()[index];
    if (!seat) return false;
    return this.selectedSeats().includes(seat.seatId);
  }

  isSeatAvailable(seat: SeatWithAvailability): boolean {
    return seat.isAvailable;
  }

  toggleSeat(index: number): void {
    const seat = this.availableSeats()[index];
    if (!seat || !seat.isAvailable) {
      return;
    }

    const currentSelectedSeats = this.selectedSeats();
    const seatId = seat.seatId;
    const isCurrentlySelected = currentSelectedSeats.includes(seatId);

    if (isCurrentlySelected) {
      const updatedSeats = currentSelectedSeats.filter((id) => id !== seatId);
      this.selectedSeats.set(updatedSeats);
      this.selectionWarning.set(null);
    } else {
      const updatedSeats = [...currentSelectedSeats, seatId];
      this.selectedSeats.set(updatedSeats);
      this.selectionWarning.set(null);
    }
  }

  getSeatClass(seat: SeatWithAvailability, index: number): string {
    if (!seat.isAvailable) return 'seat-booked';
    if (this.isSeatSelected(index)) return 'seat-selected';
    return 'seat-available';
  }

  onBookSeats(): void {
    const selectedSeatIds = this.selectedSeats();
    if (!selectedSeatIds.length) {
      this.snackBar.open('Please select at least one seat', 'Close', { duration: 3000 });
      return;
    }

    if (!this.showtimeId() || !this.selectedRoom()) {
      this.snackBar.open('Showtime or room information not available', 'Close', { duration: 3000 });
      return;
    }

    const showtime = this.showtime();
    const room = this.selectedRoom();
    if (!showtime || !room) {
      this.snackBar.open('Showtime or room information not available', 'Close', { duration: 3000 });
      return;
    }

    const totalPrice = this.totalPrice();

    this.processBooking(selectedSeatIds, totalPrice);
  }

  private processBooking(selectedSeatIds: string[], totalPrice: number): void {
    this.isBooking.set(true);
    this.errorMessage.set(null);

    const bookingData = {
      showtimeId: this.showtimeId()!,
      seatIds: selectedSeatIds,
      /* TODO: Replace with actual user ID from auth service */
      userId: 'user123',
      bookingTime: new Date().toISOString(),
      totalPrice: totalPrice,
    };

    this.bookingService
      .createBooking(bookingData)
      .pipe(take(1))
      .subscribe({
        next: (booking) => {
          this.showtimeService
            .updateShowtimeBookedSeats(this.showtimeId()!, selectedSeatIds)
            .pipe(take(1))
            .subscribe({
              next: () => {
                this.isBooking.set(false);
                this.snackBar.open(
                  `Booking successful! Booking ID: ${booking.id}. Total: $${totalPrice.toFixed(2)}`,
                  'Close',
                  { duration: 5000, panelClass: ['success-snackbar'] },
                );
                this.router.navigate(['/bookings']);
              },
              error: (error) => {
                console.error('Failed to update showtime seats:', error);
                this.isBooking.set(false);
                this.snackBar.open(
                  `Booking created (ID: ${booking.id}) but there was an issue updating seat availability. Please contact support.`,
                  'Close',
                  { duration: 5000, panelClass: ['warning-snackbar'] },
                );
                this.router.navigate(['/bookings']);
              },
            });
        },
        error: (error) => {
          this.isBooking.set(false);
          this.errorMessage.set(error.message || 'Failed to create booking');
          this.snackBar.open('Failed to create booking. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  getGridCols(): number {
    const room = this.selectedRoom();
    if (!room) return 1;

    return room.seatsPerRow;
  }

  getGridRows(): number {
    const room = this.selectedRoom();
    if (!room) return 1;

    return room.rows;
  }

  onBackToShowtimes(): void {
    if (this.roomId()) {
      this.router.navigate(['/rooms', this.roomId(), 'movies']);
    } else {
      this.router.navigate(['/rooms']);
    }
  }

  getMovieTitle(): string {
    return this.showtime()?.movie.title || 'Movie';
  }

  getShowtimeInfo(): string {
    const showtime = this.showtime();
    if (!showtime) return '';

    return `${showtime.startTime} - ${showtime.endTime} | $${showtime.price.toFixed(2)}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
