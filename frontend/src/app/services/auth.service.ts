import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/login_check`, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    const user = this.getUser();
    return !!user;
  }

  register(userData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/register`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
  }

  getUser(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const parsedData = JSON.parse(jsonPayload);
      
      // Comprobar expiración del token
      if (parsedData.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (parsedData.exp < currentTime) {
          console.warn('El token JWT ha expirado. Limpiando credenciales locales...');
          this.logout();
          return null;
        }
      }

      return parsedData;
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user && user.roles ? user.roles.includes(role) : false;
  }
}
