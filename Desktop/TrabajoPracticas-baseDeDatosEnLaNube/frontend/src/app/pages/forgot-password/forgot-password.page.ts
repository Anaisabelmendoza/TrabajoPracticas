import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ]
})
export class ForgotPasswordPage {
  step: number = 1;
  emailForm: FormGroup;
  codeForm: FormGroup;
  resetForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  sendCode() {
    if (this.emailForm.invalid) return;
    this.loading = true;
    this.http.post(`${environment.apiUrl}/forgot-password`, this.emailForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.step = 2;
        this.showToast('Código enviado (usa 123456 para la prueba)', 'success');
      },
      error: () => {
        this.loading = false;
        this.showToast('Error al enviar el código', 'danger');
      }
    });
  }

  verifyCode() {
    if (this.codeForm.get('code')?.value === '123456') {
      this.step = 3;
    } else {
      this.showToast('Código incorrecto. Prueba con 123456', 'danger');
    }
  }

  resetPassword() {
    if (this.resetForm.invalid) return;
    this.loading = true;
    const data = {
      email: this.emailForm.get('email')?.value,
      code: this.codeForm.get('code')?.value,
      password: this.resetForm.get('password')?.value
    };

    this.http.post(`${environment.apiUrl}/reset-password`, data).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('Contraseña actualizada con éxito', 'success');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.showToast('Error al actualizar la contraseña', 'danger');
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }
}
