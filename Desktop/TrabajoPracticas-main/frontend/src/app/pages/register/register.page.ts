import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    RouterModule
  ]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      userType: ['cliente', [Validators.required]],
      workerCode: [''], // Se validará manualmente
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() { }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  async onRegister() {
    const isWorker = this.registerForm.get('userType')?.value === 'trabajador';
    const workerCode = this.registerForm.get('workerCode')?.value;

    if (isWorker && workerCode !== 'AGENT2026') { // aqui se asigna el codigo de agente
      this.showPopup('Código de Agente incorrecto. Contacta con tu supervisor.', 'danger');
      return;
    }

    if (this.registerForm.invalid) {
      if (this.registerForm.get('password')?.errors?.['pattern']) {
        this.showPopup('La contraseña debe tener: 8+ caracteres, Mayúscula, Número y Símbolo', 'danger');
      } else if (this.registerForm.hasError('mismatch')) {
        this.showPopup('Las contraseñas no coinciden', 'warning');
      } else {
        this.showPopup('Por favor, rellena todos los campos obligatorios', 'warning');
      }
      return;
    }

    const { confirmPassword, ...formValues } = this.registerForm.value;

    const userData = {
      email: formValues.email,
      password: formValues.password,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      roles: formValues.userType === 'trabajador' ? ['ROLE_AGENT'] : ['ROLE_USER']
    };

    const loading = await this.loadingCtrl.create({ message: 'Registrando cuenta...' });
    await loading.present();

    this.authService.register(userData).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.showPopup('¡Usuario registrado con éxito!', 'success');
        this.router.navigate(['/login']);
      },
      error: async (err) => {
        await loading.dismiss();
        const errorMessage = err.error?.detail || err.error?.['hydra:description'] || 'Error en el servidor';
        this.showPopup('Error: ' + errorMessage, 'danger');
      }
    });
  }

  async showPopup(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      color,
      position: 'top',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    toast.present();
  }
}