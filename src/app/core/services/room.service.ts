import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Room, Seat } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly apiUrl = 'http://localhost:3000/rooms';

  constructor(private http: HttpClient) {}

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.apiUrl).pipe(
      map((rooms: Room[]) => rooms || []),
      catchError(this.handleError)
    );
  }

  getRoom(id: number): Observable<Room> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid room ID provided'));
    }

    return this.http.get<Room>(`${this.apiUrl}/${id}`).pipe(
      map((room: Room) => {
        if (!room) {
          throw new Error(`Room with ID ${id} not found`);
        }
        return room;
      }),
      catchError(this.handleError)
    );
  }

  createRoom(room: { name: string; color: string; rows: number; seatsPerRow: number; seats?: Seat[] }): Observable<Room> {
    const payload: Omit<Room, 'id'> = {
      name: room.name.trim(),
      color: room.color.trim(),
      rows: room.rows,
      seatsPerRow: room.seatsPerRow,
      seats: room.seats ?? []
    };

    if (!payload.name || !payload.color || typeof payload.rows !== 'number' || payload.rows <= 0 || typeof payload.seatsPerRow !== 'number' || payload.seatsPerRow <= 0) {
      return throwError(() => new Error('Invalid room data provided'));
    }

    return this.http.post<Room>(this.apiUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  updateRoom(room: Room): Observable<Room> {
    if (!room || !room.id || room.id <= 0) {
      return throwError(() => new Error('Invalid room ID for update'));
    }

    const payload: Room = {
      ...room,
      name: room.name.trim(),
      color: room.color.trim()
    };

    return this.http.put<Room>(`${this.apiUrl}/${room.id}`, payload).pipe(
      catchError(this.handleError)
    );
  }

  deleteRoom(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid room ID provided'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    errorMessage = `Client Error: ${error.error?.message || error.message}`;

    console.error('RoomService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
