/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/


//const userService = require('/home/tyler.forajter.local/Development/PTT/Services/mysql/usersService.js')
const userService = require('../Services/mysql/usersService')

module.exports.getUserObject = async function getUserObject(req, res, next) {
	//userService.createUser()

	res.status(201).json({ message: "getUser Method Called successfully" })

}


module.exports.getUsers = async function getUsers(req, res, next) {
	// res.status(201).json({message: "getUser Method Called successfully"})

	var users = await userService.getUsers(req, res, next)
	console.log("returning user: ",users)
	res.status(201).json(users)

}


module.exports.createUser = async function postCreateUser(req, res, next) {
	//curl command: curl -d '{"name":"","id":"", "email":""}' -H "Content-Type: application/json" -X POST 'localhost:8080/user/'
	let testUser = {
		"name": req.body.name,
		"id": req.body.id,
		"email": req.body.email
	}

	console.log("--------------------------------------------------------")
	var testuser = await userService.postCreateUser(testUser)
	console.log(testuser)
	console.log("--------------------------------------------------------")

	res.json(testuser)

}


module.exports.getUserByUserID = async function getUserByUserID(req, res, next) {
	console.log("getUserByUserID: ", req.params.userID)
	let userID = req.params.userID
	console.log(userID)
	var user = await userService.getUserByUserID(userID)
	console.log(user)
	res.status(201).json(user)

}


module.exports.updateUser = async function updateUser(req, res, next) {
	console.log("updateUser call, req.body:", req.body);
	var user = await userService.updateUser(req,res,next); 
	res.status(201).json(user)
	//res.status(201).json({ message: "updateUser Method called successfully" })

}



module.exports.replaceUser = async function replaceUser(req, res, next) {

	console.log("replaceUser call, req.body:", req.body);
	await userService.replaceUser(req, res, next);
	//res.status(201).json({message: "replaceUser Method called successfully"})

}

module.exports.deleteUser = async function deleteUser(req, res, next) {

	let userID = req.params.userID
	var deletedUser = await userService.deleteUserByUserID(userID)


	res.status(201).json(deletedUser)



}

