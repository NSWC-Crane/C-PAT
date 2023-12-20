/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/


'use strict';
const config = require('../../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')
const tokenGenerator = require('../../utils/token-generator');
const auth = require('../../utils/auth');


exports.getUserObject = async function getUserObject(body, projection, userObject){
        res.status(201).json({message: "getUser (Service) Method Called successfully"})

        console.log("Require passed")
        var con = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'PTT_Test'
        })
        console.log("Connection Created")

        con.connect(function(err){
                if(err) throw err;
                con.query("INSERT into user(name, id, email)values('Boo', 004, 'spooky4u@navy.gov')")
                console.log('Entry added')
                if(err) throw err;
		})


}

exports.postCreateUser = async function postCreateUser(testUser, body, projection, userObject){

	let connection
	let userName = testUser.name
	let userId = testUser.id
	let userEmail = testUser.email
	let sql_query = `INSERT INTO user (name, id, email) values (?, ?, ?)`
	connection = await dbUtils.pool.getConnection()
	let [row] = await connection.query(sql_query, [userName, userId, userEmail])
        await connection.release()
	const message = new Object()
	message.userName = userName
	message.userId = userId
	message.userEmail = userEmail
	return(message)

}

exports.refresh = async function refresh(userID, body, projection, userOnject) {
	
	let connection
	let sql = 'SELECT * FROM `user` WHERE `userId`=' + userID
	connection = await dbUtils.pool.getConnection()
	let [row] = await connection.query(sql)

	await connection.release() 
	return(row[0])
}

exports.getUserByUserID = async function getUserByUserID(userID, body, projection, userObject){

	let connection
	let sql = 'SELECT * FROM `user` WHERE `userId`=' + userID
	connection = await dbUtils.pool.getConnection()
	let [row] = await connection.query(sql)

	await connection.release() 
	return(row[0])

}

exports.getUsers = async function getUsers(req, res, next){

	let connection
	let sql = "SELECT * FROM poamtracking.user;"
	connection = await dbUtils.pool.getConnection()
	let [rows] = await connection.query(sql)

	await connection.release()

	var size = Object.keys(rows).length

	var users = {
		users: []
	}

	for (let counter = 0; counter < size; counter++) {
		// console.log("Before setting permissions size: ", size, ", counter: ",counter);

		users.users.push({
			"userId": rows[counter].userId,
			"userName": rows[counter].userName,
			"userEmail": rows[counter].userEmail,
			"firstName": rows[counter].firstName,
			"lastName": rows[counter].lastName,
			"created": rows[counter].created,
			"lastAccess": rows[counter].lastAccess,
			"lastCollectionAccessedId": rows[counter].lastCollectionAccessedId,
			"phoneNumber": rows[counter].phoneNumber,
			"password": rows[counter].password,
			"accountStatus": rows[counter].accountStatus,
			"fullName": rows[counter].fullName,
			"defaultTheme": rows[counter].defaultTheme,
			"isAdmin": rows[counter].isAdmin,
		});
		// console.log("After setting permissions size: ", size, ", counter: ",counter);
		// if (counter + 1 >= size) break;
	}

	console.log("getUsers returning: ",users)
	return { users };

}

exports.getUserByNamePassword =  async function getUserByNamePassword(username, password, callback) {
	/**
	 * This User instance will be passed through authentication to the JWT.
	 */
	function loginObj(userId, userName, email, created,lastAccess, firstName, lastName, phoneNumber, 
		lastCollectionAccessedId, defaultTheme)  {
		this.userId = userId
		this.userName = userName,
		this.email = email,
		this.created = created,
		this.lastAccess = lastAccess,
		this.firstName = firstName,
		this.lastName = lastName,
		this.phoneNumber = phoneNumber,
		this.lastCollectionAccessedId = lastCollectionAccessedId,
		this.defaultTheme = defaultTheme,
		this.isAdmin = isAdmin
	}

	//console.log("auth: ",auth)
	try{
		let connection
		let sql = "SELECT * FROM user WHERE userName='" + username + "' and  password='"+ password + "';"
		//let sql = "SELECT * FROM user WHERE userName='tyler.forajter' and  password='password'"
		//console.log("authUserTest sql: ", sql)
		connection = await dbUtils.pool.getConnection()
		let [rowUser] = await connection.query(sql)
		
		let dt = new Date();
		//console.log(dt)
		//console.log("User: " + rowUser[0].userName + " logged in at " + dt)
		let response = new loginObj(rowUser[0].userId,
			rowUser[0].userName,
			rowUser[0].userEmail, 
			rowUser[0].created, 
			(rowUser[0].lastAcces) ? rowUser[0].lastAcces : '',
			rowUser[0].firstName,
			rowUser[0].lastName,
			rowUser[0].phoneNumber,
			rowUser[0].lastCollectionAccessedId,
			rowUser[0].defaultTheme,
			rowUser[0].isAdmin
			);
		await connection.release()
		console.log("getUserByNamePassword callback: ", response)
		return callback(null, response);
		
	}
	catch(error){
		let errorResponse = {null: "null"}
		await connection.release()
		return errorResponse;
	}
  };

exports.updateUser = async function updateUser(req, res, next) {
	// res.status(201).json({message: "updateUser (Service) Method called successfully"})
	console.log("user.js replaceUser req.params: ", req.params.userID)
	let userID = req.body.userID;

	if (!req.body.userEmail) {
		console.info('Post usersService updateUser: email not provided.');
		return next({
			status: 422,
			errors: {
				email: 'is required',
			}
		});
	}

	if (!req.body.userID) {
		console.info('Post usersService updateUser: userID not provided.');
		return next({
			status: 422,
			errors: {
				email: 'is required',
			}
		});
	}

	try {
		let connection
		let sql = "UPDATE user SET firstName = '" + req.body.firstName + 
			"', lastName = '" + req.body.lastName + 
			"', userEmail = '" + req.body.userEmail + 
			"', lastCollectionAccessedId = '" + req.body.lastCollectionAccessedId + 
			"', phoneNumber = '" + req.body.phoneNumber  + 
			"', accountStatus = '" +req.body.accountStatus + 
			"', fullName = '" + req.body.firstName + " " + req.body.lastName + 
			"', defaultTheme = '" +req.body.defaultTheme + 
			"', isAdmin = " +req.body.isAdmin + 
			" WHERE userId=" + userID + ";"
		//console.log("authService login sql: ", sql)
		connection = await dbUtils.pool.getConnection()
		await connection.query(sql);
		//await connection.release()

		sql = "SELECT * from user WHERE userId=" + userID + ";"
		let [rowUser] = await connection.query(sql)
		await connection.release()

		if (rowUser[0] != undefined) {
			console.log("usersService updateUser returning: ", rowUser[0]);
			res.status(201).json(rowUser[0])

		} else {
			return next({
				status: 422,
				errors: {
					message: 'update failed',
				}
			});
		}
	}
	catch (error) {
		console.info('Post authService login: user login failed.', error);
		return next({
			status: 400,
			message: "Login failed"
		});
	}
}

exports.replaceUser = async function replaceUser(req, res, next){

	console.log("user.js replaceUser req.params: ", req.params.userID)
	let userID = req.params.userID

	if (!req.body.userEmail) {
		console.info('Post usersServikce replaceUser: email not provided.');
		return next({
			status: 422,
			errors: {
				email: 'is required',
			}
		});
	}

	if (!req.body.userName) {
		console.info('Post usersServikce replaceUser: userName not provided.');
		return next({
			status: 422,
			errors: {
				email: 'is required',
			}
		});
	}

	if (!req.body.password) {
		console.info('Post usersService replaceUser: password not provided.');
		return next({
			status: 422,
			errors: {
				password: 'is required',
			}
		});
	}

	try {
		let connection
		let sql = "UPDATE user SET firstName = '" + req.body.firstName + "', lastName = '" + 
			req.body.lastName + "', userEmail = '" + req.body.userEmail + "', userName = '" +
			req.body.userName + "', lastCollectionAccessedId = '" + req.body.lastCollectionAccessedId + "', phoneNumber = '" +
			req.body.phoneNumber + "', password = '" + req.body.password + "', accountStatus = '" +
			req.body.accountStatus + "', fullName = '" + req.body.fullName + "', defaultTheme = '" +
			req.body.defaultTheme + "' WHERE userId=" + userID +";"
		//console.log("authService login sql: ", sql)
		connection = await dbUtils.pool.getConnection()
		await connection.query(sql);
		//await connection.release()

		sql = "SELECT * from user WHERE userId=" + userID +";"
		let [rowUser] = await connection.query(sql)
		await connection.release()

		if (rowUser[0] != undefined) {
			console.log("usersService replaceUser returning: ", rowUser[0] );
			res.status(201).json( rowUser[0] )

		} else {
			return next({
				status: 422,
				errors: {
					message: 'update failed',
				}
			});
		}
	}
	catch (error) {
		console.info('Post authService login: user login failed.', error);
		return next({
			status: 400,
			message: "Login failed"
		});
	}
}

exports.logout = async function logout(req, res, next) {
		req.session.destroy(function(err) {
		  if(err) {
		    console.log("Session NOT destroyed.");
		    console.log(err);
		  } else {
		    console.log("Session has been destroyed.");
			return res.status(200).send({"success": true});
		  }
		});
        res.status(201).json({message: "replaceUser (Service) Method called successfully"})



}

module.exports.deleteUserByUserID = async function deleteUserByUserID(userID, req, res, next){

	let connection
	let sql_query = 'DELETE FROM `user` WHERE `id`=' + userID
	connection = await dbUtils.pool.getConnection()
	let [row] = await connection.query(sql_query)
	await connection.release()
	let messageReturned = new Object()
	messageReturned.text = "User deleted"
	console.log("User with id: " + userID + " deleted")
	return(messageReturned)
}

/**
 * @param previousPayload (optional) The payload from the previous JWT
 * @param jwtSignOptions (optional) Options to sign JWT
 *
 * @description Overwrites previous payload with refreshed data, checks permissions, and
 * @returns JWT token.
 */
module.exports.generateJWT = async function(previousPayload, jwtSignOptions, user) {
	//const findPermissionsByContract = util.promisify(Permission.findByContract);
	
	console.log("incoming user generateJWT...", user)
	let payload = Object.assign({}, previousPayload, {
	  userId: user.userId,
	  userName: user.userName,
	  email: user.email,
	  firstName: user.firstName,
	  lastName: user.lastName,
	  phoneNumber: user.phoneNumber,
	  created: user.created,
	  lastAccess: user.lastAccess,
	  lastCollectionAccessedId: user.lastCollectionAccessedId,
	  accountStataus: user.accountStatus,
	  fullName: user.fullName,
	  defaultTheme: user.defaultTheme
	});
  
	if (payload.collections) {
	  try {
		console.log("payload: ", payload);
		const permissions = "" //await findPermissionsByUser(payload.user_id);
		//console.log("permissions: " + JSON.stringify(permissions));
		if (!permissions) {console.log("deleting payload.collection..."); delete payload.collections;}
		else {

			for (permission in permissions) { 
				let assigendCollections = {
					collectionId: permission.collectionId,
					canOwn: permission.canOwn,
					canMaintain: permission.canMaintain,
					canApprove: permission.canApprove,
				}
				payload.collections.push(assigendCollections);
			}
		}
	  } catch(err) {
		console.log("ERROR: collections is missing from payload.")
		console.log(err)
		// return err;
		throw err
	  }
	} else if (this.lastCollectionAccessedId) {
	  payload.lastCollectionAccessedId = this.lastCollectionAccessedId;
	}
	else{
	  console.log("No lastCollectionAccessedId, not setting payload.lastCollectionAccessedId at all...")	  
	}
	console.log("payload for token: ",payload)
	return tokenGenerator.sign(payload, jwtSignOptions);
  }
