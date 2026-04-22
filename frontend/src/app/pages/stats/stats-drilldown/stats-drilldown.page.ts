import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TicketService } from '../../../services/ticket.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stats-drilldown',
  templateUrl: './stats-drilldown.page.html',
  styleUrls: ['./stats-drilldown.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MatCardModule,
    MatIconModule
  ]
})
export class StatsDrilldownPage implements OnInit {
  filterType: string = '';
  pageTitle: string = 'Listado de Incidencias';
  
  // Filtros aplicados desde el Dashboard principal
  filterCategory: string | null = null;
  filterPriority: string | null = null;
  
  tickets: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.filterType = params.get('type') || '';
      this.setupTitle();
      
      // Capturar los filtros que el usuario haya seleccionado en el dashboard anterior
      this.route.queryParamMap.subscribe(queryParams => {
        this.filterCategory = queryParams.get('category');
        this.filterPriority = queryParams.get('priority');
        this.loadTickets();
      });
    });
  }

  setupTitle() {
    switch (this.filterType) {
      case 'active':
        this.pageTitle = 'Incidencias Activas';
        break;
      case 'critical':
        this.pageTitle = 'Críticas Pendientes';
        break;
      case 'unassigned':
        this.pageTitle = 'Nuevas (Sin asignar)';
        break;
      default:
        this.pageTitle = 'Listado de Incidencias';
    }
  }

  loadTickets() {
    this.loading = true;
    this.ticketService.getTickets().subscribe({
      next: (allTickets) => {
        this.tickets = this.filterTickets(allTickets);
        this.loading = false;
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      }
    });
  }

  filterTickets(tickets: any[]): any[] {
    // 1. Primero, aplicar los filtros globales derivados del Dashboard UI
    let filtered = tickets;
    
    if (this.filterCategory) {
      filtered = filtered.filter(t => t.category && t.category.id.toString() === this.filterCategory);
    }
    
    if (this.filterPriority) {
      filtered = filtered.filter(t => t.priority === this.filterPriority);
    }

    // 2. Segundo, aplicar el filtro forzado por la tarjeta clickeada
    switch (this.filterType) {
      case 'active':
        // Activas: ni Resuelto ni Cerrado
        return filtered.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado');
      case 'critical':
        // Críticas Pendientes: Alta o Crítica, y no resueltas
        return filtered.filter(t => 
          (t.priority === 'Alta' || t.priority === 'Crítica') && 
          (t.status !== 'Resuelto' && t.status !== 'Cerrado')
        );
      case 'unassigned':
        // Sin asignar (Nuevas)
        return filtered.filter(t => t.status === 'Nuevo');
      default:
        return filtered;
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'nuevo': return 'primary';
      case 'en proceso': return 'warning';
      case 'resuelto': return 'success';
      case 'cerrado': return 'medium';
      default: return 'primary';
    }
  }
}
