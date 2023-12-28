// Ensure no other code will write to the console
const _log = console.log
exports.writeLog = async function writeLog(level, component, type, modifiedById, modifiedByName, data) {
    // _log({message: "writeLog (Service) Method called successfully"})
    try {
        const date = new Date().toISOString()
        _log(JSON.stringify({date, level, component, type, modifiedById, modifiedByName, data}))  
      }
      catch (e) {
        const date = new Date().toISOString()
        _log(JSON.stringify({date, level:1, component:'logger', type:'error', data: { message: e.message, stack: e.stack}}))  
      }
}
