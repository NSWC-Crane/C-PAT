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
const config = require('../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const SmError = require('../utils/error');
const logger = require('../utils/logger');
const { format } = require('date-fns');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getVramDataUpdatedDate = async function getVramDataUpdatedDate(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `SELECT value FROM ${config.database.schema}.config WHERE config.key = 'vramUpdate';`;
            let [vramUpdate] = await connection.query(sql);
            const vramUpdateDate = vramUpdate[0];
            return vramUpdateDate;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getIAVTableData = async function getIAVTableData(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `
    SELECT i.*, GROUP_CONCAT(ip.pluginID) as pluginID
    FROM ${config.database.schema}.iav i
    LEFT JOIN ${config.database.schema}.iav_plugin ip ON i.iav = ip.iav
    GROUP BY i.iav
`;
            let [tableData] = await connection.query(sql);
            let nessusPluginsMapped = null;
            if (tableData.length > 0) {
                const [nessusPluginsUpdated] = await connection.query(
                    `SELECT \`value\` FROM ${config.database.schema}.config WHERE \`key\` = ?`,
                    ['nessusPluginsMapped']
                );
                nessusPluginsMapped = nessusPluginsUpdated.length > 0 ? nessusPluginsUpdated[0].value : null;
            }

            return {
                tableData,
                nessusPluginsMapped,
            };
        });
    } catch (error) {
        return { error: error.message };
    }
};

const validateIAV = iav => /^\d{4}-[A-Z]-\d{4}$/.test(iav);
exports.mapIAVPluginIds = async function mapIAVPluginIds(mappedData) {
    try {
        return await withConnection(async connection => {
            let updatedCount = 0;
            let ignoredCount = 0;
            await connection.beginTransaction();
            try {
                const [existingIAVs] = await connection.query(`SELECT iav FROM ${config.database.schema}.iav`);
                const existingIAVSet = new Set(existingIAVs.map(row => row.iav));

                const iavGroups = mappedData.reduce((acc, { iav, pluginID }) => {
                    if (existingIAVSet.has(iav)) {
                        if (!acc[iav]) acc[iav] = new Set();
                        const pluginIDs = pluginID.split(',').map(id => id.trim());
                        pluginIDs.forEach(id => {
                            const validPluginID = validatePluginID(id);
                            if (validPluginID !== null) {
                                acc[iav].add(validPluginID);
                            } else {
                                logger.writeWarn(`Invalid pluginID: ${id} for IAV: ${iav}`);
                            }
                        });
                    } else {
                        ignoredCount++;
                    }
                    return acc;
                }, {});

                for (const [iav, pluginIDs] of Object.entries(iavGroups)) {
                    await connection.query(`DELETE FROM ${config.database.schema}.iav_plugin WHERE iav = ?`, [iav]);
                    const values = Array.from(pluginIDs).map(pluginID => [iav, pluginID]);
                    if (values.length > 0) {
                        await connection.query(`INSERT INTO ${config.database.schema}.iav_plugin (iav, pluginID) VALUES ?`, [values]);
                    }
                    updatedCount++;
                }

                await connection.commit();

                const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
                await connection.query(
                    `INSERT INTO ${config.database.schema}.config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`,
                    ['nessusPluginsMapped', formattedDate, formattedDate]
                );

                return {
                    message: 'PluginIDs mapped and updated successfully',
                    nessusPluginsMapped: formattedDate,
                    updatedCount,
                    ignoredCount,
                };
            } catch (error) {
                await connection.rollback();
                logger.writeError(`Error in mapIAVPluginIds transaction: ${error.message}`);
                throw error;
            }
        });
    } catch (error) {
        throw new SmError.UnprocessableError('Error in mapIAVPluginIDs');
    }
};

function validatePluginID(pluginID) {
    const numericID = parseInt(pluginID, 10);
    if (Number.isInteger(numericID) && numericID >= 0 && numericID <= 9999999) {
        return numericID;
    }
    return null;
}

exports.getIAVPluginIds = async function getIAVPluginIds(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `SELECT DISTINCT pluginID FROM ${config.database.schema}.iav_plugin`;
            let [pluginIDs] = await connection.query(sql);

            const uniquePluginIDs = [...new Set(pluginIDs.map(row => row.pluginID))];
            const pluginIDList = uniquePluginIDs.join(',');

            return pluginIDList;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getIAVInfoForPlugins = async function getIAVInfoForPlugins(pluginIDs) {
    try {
        if (!Array.isArray(pluginIDs) || pluginIDs.length === 0) {
            logger.writeWarn('No valid plugin IDs provided');
            return [];
        }

        const validPluginIDs = pluginIDs.filter(id => {
            const num = Number(id);
            return !isNaN(num) && num > 0 && Number.isInteger(num);
        });

        if (validPluginIDs.length === 0) {
            logger.writeWarn('No valid plugin IDs provided');
            return [];
        }

        return await withConnection(async connection => {
            const sql = `
                SELECT ip.pluginID, i.iav, i.navyComplyDate, i.supersededBy
                FROM ${config.database.schema}.iav_plugin ip
                JOIN ${config.database.schema}.iav i ON ip.iav = i.iav
                WHERE ip.pluginID IN (?)
                ORDER BY ip.pluginID, i.navyComplyDate DESC
            `;
            const [results] = await connection.query(sql, [validPluginIDs]);
            const latestResults = validPluginIDs
                .map(pluginID => {
                    const entries = results.filter(r => r.pluginID === pluginID);
                    return entries.length > 0 ? entries[0] : null;
                })
                .filter(Boolean);
            return latestResults;
        });
    } catch (error) {
        throw new SmError.UnprocessableError('Failed to fetch IAV info');
    }
};
