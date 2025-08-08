import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/rooms',
    pathMatch: 'full',
  },
  {
    path: 'rooms',
    loadComponent: () =>
      import('./features/rooms/room-list.component').then((m) => m.RoomListComponent),
  },
  {
    path: 'rooms/:roomId/movies',
    loadComponent: () =>
      import('./features/movies/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'rooms/:roomId/movies/:showtimeId/seats',
    loadComponent: () =>
      import('./features/rooms/room-selection/room-selection.component').then(
        (m) => m.RoomSelectionComponent,
      ),
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./features/bookings/booking-list/booking-list.component').then(
        (m) => m.BookingListComponent,
      ),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
  },
  {
    path: '**',
    redirectTo: '/rooms',
  },
];
