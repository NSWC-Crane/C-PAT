/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const operationService = require('../Services/operationService');
const config = require('../utils/config');

module.exports.getConfiguration = async function getConfiguration(req, res, next) {
    try {
        let dbConfigs = await operationService.getConfiguration()
        let version = { version: config.version }
        let commit = { commit: config.commit }
        let response = { ...version, ...dbConfigs }
        res.json(response)
    }
    catch (err) {
        next(err);
    }
}

module.exports.setConfigurationItem = async function setConfigurationItem(req, res, next) {
    try {
        const { key, value } = req.body;
        if (!key || !value) {
            return res.status(400).json({ error: 'Key and value are required.' });
        }

        await operationService.setConfigurationItem(key, value);
        res.json({ message: 'Configuration item updated successfully.' });

    } catch (err) {
        next(err);
    }
};

module.exports.deleteConfigurationItem = async function deleteConfigurationItem(req, res, next) {
    try {
        const { key } = req.params;

        if (!key) {
            return res.status(400).json({ error: 'Key is required.' });
        }

        await operationService.deleteConfigurationItem(key);
        res.json({ message: 'Configuration item deleted successfully.' });
    } catch (err) {
        next(err);
    }
};