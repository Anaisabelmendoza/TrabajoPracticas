import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class DashboardPage implements OnInit {
  userName: string = '';
  stats = {
    new: 0,
    inProgress: 0,
    resolved: 0
  };
  loading = true;

  constructor(
    private authService: AuthService,
    private ticketService: TicketService
  ) { }

  ngOnInit() {
    const user = this.authService.getUser();
    console.log('User from token:', user); // DEBUG
    if (user) {
      this.userName = user.firstName || user.username || 'Usuario';
    } else {
      this.userName = 'Invitado';
    }
  }

  ionViewWillEnter() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    const user = this.authService.getUser();
    const userEmail = user?.email || user?.username;
    const isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');

    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.stats.new = tickets.filter((t: any) => t.status === 'Nuevo').length;
        
        this.stats.inProgress = tickets.filter((t: any) => {
          if (t.status !== 'En proceso') return false;
          if (isAgent) return t.agent && t.agent.email === userEmail;
          return true;
        }).length;

        this.stats.resolved = tickets.filter((t: any) => {
          if (t.status !== 'Resuelto' && t.status !== 'Cerrado') return false;
          if (isAgent) return t.agent && t.agent.email === userEmail;
          return true;
        }).length;
        
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
