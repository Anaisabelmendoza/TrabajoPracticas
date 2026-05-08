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

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadUsers();
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

  toggleActive(user: User) {
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

  toggleDuty(user: User) {
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

  isConnected(user: User): boolean {
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
}
