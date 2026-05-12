import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ThemeService } from '../../services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class ProfilePage implements OnInit {
  user: any = null;
  profileImage: string | null = null;
  isDarkMode = true;

  // Cambiar contraseña
  showPasswordForm = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changingPassword = false;
  hideCurrentPwd = true;
  hideNewPwd = true;
  hideConfirmPwd = true;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastCtrl: ToastController,
    public themeService: ThemeService
  ) { }

  ngOnInit() {
    this.isDarkMode = this.themeService.getDarkMode();
    
    this.route.queryParams.subscribe(params => {
      const targetUserId = params['userId'];
      if (targetUserId) {
        // Cargar el perfil de otro usuario (modo administrador)
        this.userService.getUserById(targetUserId).subscribe({
          next: (userData) => {
            this.user = userData;
            this.profileImage = localStorage.getItem('profile_image_' + this.user?.email);
          },
          error: (err) => {
            console.error('Error al cargar perfil de usuario:', err);
            this.showToast('No se pudo cargar el perfil solicitado', 'danger');
            this.loadCurrentUser();
          }
        });
      } else {
        this.loadCurrentUser();
      }
    });
  }

  private loadCurrentUser() {
    const user = this.authService.getUser();
    if (user && user.id) {
      this.userService.getUserById(user.id).subscribe(userData => {
        this.user = userData;
        this.profileImage = localStorage.getItem('profile_image_' + this.user?.email);
      });
    } else {
      this.user = user;
      this.profileImage = localStorage.getItem('profile_image_' + this.user?.email);
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.getDarkMode();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result;
        localStorage.setItem('profile_image_' + this.user?.email, this.profileImage!);
      };
      reader.readAsDataURL(file);
    }
  }

  async changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.showToast('Rellena todos los campos', 'warning');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showToast('Las contraseñas nuevas no coinciden', 'warning');
      return;
    }

    if (this.newPassword.length < 8) {
      this.showToast('La contraseña debe tener al menos 8 caracteres', 'warning');
      return;
    }

    this.changingPassword = true;

    // Obtener el ID del usuario desde el JWT
    const userId = this.user?.id || this.user?.sub;

    if (!userId) {
      this.showToast('No se pudo identificar al usuario', 'danger');
      this.changingPassword = false;
      return;
    }

    const payload = {
      password: this.newPassword
    };

    this.http.patch(
      `${environment.apiUrl}/users/${userId}`,
      JSON.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/merge-patch+json',
          'Accept': 'application/ld+json',
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      }
    ).subscribe({
      next: () => {
        this.changingPassword = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.showPasswordForm = false;
        this.showToast('¡Contraseña actualizada correctamente!', 'success');
      },
      error: (err) => {
        this.changingPassword = false;
        const msg = err.error?.detail || err.error?.['hydra:description'] || 'Error al cambiar la contraseña';
        this.showToast(msg, 'danger');
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      color,
      position: 'top',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    toast.present();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
