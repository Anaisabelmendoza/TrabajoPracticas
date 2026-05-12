import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.page.html',
  styleUrls: ['./user-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MatTableModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    FormsModule,
    MatTabsModule,
    MatMenuModule
  ]
})
export class UserManagementPage implements OnInit {
  users: User[] = [];
  admins: User[] = [];
  agents: User[] = [];
  clients: User[] = [];
  loading = true;
  displayedColumns: string[] = ['name', 'email', 'status', 'duty', 'connected', 'actions'];

  selectedAgentForMetrics: User | null = null;
  selectedUserForCategories: User | null = null;
  allCategories: any[] = [];
  agentChart: any = null;
  saving = false;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private alertController: AlertController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadAllCategories();
  }

  loadAllCategories() {
    const tokenStr = localStorage.getItem('auth_token');
    this.http.get<any>(`${environment.apiUrl}/api/categories`, {
      headers: { 'Authorization': `Bearer ${tokenStr}` }
    }).subscribe(res => {
      this.allCategories = res['hydra:member'] || res['member'] || (Array.isArray(res) ? res : []);
    });
  }

  openCategoryManager(user: User) {
    this.selectedUserForCategories = { ...user };
    // Normalizar categorías para que sean IDs simples si vienen como objetos
    if (this.selectedUserForCategories.categories) {
      this.selectedUserForCategories.categories = this.selectedUserForCategories.categories.map(c => 
        typeof c === 'string' ? c : c['@id'] || `/api/categories/${c.id}`
      );
    } else {
      this.selectedUserForCategories.categories = [];
    }
  }

  isCategorySelected(catId: number): boolean {
    if (!this.selectedUserForCategories?.categories) return false;
    const uri = `/api/categories/${catId}`;
    return this.selectedUserForCategories.categories.includes(uri);
  }

  toggleCategory(catId: number) {
    if (!this.selectedUserForCategories) return;
    const uri = `/api/categories/${catId}`;
    const index = this.selectedUserForCategories.categories!.indexOf(uri);
    
    if (index > -1) {
      this.selectedUserForCategories.categories!.splice(index, 1);
    } else {
      this.selectedUserForCategories.categories!.push(uri);
    }
  }

  saveCategories() {
    if (!this.selectedUserForCategories) return;
    this.saving = true;
    
    this.userService.updateUser(this.selectedUserForCategories.id, {
      categories: this.selectedUserForCategories.categories
    }).subscribe({
      next: () => {
        this.snackBar.open('Categorías actualizadas correctamente', 'Cerrar', { duration: 3000 });
        this.loadUsers(); // Recargar para ver cambios
        this.selectedUserForCategories = null;
        this.saving = false;
      },
      error: (err) => {
        console.error('Error al guardar categorías:', err);
        this.snackBar.open('Error al guardar los cambios', 'Cerrar', { duration: 3000 });
        this.saving = false;
      }
    });
  }

  closeCategoryManager() {
    this.selectedUserForCategories = null;
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        console.log('Usuarios cargados:', users);
        if (Array.isArray(users)) {
          this.users = users;
          this.categorizeUsers();
        } else {
          console.error('La respuesta no es un array:', users);
          this.users = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.snackBar.open('Error al cargar agentes', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  categorizeUsers() {
    this.admins = this.users.filter(u => u.roles && u.roles.includes('ROLE_ADMIN'));
    this.agents = this.users.filter(u => u.roles && u.roles.includes('ROLE_AGENT') && !u.roles.includes('ROLE_ADMIN'));
    this.clients = this.users.filter(u => !u.roles || (!u.roles.includes('ROLE_AGENT') && !u.roles.includes('ROLE_ADMIN')));
  }

  toggleActive(user: any) {
    const newState = !user.isActive;
    this.userService.updateUser(user.id, { isActive: newState }).subscribe({
      next: () => {
        user.isActive = newState;
        this.snackBar.open(`Usuario ${newState ? 'activado' : 'desactivado'} correctamente`, 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Error al actualizar acceso al sistema', 'Cerrar', { duration: 3000 });
      }
    });
  }

  toggleDuty(user: any) {
    const newState = !user.isOnDuty;
    this.userService.updateUser(user.id, { isOnDuty: newState }).subscribe({
      next: () => {
        user.isOnDuty = newState;
        this.snackBar.open(`Agente marcado como ${newState ? 'disponible' : 'fuera de servicio'}`, 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Error al actualizar disponibilidad', 'Cerrar', { duration: 3000 });
      }
    });
  }

  isConnected(user: any): boolean {
    if (!user.lastActivityAt) return false;
    const lastActivity = new Date(user.lastActivityAt);
    const now = new Date();
    const diff = (now.getTime() - lastActivity.getTime()) / 1000 / 60; // diff in minutes
    return diff < 15; // Consider connected if active in the last 15 minutes
  }

  async confirmDelete(user: User) {
    const alert = await this.alertController.create({
      header: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar a ${user.firstName || 'este usuario'}? Esta acción no se puede deshacer. Los tickets en los que haya participado se mantendrán en el historial (se mostrarán sin agente).`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: () => {
            this.deleteUser(user);
          } 
        }
      ]
    });
    await alert.present();
  }

  deleteUser(user: User) {
    this.loading = true;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('Usuario eliminado correctamente', 'Cerrar', { duration: 3000 });
        this.loadUsers(); // Reload the lists
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  closeMetrics() {
    this.selectedAgentForMetrics = null;
    if (this.agentChart) {
      this.agentChart.destroy();
      this.agentChart = null;
    }
  }

  openMetrics(user: User) {
    this.selectedAgentForMetrics = user;
    this.snackBar.open('Cargando métricas...', '', { duration: 1500 });
    
    const tokenStr = localStorage.getItem('auth_token');
    
    this.http.get<any>(`${environment.apiUrl}/api/work_logs?agent=/api/users/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${tokenStr}`,
        'Accept': 'application/ld+json'
      }
    }).subscribe({
      next: (res) => {
        const logs = res['hydra:member'] || res['member'] || (Array.isArray(res) ? res : []);
        this.drawChart(logs);
      },
      error: (err) => {
        console.error('Error cargando métricas:', err);
        this.snackBar.open('No se pudieron cargar los registros. Revisa el backend.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  drawChart(logs: any[]) {
    // Agrupar por fecha
    const hoursByDate: { [key: string]: number } = {};
    
    // Rellenar ultimos 7 días con 0 por defecto
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      hoursByDate[dateStr] = 0;
    }

    logs.forEach(log => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      if (hoursByDate[dateStr] !== undefined) {
        hoursByDate[dateStr] += log.minutesSpent / 60; // Convertir a horas
      } else {
        hoursByDate[dateStr] = log.minutesSpent / 60;
      }
    });

    const labels = Object.keys(hoursByDate).sort();
    const data = labels.map(l => hoursByDate[l]);

    setTimeout(() => {
      const canvas = document.getElementById('agentMetricsCanvas') as HTMLCanvasElement;
      if (!canvas) return;

      if (this.agentChart) {
        this.agentChart.destroy();
      }

      this.agentChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Horas Trabajadas',
            data: data,
            backgroundColor: '#1976d2',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Horas' }
            }
          }
        }
      });
    }, 100);
  }
}
