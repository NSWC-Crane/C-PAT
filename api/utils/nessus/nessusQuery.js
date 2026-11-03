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

function sortValue(row, field) {
    const value = row[field];

    if (value && typeof value === 'object') {
        return value.id ?? value.name ?? '';
    }

    return value ?? '';
}

function compare(a, b) {
    const na = Number.parseFloat(a);
    const nb = Number.parseFloat(b);

    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;

    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
}

/**
 * Sorts and paginates normalized rows the way Tenable.sc's analysis endpoint
 * does: sortField/sortDir at the top level win over query.sortColumn/sortDirection,
 * and startOffset/endOffset slice the sorted result.
 */
function applyQuery(rows, body = {}) {
    const query = body.query || {};
    const sortField = body.sortField || query.sortColumn;
    const descending = String(body.sortDir || query.sortDirection || 'desc').toLowerCase() === 'desc';
    const sorted = sortField ? [...rows].sort((a, b) => (descending ? -1 : 1) * compare(sortValue(a, sortField), sortValue(b, sortField))) : rows;

    const start = Math.max(0, Number.parseInt(query.startOffset, 10) || 0);
    const end = Number.isFinite(Number.parseInt(query.endOffset, 10)) ? Number.parseInt(query.endOffset, 10) : sorted.length;
    const results = sorted.slice(start, end);

    return {
        totalRecords: String(sorted.length),
        returnedRecords: results.length,
        startOffset: String(start),
        endOffset: String(end),
        results,
    };
}

module.exports = { applyQuery };
