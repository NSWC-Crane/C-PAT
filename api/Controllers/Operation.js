/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const operationService = require('../Services/operationService');
const config = require('../utils/config');
const SmError = require('../utils/error.js');

module.exports.getConfiguration = async function getConfiguration(req, res, next) {
    try {
        let dbConfigs = await operationService.getConfiguration();
        let version = { version: config.version };
        let response = { ...version, ...dbConfigs };
        res.json(response);
    } catch (err) {
        next(err);
    }
};

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

module.exports.getDefinition = async function getDefinition(req, res, next) {
    try {
        let jsonpath = req.query.jsonpath;
        if (jsonpath) {
            res.json(JSONPath(jsonpath, config.definition));
        } else {
            res.json(config.definition);
        }
    } catch (err) {
        next(err);
    }
};

module.exports.getAppInfo = async function getAppInfo(req, res, next) {
    try {
        let elevate = req.query.elevate;
        if (elevate) {
            const response = await operationService.getAppInfo();
            res.json(response);
        } else {
            throw new SmError.PrivilegeError();
        }
    } catch (err) {
        next(err);
    }
};
