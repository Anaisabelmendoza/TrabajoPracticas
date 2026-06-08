import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-csat-ratings',
  templateUrl: './csat-ratings.page.html',
  styleUrls: ['./csat-ratings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ]
})
export class CsatRatingsPage implements OnInit {
  private ticketService = inject(TicketService);
  authService = inject(AuthService);

  ratedTickets: any[] = [];
  loading = true;

  // Estadísticas CSAT
  totalRatings = 0;
  averageRating = 0;
  starCounts = [0, 0, 0, 0, 0]; // Índice 0 = 1 estrella, 4 = 5 estrellas
  starPercentages = [0, 0, 0, 0, 0];

  ngOnInit() {
    this.loadRatings();
  }

  loadRatings() {
    this.loading = true;
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        // Filtramos solo los tickets que tienen valoración (rating)
        this.ratedTickets = tickets.filter(t => t.rating !== null && t.rating !== undefined && t.rating > 0);
        
        // Ordenar por fecha de actualización descending (más recientes primero)
        this.ratedTickets.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt).getTime();
          return dateB - dateA;
        });

        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tickets for CSAT:', err);
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.totalRatings = this.ratedTickets.length;
    if (this.totalRatings === 0) {
      this.averageRating = 0;
      this.starCounts = [0, 0, 0, 0, 0];
      this.starPercentages = [0, 0, 0, 0, 0];
      return;
    }

    let sum = 0;
    const counts = [0, 0, 0, 0, 0];

    this.ratedTickets.forEach(t => {
      const r = Math.min(5, Math.max(1, Math.round(t.rating)));
      sum += r;
      counts[r - 1]++;
    });

    this.averageRating = parseFloat((sum / this.totalRatings).toFixed(1));
    this.starCounts = counts;

    // Calcular porcentajes
    for (let i = 0; i < 5; i++) {
      this.starPercentages[i] = parseFloat(((counts[i] / this.totalRatings) * 100).toFixed(0));
    }
  }

  getStarArray(rating: number): number[] {
    const r = Math.round(rating);
    return Array(r).fill(1);
  }

  getEmptyStarArray(rating: number): number[] {
    const r = Math.round(rating);
    return Array(5 - r).fill(1);
  }
}
