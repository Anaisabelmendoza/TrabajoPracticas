import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-admin-control',
  templateUrl: './admin-control.page.html',
  styleUrls: ['./admin-control.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule
  ]
})
export class AdminControlPage implements OnInit {
  constructor() {}
  ngOnInit() {}
}
