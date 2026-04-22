import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TicketService } from '../../../services/ticket.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-new-ticket',
  templateUrl: './new-ticket.page.html',
  styleUrls: ['./new-ticket.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class NewTicketPage implements OnInit {
  ticketForm: FormGroup;
  categories: any[] = [];
  loading = false;
  selectedFiles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private http: HttpClient
  ) {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: [null, Validators.required],
      priority: ['Media', Validators.required]
    });
  }

  ngOnInit() {
    this.ticketService.getCategories().subscribe(data => {
      this.categories = data;
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

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedFiles.push({
            file: file,
            preview: e.target.result
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  async onSubmit() {
    if (this.ticketForm.valid) {
      this.loading = true;

      // 1. SUBIR ARCHIVOS PRIMERO
      const uploadObservables = this.selectedFiles.map(item => {
        return this.ticketService.uploadFile(item.file);
      });

      const uploadFlow = uploadObservables.length > 0 ? forkJoin(uploadObservables) : of([]);

      uploadFlow.pipe(
        switchMap((uploadResponses: any[]) => {
          const filePaths = uploadResponses.map(res => res.path);
          
          // 2. CREAR TICKET CON LOS ATTACHMENTS
          const ticketData = {
            ...this.ticketForm.value,
            category: `/api/categories/${this.ticketForm.value.category}`,
            attachments: filePaths
          };

          return this.ticketService.createTicket(ticketData);
        })
      ).subscribe({
        next: async () => {
          this.loading = false;
          const toast = await this.toastCtrl.create({
            message: 'Incidencia creada con evidencias',
            duration: 3000,
            color: 'success'
          });
          toast.present();
          this.navCtrl.navigateBack('/tickets');
        },
        error: (err) => {
          this.loading = false;
          console.error('Error detallado:', err);
          let errorMsg = 'Error al enviar la incidencia';
          
          if (err.status === 401) {
            errorMsg = 'No autorizado. Por favor, inicia sesión de nuevo.';
          } else if (err.error && err.error.detail) {
            errorMsg = err.error.detail;
          } else if (err.error && err.error.error) {
            errorMsg = err.error.error;
          }
          
          this.showToast(errorMsg, 'danger');
        }
      });
    }
  }
}
