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
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
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
    MatButtonModule,
    MatTableModule,
    MatMenuModule
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
  agentLogsData: any[] = [];
  loading = true;
  displayedColumns: string[] = ['name', 'email', 'time', 'actions'];

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

  showGlobalReport = false;
  reportMonth: string = new Date().toISOString().substring(0, 7); // YYYY-MM
  monthName: string = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  daysOfMonth: number[] = [];

  categories: any[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCategories();
    this.fetchStats();
    this.fetchAgentLogs();
    this.calculateReportDays();
  }

  ngAfterViewInit() {
    if (this.statsData && !this.barChart) {
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

  downloadFullReport() {
    const token = this.authService.getToken();
    const url = `${environment.apiUrl}/api/reports/full?token=${token}`;
    window.open(url, '_blank');
  }

  downloadAgentReport(agent: any) {
    const token = this.authService.getToken();
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const url = `${environment.apiUrl}/api/reports/agent/${agent.id}/sessions?token=${token}&month=${yearMonth}`;
    window.open(url, '_blank');
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedPriority = '';
    this.startDate = '';
    this.endDate = '';
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

  openGlobalReport() {
    this.calculateReportDays();
    this.showGlobalReport = true;
  }

  closeGlobalReport() {
    this.showGlobalReport = false;
  }

  calculateReportDays() {
    const [year, month] = this.reportMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    this.daysOfMonth = Array.from({ length: lastDay }, (_, i) => i + 1);
    
    const date = new Date(year, month - 1, 1);
    this.monthName = date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  }

  getDayMinutes(agent: any, day: number): string {
    const dayStr = `${this.reportMonth}-${day.toString().padStart(2, '0')}`;
    const data = agent.connectionData?.[dayStr];
    if (!data || !data.totalMinutes) return '-';
    
    const h = Math.floor(data.totalMinutes / 60);
    const m = data.totalMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  fetchStats() {
    this.loading = true;
    this.statsData = null; // Reiniciar para mostrar carga
    
    let url = `${environment.apiUrl}/api/statistics?`;
    if (this.selectedCategory) url += `category=${this.selectedCategory}&`;
    if (this.selectedPriority) url += `priority=${this.selectedPriority}&`;
    if (this.startDate) url += `startDate=${new Date(this.startDate).toISOString().split('T')[0]}&`;
    if (this.endDate) url += `endDate=${new Date(this.endDate).toISOString().split('T')[0]}&`;

    this.http.get<any>(url, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: (data) => {
        this.statsData = data || { by_status: [], by_agent: [], critical_pending_count: 0 };
        
        let activeCount = 0;
        let resolvedCount = 0;
        
        if (this.statsData.by_status && Array.isArray(this.statsData.by_status)) {
          this.statsData.by_status.forEach((s: any) => {
            if (s.status !== 'Resuelto' && s.status !== 'Cerrado') {
              activeCount += parseInt(s.count) || 0;
            } else {
              resolvedCount += parseInt(s.count) || 0;
            }
          });
          
          const statusNuevo = this.statsData.by_status.find((s: any) => s.status === 'Nuevo');
          this.kpis.open = statusNuevo ? parseInt(statusNuevo.count) : 0;
        }
        
        this.kpis.total = activeCount;
        this.kpis.resolved = resolvedCount;
        this.kpis.criticalPending = this.statsData.critical_pending_count || 0;

        this.loading = false;
        setTimeout(() => this.initCharts(), 100);
      },
      error: (e) => {
        console.error('Error loading stats:', e);
        this.statsData = { by_status: [], by_agent: [], critical_pending_count: 0 };
        this.loading = false;
      }
    });
  }

  fetchAgentLogs() {
    this.http.get<any>(`${environment.apiUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}`, 'Accept': 'application/ld+json' }
    }).subscribe({
      next: (usersRes) => {
        const users = usersRes['hydra:member'] || usersRes['member'] || (Array.isArray(usersRes) ? usersRes : []);
        const agents = users.filter((u: any) => u.roles && (u.roles.includes('ROLE_AGENT') || u.roles.includes('ROLE_ADMIN')));
        
        this.http.get<any>(`${environment.apiUrl}/api/work_logs`, {
          headers: { 'Authorization': `Bearer ${this.authService.getToken()}`, 'Accept': 'application/ld+json' }
        }).subscribe({
          next: (logsRes) => {
            const logs = logsRes['hydra:member'] || logsRes['member'] || (Array.isArray(logsRes) ? logsRes : []);
            
            this.agentLogsData = agents.map((agent: any) => {
              // Ahora calculamos tiempo de CONEXIÓN (connectionData) en lugar de tickets
              const connectionData = agent.connectionData || {};
              const today = new Date().toISOString().split('T')[0];
              const todayData = connectionData[today] || { totalMinutes: 0 };
              
              const totalMinutes = todayData.totalMinutes || 0;
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;

              return {
                ...agent,
                totalMinutes,
                totalHoursFormatted: `${hours}h ${minutes}m (Hoy)`
              };
            });
            this.agentLogsData.sort((a, b) => b.totalMinutes - a.totalMinutes);
          },
          error: (err) => console.error('Error loading work logs:', err)
        });
      },
      error: (err) => console.error('Error loading users:', err)
    });
  }

  initCharts() {
    try {
      if (!this.statsData || !this.pieCanvas || !this.barCanvas) return;

      if (this.pieChart) this.pieChart.destroy();
      if (this.barChart) this.barChart.destroy();

      const allStatuses = ['Nuevo', 'En proceso', 'Resuelto', 'Cerrado'];
      const statusCountsMap: { [key: string]: number } = {};
      
      if (this.statsData && this.statsData.by_status) {
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
            backgroundColor: ['#ff9800', '#2196f3', '#4caf50', '#9e9e9e'],
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

      // --- Gráfico de Barras: Carga por Agente por Día ---
      const dailyData = this.statsData && this.statsData.by_agent_daily ? this.statsData.by_agent_daily : [];
      
      // 1. Obtener todas las fechas únicas (Eje X)
      const uniqueDates = [...new Set(dailyData.map((d: any) => d.date as string))].sort();
      
      // 2. Obtener todos los agentes únicos
      const uniqueAgents = [...new Set(dailyData.map((d: any) => `${d.firstName} ${d.lastName}` as string))];
      
      // 3. Colores para agentes
      const colors = [
        '#764ba2', '#6a11cb', '#2575fc', '#667eea', '#4facfe', 
        '#00f2fe', '#007adf', '#00c6fb', '#50c9c3', '#96deda'
      ];

      // 4. Crear datasets (uno por agente)
      const datasets = uniqueAgents.map((agentName, index) => {
        const agentCounts = uniqueDates.map(date => {
          const entry = dailyData.find((d: any) => `${d.firstName} ${d.lastName}` === agentName && d.date === date);
          return entry ? parseInt(entry.count) : 0;
        });

        return {
          label: agentName,
          data: agentCounts,
          backgroundColor: colors[index % colors.length],
          borderRadius: 4
        };
      });

      this.barChart = new Chart(this.barCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: (uniqueDates as string[]).map(d => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })),
          datasets: datasets as any[]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { 
              stacked: true, // Barras apiladas para ver total y detalle
              beginAtZero: true, 
              ticks: { stepSize: 1, color: textColor }, 
              grid: { color: gridColor } 
            },
            x: { 
              stacked: true,
              ticks: { color: textColor }, 
              grid: { display: false } 
            }
          },
          plugins: {
            legend: { 
              display: true, 
              position: 'bottom',
              labels: { 
                color: textColor,
                boxWidth: 12,
                font: { size: 10 }
              } 
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          }
        }
      });
    } catch (err) {
      console.error('Error al inicializar los gráficos:', err);
    }
  }
}
