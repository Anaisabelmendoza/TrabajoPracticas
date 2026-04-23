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
import { AlertController, ToastController } from '@ionic/angular';

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
    RouterModule
  ]
})
export class TicketsPage implements OnInit {
  tickets: any[] = [];
  loading = true;
  isAgent = false;
  selectedTabIndex = 0;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] !== undefined) {
        this.selectedTabIndex = parseInt(params['tab'], 10);
      }
    });
    this.loadTickets();
  }

  ionViewWillEnter() {
    this.isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
    this.loadTickets();
  }

  getFilteredTickets(status: string): any[] {
    const user = this.authService.getUser();
    const userEmail = user?.email || user?.username;

    return this.tickets.filter(t => {
      // Filtrar tickets soft-deleted para usuarios normales
      if (!this.isAgent && t.deletedByUser === true) {
        return false;
      }

      if (status === 'Nuevo') {
        return t.status === 'Nuevo';
      } else if (status === 'Proceso') {
        if (t.status !== 'En proceso') return false;
        if (this.isAgent) return t.agent && t.agent.email === userEmail;
        return true;
      } else if (status === 'Resuelto') {
        if (t.status !== 'Resuelto' && t.status !== 'Cerrado') return false;
        if (this.isAgent) return t.agent && t.agent.email === userEmail;
        return true;
      }
      return false;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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
