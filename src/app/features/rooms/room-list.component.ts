import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RoomService } from '../../core/services/room.service';
import { Room } from '../../core/models/room.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit {
  private readonly roomService = inject(RoomService);
  private readonly router = inject(Router);

  rooms = signal<Room[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRooms();
  }

  private loadRooms(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.roomService.getRooms().pipe(take(1)).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to load rooms');
        this.isLoading.set(false);
      }
    });
  }

  onSelectRoom(roomId: number): void {
    if (roomId && roomId > 0) {
      this.router.navigate(['/rooms', roomId, 'movies']);
    }
  }

  onRetry(): void {
    this.loadRooms();
  }

  trackByRoomId(index: number, room: Room): number {
    return room.id;
  }

  getAvailableSeatsCount(room: Room): number {
    return room.seats.length;
  }

  getTotalSeatsCount(room: Room): number {
    return room.seats.length;
  }
}
