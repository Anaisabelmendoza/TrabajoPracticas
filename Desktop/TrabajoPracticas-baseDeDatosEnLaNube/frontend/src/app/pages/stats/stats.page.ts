import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
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
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
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
  startDate: string = '';
  endDate: string = '';

  kpis: any = {
    total: 0,
    open: 0,
    criticalPending: 0,
    resolved: 0
  };

  categories: any[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
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
    this.http.get<any>(`${environment.apiUrl}/api/categories`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).subscribe(res => {
      this.categories = res['member'] || res['hydra:member'] || [];
    });
  }

  onFilterChange() {
    this.fetchStats();
  }

  searchTickets() {
    this.router.navigate(['/stats/drilldown/search'], {
      queryParams: {
        category: this.selectedCategory,
        priority: this.selectedPriority,
        startDate: this.startDate,
        endDate: this.endDate
      }
    });
  }

  fetchStats() {
    this.loading = true;
    let url = `${environment.apiUrl}/api/statistics?`;
    if (this.selectedCategory) {
      url += `category=${this.selectedCategory}&`;
    }
    if (this.selectedPriority) {
      url += `priority=${this.selectedPriority}&`;
    }
    if (this.startDate) {
      const start = new Date(this.startDate);
      url += `startDate=${start.toISOString().split('T')[0]}&`;
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      url += `endDate=${end.toISOString().split('T')[0]}&`;
    }

    this.http.get<any>(url, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: (data) => {
        this.statsData = data;
        
        let activeCount = 0;
        let resolvedCount = 0;
        if (data.by_status) {
          data.by_status.forEach((s: any) => {
            if (s.status !== 'Resuelto' && s.status !== 'Cerrado') {
              activeCount += parseInt(s.count);
            } else {
              resolvedCount += parseInt(s.count);
            }
          });
        }
        this.kpis.total = activeCount;
        this.kpis.resolved = resolvedCount;
        
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
        console.error('Error del servidor:', e);
        alert('Error cargando estadísticas. Verifica tu conexión o el estado del backend.');
        this.loading = false;
      }
    });
  }

  initCharts() {
    try {
      if (!this.statsData || !this.pieCanvas || !this.barCanvas) return;

    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();

    // Pie Chart: Status (Mostramos TODOS los posibles aunque estén en 0)
    const allStatuses = ['Nuevo', 'En proceso', 'Resuelto', 'Cerrado'];
    const statusCountsMap: { [key: string]: number } = {};
    
    if (this.statsData.by_status) {
      this.statsData.by_status.forEach((item: any) => {
        statusCountsMap[item.status] = parseInt(item.count) || 0;
      });
    }

    const statusLabels = allStatuses;
    const statusValues = allStatuses.map(status => statusCountsMap[status] || 0);

    const isDarkTheme = document.body.classList.contains('dark-theme');
    const textColor = isDarkTheme ? '#ffffff' : '#666666';
    const gridColor = isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

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
          legend: { position: 'bottom', labels: { color: textColor } }
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
          y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } },
          x: { ticks: { color: textColor }, grid: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
    } catch (err) {
      console.error('Error al inicializar los gráficos:', err);
    }
  }
}
