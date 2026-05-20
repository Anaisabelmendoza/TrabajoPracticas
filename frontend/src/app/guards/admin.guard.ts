import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router, private toastCtrl: ToastController) {}

  async showDeniedToast() {
    const toast = await this.toastCtrl.create({
      message: 'Acceso denegado. Se requieren permisos de Administrador.',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    toast.present();
  }

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.hasRole('ROLE_ADMIN')) {
      return true;
    }
    
    this.showDeniedToast();
    return this.router.parseUrl('/dashboard');
  }
}
