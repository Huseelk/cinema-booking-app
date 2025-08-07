import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/rooms',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/rooms'
  }
];
