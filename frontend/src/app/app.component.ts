import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { NotificationPushService } from './services/notification-push.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private pingInterval: any;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private http: HttpClient,
    private notificationPushService: NotificationPushService
  ) {}

  ngOnInit() {
    // Iniciar monitoreo si ya está logueado
    if (this.authService.isLoggedIn()) {
      this.notificationPushService.startMonitoring();
    }

    // Enviar un "ping" al backend cada 1 minuto para mantener el estado "En línea"
    this.pingInterval = setInterval(() => {
      if (this.authService.isLoggedIn()) {
        // Asegurarse de que el monitoreo esté corriendo
        this.notificationPushService.startMonitoring();

        const user = this.authService.getUser();
        if (user && user.id) {
          // Usamos el endpoint de su propio perfil para actualizar la actividad
          this.http.get(`${environment.apiUrl}/api/users/${user.id}`, {
            headers: new HttpHeaders({
              'Authorization': `Bearer ${this.authService.getToken()}`
            })
          }).subscribe({
            next: () => console.log('Ping enviado - Usuario en línea'),
            error: (err) => {
              if (err.status === 401) {
                // Si da 401, es probable que la cuenta haya sido desactivada
                console.warn('Sesión invalidada. Cerrando sesión...');
                this.notificationPushService.stopMonitoring();
                this.authService.logout();
                window.location.href = '/login'; // Redirigir al login y recargar la aplicación
              }
            }
          });
        }
      } else {
        this.notificationPushService.stopMonitoring();
      }
    }, 60000); // 60,000 ms = 1 minuto
    
    // Sincronización automática de correos cada 2 minutos
    setInterval(() => {
      if (this.authService.isLoggedIn() && this.authService.hasRole('ROLE_ADMIN')) {
        console.log('Iniciando sincronización automática de correos...');
        this.http.post(`${environment.apiUrl}/api/sync-emails`, {}, {
          headers: new HttpHeaders({
            'Authorization': `Bearer ${this.authService.getToken()}`
          })
        }).subscribe({
          next: (res: any) => {
            if (res.created > 0) {
              console.log(`Sincronización automática: ${res.created} tickets nuevos creados.`);
            }
          },
          error: (err) => console.error('Error en sincronización automática:', err)
        });
      }
    }, 120000); // 120,000 ms = 2 minutos
  }

  ngOnDestroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
}
