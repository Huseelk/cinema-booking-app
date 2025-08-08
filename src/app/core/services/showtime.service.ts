import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Movie } from '../models/movie.model';
import { Showtime, ShowtimeWithMovie } from '../models/showtime.model';
import { MovieService } from './movie.service';

@Injectable({
  providedIn: 'root',
})
export class ShowtimeService {
  private readonly apiUrl = 'http://localhost:3000/showtimes';

  constructor(
    private http: HttpClient,
    private movieService: MovieService,
  ) {}

  getShowtimesByRoom(roomId: number): Observable<ShowtimeWithMovie[]> {
    if (!roomId || roomId <= 0) {
      return throwError(() => new Error('Invalid room ID provided'));
    }

    return this.http.get<Showtime[]>(`${this.apiUrl}?roomId=${roomId}`).pipe(
      switchMap((showtimes: Showtime[]) => {
        const uniqueMovieIds = [...new Set(showtimes.map((showtime) => showtime.movieId))];

        const movieRequests = uniqueMovieIds.map((movieId) =>
          this.movieService.getMovie(movieId).pipe(
            catchError((error) => {
              const placeholderMovie: Movie = {
                id: movieId,
                title: 'Movie Not Found',
                description: 'This movie information is currently unavailable.',
                duration: 0,
                posterUrl: '/assets/images/movie-placeholder.svg',
              };
              return of(placeholderMovie);
            }),
          ),
        );

        /** TODO: Adjust the logic to use the _expand of json server*/
        return forkJoin(movieRequests).pipe(
          map((movies) => {
            return showtimes.map((showtime) => {
              const movie = movies.find((movie) => movie.id == showtime.movieId);

              if (!movie) {
                const fallbackMovie: Movie = {
                  id: showtime.movieId,
                  title: 'Unknown Movie',
                  description: 'Movie information unavailable',
                  duration: 0,
                  posterUrl: '/assets/images/movie-placeholder.svg',
                };

                return { ...showtime, movie: fallbackMovie };
              }

              return { ...showtime, movie };
            });
          }),
        );
      }),
      catchError(this.handleError),
    );
  }

  getShowtime(id: number): Observable<ShowtimeWithMovie> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid showtime ID provided'));
    }

    return this.http.get<Showtime>(`${this.apiUrl}/${id}`).pipe(
      switchMap((showtime: Showtime) => {
        if (!showtime) {
          return throwError(() => new Error(`Showtime with ID ${id} not found`));
        }

        return this.movieService.getMovie(showtime.movieId).pipe(
          map((movie) => {
            if (!movie) {
              throw new Error(`Movie with ID ${showtime.movieId} not found`);
            }
            return { ...showtime, movie };
          }),
          catchError((error) => {
            const placeholderMovie: Movie = {
              id: showtime.movieId,
              title: 'Movie Not Found',
              description: 'This movie information is currently unavailable.',
              duration: 0,
              posterUrl: '/assets/images/movie-placeholder.svg',
            };
            return of({ ...showtime, movie: placeholderMovie });
          }),
        );
      }),
      catchError(this.handleError),
    );
  }

  updateShowtimeBookedSeats(showtimeId: number, bookedSeats: string[]): Observable<Showtime> {
    if (!showtimeId || showtimeId <= 0) {
      return throwError(() => new Error('Invalid showtime ID provided'));
    }

    return this.http.get<Showtime>(`${this.apiUrl}/${showtimeId}`).pipe(
      switchMap((showtime) => {
        if (!showtime) {
          return throwError(() => new Error(`Showtime with ID ${showtimeId} not found`));
        }

        const updatedShowtime = {
          ...showtime,
          bookedSeats: [...new Set([...showtime.bookedSeats, ...bookedSeats])],
        };

        return this.http.put<Showtime>(`${this.apiUrl}/${showtimeId}`, updatedShowtime);
      }),
      catchError(this.handleError),
    );
  }

  removeShowtimeBookedSeats(showtimeId: number, seatsToRemove: string[]): Observable<Showtime> {
    if (!showtimeId || showtimeId <= 0) {
      return throwError(() => new Error('Invalid showtime ID provided'));
    }

    return this.http.get<Showtime>(`${this.apiUrl}/${showtimeId}`).pipe(
      switchMap((showtime) => {
        if (!showtime) {
          return throwError(() => new Error(`Showtime with ID ${showtimeId} not found`));
        }

        const updatedShowtime: Showtime = {
          ...showtime,
          bookedSeats: showtime.bookedSeats.filter((seat) => !seatsToRemove.includes(seat)),
        };

        return this.http.put<Showtime>(`${this.apiUrl}/${showtimeId}`, updatedShowtime);
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    errorMessage = `Client Error: ${error.error?.message || error.message}`;

    console.error('ShowtimeService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
