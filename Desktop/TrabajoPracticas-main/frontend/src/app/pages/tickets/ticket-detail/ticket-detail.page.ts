import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TicketService } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
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
export class TicketDetailPage implements OnInit {
  ticket: any = null;
  newComment = '';
  loading = true;
  isAgent = false;
  isEditingDescription = false;
  editedDescription = '';
  commentFile: File | null = null;
  commentFilePreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const editMode = this.route.snapshot.queryParamMap.get('edit') === 'true';
    if (id) {
      this.loadTicket(parseInt(id));
    }
    if (editMode) {
      this.isEditingDescription = true;
    }
  }

  ionViewWillEnter() {
    this.isAgent = this.authService.hasRole('ROLE_AGENT') || this.authService.hasRole('ROLE_ADMIN');
  }

  isOwner(): boolean {
    if (!this.ticket) return false;
    const user = this.authService.getUser();
    // En el JWT de API Platform, el ID del usuario suele estar en el campo 'id' o similar
    // Depende de lo que devuelva el Authorizer. 
    // Compararemos por username/email si no tenemos el ID, o buscaremos el ID.
    return user && (user.username === this.ticket.author.email || user.email === this.ticket.author.email);
  }

  loadTicket(id: number) {
    this.loading = true;
    this.ticketService.getTicket(id).subscribe({
      next: (data) => {
        this.ticket = data;
        if (this.isEditingDescription) {
          this.editedDescription = this.ticket.description;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading ticket', err);
        this.loading = false;
      }
    });
  }

  claimTicket() {
    if (!this.ticket) return;
    
    this.loading = true;
    this.ticketService.claimTicket(this.ticket.id).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.loading = false;
        this.showToast('¡Ticket asignado! Ahora eres el responsable.', 'success');
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

  updateStatus(newStatus: string) {
    if (!this.ticket) return;
    this.ticketService.updateTicket(this.ticket.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.showToast(`Estado cambiado a: ${newStatus}`, 'success');
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

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  getServerUrl() {
    return 'http://localhost:8000';
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

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'nuevo': return 'primary';
      case 'en proceso': return 'warning';
      case 'resuelto': return 'success';
      case 'cerrado': return 'medium';
      default: return 'primary';
    }
  }
}
