import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class NgrokInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('ngrok-free.dev') || req.url.includes('ngrok.io')) {
      const cloned = req.clone({
        headers: req.headers.set('ngrok-skip-browser-warning', 'true')
      });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}
