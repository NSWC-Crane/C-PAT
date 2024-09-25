/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const iavService = require('../Services/iavService')


module.exports.getVramDataUpdatedDate = async function getVramDataUpdatedDate(req, res, next) {
    try {
        const vramUpdatedDate = await iavService.getVramDataUpdatedDate(req, res, next);
            res.status(200).json(vramUpdatedDate);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getIAVTableData = async function getIAVTableData(req, res, next) {
    try {
        const iavTableData = await iavService.getIAVTableData(req, res, next);
        res.status(200).json(iavTableData);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.mapIAVPluginIds = async function mapIAVPluginIds(req, res, next) {
    try {
        const updatedCount = await iavService.mapIAVPluginIds(req.body);
        res.status(200).json({ message: 'PluginIDs mapped updated successfully', updatedCount });
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getIAVPluginIds = async function getIAVPluginIds(req, res, next) {
    try {
        const iavPluginIDs = await iavService.getIAVPluginIds(req, res, next);
        res.status(200).json(iavPluginIDs);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getIAVInfoForPlugins = async function getIAVInfoForPlugins(req, res, next) {
    try {
        const pluginIDs = req.query.pluginIDs;
        const iavInfo = await iavService.getIAVInfoForPlugins(pluginIDs);
        res.status(200).json(iavInfo);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};