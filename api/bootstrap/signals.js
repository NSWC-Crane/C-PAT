/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const state = require('../utils/state')
const logger = require('../utils/logger')

module.exports.setupSignalHandlers = () => {
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

  const signalHandler = (signal) => {
    logger.writeInfo('signals','signal', {signal})
    state.setState('stop')
  }

  for (const signal of signals) {
    process.on(signal, signalHandler)
  }
}