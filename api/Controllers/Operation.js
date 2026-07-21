/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const { JSONPath } = require('jsonpath-plus');
const operationService = require('../Services/operationService');
const config = require('../utils/config');
const SmError = require('../utils/error.js');
const { sendError } = require('../utils/respond');

module.exports.getConfiguration = async function getConfiguration(_req, res) {
    try {
        const dbConfigs = await operationService.getConfiguration();

        res.status(200).json({ version: config.version, ...dbConfigs });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.setConfigurationItem = async function setConfigurationItem(req, res) {
    try {
        if (!req.userObject.isAdmin) {
            throw new SmError.PrivilegeError('User has insufficient privilege to modify application configuration.');
        }

        if (!req.body.key || !req.body.value) {
            throw new SmError.ClientError('key and value are required.');
        }

        await operationService.setConfigurationItem(req.body.key, req.body.value);

        res.status(200).json({ message: 'Configuration item updated successfully.' });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteConfigurationItem = async function deleteConfigurationItem(req, res) {
    try {
        if (!req.userObject.isAdmin) {
            throw new SmError.PrivilegeError('User has insufficient privilege to delete application configuration.');
        }

        if (!req.query.key) {
            throw new SmError.ClientError('key is required.');
        }

        await operationService.deleteConfigurationItem(req.query.key);

        res.status(200).json({ message: 'Configuration item deleted successfully.' });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getDefinition = async function getDefinition(req, res) {
    try {
        const jsonpath = req.query.jsonpath;

        res.status(200).json(jsonpath ? JSONPath(jsonpath, config.definition) : config.definition);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAppInfo = async function getAppInfo(req, res) {
    try {
        if (!req.query.elevate || req.userObject.isAdmin !== true) {
            throw new SmError.PrivilegeError('User has insufficient privilege to retrieve application information.');
        }

        const response = await operationService.getAppInfo();

        res.status(200).json(response);
    } catch (error) {
        sendError(res, error);
    }
};
