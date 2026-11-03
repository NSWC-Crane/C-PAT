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
const { XMLParser } = require('fast-xml-parser');

const LIST_TAGS = new Set([
    'ReportHost',
    'ReportItem',
    'tag',
    'cve',
    'bid',
    'xref',
    'see_also',
    'iava',
    'iavb',
    'iavt',
    'msft',
    'mskb',
    'cpe',
    'cert',
    'cwe',
    'osvdb',
    'edb-id',
]);

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    isArray: name => LIST_TAGS.has(name),
});

function text(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return text(value['#text']);

    return String(value);
}

function toList(value) {
    if (value === undefined || value === null) return [];

    return (Array.isArray(value) ? value : [value]).map(text).filter(Boolean);
}

/**
 * Parses a Nessus v2 (.nessus) export into plain host and item records.
 * Attribute and element values are kept as strings; the normalizer owns typing.
 */
function parseNessusXml(xml) {
    const doc = parser.parse(xml);
    const report = doc?.NessusClientData_v2?.Report;

    if (!report) {
        throw new Error('The export is not a NessusClientData_v2 document.');
    }

    const hosts = (report.ReportHost || []).map(reportHost => {
        const properties = {};

        for (const tag of reportHost.HostProperties?.tag || []) {
            if (tag?.name) properties[tag.name] = text(tag);
        }

        const items = (reportHost.ReportItem || []).map(item => {
            const record = {};

            for (const [key, value] of Object.entries(item)) {
                record[key] = LIST_TAGS.has(key) ? toList(value) : text(value);
            }

            return record;
        });

        return { name: text(reportHost.name), properties, items };
    });

    return { reportName: text(report.name), hosts };
}

module.exports = { parseNessusXml };
