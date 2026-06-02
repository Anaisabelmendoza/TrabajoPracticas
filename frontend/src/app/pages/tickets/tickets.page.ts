import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.page.html',
  styleUrls: ['./tickets.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatBadgeModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    HttpClientModule
  ]
})
export class TicketsPage implements OnInit {
  tickets: any[] = [];
  categories: any[] = [];
  loading = true;
  currentUser: any = null;
  isAgent = false;
  isAdmin = false;
  selectedTabIndex = 0;

  // Modal de Estado Kanban Detallado
  isStatusModalOpen = false;
  selectedStatus = '';
  modalSearchText = '';

  // Filtros
  searchId: any = '';
  searchCategory: any = '';
  searchPriority: string = '';
  searchStartDate: Date | null = null;
  searchEndDate: Date | null = null;

  showFilters: boolean = false;

  userName: string = '';
  stats = {
    new: 0,
    inProgress: 0,
    resolved: 0
  };

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.updateRoles();
    if (!this.isAgent && !this.isAdmin) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadCategories();
    this.loadCurrentUser();
    this.loadTickets();
    
    this.route.queryParams.subscribe(params => {
      if (params['tab'] !== undefined) {
        this.selectedTabIndex = parseInt(params['tab'], 10);
      }
      this.showFilters = params['filters'] === 'true';
      if (params['viewStatus'] !== undefined) {
        setTimeout(() => {
          this.openStatusModal(params['viewStatus']);
        }, 300);
      }
    });

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
    this.updateRoles();
    if (!this.isAgent && !this.isAdmin) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadCurrentUser();
    this.loadTickets();
  }

  getFilteredTickets(status: string): any[] {
    if (!this.tickets) return [];
    
    // Verificación dinámica de roles para evitar fallos de sincronización
    const isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
    const isAdmin = this.authService.hasRole('ROLE_ADMIN');

    return this.tickets.filter(t => {
      // 1. Filtrado por estado (Insensible a mayúsculas/minúsculas)
      let statusMatch = false;
      const currentStatus = (t.status || '').toLowerCase();
      
      if (status === 'Nuevo') {
        statusMatch = currentStatus === 'nuevo' || currentStatus === 'new';
      } else if (status === 'Proceso') {
        statusMatch = currentStatus === 'en proceso' || currentStatus === 'proceso' || currentStatus === 'doing';
      } else if (status === 'Resuelto') {
        statusMatch = currentStatus === 'resuelto' || currentStatus === 'done' || currentStatus === 'resolved';
      } else if (status === 'Cerrado') {
        statusMatch = currentStatus === 'cerrado';
      }
      
      if (!statusMatch) return false;

      // 2. Filtro por CATEGORÍAS ASIGNADAS
      if (isAgent && !isAdmin && this.currentUser && this.currentUser.categories) {
        // Extraemos solo los IDs numéricos de las categorías asignadas al agente
        const agentCategoryIds = this.currentUser.categories.map((c: any) => {
          if (c.id) return c.id.toString();
          if (typeof c === 'string') return c.split('/').pop();
          if (c['@id']) return c['@id'].split('/').pop();
          return null;
        }).filter((id: any) => id !== null);
        
        if (agentCategoryIds.length > 0) {
          // Extraemos el ID numérico de la categoría del ticket
          let ticketCategoryId = null;
          if (t.category) {
            if (t.category.id) ticketCategoryId = t.category.id.toString();
            else if (typeof t.category === 'string') ticketCategoryId = t.category.split('/').pop();
            else if (t.category['@id']) ticketCategoryId = t.category['@id'].split('/').pop();
          }

          const categoryName = t.category?.name || '';

          // EXCEPCIÓN: Si es un ticket de Email, todos los agentes deben poder verlo
          if (categoryName.toLowerCase() === 'email' || t.description?.includes('[ORIGEN: EMAIL]')) {
            // Permitimos el paso
          } else if (!ticketCategoryId || !agentCategoryIds.includes(ticketCategoryId)) {
            return false;
          }
        }
      }

      // 3. Filtros de búsqueda (ID, Categoría, Prioridad, Fechas)
      if (this.searchId && t.id.toString() !== this.searchId.toString()) return false;
      
      if (this.searchCategory) {
        const catId = t.category?.id || (typeof t.category === 'object' ? t.category.id : null);
        if (catId?.toString() !== this.searchCategory.toString()) return false;
      }

      if (this.searchPriority && t.priority !== this.searchPriority) return false;

      // Filtro de Fechas
      if (this.searchStartDate || this.searchEndDate) {
        const ticketDate = new Date(t.createdAt);
        if (this.searchStartDate) {
          const start = new Date(this.searchStartDate);
          start.setHours(0, 0, 0, 0);
          if (ticketDate < start) return false;
        }
        if (this.searchEndDate) {
          const end = new Date(this.searchEndDate);
          end.setHours(23, 59, 59, 999);
          if (ticketDate > end) return false;
        }
      }

      // 4. Permisos y Soft Delete
      if (isAgent || isAdmin) {
        return true; // Los agentes/admins ven todo lo que pase los filtros anteriores
      }

      // Los usuarios normales solo ven sus propios tickets (author)
      const user = this.authService.getUser();
      const userEmail = user?.email || user?.username;
      
      const isAuthor = (t.author && (t.author.email === userEmail || t.author.username === userEmail));
      
      if (!isAuthor) return false;
      if (t.deletedByUser === true) return false;

      return true;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  clearFilters() {
    this.searchId = '';
    this.searchCategory = '';
    this.searchPriority = '';
    this.searchStartDate = null;
    this.searchEndDate = null;
    this.loadTickets();
  }

  loadTickets() {
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

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'nuevo': return 'primary';
      case 'en proceso': return 'warning';
      case 'resuelto': return 'success';
      case 'cerrado': return 'medium';
      default: return 'primary';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baja': return 'success';
      default: return 'medium';
    }
  }

  async editTicket(ticket: any, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/tickets', ticket.id], { queryParams: { edit: 'true' } });
  }

  async deleteTicket(ticket: any, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar este ticket?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            if (!this.isAgent) {
              // Soft delete para usuario
              this.ticketService.updateTicket(ticket.id, { deletedByUser: true }).subscribe({
                next: () => {
                  this.tickets = this.tickets.filter(t => t.id !== ticket.id);
                  this.showToast('Incidencia eliminada de tu perfil', 'success');
                },
                error: (err) => {
                  console.error('Error al ocultar ticket', err);
                  this.showToast('Error al eliminar la incidencia', 'danger');
                }
              });
            } else {
              // Hard delete normal para agentes o admins
              this.ticketService.deleteTicket(ticket.id).subscribe({
                next: () => {
                  this.tickets = this.tickets.filter(t => t.id !== ticket.id);
                  this.showToast('Ticket eliminado correctamente', 'success');
                },
                error: (err) => {
                  console.error('Error al eliminar', err);
                  this.showToast('Error al eliminar el ticket', 'danger');
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  async claimTicket(ticket: any, event: Event) {
    event.stopPropagation();
    this.ticketService.claimTicket(ticket.id).subscribe({
      next: () => {
        this.showToast('¡Has reclamado el ticket correctamente!', 'success');
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error claiming ticket', err);
        this.showToast('Error al reclamar el ticket', 'danger');
      }
    });
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
    if (first) {
      return first.slice(0, 2).toUpperCase();
    }
    return 'U';
  }

  openStatusModal(status: string) {
    this.selectedStatus = status;
    this.modalSearchText = '';
    this.isStatusModalOpen = true;
  }

  getModalFilteredTickets(): any[] {
    const statusFiltered = this.getFilteredTickets(this.selectedStatus);
    if (!this.modalSearchText) return statusFiltered;
    
    const query = this.modalSearchText.toLowerCase().trim();
    return statusFiltered.filter(t => {
      return t.id.toString().includes(query) || 
             (t.title || '').toLowerCase().includes(query) || 
             (t.description || '').toLowerCase().includes(query) ||
             (t.author?.firstName || '').toLowerCase().includes(query) ||
             (t.author?.lastName || '').toLowerCase().includes(query);
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

  goToTicket(id: number) {
    this.isStatusModalOpen = false;
    this.router.navigate(['/tickets', id]);
  }
}
