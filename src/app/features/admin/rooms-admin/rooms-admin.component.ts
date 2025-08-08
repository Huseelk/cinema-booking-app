import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { take } from 'rxjs';
import { Room } from '../../../core/models/room.model';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-rooms-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './rooms-admin.component.html',
  styleUrls: ['./rooms-admin.component.scss'],
})
export class RoomsAdminComponent implements OnInit {
  readonly displayedColumns = ['id', 'name', 'color', 'rows', 'seatsPerRow', 'actions'];
  rooms = signal<Room[]>([]);
  selectedRoom: Room | null = null;
  form!: FormGroup;

  private readonly roomService = inject(RoomService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      color: ['', [Validators.required, Validators.maxLength(20)]],
      rows: [8, [Validators.required, Validators.min(1)]],
      seatsPerRow: [10, [Validators.required, Validators.min(1)]],
    });

    this.loadRooms();
  }

  loadRooms(): void {
    this.roomService
      .getRooms()
      .pipe(take(1))
      .subscribe({
        next: (rooms) => this.rooms.set(rooms),
        error: () => this.snackBar.open('Failed to load rooms', 'Close', { duration: 3000 }),
      });
  }

  onEdit(room: Room): void {
    this.selectedRoom = room;
    this.form.patchValue({
      name: room.name,
      color: room.color,
      rows: room.rows,
      seatsPerRow: room.seatsPerRow,
    });
  }

  onDelete(room: Room): void {
    this.roomService
      .deleteRoom(room.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.snackBar.open('Room deleted', 'Close', { duration: 2000 });
          this.loadRooms();
        },
        error: () => this.snackBar.open('Failed to delete room', 'Close', { duration: 3000 }),
      });
  }

  onSubmit(): void {
    const value = this.form.value as {
      name: string;
      color: string;
      rows: number;
      seatsPerRow: number;
    };
    if (this.selectedRoom) {
      const updated: Room = { ...this.selectedRoom, ...value };
      this.roomService
        .updateRoom(updated)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.snackBar.open('Room updated', 'Close', { duration: 2000 });

            this.resetForm();
            this.loadRooms();
          },
          error: () => this.snackBar.open('Failed to update room', 'Close', { duration: 3000 }),
        });
    } else {
      this.roomService
        .createRoom(value)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.snackBar.open('Room created', 'Close', { duration: 2000 });

            this.resetForm();
            this.loadRooms();
          },
          error: () => this.snackBar.open('Failed to create room', 'Close', { duration: 3000 }),
        });
    }
  }

  resetForm(): void {
    this.selectedRoom = null;
    this.form.reset({ name: '', color: '', rows: 8, seatsPerRow: 10 });
  }
}
