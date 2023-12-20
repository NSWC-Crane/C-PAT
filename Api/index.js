/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/


const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = 8086
//const HOST = '130.163.10.80'
const HOST = 'localhost'
var passport = require('passport');

const path = require('path')
const multer = require('multer')
const http = require('http')
const cors = require('cors');
const authAPI = require('./utils/authAPI')
//const server = http.createServer(app)

const { middleware: openApiMiddleware, resolvers } = require('express-openapi-validator')
const eovPath = path.dirname(require.resolve('express-openapi-validator'))
const eovErrors = require(path.join(eovPath, 'framework', 'types.js'))
const config = require('./utils/config')
const { init } = require('./utils/config');

let storage = multer.memoryStorage()
initAuth()
//process.on('uncaughtException', (err, origin) =>{console.log('CAUGHT')})
//process.on('unhandledRejection', (reason, promise) => {console.log('CaughtRejection')})






app.use(cors())
app.use(express.json({
	strict: false, //all root to be any JSON value, per https://datatracker.ietf.org/doc/html/rfc7159#section-2
	limit: parseInt('524288')
}))  //Handle JSON request body


const apiSpecPath = path.join(__dirname,'./specification/poam-manager.yaml')
app.use("/", openApiMiddleware ({
	apiSpec: apiSpecPath,
	validateRequests:{
	coerceTypes:false,
	allowUnknownQueryParameters: false,
	
	},
	validateResponses: true,
	validateApiSpec: true,
	$refParser:{
		mode: 'dereference',
	},
	operationHandlers: {
		basePath: path.join(__dirname, 'controllers'),
		resolver: modulePathResolver
	},
	validateSecurity: {
		handlers:{
		  oauth: authAPI.verifyRequest
		}
	},
	
}))

require('./utils/passport');

async function initAuth(){
	await authAPI.initializeAuth()

}

//app.use((err,req,res,next) =>{
 //format error
//	res.status(err.status || 500).json({
//		message: err.message,
//		errors: err.errors,
//	});
//});


/*
app.listen(

	PORT,
	'0.0.0.0',
	() => console.log(`It's alive on http://${HOST}:${PORT}`)


)
*/

	let db = require(`./Services/${config.database.type}/utils`)
	try{
		db.initializeDatabase();
	}
	catch (e){
		console.log(e)
	}

	const server = http.createServer(app).listen(PORT,() => console.log(`It's alive on http://${HOST}:${PORT}`))




function modulePathResolver(handlersPath, route, apiDoc)
{
	const pathKey = route.openApiRoute.substring(route.basePath.length);
	const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];
	//const [controller, method] = schema ['operationID'].split('.');
	const controller = schema.tags[0]
	const method = schema['operationId']
	const modulePath = path.join(handlersPath, controller)
	const handler = require(modulePath);
	if(handler[method] === undefined){
		throw new Error(`Could not find a [${method}] function in ${modulePath} when tyring to route [${route.method} ${route.expressRoute}]. Pathkey: ${pathKey} Schema: ${schema} Controller: ${controller} method: ${method} ModulePath: ${modulePath} Handler: ${handler}`,);

	}


	return handler[method];


}
