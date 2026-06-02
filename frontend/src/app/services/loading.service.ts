import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  show() {
    if (this.activeRequests === 0) {
      this.isLoadingSubject.next(true);
    }
    this.activeRequests++;
  }

  hide() {
    if (this.activeRequests > 0) {
      this.activeRequests--;
      if (this.activeRequests === 0) {
        this.isLoadingSubject.next(false);
      }
    }
  }

  // Utilizado para cierres forzosos (por ejemplo al cancelar navegación)
  forceHide() {
    this.activeRequests = 0;
    this.isLoadingSubject.next(false);
  }
}
