import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { TicketService } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { WorkLogService } from '../../../services/work-log.service';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.page.html',
  styleUrls: ['./ticket-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class TicketDetailPage implements OnInit, OnDestroy {
  ticket: any = null;
  newComment = '';
  loading = true;
  isAgent = false;
  isAdmin = false;
  isEditingDescription = false;
  editedDescription = '';
  commentFile: File | null = null;
  commentFilePreview: string | null = null;
  today = new Date();

  // Variables de Encuesta de Satisfacción CSAT
  selectedRating = 0;
  hoverRating = 0;
  surveyComment = '';
  surveySubmitted = false;

  // Variables del Cronómetro
  timerInterval: any;
  timerSeconds: number = 0;
  isTimerRunning: boolean = false;
  defaultBackHref = '/tickets';
  chatPollInterval: any;

  // Variables de SLA calculadas en frontend de manera robusta
  slaRemainingText = '';
  slaRemainingClass = '';
  slaRemainingExpired = false;
  slaFormattedHours = 24;
  slaFormattedTime = '';
  slaFormattedDate = '';
  slaInterval: any;

  // Variables de Notas Manuales de Historial
  newManualNote = '';
  isAddingNote = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    public authService: AuthService,
    private workLogService: WorkLogService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');
    const id = this.route.snapshot.paramMap.get('id');
    const editMode = this.route.snapshot.queryParamMap.get('edit') === 'true';
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'dashboard') {
      this.defaultBackHref = '/dashboard';
    }
    if (id) {
      const parsedId = parseInt(id);
      this.loadTicket(parsedId);
      this.startChatPolling(parsedId);
    }
    if (editMode) {
      this.isEditingDescription = true;
    }
  }

  ionViewWillEnter() {
    this.isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');
  }

  isOwner(): boolean {
    if (!this.ticket || !this.ticket.author) return false;
    const user = this.authService.getUser();
    if (!user) return false;

    const loggedInEmail = user.email || user.username || user.sub;
    const authorEmail = this.ticket.author.email;
    const loggedInId = user.id;
    const authorId = this.ticket.author.id;

    return (loggedInEmail && authorEmail && loggedInEmail.toLowerCase() === authorEmail.toLowerCase()) ||
      (loggedInId && authorId && loggedInId === authorId);
  }

  loadTicket(id: number) {
    this.loading = true;
    this.ticketService.getTicket(id).subscribe({
      next: (data) => {
        this.ticket = data;
        console.log('--- DIAGNOSTIC: TICKET DETAIL RECEIVED ---', data);
        if (this.isEditingDescription) {
          this.editedDescription = this.ticket.description;
        }
        this.resumeTimerIfActive();
        this.calculateSlaDetails();
        this.startSlaInterval();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading ticket', err);
        this.loading = false;
      }
    });
  }

  ionViewWillLeave() {
    this.stopChatPolling();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.slaInterval) {
      clearInterval(this.slaInterval);
    }
    this.stopChatPolling();
  }

  startChatPolling(id: number) {
    this.stopChatPolling();
    this.chatPollInterval = setInterval(() => {
      this.refreshChatSilently(id);
    }, 7000); // Refrescar chat en segundo plano cada 7 segundos
  }

  stopChatPolling() {
    if (this.chatPollInterval) {
      clearInterval(this.chatPollInterval);
      this.chatPollInterval = null;
    }
  }

  refreshChatSilently(id: number) {
    if (this.loading || !this.ticket) return;
    this.ticketService.getTicket(id).subscribe({
      next: (data) => {
        const currentCommentsLength = this.ticket.comments?.length || 0;
        const newCommentsLength = data.comments?.length || 0;

        // Actualizamos de forma silenciosa si hay nuevos comentarios o cambió el estado
        if (newCommentsLength > currentCommentsLength || data.status !== this.ticket.status) {
          this.ticket = data;
          console.log('Chat actualizado automáticamente con nuevos mensajes / estado.');
        }
      },
      error: (err) => console.error('Error al auto-actualizar chat:', err)
    });
  }

  startTimer() {
    if (this.isTimerRunning) return;
    this.isTimerRunning = true;
    localStorage.setItem(`ticket_timer_start_${this.ticket.id}`, Date.now().toString());

    // Si ya teníamos segundos acumulados (de una pausa previa sin loggear), los mantenemos
    const accumulated = parseInt(localStorage.getItem(`ticket_timer_accumulated_${this.ticket.id}`) || '0', 10);
    this.timerSeconds = accumulated;

    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
    }, 1000);
  }

  pauseTimer() {
    if (!this.isTimerRunning) return;
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);

    // Guardamos los segundos actuales para poder reanudar
    localStorage.setItem(`ticket_timer_accumulated_${this.ticket.id}`, this.timerSeconds.toString());
    localStorage.removeItem(`ticket_timer_start_${this.ticket.id}`);

    this.showToast('Temporizador en pausa ⏸️', 'warning');
  }

  resumeTimer() {
    this.startTimer();
    this.showToast('Temporizador reanudado ▶️', 'success');
  }

  stopTimerAndLog() {
    // Si no está corriendo pero hay tiempo acumulado (pausado), también debemos loggearlo
    const accumulated = parseInt(localStorage.getItem(`ticket_timer_accumulated_${this.ticket.id}`) || '0', 10);
    const current = this.timerSeconds;
    const finalSeconds = Math.max(accumulated, current);

    if (finalSeconds === 0 && !this.isTimerRunning) return;

    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    localStorage.removeItem(`ticket_timer_start_${this.ticket.id}`);
    localStorage.removeItem(`ticket_timer_accumulated_${this.ticket.id}`);

    const minutes = Math.ceil(finalSeconds / 60);
    this.timerSeconds = 0;

    if (minutes > 0) {
      this.loading = true;
      const user = this.authService.getUser();
      this.workLogService.createWorkLog({
        ticket: `/api/tickets/${this.ticket.id}`,
        agent: `/api/users/${user.id}`,
        minutesSpent: minutes,
        description: 'Tiempo registrado automáticamente (Cronómetro)'
      }).subscribe({
        next: (newLog) => {
          this.loading = false;
          if (!this.ticket.workLogs) this.ticket.workLogs = [];
          this.ticket.workLogs.push(newLog);
          this.showToast(`Se han registrado ${minutes} minuto(s) de trabajo.`, 'success');
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.showToast('Error al guardar el tiempo del cronómetro', 'danger');
        }
      });
    } else {
      this.showToast('El tiempo fue menor a 1 minuto, no se registró.', 'warning');
    }
  }

  resumeTimerIfActive() {
    const startTime = localStorage.getItem(`ticket_timer_start_${this.ticket.id}`);
    const accumulated = parseInt(localStorage.getItem(`ticket_timer_accumulated_${this.ticket.id}`) || '0', 10);

    if (startTime) {
      this.isTimerRunning = true;
      const elapsedMs = Date.now() - parseInt(startTime, 10);
      this.timerSeconds = accumulated + Math.floor(elapsedMs / 1000);

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        this.timerSeconds++;
      }, 1000);
    } else if (accumulated > 0) {
      // Estaba pausado
      this.timerSeconds = accumulated;
      this.isTimerRunning = false;
    }
  }

  formatTimer(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  claimTicket() {
    if (!this.ticket) return;

    this.loading = true;
    this.ticketService.claimTicket(this.ticket.id).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.loading = false;
        this.showToast('¡Ticket asignado! Ahora eres el responsable.', 'success');

        // Auto-start timer
        this.startTimer();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error en claimTicket:', err);
        let msg = 'Error al asignar el ticket';
        if (err.error && (err.error.detail || err.error['hydra:description'])) {
          msg = err.error.detail || err.error['hydra:description'];
        }
        this.showToast(msg, 'danger');
      }
    });
  }

  releaseTicket() {
    if (!this.ticket) return;

    this.alertCtrl.create({
      header: 'Liberar Incidencia',
      message: '¿Estás seguro de que deseas desasignar al técnico y devolver esta incidencia al estado "Nuevo" para que otro agente pueda atenderla?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, liberar',
          handler: () => {
            this.loading = true;
            if (this.isTimerRunning) {
              this.stopTimerAndLog();
            }
            this.ticketService.updateTicket(this.ticket.id, {
              agent: null,
              status: 'Nuevo'
            }).subscribe({
              next: (updated) => {
                this.ticket = updated;
                this.loading = false;
                this.showToast('Incidencia liberada. Ha regresado al grupo de Nuevas.', 'success');
              },
              error: (err) => {
                this.loading = false;
                console.error('Error al liberar ticket:', err);
                this.showToast('Error al liberar la incidencia', 'danger');
              }
            });
          }
        }
      ]
    }).then(alert => alert.present());
  }

  async assignTicket() {
    this.loading = true;
    // 1. Obtener lista de agentes
    this.http.get<any>(`${environment.apiUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}`, 'Accept': 'application/ld+json' }
    }).subscribe({
      next: async (res) => {
        this.loading = false;
        const users = res['hydra:member'] || res['member'] || (Array.isArray(res) ? res : []);
        const agents = users.filter((u: any) => u.roles && u.roles.includes('ROLE_AGENT'));

        if (agents.length === 0) {
          this.showToast('No hay agentes registrados en el sistema.', 'warning');
          return;
        }

        // 2. Mostrar alerta para elegir agente
        const alert = await this.alertCtrl.create({
          header: 'Asignar Incidencia',
          subHeader: 'Selecciona un técnico para esta incidencia',
          inputs: agents.map((agent: any) => ({
            type: 'radio',
            label: `${agent.firstName} ${agent.lastName}`,
            value: agent.id,
            checked: this.ticket.agent && this.ticket.agent.id === agent.id
          })),
          buttons: [
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Asignar',
              handler: (agentId) => {
                if (!agentId) return false;
                this.performAssignment(agentId);
                return true;
              }
            }
          ]
        });
        await alert.present();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando agentes:', err);
        this.showToast('Error al cargar la lista de técnicos', 'danger');
      }
    });
  }

  private performAssignment(agentId: number) {
    this.loading = true;
    this.ticketService.updateTicket(this.ticket.id, { agent: `/api/users/${agentId}` }).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.loading = false;
        this.showToast('Incidencia asignada correctamente', 'success');

        // Si el usuario actual es el asignado, iniciar cronómetro
        const user = this.authService.getUser();
        if (user && user.id === agentId) {
          this.startTimer();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al asignar:', err);
        this.showToast('Error al procesar la asignación', 'danger');
      }
    });
  }

  updateStatus(newStatus: string) {
    if (!this.ticket) return;
    this.ticketService.updateTicket(this.ticket.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.showToast(`Estado cambiado a: ${newStatus}`, 'success');

        // Iniciar cronómetro automáticamente
        if (newStatus === 'En proceso') {
          this.startTimer();
        }

        // Detener cronómetro automáticamente
        if (newStatus === 'Resuelto') {
          this.stopTimerAndLog();
        }
      },
      error: (err) => {
        console.error('Error en updateStatus:', err);
        let msg = `Error al cambiar el estado (${err.status}: ${err.statusText})`;
        if (err.error && typeof err.error === 'object') {
          msg = err.error.detail || err.error['hydra:description'] || msg;
        } else if (typeof err.error === 'string') {
          msg = err.error;
        }
        this.showToast(msg, 'danger');
      }
    });
  }

  toggleEditDescription() {
    this.isEditingDescription = !this.isEditingDescription;
    if (this.isEditingDescription) {
      this.editedDescription = this.ticket.description;
    }
  }

  saveDescription() {
    if (!this.ticket || !this.editedDescription.trim()) return;

    this.loading = true;
    this.ticketService.updateTicket(this.ticket.id, { description: this.editedDescription }).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.isEditingDescription = false;
        this.loading = false;
        this.showToast('Descripción actualizada correctamente', 'success');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al actualizar descripción:', err);
        this.showToast('Error al actualizar la descripción', 'danger');
      }
    });
  }

  async logTime() {
    if (!this.ticket || !this.isAgent) return;

    const alert = await this.alertCtrl.create({
      header: 'Registrar Tiempo',
      message: 'Introduce los minutos invertidos y una breve descripción (opcional).',
      inputs: [
        {
          name: 'minutes',
          type: 'number',
          placeholder: 'Minutos (ej: 30)',
          min: 1
        },
        {
          name: 'description',
          type: 'text',
          placeholder: 'Descripción de la tarea'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const mins = parseInt(data.minutes, 10);
            if (isNaN(mins) || mins <= 0) {
              this.showToast('Introduce una cantidad válida de minutos', 'danger');
              return false;
            }

            const user = this.authService.getUser();
            this.loading = true;
            this.workLogService.createWorkLog({
              ticket: `/api/tickets/${this.ticket.id}`,
              agent: `/api/users/${user.id}`,
              minutesSpent: mins,
              description: data.description || ''
            }).subscribe({
              next: () => {
                this.loading = false;
                this.showToast('Tiempo registrado correctamente', 'success');
              },
              error: (err) => {
                console.error(err);
                this.loading = false;
                this.showToast('Error al registrar el tiempo', 'danger');
              }
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  generatePDF() {
    window.print();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  getServerUrl() {
    return environment.apiUrl;
  }

  onCommentFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.commentFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.commentFilePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  removeCommentFile() {
    this.commentFile = null;
    this.commentFilePreview = null;
  }

  openImage(url: string) {
    window.open(this.getServerUrl() + url, '_blank');
  }

  sendComment() {
    if (!this.ticket) return;
    if (!this.newComment.trim() && !this.commentFile) return;

    this.loading = true;

    // 1. COMPROBAR SI HAY ARCHIVO PARA SUBIR
    const upload$ = this.commentFile ?
      this.ticketService.uploadFile(this.commentFile) : of({ path: null });

    upload$.pipe(
      switchMap(res => {
        return this.ticketService.addComment(this.ticket.id, this.newComment, res.path);
      })
    ).subscribe({
      next: (comment) => {
        if (!this.ticket.comments) this.ticket.comments = [];
        this.ticket.comments.push(comment);
        this.newComment = '';
        this.removeCommentFile();
        this.loading = false;
        this.showToast('Mensaje enviado', 'success');
      },
      error: (err) => {
        console.error('Error detallado enviando mensaje:', err);
        this.loading = false;
        let msg = 'Error al enviar el mensaje';
        if (err.error && err.error.detail) {
          msg = err.error.detail;
        } else if (err.error && err.error.error) {
          msg = err.error.error;
        }
        this.showToast(msg, 'danger');
      }
    });
  }

  async deleteTicket() {
    if (!this.isAdmin) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar Incidencia',
      message: '¿Deseas guardar una copia en PDF del trabajo realizado antes de eliminar permanentemente la incidencia?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar solo (sin guardar PDF)',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.confirmDeletion(false);
          }
        },
        {
          text: 'Guardar PDF y Eliminar',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.confirmDeletion(true);
          }
        }
      ]
    });

    await alert.present();
  }

  private confirmDeletion(archive: boolean) {
    this.loading = true;
    this.ticketService.deleteTicket(this.ticket.id, archive).subscribe({
      next: () => {
        this.loading = false;
        this.showToast(archive ? 'PDF guardado e incidencia eliminada' : 'Incidencia eliminada correctamente', 'success');
        const from = this.route.snapshot.queryParamMap.get('from');
        if (from === 'dashboard') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/tickets']);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.showToast('Error al eliminar la incidencia', 'danger');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'nuevo': return 'primary';
      case 'en proceso': return 'warning';
      case 'resuelto': return 'success';
      case 'cerrado': return 'medium';
      default: return 'primary';
    }
  }

  getTotalTimeSpent(): string {
    if (!this.ticket || !this.ticket.workLogs || this.ticket.workLogs.length === 0) {
      return '0h 0m';
    }
    const totalMinutes = this.ticket.workLogs.reduce((acc: number, log: any) => acc + (log.minutesSpent || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
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

  getPriorityClass(priority: string): string {
    if (!priority) return 'priority-baja';
    switch (priority.toLowerCase()) {
      case 'crítica':
      case 'critica':
        return 'priority-critical';
      case 'alta':
        return 'priority-high';
      case 'media':
        return 'priority-medium';
      case 'baja':
      default:
        return 'priority-low';
    }
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-new';
    switch (status.toLowerCase()) {
      case 'en proceso':
        return 'status-process';
      case 'resuelto':
        return 'status-resolved';
      case 'cerrado':
        return 'status-closed';
      case 'nuevo':
      default:
        return 'status-new';
    }
  }

  getHistoryIcon(action: string): string {
    if (!action) return 'history';
    const act = action.toLowerCase();
    if (act.includes('nota manual') || act.includes('\ud83d\udcdd')) return 'edit_note';
    if (act.includes('creación') || act.includes('creacion')) return 'add_circle';
    if (act.includes('prioridad')) return 'low_priority';
    if (act.includes('categoría') || act.includes('categoria')) return 'category';
    if (act.includes('estado')) return 'sync_alt';
    if (act.includes('asign') || act.includes('técnico') || act.includes('tecnico')) return 'person';
    if (act.includes('csat') || act.includes('encuesta')) return 'star';
    return 'history';
  }

  getHistoryBadgeClass(action: string): string {
    if (!action) return 'badge-default';
    const act = action.toLowerCase();
    if (act.includes('nota manual') || act.includes('\ud83d\udcdd')) return 'badge-note';
    if (act.includes('creación') || act.includes('creacion')) return 'badge-create';
    if (act.includes('prioridad')) return 'badge-priority';
    if (act.includes('categoría') || act.includes('categoria')) return 'badge-category';
    if (act.includes('estado')) return 'badge-status';
    if (act.includes('asign') || act.includes('técnico') || act.includes('tecnico')) return 'badge-agent';
    return 'badge-default';
  }

  addManualNote() {
    if (!this.newManualNote.trim() || !this.ticket) return;
    this.isAddingNote = true;

    // Forzamos "as any" para saltarnos la comprobación estricta de TypeScript
    (this.ticketService as any).addTicketNote(this.ticket.id, this.newManualNote.trim()).subscribe({
      next: (newEntry: any) => {
        if (!this.ticket.history) this.ticket.history = [];
        this.ticket.history.unshift(newEntry);
        this.newManualNote = '';
        this.isAddingNote = false;
        this.showToast('¡Nota guardada en el historial! 📝', 'success');
      },
      error: (err: any) => {
        console.error('Error guardando nota con TicketService:', err);
        this.isAddingNote = false;
        this.showToast('Error al guardar la nota en el servidor', 'danger');
      }
    });
  }

  // Métodos de Encuesta de Satisfacción CSAT
  setRating(stars: number) {
    this.selectedRating = stars;
  }

  setHoverRating(stars: number) {
    this.hoverRating = stars;
  }

  submitSurvey() {
    if (this.selectedRating < 1 || this.selectedRating > 5) return;
    this.loading = true;
    this.ticketService.updateTicket(this.ticket.id, {
      rating: this.selectedRating,
      ratingComment: this.surveyComment
    }).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.loading = false;
        this.surveySubmitted = true;
        this.showToast('¡Muchas gracias por valorar nuestro soporte! 👍', 'success');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error submitting survey:', err);
        this.showToast('Error al enviar la valoración', 'danger');
      }
    });
  }

  // Métodos de Control y Cálculo de SLAs
  calculateSlaDetails() {
    if (!this.ticket) {
      this.slaRemainingText = '';
      return;
    }

    if (!this.ticket.slaLimit && this.ticket.createdAt) {
      try {
        const createdDate = new Date(this.ticket.createdAt);
        let hoursToAdd = 24;
        switch (this.ticket.priority?.toLowerCase()) {
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
        this.ticket.slaLimit = calculatedLimit.toISOString();
      } catch (e) {
        console.error('Error calculating local SLA limit:', e);
      }
    }

    if (!this.ticket.slaLimit) {
      this.slaRemainingText = '';
      return;
    }

    // 1. Horas según prioridad
    switch (this.ticket.priority?.toLowerCase()) {
      case 'crítica':
      case 'critica':
        this.slaFormattedHours = 4;
        break;
      case 'alta':
        this.slaFormattedHours = 12;
        break;
      case 'media':
        this.slaFormattedHours = 24;
        break;
      case 'baja':
      default:
        this.slaFormattedHours = 48;
        break;
    }

    // 2. Formatear compromiso antes de las HH:mm del dd/MM
    try {
      const limitDate = new Date(this.ticket.slaLimit);
      const hours = limitDate.getHours().toString().padStart(2, '0');
      const minutes = limitDate.getMinutes().toString().padStart(2, '0');
      this.slaFormattedTime = `${hours}:${minutes}`;

      const day = limitDate.getDate().toString().padStart(2, '0');
      const month = (limitDate.getMonth() + 1).toString().padStart(2, '0');
      this.slaFormattedDate = `${day}/${month}`;
    } catch (e) {
      console.error('Error parsing slaLimit:', e);
    }

    // 3. Calcular tiempo restante para el indicador
    if (this.ticket.status === 'Resuelto' || this.ticket.status === 'Cerrado') {
      this.slaRemainingText = '';
      return;
    }

    const limit = new Date(this.ticket.slaLimit);
    const now = new Date();
    const diff = limit.getTime() - now.getTime();

    if (diff <= 0) {
      const diffH = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
      this.slaRemainingText = `SLA Vencido hace ${diffH} horas`;
      this.slaRemainingClass = 'sla-expired-detail';
      this.slaRemainingExpired = true;
    } else {
      const diffH = Math.floor(diff / (1000 * 60 * 60));
      const diffM = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (diffH < 2) {
        this.slaRemainingText = `Urgente: Quedan ${diffH}h ${diffM}m`;
        this.slaRemainingClass = 'sla-warning-detail';
      } else {
        this.slaRemainingText = `Quedan ${diffH}h ${diffM}m`;
        this.slaRemainingClass = 'sla-normal-detail';
      }
      this.slaRemainingExpired = false;
    }
  }

  startSlaInterval() {
    if (this.slaInterval) clearInterval(this.slaInterval);
    this.slaInterval = setInterval(() => {
      this.calculateSlaDetails();
    }, 30000); // Recalcular cada 30 segundos
  }

  getSlaRemainingTime(): { text: string; class: string; expired: boolean } {
    return { text: this.slaRemainingText, class: this.slaRemainingClass, expired: this.slaRemainingExpired };
  }

  getSlaHoursEstimate(): number {
    return this.slaFormattedHours;
  }
}