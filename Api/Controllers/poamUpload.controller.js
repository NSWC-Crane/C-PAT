/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const readXlsxFile = require('read-excel-file/node');
const { db } = require('../utils/sequelize.js');
const { poamAsset, Poam } = require('../utils/sequelize.js');

const excelColumnToDbColumnMapping = {
    "POA&M Item ID": "poamitemid",
    "Control Vulnerability Description": "description",
    "Security Control Number (NC/NA controls only)": "securityControlNumber",
    "Office/Org": "officeOrg",
    "Security Checks": "vulnerabilityId",
    "Resources Required": "requiredResources",
    "Scheduled Completion Date": "scheduledCompletionDate",
    "Milestone with Completion Dates": "milestones",
    "Source Identifying Vulnerability ": "vulnerabilitySource",
    "Status": "emassStatus",
    "Comments": "notes",
    "Raw Severity": "rawSeverity",
    "Devices Affected": "devicesAffected",
    "Mitigations (in-house and in conjunction with the Navy CSSP)": "mitigations",
    "Predisposing Conditions": "predisposingConditions",
    "Severity": "severity",
    "Relevance of Threat": "relevanceOfThreat",
    "Threat Description": "threatDescription",
    "Likelihood": "likelihood",
    "Impact": "businessImpact",
    "Impact Description": "impactDescription",
    "Residual Risk Level": "residualRisk",
    "Recommendations": "recommendations",
    "Resulting Residual Risk after Proposed Mitigations": "adjSeverity"
};

exports.uploadPoamFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: "Please upload an Excel file!" });
    }

    try {
        const rows = await readXlsxFile(req.file.buffer);
        const headers = rows[5]; // Headers from row 6
        const dataRows = rows.slice(6); // Data starts from row 7

        const poamData = dataRows.map(row => {
            const poamEntry = {};
            row.forEach((value, index) => {
                const dbColumn = headers[index] ? excelColumnToDbColumnMapping[headers[index]] : null;
                if (dbColumn) {
                    poamEntry[dbColumn] = value;
                }
            });
            return poamEntry;
        });

        // Bulk insert POAM data
        const createdPoams = await Poam.bulkCreate(poamData, { returning: true });

        // Process devicesAffected for each poamEntry...
        for (const poamEntry of createdPoams) {
            // Now poamEntry includes poamId generated by the database
            const poamId = poamEntry.poamId;

            // Check if devicesAffected is defined and is either a string or a number
            if (poamEntry.devicesAffected !== undefined && (typeof poamEntry.devicesAffected === 'string' || typeof poamEntry.devicesAffected === 'number')) {
                // Convert to string if it's a number
                let devicesString = poamEntry.devicesAffected.toString();

                // Split by line breaks
                const devices = devicesString.split('\n');
                for (const deviceName of devices) {
                    // Trim the device name to remove extra spaces
                    const trimmedDeviceName = deviceName.trim();

                    // Check if the device name is not empty
                    if (trimmedDeviceName) {
                        const existingAsset = await poamAsset.findOne({
                            where: { assetId: trimmedDeviceName }
                        });

                        if (existingAsset) {
                            // Update existing asset with new poamId
                            await existingAsset.update({ poamId: poamId });
                        } else {
                            // Create new asset with both assetId and poamId if it doesn't exist
                            await poamAsset.create({ assetId: trimmedDeviceName, poamId: poamId });
                        }
                    }
                }
            } else {
                // Handle cases where devicesAffected is neither a string nor a number
                console.log('devicesAffected is neither a string nor a number:', poamEntry.devicesAffected);
            }
        }

        res.status(200).send({ message: "Uploaded the file successfully: " + req.file.originalname });
    }
    catch (error) {
        console.error("Error during file upload and processing: ", error);
        res.status(500).send({
            message: "Could not process the file: " + req.file.originalname,
            error: error.message,
        });
    }
};