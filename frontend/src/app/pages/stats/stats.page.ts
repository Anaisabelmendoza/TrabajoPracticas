import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule
  ]
})
export class StatsPage implements OnInit, AfterViewInit {
  @ViewChild('pieCanvas') private pieCanvas!: ElementRef;
  @ViewChild('barCanvas') private barCanvas!: ElementRef;

  pieChart: any;
  barChart: any;

  statsData: any = null;
  loading = true;

  // Filtros interactivos
  selectedCategory: number | '' = '';
  selectedPriority: string = '';

  kpis = {
    total: 0,
    open: 0,
    criticalPending: 0
  };

  categories: any[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.loadCategories();
    this.fetchStats();
  }

  ngAfterViewInit() {
    // Si la data llego muy rapido, dibuja. Si no, `fetchStats` lo hara.
    if (this.statsData && !this.pieChart) {
      this.initCharts();
    }
  }

  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).subscribe(res => {
      this.categories = res['member'] || res['hydra:member'] || [];
    });
  }

  onFilterChange() {
    this.fetchStats();
  }

  fetchStats() {
    this.loading = true;
    let url = `${environment.apiUrl}/statistics?`;
    if (this.selectedCategory) {
      url += `category=${this.selectedCategory}&`;
    }
    if (this.selectedPriority) {
      url += `priority=${this.selectedPriority}`;
    }

    this.http.get<any>(url, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: (data) => {
        this.statsData = data;
        
        let activeCount = 0;
        if (data.by_status) {
          data.by_status.forEach((s: any) => {
            if (s.status !== 'Resuelto' && s.status !== 'Cerrado') {
              activeCount += parseInt(s.count);
            }
          });
        }
        this.kpis.total = activeCount;
        
        const statusNuevo = data.by_status.find((s: any) => s.status === 'Nuevo');
        this.kpis.open = statusNuevo ? parseInt(statusNuevo.count) : 0;

        this.kpis.criticalPending = data.critical_pending_count || 0;

        this.loading = false;
        
        // Timeout to ensure canvas exists in DOM if it was hidden by *ngIf="loading"
        setTimeout(() => {
          this.initCharts();
        }, 100);
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      }
    });
  }

  initCharts() {
    if (!this.statsData || !this.pieCanvas || !this.barCanvas) return;

    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();

    // Pie Chart: Status
    const statusLabels = this.statsData.by_status.map((item: any) => item.status);
    const statusValues = this.statsData.by_status.map((item: any) => parseInt(item.count));

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{
          data: statusValues,
          backgroundColor: [
            '#ff9800', // Nuevo
            '#2196f3', // Proceso
            '#4caf50', // Resuelto
            '#9e9e9e'  // Cerrado
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: 'white' } }
        }
      }
    });

    // Bar Chart: Employees
    const agentLabels = this.statsData.by_agent.map((item: any) => `${item.firstName} ${item.lastName}`);
    const agentValues = this.statsData.by_agent.map((item: any) => parseInt(item.count));

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: agentLabels,
        datasets: [{
          label: 'Incidencias Asignadas',
          data: agentValues,
          backgroundColor: '#764ba2',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { ticks: { color: 'white' }, grid: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
