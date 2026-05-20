import { Component, OnInit } from '@angular/core';
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
  // Variables para Categorías
  categories: any[] = [
    { id: 1, name: 'Redes' },
    { id: 2, name: 'Software' },
    { id: 3, name: 'Hardware' }
  ];
  newCategoryName: string = '';
  displayedColumns: string[] = ['id', 'name', 'actions'];

  // Variables para Prioridades
  priorities: any[] = [
    { id: 1, name: 'Baja' },
    { id: 2, name: 'Media' },
    { id: 3, name: 'Alta' },
    { id: 4, name: 'Urgente' }
  ];
  newPriorityName: string = '';

  loading: boolean = false;

  constructor() {}

  ngOnInit() {}

  // Lógica de Categorías
  addCategory() {
    if (this.newCategoryName.trim()) {
      const newId = this.categories.length > 0 ? Math.max(...this.categories.map(c => c.id)) + 1 : 1;
      this.categories.push({ id: newId, name: this.newCategoryName.trim() });
      this.newCategoryName = '';
    }
  }

  deleteCategory(id: number) {
    this.categories = this.categories.filter(c => c.id !== id);
  }

  // Lógica de Prioridades
  addPriority() {
    if (this.newPriorityName.trim()) {
      const newId = this.priorities.length > 0 ? Math.max(...this.priorities.map(p => p.id)) + 1 : 1;
      this.priorities.push({ id: newId, name: this.newPriorityName.trim() });
      this.newPriorityName = '';
    }
  }

  deletePriority(id: number) {
    this.priorities = this.priorities.filter(p => p.id !== id);
  }

  editCategory(cat: any) {
    console.log('Edit category:', cat);
    // Próximamente: Lógica de edición
  }
}
