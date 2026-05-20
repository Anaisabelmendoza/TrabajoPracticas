import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface WorkLog {
  id?: number;
  ticket: string; // IRI, ej: "/api/tickets/1"
  agent: string;  // IRI, ej: "/api/users/2"
  date?: string;  // Formato YYYY-MM-DD
  minutesSpent: number;
  description?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkLogService {
  private apiUrl = `${environment.apiUrl}/api/work_logs`;

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

  getWorkLogs(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => response['hydra:member'] || response['member'] || (Array.isArray(response) ? response : []))
    );
  }

  createWorkLog(workLog: WorkLog): Observable<any> {
    return this.http.post<any>(this.apiUrl, workLog, { headers: this.getHeaders() });
  }

  deleteWorkLog(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    });
  }
}
