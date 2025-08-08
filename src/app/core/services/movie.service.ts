import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private readonly apiUrl = 'http://localhost:3000/movies';

  constructor(private http: HttpClient) {}

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.apiUrl).pipe(
      map((movies: Movie[]) => movies || []),
      catchError(this.handleError),
    );
  }

  getMovie(id: number): Observable<Movie> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid movie ID provided'));
    }

    return this.http.get<Movie>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  createMovie(movie: Omit<Movie, 'id'>): Observable<Movie> {
    const payload: Omit<Movie, 'id'> = {
      title: movie.title.trim(),
      description: movie.description.trim(),
      duration: movie.duration,
      posterUrl: movie.posterUrl.trim(),
    };

    if (!payload.title || !payload.description || !payload.posterUrl || payload.duration <= 0) {
      return throwError(() => new Error('Invalid movie data provided'));
    }

    return this.http.post<Movie>(this.apiUrl, payload).pipe(catchError(this.handleError));
  }

  updateMovie(movie: Movie): Observable<Movie> {
    const id = Number(movie.id);
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid movie ID for update'));
    }

    const payload: Movie = {
      ...movie,
      title: movie.title.trim(),
      description: movie.description.trim(),
      posterUrl: movie.posterUrl.trim(),
      id,
    };

    return this.http.put<Movie>(`${this.apiUrl}/${id}`, payload).pipe(catchError(this.handleError));
  }

  deleteMovie(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid movie ID provided'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    errorMessage = `Client Error: ${error.error?.message || error.message}`;

    return throwError(() => new Error(errorMessage));
  }
}
