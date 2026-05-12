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

  // Filtros
  searchCategory: number | '' = '';
  searchPriority: string = '';
  searchStartDate: Date | null = null;
  searchEndDate: Date | null = null;

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
    // Primero cargamos roles y luego tickets
    this.updateRoles();
    this.loadCategories();
    this.loadCurrentUser();
    this.loadTickets();
    
    this.route.queryParams.subscribe(params => {
      if (params['tab'] !== undefined) {
        this.selectedTabIndex = parseInt(params['tab'], 10);
      }
    });
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
        statusMatch = currentStatus === 'resuelto' || currentStatus === 'cerrado' || currentStatus === 'done' || currentStatus === 'resolved';
      }
      
      if (!statusMatch) return false;

      // 2. Filtro por CATEGORÍAS ASIGNADAS
      // Si es AGENTE y NO es ADMIN, solo ve tickets de sus categorías asignadas
      if (isAgent && !isAdmin && this.currentUser && this.currentUser.categories) {
        const agentCategoryUris = this.currentUser.categories.map((c: any) => typeof c === 'string' ? c : c['@id']);
        
        // REGLA: Si el agente TIENE categorías asignadas, aplicamos el filtro. 
        // Si NO TIENE categorías (lista vacía), entonces ve TODO.
        if (agentCategoryUris.length > 0) {
          const ticketCategoryUri = t.category ? (t.category['@id'] || `/api/categories/${t.category.id}`) : null;
          if (!ticketCategoryUri || !agentCategoryUris.includes(ticketCategoryUri)) {
            return false;
          }
        }
      }

      // 3. Filtros de búsqueda (Categoría, Prioridad, Fechas)
      if (this.searchCategory && t.category?.id !== this.searchCategory) return false;
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.loading = false;
      }
    });
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
}
