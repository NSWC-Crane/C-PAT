/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const authService = require('../Services/mysql/authService')
const auth = require('../utils/auth');

module.exports.authLogin = async function authLogin(req, res, next){

	console.log("authLogin req.body: ",req.body);
	await authService.login(req,res,next);

}

module.exports.authLogout = async function authLogout(req, res, next){

	console.log("authLogout...")

	var userLogout = await authService.logout(req,res,next)
	res.status(201).json(userLogout)
}

module.exports.authRegister = async function authRegister(req, res, next){

	console.log("authRegister req.body: ", req.body);
	await authService.register(req,res,next); 
}

module.exports.changeWorkspace = async function changeWorkspace(req, res, next){
	console.log("changeWorkspace...req.body: ", req.body)
	// var userAuth = await authService.login(req,res,next)
	// //let test = {userID: '1' ,userName: "tyler.forajter", email: 't1@ttt.com'}
	// console.log("controller login returning userAuth: ",userAuth)
	// console.log("controller login returning res: ",res.body)
	// res.status(201).json(userAuth)

	// await await authService.changeWorkspace(req,res,(err,token) => {
	// 	console.log("authService.changeWorkspace err: ", err)
	// 	console.log("authService.changeWorkspace token: ", token)
	// 	// if (err) { 
	// 	//   console.log('passport.use user.authentication err: ' + JSON.stringify(err));
	// 	//   return done(null, false, err);
	// 	// }
	// 	res.status(201).json(token)
	// });

	await authService.changeWorkspace(req, res, next);
}