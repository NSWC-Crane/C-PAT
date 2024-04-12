/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the 
! Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Import = require('./Controllers/Import');
const { middleware: openApiMiddleware } = require('express-openapi-validator');
const authAPI = require('./utils/authAPI');
const apiSpecPath = path.join(__dirname, './specification/C-PAT.yaml');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/import/poams', upload.single('file'), Import.uploadPoamFile);
router.post('/import/stigmanagercollection', Import.importCollectionAndAssets);
router.post('/import/stigmanagerassets', Import.importAssets);

router.use(
    '/',
    openApiMiddleware({
        apiSpec: apiSpecPath,
        validateRequests: {
            coerceTypes: false,
            allowUnknownQueryParameters: false,
        },
        validateResponses: true,
        validateApiSpec: true,
        $refParser: {
            mode: 'dereference',
        },
        operationHandlers: {
            basePath: path.join(__dirname, 'controllers'),
            resolver: modulePathResolver,
        },
        validateSecurity: {
            handlers: {
                oauth: authAPI.verifyRequest,
            },
        },
    })
);

function modulePathResolver(handlersPath, route, apiDoc) {
    const pathKey = route.openApiRoute.substring(route.basePath.length);
    const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];

    if (!schema || !schema.tags || schema.tags.length === 0) {
        throw new Error(`Invalid schema definition for route [${route.method} ${route.expressRoute}]. Missing or empty tags array.`);
    }

    const controller = schema.tags[0];
    const method = schema['operationId'];

    if (!method) {
        throw new Error(`Invalid schema definition for route [${route.method} ${route.expressRoute}]. Missing operationId.`);
    }

    const modulePath = path.join(handlersPath, controller);
    const handler = require(modulePath);

    if (handler[method] === undefined) {
        throw new Error(`Could not find a [${method}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}].`);
    }

    return handler[method];
}

module.exports = router;