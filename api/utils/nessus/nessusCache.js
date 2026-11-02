/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';

/**
 * Small TTL + LRU cache with single-flight loading, so concurrent requests
 * for the same scan share one export instead of each triggering their own.
 */
class NessusCache {
    constructor({ ttlMs, maxEntries }) {
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
        this.entries = new Map();
        this.pending = new Map();
    }

    get(key) {
        const entry = this.entries.get(key);

        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.entries.delete(key);

            return undefined;
        }

        this.entries.delete(key);
        this.entries.set(key, entry);

        return entry.value;
    }

    set(key, value) {
        this.entries.delete(key);
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });

        while (this.entries.size > this.maxEntries) {
            this.entries.delete(this.entries.keys().next().value);
        }
    }

    delete(key) {
        this.entries.delete(key);
    }

    deleteWhere(predicate) {
        for (const key of [...this.entries.keys()]) {
            if (predicate(key)) this.entries.delete(key);
        }
    }

    values() {
        return [...this.entries.values()].map(entry => entry.value);
    }

    async load(key, loader) {
        const cached = this.get(key);

        if (cached !== undefined) return cached;

        let inflight = this.pending.get(key);

        if (!inflight) {
            inflight = loader()
                .then(value => {
                    this.set(key, value);

                    return value;
                })
                .finally(() => this.pending.delete(key));
            this.pending.set(key, inflight);
        }

        return inflight;
    }
}

module.exports = { NessusCache };
