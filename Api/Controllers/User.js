/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const userService = require('../Services/mysql/usersService')


module.exports.getUsers = async function getUsers(req, res, next) {
	// res.status(201).json({message: "getUser Method Called successfully"})

	var users = await userService.getUsers(req, res, next)
	// console.log("returning user: ",users)
	res.status(201).json(users)
}


module.exports.getUserByUserID = async function getUserByUserID(req, res, next) {
	// console.log("getUserByUserID: ", req.params.userID)
	let userID = req.params.userID
	// console.log(userID)
	var user = await userService.getUserByUserID(userID)
	// console.log(user)
	res.status(201).json(user)

}

module.exports.updateUser = async function updateUser(req, res, next) {
	// console.log("updateUser call, req.body:", req.body);
	var user = await userService.updateUser(req,res,next); 
	res.status(201).json(user)
	//res.status(201).json({ message: "updateUser Method called successfully" })

}


module.exports.deleteUser = async function deleteUser(req, res, next) {

	let userID = req.params.userID
	var deletedUser = await userService.deleteUserByUserID(userID)


	res.status(201).json(deletedUser)
}

module.exports.loginout = async function loginout(req, res, next) {
	//console.log("user controller loginout req: ",req.body)
	var inout = await userService.loginout(req,res,next); 
	res.status(201).json(inout)
}
