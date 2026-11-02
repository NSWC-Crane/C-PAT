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

const DAY_SECONDS = 24 * 60 * 60;
const PROTOCOL_NUMBERS = { 1: 'ICMP', 6: 'TCP', 17: 'UDP' };

/** Tenable filters that have no Nessus Professional equivalent. */
const UNSUPPORTED_FILTERS = new Set([
    'asset',
    'auditFile',
    'policy',
    'responsibleUser',
    'assetCriticalityRating',
    'assetExposureScore',
    'aesSeverity',
    'acceptRiskStatus',
    'recastRiskStatus',
    'dataFormat',
    'cgiScanEnabled',
    'paranoidScanEnabled',
    'thoroughScanEnabled',
    'wasVuln',
    'wasInputName',
    'wasInputType',
    'wasHttpMethod',
    'wasURL',
    'vulnUUID',
    'cvssV4ThreatScore',
    'cvssV4ThreatVector',
    'cvssV4Supplemental',
]);

function tokens(value) {
    if (Array.isArray(value)) return value.map(v => (v && typeof v === 'object' ? v.id : v)).map(String);

    return String(value ?? '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
}

function negate(operator, predicate) {
    return operator === '!=' ? f => !predicate(f) : predicate;
}

const MAX_PATTERN_LENGTH = 256;
/** Quantified groups or stacked quantifiers are the shapes that backtrack catastrophically. */
const UNSAFE_PATTERN = /\)[*+{]|[*+}][*+]/;

/** Compiles a caller-supplied pattern, refusing ones that could stall the event loop. */
function regex(pattern, flags = 'i') {
    if (pattern.length > MAX_PATTERN_LENGTH || UNSAFE_PATTERN.test(pattern)) return null;

    try {
        return new RegExp(pattern, flags);
    } catch {
        return null;
    }
}

function wildcardToRegex(pattern) {
    return regex(`^${pattern.split('*').map(escapeRegex).join('.*')}$`);
}

function escapeRegex(text) {
    return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function textMatcher(operator, value, getter) {
    if (operator === 'pcre') {
        const re = regex(String(value));

        return f => (re ? re.test(getter(f)) : false);
    }

    const needles = tokens(value).map(t => t.toLowerCase());
    const exact = operator === '=' || operator === '!=';
    const match = f => {
        const haystack = String(getter(f) || '').toLowerCase();

        return needles.some(n => (exact ? haystack === n : haystack.includes(n)));
    };

    return negate(operator, match);
}

function containsMatcher(operator, value, getter) {
    const needles = tokens(value).map(t => t.toLowerCase());

    return negate(operator, f => {
        const haystack = String(getter(f) || '').toLowerCase();

        return needles.some(n => haystack.includes(n));
    });
}

function ipToInt(ip) {
    const parts = ip.split('.').map(Number);

    if (parts.length !== 4 || parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return null;

    return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function ipRange(token) {
    if (token.includes('/')) {
        const [base, bits] = token.split('/');
        const start = ipToInt(base);
        const prefix = Number(bits);

        if (start === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;

        const size = 2 ** (32 - prefix);
        const from = Math.floor(start / size) * size;

        return [from, from + size - 1];
    }

    if (token.includes('-')) {
        const [a, b] = token.split('-').map(ipToInt);

        return a === null || b === null ? null : [Math.min(a, b), Math.max(a, b)];
    }

    const single = ipToInt(token);

    return single === null ? null : [single, single];
}

function ipMatcher(operator, value) {
    const ranges = tokens(value).map(ipRange).filter(Boolean);

    return negate(operator, f => {
        const ip = ipToInt(f.host.ip);

        return ip !== null && ranges.some(([from, to]) => ip >= from && ip <= to);
    });
}

function numberMatcher(operator, value, getter) {
    const wanted = tokens(value).map(Number);

    switch (operator) {
        case '>=':
            return f => getter(f) >= wanted[0];
        case '<=':
            return f => getter(f) <= wanted[0];
        default:
            return negate(operator, f => wanted.includes(getter(f)));
    }
}

function rangeMatcher(value, getter) {
    if (String(value).toLowerCase() === 'none') {
        return f => getter(f) === '' || getter(f) === null || getter(f) === undefined;
    }

    const [min, max] = String(value).split('-').map(Number);

    return f => {
        const raw = getter(f);

        if (raw === '' || raw === null || raw === undefined) return false;

        const n = Number(raw);

        return n >= min && n <= max;
    };
}

function startOfMonth(d, offset = 0) {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1) / 1000;
}

function startOfQuarter(d, offset = 0) {
    const quarterMonth = Math.floor(d.getUTCMonth() / 3) * 3;

    return Date.UTC(d.getUTCFullYear(), quarterMonth + offset * 3, 1) / 1000;
}

function startOfYear(d, offset = 0) {
    return Date.UTC(d.getUTCFullYear() + offset, 0, 1) / 1000;
}

/**
 * Tenable date grammar: "a:b" is between a and b days ago ("all" for no upper
 * bound), named periods, "none" for absent dates, "All" for anything.
 */
function dateWindow(value, nowSeconds) {
    const text = String(value ?? '').trim();
    const now = new Date(nowSeconds * 1000);

    if (!text || text.toLowerCase() === 'all') return null;

    if (text.includes(':')) {
        const [fromDays, toDays] = text.split(':');
        const to = nowSeconds - (Number(fromDays) || 0) * DAY_SECONDS;
        const from = toDays === 'all' ? Number.NEGATIVE_INFINITY : nowSeconds - Number(toDays) * DAY_SECONDS;

        return [from, to];
    }

    switch (text) {
        case 'currentMonth':
            return [startOfMonth(now), nowSeconds];
        case 'lastMonth':
            return [startOfMonth(now, -1), startOfMonth(now)];
        case 'currentQuarter':
            return [startOfQuarter(now), nowSeconds];
        case 'lastQuarter':
            return [startOfQuarter(now, -1), startOfQuarter(now)];
        case 'currentYear':
            return [startOfYear(now), nowSeconds];
        case 'lastYear':
            return [startOfYear(now, -1), startOfYear(now)];
        default:
            return undefined;
    }
}

function dateMatcher(value, getter, nowSeconds) {
    if (String(value).toLowerCase() === 'none') {
        return f => !getter(f) || getter(f) === '-1';
    }

    const window = dateWindow(value, nowSeconds);

    if (window === null) return () => true;
    if (window === undefined) return null;

    const [from, to] = window;

    return f => {
        const ts = Number(getter(f));

        return ts > 0 && ts >= from && ts <= to;
    };
}

function xrefMatcher(operator, value, types) {
    const patterns = tokens(value).map(token => {
        const [type, pattern] = token.includes('|') ? token.split('|') : [null, token];

        return { type: type ? type.toUpperCase() : null, re: wildcardToRegex(pattern.toUpperCase()) };
    });

    return negate(operator, f =>
        f.plugin.xrefs.some(ref => {
            if (types && !types.includes(ref.type)) return false;

            return patterns.some(p => (!p.type || p.type === ref.type) && p.re?.test(ref.value.toUpperCase()));
        })
    );
}

function pluginTypeMatcher(value) {
    switch (String(value)) {
        case 'active':
            return f => f.plugin.family.type !== 'compliance';
        case 'compliance':
            return f => f.plugin.family.type === 'compliance';
        case 'all':
            return () => true;
        default:
            return () => false;
    }
}

function protocolMatcher(value) {
    const wanted = tokens(value).map(t => (PROTOCOL_NUMBERS[t] || t).toUpperCase());

    return f => wanted.includes(f.protocol);
}

const PLUGIN_DATE_FIELDS = {
    patchPublished: 'patchPubDate',
    pluginPublished: 'pluginPubDate',
    pluginModified: 'pluginModDate',
    vulnPublished: 'vulnPubDate',
    seolDate: 'seolDate',
};

const PLUGIN_RANGE_FIELDS = {
    vprScore: 'vprScore',
    baseCVSSScore: 'baseScore',
    cvssV3BaseScore: 'cvssV3BaseScore',
    cvssV4BaseScore: 'cvssV4BaseScore',
    epssScore: 'epssScore',
};

const PLUGIN_TEXT_FIELDS = {
    cpe: 'cpe',
    cvssVector: 'cvssVector',
    cvssV3Vector: 'cvssV3Vector',
    cvssV4Vector: 'cvssV4Vector',
    exploitFrameworks: 'exploitFrameworks',
};

const XREF_FIELDS = {
    xref: null,
    cveID: ['CVE'],
    iavmID: ['IAVA', 'IAVB', 'IAVT'],
    msbulletinID: ['MSFT', 'MSKB'],
    cceID: ['CCE'],
};

function buildPredicate(filter, nowSeconds) {
    const { filterName, operator = '=', value } = filter;

    if (filterName in PLUGIN_DATE_FIELDS) {
        return dateMatcher(value, f => f.plugin[PLUGIN_DATE_FIELDS[filterName]], nowSeconds);
    }
    if (filterName in PLUGIN_RANGE_FIELDS) {
        return rangeMatcher(value, f => f.plugin[PLUGIN_RANGE_FIELDS[filterName]]);
    }
    if (filterName in PLUGIN_TEXT_FIELDS) {
        return containsMatcher(operator, value, f => f.plugin[PLUGIN_TEXT_FIELDS[filterName]]);
    }
    if (filterName in XREF_FIELDS) {
        return xrefMatcher(operator, value, XREF_FIELDS[filterName]);
    }

    switch (filterName) {
        case 'pluginID':
            return negate(
                operator,
                (
                    ids => f =>
                        ids.has(f.pluginID)
                )(new Set(tokens(value)))
            );
        case 'pluginName':
            return operator === 'pcre' || operator === '!='
                ? textMatcher(operator, value, f => f.plugin.name)
                : containsMatcher(operator, value, f => f.plugin.name);
        case 'pluginText':
            return operator === 'pcre' ? textMatcher(operator, value, f => f.pluginOutput) : containsMatcher(operator, value, f => f.pluginOutput);
        case 'family':
            return (
                wanted => f =>
                    wanted.has(f.plugin.family.id) || wanted.has(f.plugin.family.name)
            )(new Set(tokens(value)));
        case 'severity':
            return numberMatcher(operator, value, f => f.severity);
        case 'exploitAvailable':
            return f => (f.plugin.exploitAvailable === 'true') === ['true', 'yes'].includes(String(value).toLowerCase());
        case 'ip':
            return ipMatcher(operator, value);
        case 'dnsName':
            return operator === '~' || operator === 'pcre'
                ? operator === 'pcre'
                    ? textMatcher(operator, value, f => f.host.dnsName)
                    : containsMatcher('=', value, f => f.host.dnsName)
                : textMatcher(operator, value, f => f.host.dnsName);
        case 'netbiosName':
            return operator === '~=' ? containsMatcher('=', value, f => f.host.netbiosName) : textMatcher(operator, value, f => f.host.netbiosName);
        case 'operatingSystem':
            return containsMatcher(operator, value, f => f.host.operatingSystem);
        case 'hostUUID':
            return textMatcher(operator, value, f => f.host.hostUUID);
        case 'uuid':
            return textMatcher(operator, value, f => f.host.uuid);
        case 'port':
            return numberMatcher(operator, value, f => f.port);
        case 'protocol':
            return protocolMatcher(value);
        case 'stigSeverity':
            return textMatcher(operator, value, f => f.plugin.stigSeverity);
        case 'pluginType':
            return pluginTypeMatcher(value);
        case 'lastSeen':
            return dateMatcher(value, f => f.lastSeen, nowSeconds);
        case 'firstSeen':
            return dateMatcher(value, f => f.firstSeen, nowSeconds);
        case 'mitigatedStatus':
            return String(value) === 'previously' ? () => false : () => true;
        default:
            return null;
    }
}

/**
 * Compiles Tenable-style analysis filters into a single predicate over
 * normalized findings. Unsupported filters are skipped and reported.
 */
function compileFilters(filters = [], { nowSeconds = Math.floor(Date.now() / 1000) } = {}) {
    const predicates = [];
    const warnings = [];
    let scanIds = [];

    for (const filter of filters) {
        if (!filter?.filterName) continue;

        if (filter.filterName === 'repository') {
            scanIds = tokens(filter.value);
            continue;
        }

        if (UNSUPPORTED_FILTERS.has(filter.filterName)) {
            warnings.push(`The ${filter.filterName} filter is not supported for Nessus Professional and was ignored.`);
            continue;
        }

        const predicate = buildPredicate(filter, nowSeconds);

        if (predicate) predicates.push(predicate);
        else warnings.push(`The ${filter.filterName} filter value was not understood and was ignored.`);
    }

    return {
        scanIds,
        warnings,
        predicate: finding => predicates.every(p => p(finding)),
    };
}

module.exports = { compileFilters, UNSUPPORTED_FILTERS, dateWindow, ipRange };
