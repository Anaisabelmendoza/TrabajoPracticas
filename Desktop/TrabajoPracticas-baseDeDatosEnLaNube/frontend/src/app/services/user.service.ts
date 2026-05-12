import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive?: boolean;
  isOnDuty?: boolean;
  lastActivityAt?: string;
  categories?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Accept': 'application/ld+json',
      'Content-Type': 'application/ld+json'
    });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => response['hydra:member'] || response['member'] || (Array.isArray(response) ? response : []))
    );
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`,
        'Content-Type': 'application/merge-patch+json'
      })
    });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    });
  }

  getAgents(): Observable<User[]> {
    return this.getUsers().pipe(
      map(users => users.filter(u => u.roles.includes('ROLE_AGENT') && !u.roles.includes('ROLE_ADMIN')))
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
