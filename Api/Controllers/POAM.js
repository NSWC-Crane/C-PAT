/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamService = require('../Services/mysql/poamService');

module.exports.getPoams = async function getPoams(req, res, next) {
    try {
        const poams = await poamService.getPoams(req, res, next);
        res.status(200).json(poams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getPoam = async function getPoam(req, res, next) {
    try {
        const poam = await poamService.getPoam(req, res, next);
            res.status(200).json(poam);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getPoamsByCollectionId = async function getPoamsByCollectionId(req, res, next) {
    try {
        const poams = await poamService.getPoamsByCollectionId(req, res, next);
            res.status(200).json(poams);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getPoamsByOwnerId = async function getPoamsByOwnerId(req, res, next) {
    try {
        const poams = await poamService.getPoamsByOwnerId(req, res, next);
            res.status(200).json(poams);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postPoam = async function postPoam(req, res, next) {
    try {
        const poam = await poamService.postPoam(req, res, next);
        if (poam.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: poam.errors });
        } else if (poam.error) {
            res.status(500).json({ error: 'Internal Server Error', detail: poam.error });
        } else {
            res.status(201).json(poam);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.putPoam = async function putPoam(req, res, next) {
    try {
        const poam = await poamService.putPoam(req, res, next);
        if (poam.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: poam.errors });
        } else if (!poam) {
            res.status(500).json({ error: 'Internal Server Error', detail: 'Failed to update POAM' });
        } else {
            res.status(200).json(poam);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.deletePoam = async function deletePoam(req, res, next) {
    try {
        const result = await poamService.deletePoam(req, res, next);
        if (result.error) {
            res.status(500).json({ error: 'Internal Server Error', detail: result.error });
        } else {
            res.status(204).send();
        }
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};