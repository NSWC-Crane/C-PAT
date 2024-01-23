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

require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 8086;
const HOST = 'localhost';
const passport = require('passport');
const sequelize = require('./utils/sequelize');
const path = require('path');
const multer = require('multer');
const http = require('http');
const cors = require('cors');
const authAPI = require('./utils/authAPI');
const upload = multer({ storage: multer.memoryStorage() });
const Import = require('./Controllers/Import');

const { middleware: openApiMiddleware } = require('express-openapi-validator');
const apiSpecPath = path.join(__dirname, './specification/poam-manager.yaml');
const eovPath = path.dirname(require.resolve('express-openapi-validator'));
const eovErrors = require(path.join(eovPath, 'framework', 'types.js'));
const config = require('./utils/config');

let storage = multer.memoryStorage();
initAuth();

app.use(cors());
app.use(express.json({
    strict: false,
    limit: parseInt('10485760') //JSON request body limited to 10MB
}));

// Define the poamUploadRoutes within index.js
app.post('/api/poamimport', upload.single('file'), Import.uploadPoamFile);

app.use("/", openApiMiddleware({
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
        resolver: modulePathResolver
    },
    validateSecurity: {
        handlers: {
            oauth: authAPI.verifyRequest
        }
    },
}));

app.post('/api/stigmancollectionimport', Import.importCollectionAndAssets);
app.post('/api/stigmanassetimport', Import.importAssets);

require('./utils/passport');

async function initAuth() {
    await authAPI.initializeAuth();
}

let db = require(`./Services/${config.database.type}/utils`);
try {
    db.initializeDatabase();
} catch (e) {
    console.log(e);
}

const server = http.createServer(app).listen(PORT, () => console.log(`It's alive on http://${HOST}:${PORT}`));

function modulePathResolver(handlersPath, route, apiDoc) {
    const pathKey = route.openApiRoute.substring(route.basePath.length);
    const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];
    const controller = schema.tags[0];
    const method = schema['operationId'];
    const modulePath = path.join(handlersPath, controller);
    const handler = require(modulePath);
    if (handler[method] === undefined) {
        throw new Error(`Could not find a [${method}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}]. Pathkey: ${pathKey} Schema: ${schema} Controller: ${controller} method: ${method} ModulePath: ${modulePath} Handler: ${handler}`);
    }
    return handler[method];
}