/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataCacheService } from './data-cache.service';

describe('DataCacheService', () => {
  let service: DataCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DataCacheService] });
    service = TestBed.inject(DataCacheService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const collect = <T>(source: Observable<T>): { values: T[]; errors: unknown[]; complete: boolean } => {
    const record = { values: [] as T[], errors: [] as unknown[], complete: false };

    source.subscribe({
      next: (value) => record.values.push(value),
      error: (error) => record.errors.push(error),
      complete: () => {
        record.complete = true;
      }
    });

    return record;
  };

  const isCached = (key: string): boolean => [...(service as unknown as { entries: Map<string, unknown> }).entries.keys()].includes(key);
  const cachedValue = (key: string): unknown => (service as unknown as { entries: Map<string, { value: unknown }> }).entries.get(key)?.value;
  const pastRefreshWindow = () => vi.advanceTimersByTime(60 * 1000);

  describe('observe', () => {
    it('emits once when nothing is cached', () => {
      const record = collect(service.observe('a', () => of('fresh')));

      expect(record.values).toEqual(['fresh']);
      expect(record.complete).toBe(true);
    });

    it('emits only the cached value on a second subscription', () => {
      collect(service.observe('a', () => of('first')));

      const record = collect(service.observe('a', () => of('second')));

      expect(record.values).toEqual(['first']);
      expect(record.complete).toBe(true);
    });

    it('refreshes the cache in the background on a hit older than the refresh window', () => {
      vi.useFakeTimers();
      collect(service.observe('a', () => of('first')));
      pastRefreshWindow();
      collect(service.observe('a', () => of('second')));

      expect(cachedValue('a')).toBe('second');
      expect(collect(service.observe('a', () => of('third'))).values).toEqual(['second']);
    });

    it('does not refresh a hit younger than the refresh window', () => {
      vi.useFakeTimers();

      const fetcher = vi.fn(() => of('second'));

      collect(service.observe('a', () => of('first')));
      vi.advanceTimersByTime(59 * 1000);
      collect(service.observe('a', fetcher));

      expect(fetcher).not.toHaveBeenCalled();
      expect(cachedValue('a')).toBe('first');
    });

    it('does not surface a late background refresh to the subscriber that triggered it', () => {
      vi.useFakeTimers();

      const gate = new Subject<string>();

      collect(service.observe('a', () => of('first')));
      pastRefreshWindow();

      const record = collect(service.observe('a', () => gate.asObservable()));

      gate.next('second');
      gate.complete();

      expect(record.values).toEqual(['first']);
      expect(cachedValue('a')).toBe('second');
    });

    it('reads the cache at subscribe time rather than creation time', () => {
      const stream = service.observe('a', () => of('second'));

      collect(service.observe('a', () => of('first')));

      expect(collect(stream).values).toEqual(['first']);
    });

    it('does not invoke the fetcher until subscribed', () => {
      const fetcher = vi.fn(() => of('value'));

      service.observe('a', fetcher);

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('delivers but does not cache a value the predicate rejects', () => {
      const record = collect(
        service.observe(
          'a',
          () => of({ error_msg: 'Session expired' }),
          (value) => !value.error_msg
        )
      );

      expect(record.values).toEqual([{ error_msg: 'Session expired' }]);
      expect(isCached('a')).toBe(false);
    });

    it('fetches again after a rejected value rather than serving it', () => {
      const cacheable = (value: { error_msg?: string }) => !value.error_msg;

      collect(service.observe('a', () => of({ error_msg: 'Session expired' }), cacheable));

      const record = collect(service.observe('a', () => of({ error_msg: '' }), cacheable));

      expect(record.values).toEqual([{ error_msg: '' }]);
      expect(isCached('a')).toBe(true);
    });

    it('keeps the good entry when a background refresh returns a rejected value', () => {
      vi.useFakeTimers();

      const cacheable = (value: { error_msg?: string }) => !value.error_msg;

      collect(service.observe('a', () => of({ error_msg: '' }), cacheable));
      pastRefreshWindow();
      collect(service.observe('a', () => of({ error_msg: 'Session expired' }), cacheable));

      expect(cachedValue('a')).toEqual({ error_msg: '' });
    });
  });

  describe('age gate', () => {
    it('serves a cached value inside thirty minutes', () => {
      vi.useFakeTimers();
      collect(service.observe('a', () => of('first')));

      vi.advanceTimersByTime(29 * 60 * 1000);

      expect(collect(service.observe('a', () => of('second'))).values).toEqual(['first']);
    });

    it('discards a cached value at the thirty minute boundary', () => {
      vi.useFakeTimers();
      collect(service.observe('a', () => of('first')));

      vi.advanceTimersByTime(30 * 60 * 1000);

      expect(collect(service.observe('a', () => of('second'))).values).toEqual(['second']);
    });

    it('restarts the age window when a background refresh lands', () => {
      vi.useFakeTimers();
      collect(service.observe('a', () => of('first')));

      vi.advanceTimersByTime(20 * 60 * 1000);
      collect(service.observe('a', () => of('second')));

      vi.advanceTimersByTime(20 * 60 * 1000);

      expect(collect(service.observe('a', () => of('third'))).values).toEqual(['second']);
    });
  });

  describe('in-flight coalescing', () => {
    it('issues a single request for concurrent subscribers', () => {
      const gate = new Subject<string>();
      const fetcher = vi.fn(() => gate.asObservable());

      const first = collect(service.observe('a', fetcher));
      const second = collect(service.observe('a', fetcher));

      gate.next('value');
      gate.complete();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(first.values).toEqual(['value']);
      expect(second.values).toEqual(['value']);
    });

    it('issues a new request once the previous one settles', () => {
      vi.useFakeTimers();

      const fetcher = vi.fn(() => of('value'));

      collect(service.observe('a', fetcher));
      pastRefreshWindow();
      collect(service.observe('a', fetcher));

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('does not start a second background refresh while one is in flight', () => {
      vi.useFakeTimers();

      const gate = new Subject<string>();
      const fetcher = vi.fn(() => gate.asObservable());

      collect(service.observe('a', () => of('first')));
      pastRefreshWindow();
      collect(service.observe('a', fetcher));
      pastRefreshWindow();
      collect(service.observe('a', fetcher));

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('joins a cache miss to an in-flight background refresh', () => {
      vi.useFakeTimers();

      const gate = new Subject<string>();
      const fetcher = vi.fn(() => gate.asObservable());

      collect(service.observe('a', () => of('first')));
      vi.advanceTimersByTime(29 * 60 * 1000);
      collect(service.observe('a', fetcher));
      vi.advanceTimersByTime(60 * 1000);

      const record = collect(service.observe('a', fetcher));

      gate.next('second');
      gate.complete();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(record.values).toEqual(['second']);
    });

    it('completes the request when an early subscriber unsubscribes', () => {
      const gate = new Subject<string>();
      const subscription = service.observe('a', () => gate.asObservable()).subscribe();

      subscription.unsubscribe();
      gate.next('value');
      gate.complete();

      expect(isCached('a')).toBe(true);
    });
  });

  describe('errors', () => {
    it('surfaces the error when nothing is cached', () => {
      const failure = new Error('upstream down');
      const record = collect(service.observe('a', () => throwError(() => failure)));

      expect(record.errors).toEqual([failure]);
      expect(record.values).toEqual([]);
    });

    it('swallows a failed background refresh and keeps the cached value', () => {
      vi.useFakeTimers();
      collect(service.observe('a', () => of('first')));
      pastRefreshWindow();

      const record = collect(service.observe('a', () => throwError(() => new Error('upstream down'))));

      expect(record.values).toEqual(['first']);
      expect(record.errors).toEqual([]);
      expect(record.complete).toBe(true);
      expect(cachedValue('a')).toBe('first');
    });

    it('never caches a failure', () => {
      collect(service.observe('a', () => throwError(() => new Error('upstream down'))));

      expect(isCached('a')).toBe(false);
    });

    it('retries after a failure rather than replaying it', () => {
      collect(service.observe('a', () => throwError(() => new Error('upstream down'))));

      expect(collect(service.observe('a', () => of('recovered'))).values).toEqual(['recovered']);
    });
  });

  describe('eviction', () => {
    it('drops the least recently used entry beyond the cap', () => {
      for (let index = 0; index < 41; index++) {
        collect(service.observe(`key-${index}`, () => of(index)));
      }

      expect(isCached('key-0')).toBe(false);
      expect(isCached('key-1')).toBe(true);
      expect(isCached('key-40')).toBe(true);
    });

    it('treats a read as a use', () => {
      for (let index = 0; index < 40; index++) {
        collect(service.observe(`key-${index}`, () => of(index)));
      }

      const pending = new Subject<string>();

      collect(service.observe('key-0', () => pending.asObservable()));
      collect(service.observe('overflow', () => of('value')));

      expect(isCached('key-0')).toBe(true);
      expect(isCached('key-1')).toBe(false);
    });

    describe('byte budget', () => {
      const statics = DataCacheService as unknown as { MAX_BYTES: number };
      const originalBudget = statics.MAX_BYTES;
      const payload = (chars: number) => 'x'.repeat(chars - 2);

      beforeEach(() => {
        statics.MAX_BYTES = 100;
      });

      afterEach(() => {
        statics.MAX_BYTES = originalBudget;
      });

      it('drops the least recently used entries once the budget is exceeded', () => {
        collect(service.observe('a', () => of(payload(40))));
        collect(service.observe('b', () => of(payload(40))));
        collect(service.observe('c', () => of(payload(40))));

        expect(isCached('a')).toBe(false);
        expect(isCached('b')).toBe(true);
        expect(isCached('c')).toBe(true);
      });

      it('delivers but does not store a single value larger than the budget', () => {
        const record = collect(service.observe('a', () => of(payload(101))));

        expect(record.values).toHaveLength(1);
        expect(isCached('a')).toBe(false);
      });

      it('releases the bytes of a replaced entry', () => {
        vi.useFakeTimers();
        collect(service.observe('a', () => of(payload(60))));
        vi.advanceTimersByTime(60 * 1000);
        collect(service.observe('a', () => of(payload(10))));
        collect(service.observe('b', () => of(payload(80))));

        expect(isCached('a')).toBe(true);
        expect(isCached('b')).toBe(true);
      });

      it('resets the budget on clear', () => {
        collect(service.observe('a', () => of(payload(90))));
        service.clear();
        collect(service.observe('b', () => of(payload(90))));

        expect(isCached('b')).toBe(true);
      });
    });
  });

  describe('keys', () => {
    it('orders object keys canonically', () => {
      const first = service.keyForBody('/analysis', { tool: 'vuln', filters: { severity: 4, plugin: 19506 } });
      const second = service.keyForBody('/analysis', { filters: { plugin: 19506, severity: 4 }, tool: 'vuln' });

      expect(first).toBe(second);
    });

    it('preserves array order as significant', () => {
      const first = service.keyForBody('/analysis', { filters: ['a', 'b'] });
      const second = service.keyForBody('/analysis', { filters: ['b', 'a'] });

      expect(first).not.toBe(second);
    });

    it('separates different bodies at the same url', () => {
      const first = service.keyForBody('/analysis', { severity: 4 });
      const second = service.keyForBody('/analysis', { severity: 3 });

      expect(first).not.toBe(second);
    });

    it('separates the same body at different urls', () => {
      expect(service.keyForBody('/analysis', { severity: 4 })).not.toBe(service.keyForBody('/solutions', { severity: 4 }));
    });

    it('does not collide a cached body query with a plain url', () => {
      collect(service.observe(service.keyForBody('/analysis', { severity: 4 }), () => of('body')));

      expect(isCached(service.keyFor('/analysis'))).toBe(false);
    });
  });

  describe('clear', () => {
    it('drops cached values and in-flight requests', () => {
      const gate = new Subject<string>();
      const fetcher = vi.fn(() => gate.asObservable());

      collect(service.observe('a', () => of('cached')));
      collect(service.observe('b', fetcher));

      service.clear();
      collect(service.observe('b', fetcher));

      expect(isCached('a')).toBe(false);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('does not let a request that was in flight repopulate the cache', () => {
      const gate = new Subject<string>();

      collect(service.observe('a', () => gate.asObservable()));

      service.clear();

      gate.next('late');
      gate.complete();

      expect(isCached('a')).toBe(false);
    });

    it('still delivers the value to the subscriber that asked for it', () => {
      const gate = new Subject<string>();
      const record = collect(service.observe('a', () => gate.asObservable()));

      service.clear();

      gate.next('late');
      gate.complete();

      expect(record.values).toEqual(['late']);
      expect(isCached('a')).toBe(false);
    });

    it('leaves a request started after the clear able to cache', () => {
      const stale = new Subject<string>();

      collect(service.observe('a', () => stale.asObservable()));
      service.clear();

      const fresh = new Subject<string>();

      collect(service.observe('a', () => fresh.asObservable()));

      stale.next('stale');
      stale.complete();
      fresh.next('fresh');
      fresh.complete();

      expect(collect(service.observe('a', () => of('next'))).values).toEqual(['fresh']);
    });
  });

  describe('superseded requests', () => {
    it('does not let a request cleared mid-flight delete the replacement in-flight entry', () => {
      const stale = new Subject<string>();

      collect(service.observe('a', () => stale.asObservable()));
      service.clear();

      const replacement = new Subject<string>();
      const replacementFetcher = vi.fn(() => replacement.asObservable());

      collect(service.observe('a', replacementFetcher));

      stale.complete();

      const joiner = vi.fn(() => of('third'));

      collect(service.observe('a', joiner));

      expect(joiner).not.toHaveBeenCalled();
    });
  });
});
