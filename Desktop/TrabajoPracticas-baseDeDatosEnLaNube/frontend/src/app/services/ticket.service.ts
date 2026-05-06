import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = environment.apiUrl;

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

  private getAuthHeader() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getTickets(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/api/tickets`, { headers: this.getHeaders() }).pipe(
      map(response => response['member'] || response['hydra:member'] || [])
    );
  }

  getTicket(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/tickets/${id}`, { headers: this.getHeaders() });
  }

  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/tickets`, JSON.stringify(ticketData), { headers: this.getHeaders() });
  }

  addComment(ticketId: number, content: string, attachment: string | null = null): Observable<any> {
    const commentData: any = {
      content: content,
      ticket: `/api/tickets/${ticketId}`
    };
    if (attachment) {
      commentData.attachment = attachment;
    }
    return this.http.post<any>(`${this.apiUrl}/api/comments`, JSON.stringify(commentData), { headers: this.getHeaders() });
  }

  claimTicket(ticketId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/tickets-claim/${ticketId}`, {}, { headers: this.getHeaders() });
  }

  updateTicket(ticketId: number, data: any): Observable<any> {
    const headers = this.getHeaders().set('Content-Type', 'application/merge-patch+json');
    return this.http.patch<any>(`${this.apiUrl}/api/tickets/${ticketId}`, JSON.stringify(data), { headers });
  }

  deleteTicket(ticketId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/tickets/${ticketId}`, { headers: this.getHeaders() });
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/api/categories`, { headers: this.getHeaders() }).pipe(
      map(response => response['member'] || response['hydra:member'] || [])
    );
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/api/upload`, formData, {
      headers: this.getAuthHeader()
    });
  }
}
