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
const passport = require('passport');
const userService = require('./usersService')
const tokenGenerator = require('../../utils/token-generator')
var refreshPayload = require('../../utils/refresh_payload');
const { json } = require('express');

exports.changeWorkspace = async function changeWorkspace (req, res, next) {
	// if (!req.body.collections) {
	//   console.info( 'Post node-api change-workspace: collections not provided.');
	//   return res.status(422).json({
	// 	message: 'No collections found'
	//   });
	// }
	console.log("authService changeWorkspace req.body: ", req.body)
	if (!req.body.token) {
	  console.info( 'Post node-api change-workspace: token not provided.');
	  return res.status(422).json({
		message: 'token not provided'
	  });
	}

	tokenGenerator.refresh(
	  req.body.token,
	  {
		verify: { algorithms: ['HS256'] },
		mergePayload: { user: req.body.user },
		refreshPayload: refreshPayload,
	  }
	)
	.then(token => {
		console.log("tokenGenerator token returned: ",token)
		res.json({ token: token })
	})
	.catch(err => {
	  console.log('Uh oh!')
	  console.error( 'Post node-api change-workspace err: ' + JSON.stringify(err));
	  next(err)
	})
  }

exports.login = async function login(req, res, next) {

	function loginObj(userId, userName, email, canAdmin, canCreateCollection, created, lastAcces, token, expiration) {
		this.userId = userId;
		this.userName = userName,
			this.email = email,
			this.canAdmin = canAdmin,
			this.canCreateCollection = canCreateCollection,
			this.created = created,
			this.token = token;
	}

	if (!req.body.email) {
		console.info('Post authServikce login: email or username not provided.');
		return next({
			status: 422,
			errors: {
				email: 'is required',
			}
		});
	}

	if (!req.body.password) {
		console.info('Post authService login: password not provided.');
		return next({
			status: 422,
			errors: {
				password: 'is required',
			}
		});
	}

	try {
		let connection
		let sql = "SELECT * FROM user WHERE userEmail='" + req.body.email + "' and  password='" + req.body.password + "';"
		//console.log("authService login sql: ", sql)
		connection = await dbUtils.pool.getConnection()
		let [rowUser] = await connection.query(sql)
	
		await connection.release()

		if (rowUser[0] != undefined) {
			req.body.username = rowUser[0].userName;	//Needed for passport call to verify user
			req.body.lastCollectionAccessedId = rowUser[0].lastCollectionAccessedId;

			return await passport
				.authenticate('local', { session: false }, async (err, user, info) => {
					if (err) {
						console.error('Post node-api login err: ' + JSON.stringify(err));
						return next(err);
					}
					if (user) {
						console.log('login successful!', 'user:', user);
						let token = await userService.generateJWT('', '', user);
						//console.log("token: ", token);
						// We have a token, let's update lastAccess on user record
						let sql = "UPDATE user SET lastAccess =  Now() WHERE userEmail='" + req.body.email + "' and  password='" + req.body.password + "';"
						connection = await dbUtils.pool.getConnection()
						await connection.query(sql)					
						await connection.release()
						
						return res.status(200).json({
							token: token,
						});
					}
					return next({
						status: 400,
						message: info.message
					});
				})(req, res, next);
		} else {
			return next({
				status: 422,
				errors: {
					email: 'Not found',
				}
			});
		}
	}
	catch(error){
		console.info('Post authService login: user login failed.',error);
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
}

exports.register = async function register(req, res, next) {

	try {

		console.log('authService register incoming req.body:', req.body);
		let connection
		// confirm that user typed same password twice
		if (req.body.password != req.body.confirmPassword) {
			console.log('Post node-api register: passwords do not match.');
			return next({
				status: 400,
				message: 'Passwords do not match',
				stack: new Error().stack,
			})
		}

		// check if email already in use
		if (req.body.email) {

			//let connection
			let sql = "SELECT * FROM user WHERE userEmail='" + req.body.email + "'"
			connection = await dbUtils.pool.getConnection()
			let [rowUser] = await connection.query(sql)

			//console.log("email check: ",rowUser[0])
			await connection.release()
			if (rowUser[0] != undefined) {
				console.log('Post node-api register: email address exists.',rowUser[0].userEmail);
				return next({
					status: 500,
					message: "An account with this email address already exists",
					stack: new Error().stack,
				})
			}
		} else {
			console.log('Post node-api register: email address required.');
			return next({
				status: 400,
				message: 'Missing email',
				stack: new Error().stack,
			})
		}
		
		// check if username already exists
		if (req.body.userName) {
			
			let sql = "SELECT * FROM user WHERE userName='" + req.body.userName + "'"
			connection = await dbUtils.pool.getConnection()
			
			let [rowUser] = await connection.query(sql)
			await connection.release()
			//console.log("name check: ",rowUser[0])
			if (rowUser[0] != undefined) {
				console.info('Post node-api register: username exists.',rowUser[0].userName);
				return next({
					status: 500,
					message: "An account with this userName already exists",
					stack: new Error().stack,
				})
			}
		} else {
			console.log('Post node-api register: userName required required.');
			return next({
				status: 400,
				message: 'Missing userName',
				stack: new Error().stack,
			})
		}

		if (
			req.body.userName &&
			req.body.email &&
			req.body.password
		) {
			// create new user
			let sql = "INSERT INTO user (userName, userEmail, password, created, firstName, lastName, phoneNumber," 
				+ " lastCollectionAccessedId, accountStatus, fullName, defaultTheme) VALUES (" 
				+ "'" + req.body.userName + "','" + req.body.email + "', '" + req.body.password + "', CURDATE(), '" 
				+ req.body.firstName + "', '" + req.body.lastName + "', '" + req.body.phoneNumber + "', 0 , 'PENDING', '" +
				req.body.firstName + " " + req.body.lastName + "', 'default' );"

			connection = await dbUtils.pool.getConnection()
			await connection.query(sql)
			await connection.release()		
			
			sql = "SELECT * FROM user WHERE userName='" + req.body.userName + "'"
			connection = await dbUtils.pool.getConnection()			
			let [user] = await connection.query(sql)
			await connection.release()	

			if (!user) {
				console.info('Post node-api register: failed to create user.');
				return next({
					status: 500,
					message: 'Failed to create user',
					stack: new Error().stack,
				})
			}
			// console.log("userID: ", user[0].userId)
			if (req.body.collectionAccessRequest) {
				let collectionRequest = req.body.collectionAccessRequest;
				// console.log("collectionRequest: ",collectionRequest)
				collectionRequest.forEach(async request => {
					connection = await dbUtils.pool.getConnection()
	
					let sql_query = `INSERT INTO poamtracking.collectionpermissions (userId, collectionId, canOwn, canMaintain, canApprove) values (?, ?, ?, ?, ?)`
			
					await connection.query(sql_query, [user[0].userId, request.collectionId, false, false, false])
					await connection.release()				
				}); 
			}

			const token = await userService.generateJWT('', '', user);
			console.log("Register token: ", token)
			return res.status(200).json({
				token: token
			})

		} else {
			return next({
				status: 500,
				message: 'All fields required',
				stack: new Error().stack,
			})
		}
	} catch (err) {
		console.error('Post node-api register err: ' + JSON.stringify(err));
		next(err)
	}
}

exports.refreshToken = async function refreshToken (req, res, next) {
	if (!req.body.token) {
	  console.info( 'Post node-api refresh-token: token not provided.');
	  res.status(401).json({
		error: 'No token available'
	  });
	}
	console.log('POST /refresh-token')
	try {
	  const token = await tokenGenerator.refresh(
		req.body.token,
		{ verify: { algorithms: ["HS256"], ignoreExpiration: true }, refreshPayload: refreshPayload }
	  )
	  return res.status(200).json({
		token: token
	  })
	} catch(err) {
	  console.log(err)
	  console.error( 'Post node-api refresh-token err: ' + JSON.stringify(err));
	  next(err)
	}
  };