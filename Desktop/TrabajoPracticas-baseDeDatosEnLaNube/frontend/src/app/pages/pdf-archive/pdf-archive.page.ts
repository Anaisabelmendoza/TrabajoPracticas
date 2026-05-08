import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-pdf-archive',
  templateUrl: './pdf-archive.page.html',
  styleUrls: ['./pdf-archive.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatListModule
  ]
})
export class PdfArchivePage implements OnInit {
  loading = true;
  clientsWithTickets: { client: any, tickets: any[] }[] = [];

  constructor(private ticketService: TicketService) {}

  ngOnInit() {
    this.loadArchivedTickets();
  }

  loadArchivedTickets() {
    this.loading = true;
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        // Filtrar tickets finalizados
        const archived = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado');
        
        // Agrupar por cliente (author)
        const grouped = new Map<number, { client: any, tickets: any[] }>();
        
        archived.forEach(ticket => {
          if (!ticket.author) return;
          if (!grouped.has(ticket.author.id)) {
            grouped.set(ticket.author.id, { client: ticket.author, tickets: [] });
          }
          grouped.get(ticket.author.id)!.tickets.push(ticket);
        });

        this.clientsWithTickets = Array.from(grouped.values());
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tickets for pdf archive', err);
        this.loading = false;
      }
    });
  }
}
