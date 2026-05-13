import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationPushService {
  private lastTicketId: number | null = null;
  private pollInterval: any;
  private isFirstLoad = true;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    this.requestPermission();
  }

  requestPermission() {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }

  startMonitoring() {
    if (this.pollInterval) return;

    // Verificar cada 30 segundos
    this.pollInterval = setInterval(() => {
      this.checkNewTickets();
    }, 30000);

    // Primera ejecución inmediata
    this.checkNewTickets();
  }

  stopMonitoring() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isFirstLoad = true;
    this.lastTicketId = null;
  }

  private checkNewTickets() {
    if (!this.authService.isLoggedIn()) {
      this.stopMonitoring();
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Accept': 'application/ld+json'
    });

    // Consultamos los tickets más recientes (ordenados por ID desc)
    this.http.get<any>(`${environment.apiUrl}/api/tickets?order[id]=desc&itemsPerPage=1`, { headers })
      .subscribe({
        next: (response) => {
          const tickets = response['member'] || response['hydra:member'] || [];
          if (tickets.length > 0) {
            const latestTicket = tickets[0];
            const latestId = latestTicket.id;

            if (this.isFirstLoad) {
              this.lastTicketId = latestId;
              this.isFirstLoad = false;
              return;
            }

            if (this.lastTicketId !== null && latestId > this.lastTicketId) {
              this.showNotification(latestTicket);
              this.lastTicketId = latestId;
            }
          }
        },
        error: (err) => console.error('Error al monitorear nuevos tickets:', err)
      });
  }

  private showNotification(ticket: any) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification('Nuevo Ticket en HelpDesk 🎫', {
      body: `[#${ticket.id}] ${ticket.title}\nPrioridad: ${ticket.priority}`,
      icon: 'assets/icon/favicon.png', // Asegúrate de que esta ruta sea válida
      tag: 'new-ticket-' + ticket.id
    });

    notification.onclick = () => {
      window.focus();
      this.router.navigate(['/tickets', ticket.id]);
      notification.close();
    };
  }
}
