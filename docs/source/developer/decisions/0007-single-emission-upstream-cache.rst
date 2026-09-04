.. _adr-0007:

0007: Upstream reads use a single-emission, cache-first client cache
####################################################################

:Status: accepted
:Date: 2026-08-18

Context
==========================

Reads from :term:`STIG Manager` and :term:`Tenable.sc` are slow, and the dashboards and grids request the same data repeatedly as a user moves between views. A stale-while-revalidate design that emits the cached value and then the fresh one was considered: it keeps views current, but every consumer would have to handle two emissions, and under OnPush with generation counters the second emission is a source of subtle bugs.

Decision
==========================

``DataCacheService`` caches upstream responses in memory for up to 30 minutes, at most 40 entries and 64 MB of serialized JSON, with least-recently-used eviction. A cached method emits exactly once: the cached value if there is one, otherwise the fresh response. When the cached entry is more than a minute old, a background refresh updates it for the next subscriber. Concurrent requests for a key share one HTTP call. Whether a request is cached is decided by a URL prefix guard in ``SharedService`` and ``IntegrationService``, never by convention, and nothing from C-PAT's own API is cached. Methods whose callers need current data accept a ``useCache`` opt-out, and a ``cacheable`` predicate keeps Tenable errors delivered as HTTP 200 out of the cache. The double-emission variant was rejected and is not to be reintroduced.

Consequences
==========================

* Consumers see ordinary single-emission observables.
* A view can show data up to 30 minutes old by design; exports and verification actions must pass the opt-out.
* Components that reload on input change need a generation counter, because a cached response returns before an older network response.
* The cache is cleared on logout.

Embodied in ``client/src/app/common/services/data-cache.service.ts``, ``client/src/app/common/services/shared.service.ts``, and ``client/src/app/pages/integrations/integration.service.ts``.
