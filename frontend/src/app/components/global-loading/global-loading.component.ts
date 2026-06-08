import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-loading',
  templateUrl: './global-loading.component.html',
  styleUrls: ['./global-loading.component.scss'],
  standalone: false
})
export class GlobalLoadingComponent {
  private loadingService = inject(LoadingService);

  isLoading$: Observable<boolean>;

  constructor() {
    this.isLoading$ = this.loadingService.isLoading$;
  }
}
