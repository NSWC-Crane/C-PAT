/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const mysql = require('mysql2/promise');
const config = require('../../utils/config')
const fs = require("fs")
const retry = require('async-retry')


const minMySqlVersion = '8.0.14'
let _this = this

let initAttempt = 0
module.exports.testConnection = async function () {
 // logger.writeDebug('mysql', 'preflight', { attempt: ++initAttempt })
  let [result] = await _this.pool.query('SELECT VERSION() as version')
  return result[0].version
}

function getPoolConfig() {
  const poolConfig = {
    connectionLimit : config.database.maxConnections,
    timezone: 'Z',
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    database: config.database.schema,
    decimalNumbers: true,
    typeCast: function (field, next) {
      if ((field.type === "BIT") && (field.length === 1)) {
        let bytes = field.buffer() || [0];
        return( bytes[ 0 ] === 1 );
      }
      return next();
    } 
  }
  if (config.database.password) {
    poolConfig.password = config.database.password
  }
  return poolConfig
}

module.exports.initializeDatabase = async function () {
  // Create the connection pool
  const poolConfig = getPoolConfig()
  console.log('mysql', 'poolConfig', { ...poolConfig })
  _this.pool = mysql.createPool(poolConfig)
  // Set common session variables
  _this.pool.on('connection', function (connection) {
    connection.query('SET SESSION group_concat_max_len=10000000')
  })

  // Call the pool destruction methods on SIGTERM and SEGINT
  async function closePoolAndExit(signal) {
    console.log('app', 'shutdown', { signal })
    try {
      await _this.pool.end()
      console.log('mysql', 'close', { success: true })
      process.exit(0);
    } catch(err) {
      console.log('mysql', 'close', { success: false, message: err.message })
      process.exit(1);
    }
  }   
  process.on('SIGPIPE', closePoolAndExit)
  process.on('SIGHUP', closePoolAndExit)
  process.on('SIGTERM', closePoolAndExit)
  process.on('SIGINT', closePoolAndExit)
  console.log("COMPLETE")

  const detectedMySqlVersion = await retry(_this.testConnection, {
    retries: 24,
    factor: 1,
    minTimeout: 5 * 1000,
    maxTimeout: 5 * 1000,
    onRetry: (error) => {
      console.log('mysql', 'preflight', { success: false, message: error.message })
    }
  })
  
  //if ( semverLt(detectedMySqlVersion, minMySqlVersion) ) 
  // if(detectedMySqlVersion != minMySqlVersion){
  //   console.log('mysql', 'preflight', { success: false, message: `MySQL release ${detectedMySqlVersion} is too old. Update to release ${minMySqlVersion} or later.` })
  //   process.exit(1)
  // } 
  // else {
  //   console.log('mysql', 'preflight', { 
  //     success: true,
  //     version: detectedMySqlVersion
  //     })

  // }


}
