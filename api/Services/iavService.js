/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

'use strict';
const config = require('../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const SmError = require('../utils/error');
const logger = require('../utils/logger');

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
        return await withConnection(async (connection) => {
            let sql = "SELECT value FROM cpat.config WHERE config.key = 'vramUpdate';";
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
        return await withConnection(async (connection) => {
            let sql = `
    SELECT i.*, GROUP_CONCAT(ip.pluginID) as pluginID
    FROM cpat.iav i
    LEFT JOIN cpat.iav_plugin ip ON i.iav = ip.iav
    GROUP BY i.iav
`;
            let [tableData] = await connection.query(sql);
            return tableData;
        });
    } catch (error) {
        return { error: error.message };
    }
};

const validateIAV = (iav) => /^\d{4}-[A-Z]-\d{4}$/.test(iav);
exports.mapIAVPluginIds = async function mapIAVPluginIds(mappedData) {
    try {
        return await withConnection(async (connection) => {
            let updatedCount = 0;
            let ignoredCount = 0;
            await connection.beginTransaction();
            try {
                const [existingIAVs] = await connection.query("SELECT iav FROM iav");
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
                    await connection.query("DELETE FROM iav_plugin WHERE iav = ?", [iav]);
                    const values = Array.from(pluginIDs).map(pluginID => [iav, pluginID]);
                    if (values.length > 0) {
                        await connection.query("INSERT INTO iav_plugin (iav, pluginID) VALUES ?", [values]);
                    }
                    updatedCount++;
                }

                await connection.commit();
                return {
                    message: 'PluginIDs mapped and updated successfully',
                    updatedCount,
                    ignoredCount
                };
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
    } catch (error) {
        return { error: error.message };
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
        return await withConnection(async (connection) => {
            let sql = `SELECT DISTINCT pluginID FROM cpat.iav_plugin`;
            let [pluginIDs] = await connection.query(sql);

            const uniquePluginIDs = [...new Set(pluginIDs.map(row => row.pluginID))];
            const pluginIDList = uniquePluginIDs.join(',');

            return pluginIDList;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getIAVInfoForPlugins = async function getIAVInfoForPlugins(encodedPluginIDs) {
    try {
        const decodedPluginIDs = decodeURIComponent(encodedPluginIDs).split(',');

        const validPluginIDs = decodedPluginIDs
            .map(id => id.trim())
            .filter(id => {
                const num = Number(id);
                const isValid = !isNaN(num) && num > 0 && Number.isInteger(num);
                return isValid;
            });

        if (validPluginIDs.length === 0) {
            logger.writeWarn('No valid plugin IDs provided');
            return [];
        }

        return await withConnection(async (connection) => {
            const sql = `
                SELECT ip.pluginID, i.iav, i.navyComplyDate
                FROM cpat.iav_plugin ip
                JOIN cpat.iav i ON ip.iav = i.iav
                WHERE ip.pluginID IN (?)
                ORDER BY ip.pluginID, i.navyComplyDate DESC
            `;

            const [results] = await connection.query(sql, [validPluginIDs]);

            const latestResults = validPluginIDs.map(pluginID => {
                const entries = results.filter(r => {
                    const match = r.pluginID.toString() === pluginID.toString();
                    return match;
                });
                return entries.length > 0 ? entries[0] : null;
            }).filter(Boolean);

            return latestResults;
        });
    } catch (error) {
        throw new SmError.UnprocessableError('Failed to fetch IAV info');
    }
};