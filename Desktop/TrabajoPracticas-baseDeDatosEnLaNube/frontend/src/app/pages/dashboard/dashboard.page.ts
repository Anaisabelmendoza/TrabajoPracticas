import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
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
  loading = true;
  isAdmin = false;
  isAgent = false;
  tickets: any[] = [];
  categories: any[] = [];
  currentUser: any = null;
  stats = {
    new: 0,
    inProgress: 0,
    resolved: 0
  };

  constructor(
    private authService: AuthService,
    private ticketService: TicketService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.updateRoles();
    this.loadCategories();
    this.loadCurrentUser();
    this.loadTickets();
    
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.firstName || user.username || 'Usuario';
    }
  }

  loadCurrentUser() {
    const user = this.authService.getUser();
    if (user && user.id) {
      this.http.get<any>(`${environment.apiUrl}/api/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${this.authService.getToken()}`, 'Accept': 'application/ld+json' }
      }).subscribe(res => {
        this.currentUser = res;
      });
    }
  }

  updateRoles() {
    this.isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');
  }

  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/api/categories`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).subscribe(res => {
      this.categories = res['member'] || res['hydra:member'] || [];
    });
  }

  ionViewWillEnter() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        this.calculateStats(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.loading = false;
      }
    });
  }

  loadTickets() {
    this.loadStats();
  }

  calculateStats(tickets: any[]) {
    const isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
    const isAdmin = this.authService.hasRole('ROLE_ADMIN');
    const user = this.authService.getUser();
    const userEmail = user?.email || user?.username;

    let filtered = tickets;
    if (!isAgent) {
      filtered = tickets.filter((t: any) => !t.deletedByUser);
    }

    this.stats.new = filtered.filter((t: any) => t.status === 'Nuevo').length;
    
    this.stats.inProgress = filtered.filter((t: any) => {
      if (t.status !== 'En proceso') return false;
      if (isAdmin) return true;
      if (isAgent) return t.agent && t.agent.email === userEmail;
      return true;
    }).length;

    this.stats.resolved = filtered.filter((t: any) => {
      if (t.status !== 'Resuelto' && t.status !== 'Cerrado') return false;
      if (isAdmin) return true;
      if (isAgent) return t.agent && t.agent.email === userEmail;
      return true;
    }).length;
  }

  getFilteredTickets(status: string): any[] {
    if (!this.tickets) return [];
    
    const isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
    const isAdmin = this.authService.hasRole('ROLE_ADMIN');

    return this.tickets.filter(t => {
      let statusMatch = false;
      const currentStatus = (t.status || '').toLowerCase();
      
      if (status === 'Nuevo') {
        statusMatch = currentStatus === 'nuevo' || currentStatus === 'new';
      } else if (status === 'Proceso') {
        statusMatch = currentStatus === 'en proceso' || currentStatus === 'proceso';
      } else if (status === 'Resuelto') {
        statusMatch = currentStatus === 'resuelto';
      } else if (status === 'Cerrado') {
        statusMatch = currentStatus === 'cerrado';
      }
      
      if (!statusMatch) return false;

      // Si es Admin, ve todo
      if (isAdmin) return true;

      // Si es Agente, aplicamos filtros de categoría
      if (isAgent) {
        if (this.currentUser && this.currentUser.categories) {
          const agentCategoryUris = this.currentUser.categories.map((c: any) => typeof c === 'string' ? c : c['@id']);
          
          if (agentCategoryUris.length > 0) {
            const ticketCategoryUri = t.category ? (t.category['@id'] || `/api/categories/${t.category.id}`) : null;
            const categoryName = t.category?.name || '';

            // EXCEPCIÓN: Si es un ticket de Email, todos los agentes deben poder verlo
            if (categoryName.toLowerCase() === 'email' || t.description?.includes('[ORIGEN: EMAIL]')) {
              return true;
            }

            if (!ticketCategoryUri || !agentCategoryUris.includes(ticketCategoryUri)) {
              return false;
            }
          }
        }
        return true;
      }

      // Usuario normal: solo sus tickets
      const user = this.authService.getUser();
      const userEmail = user?.email || user?.username;
      const isAuthor = (t.author && (t.author.email === userEmail || t.author.username === userEmail));
      return isAuthor && !t.deletedByUser;
    });
  }
}
