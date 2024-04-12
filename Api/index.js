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
const app = express();
const passport = require('passport');
const cors = require('cors');
const authAPI = require('./utils/authAPI');
const config = require('./utils/config');
const routes = require('./routes');
const db = require('./db');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecification = YAML.load('./specification/C-PAT.yaml');

app.use(cors());
app.use(express.json({
    strict: false,
    limit: parseInt('10485760'),
}));

app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerSpecification));

(async () => {
    await authAPI.initializeAuth();
    await db.initializeDatabase();

    app.use(routes);

    const server = app.listen(config.cpat.port, () =>
        console.log(`API is live on http://${config.cpat.host}:${config.cpat.port}\nSwagger UI is live on http://${config.cpat.host}:${config.cpat.port}/api`),
    );
})();