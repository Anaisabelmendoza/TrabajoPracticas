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
import { MatTabsModule } from '@angular/material/tabs';

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
    MatListModule,
    MatTabsModule
  ]
})
export class PdfArchivePage implements OnInit {
  loading = true;
  clientsWithActiveTickets: { client: any, tickets: any[] }[] = [];
  clientsWithPdfArchives: { client: any, tickets: any[] }[] = [];

  constructor(private ticketService: TicketService) {}

  ngOnInit() {
    this.loadArchivedTickets();
  }

  loadArchivedTickets() {
    this.loading = true;
    
    // Cargamos tickets activos resueltos y archivos PDF físicos en paralelo
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        const activeArchived = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado');
        
        this.ticketService.getArchivedPdfs().subscribe({
          next: (pdfFiles) => {
            this.processLists(activeArchived, pdfFiles);
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading physical PDFs', err);
            this.processLists(activeArchived, []);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.loading = false;
      }
    });
  }

  processLists(activeTickets: any[], physicalPdfs: any[]) {
    // 1. Agrupar Tickets Activos por Cliente
    const activeGrouped = new Map<string, { clientName: string, items: any[] }>();
    activeTickets.forEach(t => {
      if (!t.author) return;
      const key = t.author.email;
      if (!activeGrouped.has(key)) {
        activeGrouped.set(key, { clientName: `${t.author.firstName} ${t.author.lastName}`, items: [] });
      }
      activeGrouped.get(key)!.items.push({
        id: t.id,
        title: t.title,
        date: t.updatedAt || t.createdAt,
        type: 'db',
        path: `/tickets/${t.id}`
      });
    });

    // 2. Agrupar PDFs Físicos por Cliente
    const pdfGrouped = new Map<string, { clientName: string, items: any[] }>();
    physicalPdfs.forEach(p => {
      const key = p.client;
      if (!pdfGrouped.has(key)) {
        pdfGrouped.set(key, { clientName: p.client, items: [] });
      }
      pdfGrouped.get(key)!.items.push({
        id: null,
        title: p.filename,
        date: p.date,
        type: 'pdf',
        path: p.path
      });
    });

    this.clientsWithActiveTickets = Array.from(activeGrouped.values()).map(g => ({
      client: { firstName: g.clientName, lastName: '' },
      tickets: g.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }));

    this.clientsWithPdfArchives = Array.from(pdfGrouped.values()).map(g => ({
      client: { firstName: g.clientName, lastName: '' },
      tickets: g.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }));
  }

  openPdf(item: any) {
    if (item.type === 'pdf') {
      window.open(this.ticketService.getServerUrl() + item.path, '_blank');
    } else {
      window.location.href = item.path;
    }
  }

  getServerUrl() {
    return this.ticketService.getServerUrl();
  }
}
