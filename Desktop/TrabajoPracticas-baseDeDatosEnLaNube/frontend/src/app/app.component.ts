import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

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
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Enviar un "ping" al backend cada 1 minuto para mantener el estado "En línea"
    this.pingInterval = setInterval(() => {
      if (this.authService.isLoggedIn()) {
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
                this.authService.logout();
                window.location.href = '/login'; // Redirigir al login y recargar la aplicación
              }
            }
          });
        }
      }
    }, 60000); // 60,000 ms = 1 minuto
  }

  ngOnDestroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
}
