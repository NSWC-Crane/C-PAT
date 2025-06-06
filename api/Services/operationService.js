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
const config = require('../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')
const klona = require('../utils/klona');
const logger = require('../utils/logger');
const os = require('node:os');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getConfiguration = async function () {
    try {
        return await withConnection(async (connection) => {
            let sql = `SELECT * from ${config.database.schema}.config`
            let [rows] = await connection.query(sql)
            let configResult = {}
            for (const row of rows) {
                configResult[row.key] = row.value
            }
            return (configResult)
        });
    }
    catch (err) {
        throw ({ status: 500, message: err.message, stack: err.stack })
    }
}

exports.setConfigurationItem = async function (key, value) {
    try {
        return await withConnection(async (connection) => {
        let sql = `INSERT INTO ${config.database.schema}.config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)`
            await connection.query(sql, [key, value])
        return (true)
        });
    }
    catch (err) {
        throw ({ status: 500, message: err.message, stack: err.stack })
    }
}

exports.deleteConfigurationItem = async function (key) {
    try {
        return await withConnection(async (connection) => {
            let sql = `DELETE FROM ${config.database.schema}.config WHERE \`key\` = ?`;
            await connection.query(sql, [key]);
            return true;
        });
    } catch (err) {
        throw { status: 500, message: err.message, stack: err.stack };
    }
};

exports.getAppInfo = async function () {
    const schema = 'cpat-appinfo-v0.9'
    const sqlUserInfo = `
  select
    ud.userId,
    ud.username,
    ud.created,
    ud.lastAccess,
    coalesce(
      JSON_EXTRACT(ud.lastClaims, "$.${config.oauth.claims.privilegesChainSql}"),
      json_array()
    ) as privileges,
    json_object(
		  "Viewer", sum(case when cg.accessLevel = 1 then 1 else 0 end),
      "Submitter", sum(case when cg.accessLevel = 2 then 1 else 0 end),
		  "Approver", sum(case when cg.accessLevel = 3 then 1 else 0 end),
      "CAT-I Approver", sum(case when cg.accessLevel = 4 then 1 else 0 end)
	  ) as roles
  from
    ${config.database.schema}.user ud
    left join ${config.database.schema}.collectionpermissions cg using (userId)
  group by
	  ud.userId
  `
    const sqlInfoSchema = `
  SELECT
    TABLE_NAME as tableName,
    TABLE_ROWS as tableRows,
    TABLE_COLLATION as tableCollation,
    AVG_ROW_LENGTH as avgRowLength,
    DATA_LENGTH as dataLength,
    INDEX_LENGTH as indexLength,
    AUTO_INCREMENT as autoIncrement,
    CREATE_TIME as createTime,
    UPDATE_TIME as updateTime
  FROM
    information_schema.TABLES
  WHERE
    TABLE_SCHEMA = ?
    and TABLE_TYPE='BASE TABLE'
  ORDER BY
    TABLE_NAME`
    const sqlMySqlVersion = `SELECT VERSION() as version`

    const mySqlVariablesOnly = [
        'innodb_buffer_pool_size',
        'innodb_log_buffer_size',
        'innodb_log_file_size',
        'tmp_table_size',
        'key_buffer_size',
        'max_heap_table_size',
        'temptable_max_mmap',
        'sort_buffer_size',
        'read_buffer_size',
        'read_rnd_buffer_size',
        'join_buffer_size',
        'binlog_cache_size',
        'tmp_table_size',
        'innodb_buffer_pool_instances',
        'innodb_io_capacity',
        'innodb_io_capacity_max',
        'innodb_flush_sync',
        'innodb_io_capacity_max',
        'innodb_lock_wait_timeout',
        'version',
        'version_compile_machine',
        'version_compile_os',
        'long_query_time'
    ]
    const sqlMySqlVariablesValues = `
  SELECT
    variable_name,
    variable_value as value
    FROM
    performance_schema.global_variables
  WHERE
    variable_name IN (${mySqlVariablesOnly.map(v => `'${v}'`).join(',')})
    ORDER by variable_name
  `
    const mySqlStatusOnly = [
        'Bytes_received',
        'Bytes_sent',
        'Handler_commit',
        'Handler_update',
        'Handler_write',
        'Innodb_buffer_pool_bytes_data',
        'Innodb_row_lock_waits',
        'Innodb_rows_read',
        'Innodb_rows_updated',
        'Innodb_rows_inserted',
        'Innodb_row_lock_time_avg',
        'Innodb_row_lock_time_max',
        'Created_tmp_files',
        'Created_tmp_tables',
        'Max_used_connections',
        'Open_tables',
        'Opened_tables',
        'Queries',
        'Select_full_join',
        'Slow_queries',
        'Table_locks_immediate',
        'Table_locks_waited',
        'Threads_created',
        'Uptime'
    ]
    const sqlMySqlStatusValues = `
  SELECT
    variable_name,
    variable_value as value
  FROM
    performance_schema.global_status
  WHERE
    variable_name IN (
        ${mySqlStatusOnly.map(v => `'${v}'`).join(',')}
    )
  ORDER by variable_name
  `
    const [schemaInfoArray] = await dbUtils.pool.query(sqlInfoSchema, [config.database.schema])
    const tables = createObjectFromKeyValue(schemaInfoArray, "tableName")

    const rowCountQueries = []
    for (const table in tables) {
        rowCountQueries.push(dbUtils.pool.query(`SELECT "${table}" as tableName, count(*) as rowCount from ${table}`))
    }

    let [
        [userInfo],
        [mySqlVersion],
        [mySqlVariables],
        [mySqlStatus],
        rowCountResults
    ] = await Promise.all([
        dbUtils.pool.query(sqlUserInfo),
        dbUtils.pool.query(sqlMySqlVersion),
        dbUtils.pool.query(sqlMySqlVariablesValues),
        dbUtils.pool.query(sqlMySqlStatusValues),
        Promise.all(rowCountQueries)
    ])

    for (const result of rowCountResults) {
        tables[result[0][0].tableName].rowCount = result[0][0].rowCount
    }

    const cpatPrivs = ['admin', 'cpat_write', 'user']
    for (const user of userInfo) {
        user.privileges = user.privileges.filter(v => cpatPrivs.includes(v))
    }

    const userPrivilegeCounts = breakOutPrivilegeUsage(userInfo)

    const requests = klona(logger.requestStats);
    requests.operationIds = sortObjectByKeys(requests.operationIds);


    const returnObj = {
        date: new Date().toISOString(),
        schema,
        version: config.version,
        requests,
        users: {
            userInfo: createObjectFromKeyValue(userInfo, "userId", null),
            userPrivilegeCounts
        },
        mysql: {
            version: mySqlVersion[0].version,
            tables,
            variables: createObjectFromKeyValue(mySqlVariables, "variable_name", "value"),
            status: createObjectFromKeyValue(mySqlStatus, "variable_name", "value")
        },
        nodejs: getNodeValues()
    }
    return returnObj

    function createObjectFromKeyValue(data, keyPropertyName, valuePropertyName = null, includeKey = false) {
        return data.reduce((acc, item) => {
            const { [keyPropertyName]: key, ...rest } = item
            acc[key] = valuePropertyName ? item[valuePropertyName] : includeKey ? item : rest
            return acc
        }, {})
    }

    function sortObjectByKeys(obj) {
        const sortedObj = {}
        for (const key of Object.keys(obj).sort()) {
            sortedObj[key] = obj[key]
        }
        return sortedObj
    }

    function breakOutPrivilegeUsage(userInfo) {
        let privilegeCounts = {
            overall: { none: 0 },
            activeInLast30Days: { none: 0 },
            activeInLast90Days: { none: 0 }
        }

        const currentTime = Math.floor(Date.now() / 1000)
        const thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60)
        const ninetyDaysAgo = currentTime - (90 * 24 * 60 * 60)
        const updateCounts = (categoryCounts, userPrivs) => {
            if (userPrivs.length === 0) {
                categoryCounts.none++
            }
            for (const privilege of userPrivs) {
                categoryCounts[privilege] = categoryCounts[privilege] ? categoryCounts[privilege] + 1 : 1
            }
        }

        for (const user of userInfo) {
            updateCounts(privilegeCounts.overall, user.privileges)
            if (user.lastAccess >= ninetyDaysAgo) {
                updateCounts(privilegeCounts.activeInLast90Days, user.privileges)
            }
            if (user.lastAccess >= thirtyDaysAgo) {
                updateCounts(privilegeCounts.activeInLast30Days, user.privileges)
            }
        }
        return privilegeCounts
    }

    function getNodeValues() {
        const { environmentVariables, header, resourceUsage } = process.report.getReport()

        const environment = {}
        for (const [key, value] of Object.entries(environmentVariables)) {
            if (/^(NODE|CPAT)_/.test(key)) {
                environment[key] = key === 'CPAT_DB_PASSWORD' ? '***' : value
            }
        }
        const { platform, arch, nodejsVersion, cpus, osMachine, osName, osRelease } = header
        for (let x = 0; x < cpus.length; x++) {
            cpus[x] = { model: cpus[x].model, speed: cpus[x].speed }
        }
        const loadAverage = os.loadavg().join(', ')

        const memory = process.memoryUsage()
        memory.maxRss = resourceUsage.maxRss
        return {
            version: nodejsVersion.substring(1),
            uptime: process.uptime(),
            os: {
                platform,
                arch,
                osMachine,
                osName,
                osRelease,
                loadAverage
            },
            environment,
            memory,
            cpus
        }
    }
}