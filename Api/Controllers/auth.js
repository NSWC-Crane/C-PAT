/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const authService = require('../Services/mysql/authService');
const auth = require('../utils/auth');

module.exports = {
    authLogin: async (req, res, next) => {
        console.log("authLogin req.body: ", req.body);
        await authService.login(req, res, next);
    },

    authLogout: async (req, res, next) => {
        console.log("authLogout...");
        const userLogout = await authService.logout(req, res, next);
        res.status(201).json(userLogout);
    },

    authRegister: async (req, res, next) => {
        console.log("authRegister req.body: ", req.body);
        await authService.register(req, res, next);
    },

    changeWorkspace: async (req, res, next) => {
        console.log("changeWorkspace...req.body: ", req.body);
        await authService.changeWorkspace(req, res, next);
    }
};