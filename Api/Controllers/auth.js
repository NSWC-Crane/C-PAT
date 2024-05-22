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
const logger = require('../utils/logger');

module.exports = {
    authLogin: async (req, res, next) => {
        try {
            await authService.login(req, res, next);
        } catch (error) {
            logger.writeError('auth', 'authLogin', error);
        }
    },

    authLogout: async (req, res, next) => {
        try {
        const userLogout = await authService.logout(req, res, next);
            res.status(201).json(userLogout);
        } catch (error) {
            logger.writeError('auth', 'authLogout', error);
        }
    },

    authRegister: async (req, res, next) => {
        try {
            await authService.register(req, res, next);
        } catch (error) {
            logger.writeError('auth', 'authRegister', error);
        }
    },

    changeWorkspace: async (req, res, next) => {
        try {
            await authService.changeWorkspace(req, res, next);
        } catch (error) {
            logger.writeError('auth', 'changeWorkspace', error);
        }
    }
};