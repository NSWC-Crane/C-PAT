/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const logger = require('../utils/logger')
const auth = require('../utils/auth')
const db = require('../Services/utils')
const { serializeError } = require('../utils/serializeError')
const state = require('../utils/state')

async function initializeDependencies() {
  try {
      await Promise.all([
          auth.initializeAuth(),
          db.initializeDatabase()
      ])
  }
  catch (e) {
    logger.writeError('dependencies', 'fail', {message:'Unable to setup dependencies'})
    state.setState('fail')
  }
}

module.exports = {
  initializeDependencies
}