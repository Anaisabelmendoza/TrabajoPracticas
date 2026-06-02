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
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
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

  // Variables del Modal de Estado
  isStatusModalOpen: boolean = false;
  selectedStatus: string = '';
  modalSearchText: string = '';


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
        alert(`INFO DASHBOARD DEBUG: getTickets() devolvió ${data ? data.length : 0} tickets. isAgent=${this.isAgent}, isAdmin=${this.isAdmin}`);
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.loading = false;
        
        // FORZAR LOGOUT POR SI LA SESION CADUCÓ Y EL INTERCEPTOR NO SALTÓ
        localStorage.removeItem('auth_token');
        alert(`INFO DASHBOARD DEBUG: getTickets() falló. Status: ${err?.status || 'N/A'}. Message: ${err?.message || 'N/A'}. TE HEMOS CERRADO SESIÓN POR SEGURIDAD.`);
        this.router.navigate(['/login']);
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

  openStatusModal(status: string) {
    this.selectedStatus = status;
    this.modalSearchText = '';
    this.isStatusModalOpen = true;
  }

  goToTicket(id: number) {
    this.isStatusModalOpen = false;
    this.router.navigate(['/tickets', id], { queryParams: { from: 'dashboard' } });
  }

  getModalFilteredTickets(): any[] {
    const ticketsOfStatus = this.getFilteredTickets(this.selectedStatus);
    if (!this.modalSearchText.trim()) {
      return ticketsOfStatus;
    }
    const query = this.modalSearchText.toLowerCase().trim();
    return ticketsOfStatus.filter(t => {
      const idStr = t.id ? t.id.toString() : '';
      const titleStr = t.title ? t.title.toLowerCase() : '';
      const descStr = t.description ? t.description.toLowerCase() : '';
      const clientStr = t.author ? (t.author.firstName + ' ' + t.author.lastName).toLowerCase() : '';
      return idStr.includes(query) || titleStr.includes(query) || descStr.includes(query) || clientStr.includes(query);
    });
  }

  getStatusHeaderColor(status: string): string {
    switch (status) {
      case 'Nuevo': return '#d32f2f';
      case 'Proceso': return '#f57c00';
      case 'Resuelto': return '#388e3c';
      case 'Cerrado': return '#7f8c8d';
      default: return '#8e2de2';
    }
  }


  getSlaStatus(ticket: any): { text: string; class: string; expired: boolean } {
    if (!ticket || (ticket.status === 'Resuelto' || ticket.status === 'Cerrado')) {
      return { text: '', class: '', expired: false };
    }

    if (!ticket.slaLimit && ticket.createdAt) {
      try {
        const createdDate = new Date(ticket.createdAt);
        let hoursToAdd = 24;
        switch (ticket.priority?.toLowerCase()) {
          case 'crítica':
          case 'critica':
            hoursToAdd = 4;
            break;
          case 'alta':
            hoursToAdd = 12;
            break;
          case 'media':
            hoursToAdd = 24;
            break;
          case 'baja':
          default:
            hoursToAdd = 48;
            break;
        }
        const calculatedLimit = new Date(createdDate.getTime() + hoursToAdd * 60 * 60 * 1000);
        ticket.slaLimit = calculatedLimit.toISOString();
      } catch (e) {
        console.error('Error calculating local SLA limit:', e);
      }
    }

    if (!ticket.slaLimit) {
      return { text: '', class: '', expired: false };
    }

    const limitDate = new Date(ticket.slaLimit);
    const now = new Date();
    const diffMs = limitDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      const diffHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      return {
        text: `🔴 SLA Vencido hace ${diffHours}h`,
        class: 'sla-expired',
        expired: true
      };
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours < 2) {
        return {
          text: `⚠️ Quedan ${diffHours}h ${diffMins}m`,
          class: 'sla-warning',
          expired: false
        };
      } else {
        return {
          text: `⏳ Quedan ${diffHours}h`,
          class: 'sla-normal',
          expired: false
        };
      }
    }
  }

  getCategoryIcon(categoryName: string): string {
    if (!categoryName) return 'help_outline';
    const name = categoryName.toLowerCase();
    if (name.includes('redes')) return 'settings_ethernet';
    if (name.includes('hardware')) return 'computer';
    if (name.includes('software')) return 'code';
    if (name.includes('acceso')) return 'vpn_key';
    if (name.includes('email') || name.includes('correo')) return 'alternate_email';
    return 'help_outline';
  }

  getAuthorInitials(author: any): string {
    if (!author) return 'U';
    const first = author.firstName || author.username || '';
    const last = author.lastName || '';
    if (first && last) {
      return (first[0] + last[0]).toUpperCase();
    }
    return first ? first[0].toUpperCase() : 'U';
  }
}

