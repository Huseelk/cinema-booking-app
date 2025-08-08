import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { take } from 'rxjs';
import { Movie } from '../../../core/models/movie.model';
import { MovieService } from '../../../core/services/movie.service';

@Component({
  selector: 'app-movies-admin',
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
  templateUrl: './movies-admin.component.html',
  styleUrls: ['./movies-admin.component.scss'],
})
export class MoviesAdminComponent implements OnInit {
  readonly displayedColumns = ['id', 'title', 'duration', 'posterUrl', 'actions'];
  movies = signal<Movie[]>([]);
  selectedMovie: Movie | null = null;
  form!: FormGroup;

  private readonly movieService = inject(MovieService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required]],
      duration: [90, [Validators.required, Validators.min(1)]],
      posterUrl: ['', [Validators.required]],
    });
    this.loadMovies();
  }

  loadMovies(): void {
    this.movieService
      .getMovies()
      .pipe(take(1))
      .subscribe({
        next: (movies) => this.movies.set(movies),
        error: () => this.snackBar.open('Failed to load movies', 'Close', { duration: 3000 }),
      });
  }

  onEdit(movie: Movie): void {
    this.selectedMovie = movie;
    this.form.patchValue({
      title: movie.title,
      description: movie.description,
      duration: movie.duration,
      posterUrl: movie.posterUrl,
    });
  }

  onDelete(movie: Movie): void {
    const id = Number(movie.id);
    this.movieService
      .deleteMovie(id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.snackBar.open('Movie deleted', 'Close', { duration: 2000 });
          this.loadMovies();
        },
        error: () => this.snackBar.open('Failed to delete movie', 'Close', { duration: 3000 }),
      });
  }

  onSubmit(): void {
    const value = this.form.value as {
      title: string;
      description: string;
      duration: number;
      posterUrl: string;
    };
    if (this.selectedMovie) {
      const updated: Movie = { ...this.selectedMovie, ...value };

      this.movieService
        .updateMovie(updated)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.snackBar.open('Movie updated', 'Close', { duration: 2000 });

            this.resetForm();
            this.loadMovies();
          },
          error: () => this.snackBar.open('Failed to update movie', 'Close', { duration: 3000 }),
        });
    } else {
      this.movieService
        .createMovie(value)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.snackBar.open('Movie created', 'Close', { duration: 2000 });

            this.resetForm();
            this.loadMovies();
          },
          error: () => this.snackBar.open('Failed to create movie', 'Close', { duration: 3000 }),
        });
    }
  }

  resetForm(): void {
    this.selectedMovie = null;
    this.form.reset({ title: '', description: '', duration: 90, posterUrl: '' });
  }
}
