import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

import { catchError, of, Subject, take, takeUntil } from 'rxjs';

import { Room } from '../../../core/models/room.model';
import { ShowtimeWithMovie } from '../../../core/models/showtime.model';
import { MovieService } from '../../../core/services';
import { RoomService } from '../../../core/services/room.service';
import { ShowtimeService } from '../../../core/services/showtime.service';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.scss'],
})
export class MovieListComponent implements OnInit {
  private readonly showtimeService = inject(ShowtimeService);
  private readonly roomService = inject(RoomService);
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();

  showtimes = signal<ShowtimeWithMovie[]>([]);
  selectedRoom = signal<Room | null>(null);
  roomId = signal<number | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const roomIdParam = params.get('roomId');

      if (roomIdParam) {
        const id = parseInt(roomIdParam, 10);

        this.roomId.set(id);
        this.loadRoom(id);
        this.loadShowtimes(id);
      } else {
        this.errorMessage.set('Room Id is required');
      }
    });
  }

  private loadRoom(roomId: number): void {
    this.roomService
      .getRoom(roomId)
      .pipe(take(1))
      .subscribe({
        next: (room) => {
          this.selectedRoom.set(room);
        },
        error: (error) => {
          console.error('Error loading room:', error);
        },
      });
  }

  private loadShowtimes(roomId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.showtimeService
      .getShowtimesByRoom(roomId)
      .pipe(
        take(1),
        catchError((error) => {
          console.error('Error loading showtimes:', error);
          this.errorMessage.set(error.message || 'Failed to load showtimes. Please try again.');
          return of([]);
        }),
      )
      .subscribe({
        next: (showtimes) => {
          for (const showtime of showtimes) {
            showtime.getAvailableSeatsCount = this.getAvailableSeatsCount(showtime);
            showtime.startTime = this.formatTime(showtime.startTime);
            showtime.endTime = this.formatTime(showtime.endTime);
            showtime.formattedPrice = this.formatPrice(showtime.price);
          }

          console.log(showtimes);

          this.showtimes.set(showtimes);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('An unexpected error occurred. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  onSelectShowtime(showtimeId: number): void {
    if (showtimeId && showtimeId > 0 && this.roomId()) {
      this.router.navigate(['/rooms', this.roomId(), 'movies', showtimeId, 'seats']);
    }
  }

  onRetry(): void {
    if (this.roomId()) {
      this.loadShowtimes(this.roomId()!);
    }
  }

  onBackToRooms(): void {
    this.router.navigate(['/rooms']);
  }

  trackByShowtimeId(index: number, showtime: ShowtimeWithMovie): number {
    return showtime.id || index;
  }

  onImageError(event: any): void {
    if (event?.target) {
      event.target.src = '/assets/images/movie-placeholder.svg';
    }
  }

  getAvailableSeatsCount(showtime: ShowtimeWithMovie): number {
    const room = this.selectedRoom();

    if (!room) return 0;

    return room.seats.length - showtime.bookedSeats.length;
  }

  formatTime(time: string): string {
    return time;
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
