import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-control',
  templateUrl: './admin-control.page.html',
  styleUrls: ['./admin-control.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule
  ]
})
export class AdminControlPage implements OnInit {
  isSyncing = false;

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  syncEmails() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    this.http.post<any>(`${environment.apiUrl}/api/sync-emails`, {}, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: (res) => {
        const count = res.created || 0;
        this.isSyncing = false;
        this.showToast(`Sincronización finalizada. ${count} tickets nuevos.`, 'success');
      },
      error: (err) => {
        this.isSyncing = false;
        console.error(err);
        this.showToast('Error al sincronizar correos: ' + (err.error?.error || 'Error desconocido'), 'danger');
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color
    });
    toast.present();
  }
}
