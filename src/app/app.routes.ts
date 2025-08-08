import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/rooms',
    pathMatch: 'full'
  },
  {
    path: 'rooms',
    loadComponent: () => import('./features/rooms/room-list.component').then(m => m.RoomListComponent)
  },
  {
    path: '**',
    redirectTo: '/rooms'
  }
];
