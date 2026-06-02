import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Ignorar las peticiones en segundo plano para que no salte el spinner
    const url = request.url.toLowerCase();
    const isBackgroundPing = request.method === 'GET' && url.includes('/api/users/');
    const isEmailSync = url.includes('/api/sync-emails');
    const isChatPolling = request.headers.has('X-Silent-Request'); // Por si tenemos polling silencioso

    if (isBackgroundPing || isEmailSync || isChatPolling) {
      return next.handle(request);
    }

    this.loadingService.show();

    return next.handle(request).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    );
  }
}
