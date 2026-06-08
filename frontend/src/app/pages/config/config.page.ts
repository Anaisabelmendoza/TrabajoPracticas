import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatTableModule
  ]
})
export class ConfigPage implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Variables para Categorías
  categories: any[] = [];
  newCategoryName: string = '';
  displayedColumns: string[] = ['id', 'name', 'actions'];

  // Variables para Prioridades
  priorities: any[] = [];
  newPriorityName: string = '';

  loading: boolean = false;

  ngOnInit() {
    this.loadCategories();
    this.loadPriorities();
  }

  loadCategories() {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${environment.apiUrl}/api/categories`, { headers }).subscribe({
      next: (res) => {
        this.categories = res['hydra:member'] || res['member'] || (Array.isArray(res) ? res : []);
      },
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadPriorities() {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${environment.apiUrl}/api/priorities`, { headers }).subscribe({
      next: (res) => {
        this.priorities = res['hydra:member'] || res['member'] || (Array.isArray(res) ? res : []);
      },
      error: (err) => console.error('Error loading priorities', err)
    });
  }

  // Lógica de Categorías
  addCategory() {
    if (this.newCategoryName.trim()) {
      const token = this.authService.getToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const body = { name: this.newCategoryName.trim() };

      this.http.post(`${environment.apiUrl}/api/categories`, body, { headers }).subscribe({
        next: (res) => {
          this.loadCategories();
          this.newCategoryName = '';
        },
        error: (err) => console.error('Error adding category', err)
      });
    }
  }

  deleteCategory(id: number) {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.delete(`${environment.apiUrl}/api/categories/${id}`, { headers }).subscribe({
      next: () => this.loadCategories(),
      error: (err) => console.error('Error deleting category', err)
    });
  }

  // Lógica de Prioridades
  newPrioritySla: number = 24;

  addPriority() {
    if (this.newPriorityName.trim()) {
      const token = this.authService.getToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const body = { name: this.newPriorityName.trim(), slaHours: this.newPrioritySla };

      this.http.post(`${environment.apiUrl}/api/priorities`, body, { headers }).subscribe({
        next: (res) => {
          this.loadPriorities();
          this.newPriorityName = '';
          this.newPrioritySla = 24;
        },
        error: (err) => console.error('Error adding priority', err)
      });
    }
  }

  deletePriority(id: number) {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.delete(`${environment.apiUrl}/api/priorities/${id}`, { headers }).subscribe({
      next: () => this.loadPriorities(),
      error: (err) => console.error('Error deleting priority', err)
    });
  }

  editCategory(cat: any) {
    console.log('Edit category:', cat);
    // Próximamente: Lógica de edición
  }
}
