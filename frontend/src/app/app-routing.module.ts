import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { ProfilePage } from './pages/profile/profile.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPage
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardPage
  },
  {
    path: 'profile',
    component: ProfilePage
  },
  {
    path: 'tickets',
    loadComponent: () => import('./pages/tickets/tickets.page').then(m => m.TicketsPage)
  },
  {
    path: 'tickets/new',
    loadComponent: () => import('./pages/tickets/new-ticket/new-ticket.page').then(m => m.NewTicketPage)
  },
  {
    path: 'tickets/:id',
    loadComponent: () => import('./pages/tickets/ticket-detail/ticket-detail.page').then(m => m.TicketDetailPage)
  },
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats.page').then(m => m.StatsPage),
    canActivate: [AdminGuard]
  },
  {
    path: 'stats/drilldown/:type',
    loadComponent: () => import('./pages/stats/stats-drilldown/stats-drilldown.page').then(m => m.StatsDrilldownPage),
    canActivate: [AdminGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
