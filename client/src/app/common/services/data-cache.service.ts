/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from '@angular/core';
import { Observable, defer, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

interface CacheEntry {
  value: unknown;
  storedAt: number;
  size: number;
}

interface PendingRequest {
  request: Observable<unknown>;
  token: number;
}

@Injectable({ providedIn: 'root' })
export class DataCacheService {
  private static readonly MAX_AGE_MS = 30 * 60 * 1000;
  private static readonly MIN_REFRESH_MS = 60 * 1000;
  private static readonly MAX_ENTRIES = 40;
  private static readonly MAX_BYTES = 64 * 1024 * 1024;

  private readonly entries = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, PendingRequest>();
  private issued = 0;
  private totalBytes = 0;

  observe<T>(key: string, fetcher: () => Observable<T>, cacheable: (value: T) => boolean = () => true): Observable<T> {
    return defer(() => {
      const entry = this.read(key);

      if (!entry) {
        return this.fetch(key, fetcher, cacheable);
      }

      if (Date.now() - entry.storedAt >= DataCacheService.MIN_REFRESH_MS) {
        this.fetch(key, fetcher, cacheable).subscribe({ error: () => undefined });
      }

      return of(entry.value as T);
    });
  }

  keyFor(url: string): string {
    return url;
  }

  keyForBody(url: string, body: unknown): string {
    return `${url}::${this.canonicalize(body)}`;
  }

  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
    this.totalBytes = 0;
  }

  private fetch<T>(key: string, fetcher: () => Observable<T>, cacheable: (value: T) => boolean): Observable<T> {
    const pending = this.inFlight.get(key);

    if (pending) {
      return pending.request as Observable<T>;
    }

    const token = ++this.issued;
    const current = () => this.inFlight.get(key)?.token === token;

    const request = fetcher().pipe(
      tap((value) => {
        if (current() && cacheable(value)) {
          this.write(key, value);
        }
      }),
      finalize(() => {
        if (current()) {
          this.inFlight.delete(key);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.inFlight.set(key, { request, token });

    return request;
  }

  private read(key: string): CacheEntry | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.storedAt >= DataCacheService.MAX_AGE_MS) {
      this.remove(key);

      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry;
  }

  private write(key: string, value: unknown): void {
    const size = this.sizeOf(value);

    this.remove(key);

    if (size > DataCacheService.MAX_BYTES) {
      return;
    }

    this.entries.set(key, { value, storedAt: Date.now(), size });
    this.totalBytes += size;

    while (this.entries.size > DataCacheService.MAX_ENTRIES || this.totalBytes > DataCacheService.MAX_BYTES) {
      const oldest = this.entries.keys().next();

      if (oldest.done) {
        break;
      }

      this.remove(oldest.value);
    }
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);

    if (!entry) {
      return;
    }

    this.entries.delete(key);
    this.totalBytes -= entry.size;
  }

  private sizeOf(value: unknown): number {
    const json = JSON.stringify(value);

    return json ? json.length : 0;
  }

  private canonicalize(value: unknown): string {
    return JSON.stringify(value, (_key, nested) => {
      if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
        return nested;
      }

      const source = nested as Record<string, unknown>;

      return Object.keys(source)
        .sort((a, b) => a.localeCompare(b))
        .reduce<Record<string, unknown>>((sorted, name) => {
          sorted[name] = source[name];

          return sorted;
        }, {});
    });
  }
}
