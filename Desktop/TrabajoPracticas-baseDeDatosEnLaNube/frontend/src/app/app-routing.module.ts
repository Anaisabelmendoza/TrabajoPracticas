import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { ProfilePage } from './pages/profile/profile.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';

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
    redirectTo: 'tickets',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [AuthGuard]
  },
  {
    path: 'tickets',
    loadComponent: () => import('./pages/tickets/tickets.page').then(m => m.TicketsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'tickets/new',
    loadComponent: () => import('./pages/tickets/new-ticket/new-ticket.page').then(m => m.NewTicketPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'tickets/:id',
    loadComponent: () => import('./pages/tickets/ticket-detail/ticket-detail.page').then(m => m.TicketDetailPage),
    canActivate: [AuthGuard]
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
  },
  {
    path: 'admin-control',
    loadComponent: () => import('./pages/admin-control/admin-control.page').then(m => m.AdminControlPage),
    canActivate: [AdminGuard]
  },
  {
    path: 'user-management',
    loadComponent: () => import('./pages/user-management/user-management.page').then(m => m.UserManagementPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'pdf-archive',
    loadComponent: () => import('./pages/pdf-archive/pdf-archive.page').then(m => m.PdfArchivePage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'config',
    loadComponent: () => import('./pages/config/config.page').then(m => m.ConfigPage),
    canActivate: [AuthGuard, AdminGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
