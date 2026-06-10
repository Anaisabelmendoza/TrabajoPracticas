import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationPushService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  private lastTicketId: number | null = null;
  private lastCommentId: number | null = null;
  private pollInterval: any;
  private isFirstLoad = true;

  constructor() {
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
      this.checkNewComments();
    }, 30000);

    // Primera ejecución inmediata
    this.checkNewTickets();
    this.checkNewComments();
  }

  stopMonitoring() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isFirstLoad = true;
    this.lastTicketId = null;
    this.lastCommentId = null;
  }

  private checkNewTickets() {
    if (!this.authService.isLoggedIn()) {
      this.stopMonitoring();
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Accept': 'application/ld+json',
      'X-Silent-Request': 'true'
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

  private checkNewComments() {
    if (!this.authService.isLoggedIn()) {
      this.stopMonitoring();
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Accept': 'application/ld+json',
      'X-Silent-Request': 'true'
    });

    // Consultamos los comentarios más recientes del sistema
    this.http.get<any>(`${environment.apiUrl}/api/comments?order[id]=desc&itemsPerPage=5`, { headers })
      .subscribe({
        next: (response) => {
          const comments = response['member'] || response['hydra:member'] || [];
          if (comments.length > 0) {
            // Ordenamos de más antiguo a más nuevo para procesar en orden cronológico
            const sortedComments = [...comments].sort((a, b) => a.id - b.id);
            
            const currentUser = this.authService.getUser();
            const currentUserIri = currentUser ? `/api/users/${currentUser.id}` : '';

            sortedComments.forEach(comment => {
              const commentId = comment.id;

              // Inicializar la primera carga silenciosa para evitar spam de notificaciones antiguas al loguearse
              if (this.lastCommentId === null) {
                this.lastCommentId = commentId;
                return;
              }

              if (commentId > this.lastCommentId) {
                // Obtener el IRI del autor del comentario
                const authorIri = typeof comment.author === 'string' ? comment.author : comment.author?.['@id'];
                
                // Mostrar notificación solo si el autor no es el propio usuario logueado
                if (authorIri && authorIri !== currentUserIri) {
                  // Obtener el ID de la incidencia desde el IRI de ticket (ej: "/api/tickets/15")
                  const ticketIri = typeof comment.ticket === 'string' ? comment.ticket : comment.ticket?.['@id'];
                  const ticketId = ticketIri ? ticketIri.match(/\d+/)?.[0] : null;

                  this.showCommentNotification(comment, ticketId);
                }
                this.lastCommentId = commentId;
              }
            });
          }
        },
        error: (err) => console.error('Error al monitorear nuevos comentarios:', err)
      });
  }

  private showNotification(ticket: any) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification('Nuevo Ticket en HelpDesk 🎫', {
      body: `[#${ticket.id}] ${ticket.title}\nPrioridad: ${ticket.priority}`,
      icon: 'assets/icon/favicon.png',
      tag: 'new-ticket-' + ticket.id
    });

    notification.onclick = () => {
      window.focus();
      this.router.navigate(['/tickets', ticket.id]);
      notification.close();
    };
  }

  private showCommentNotification(comment: any, ticketId: string | null) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const ticketLabel = ticketId ? `#${ticketId}` : '';
    const cleanContent = comment.content.length > 60 
      ? comment.content.substring(0, 57) + '...' 
      : comment.content;

    const notification = new Notification(`Mensaje en Chat ${ticketLabel} 💬`, {
      body: `"${cleanContent}"`,
      icon: 'assets/icon/favicon.png',
      tag: 'new-comment-' + comment.id
    });

    notification.onclick = () => {
      window.focus();
      if (ticketId) {
        this.router.navigate(['/tickets', parseInt(ticketId)]);
      }
      notification.close();
    };
  }
}
