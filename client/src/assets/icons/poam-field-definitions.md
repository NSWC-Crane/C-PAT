#################################
POAM Field Definitions
#################################

Core Field Definitions
=====================

Description
----------
"Control Vulnerability Description: Describes the vulnerability identified during assessment. This is pulled directly from the assessment procedure entry or technical assessment method (e.g., STIG test case) where applicable. Otherwise it must be manually entered in the NC status for the vulnerability."

Source Identifying Control Vulnerability
-------------------------------------
"Source Identifying Control Vulnerability: Identifies the source of the vulnerability (e.g., program review, test and evaluation program findings, IG DoD audit, and GAO audit)."

Vulnerability ID
--------------
"Security Checks - NIST -53Rev 4 Assessment Procedure, STIG / SRG Vulnerability ID, or ACAS Plugin ID (Do not leave this field blank)."

Risk & Impact Fields
===================

Raw Severity
----------
"Raw Severity: The initial or starting severity of the vulnerability prior to implementing mitigations and/or compensating Controls."

Adjusted Severity
---------------
"Resulting Residual Risk after Proposed Mitigations: The risk level expected after any proposed mitigations are implemented. Proposed mitigations should be appropriately documented as POA&M milestones"

Impact Description
----------------
"Impact Description: Describe the identified impact."

Predisposing Conditions
---------------------
"Predisposing Conditions: A condition existing within an organization, a mission or business process, enterprise architecture, information system, or environment of operation, which affects (i.e., increases or decreases) the likelihood that threat events, once initiated, result in adverse impacts."

Scheduling & Resources
====================

Scheduled Completion Date
-----------------------
"Scheduled Completion Date: Target completion date for resolving the vulnerability. This target completion date can stretch beyond the potential 3-year authorization window and must accurately reflect the resolution timetable. Please note that the initial date entered may not be changed. When a vulnerability severity value is resolved, the agency should note the actual completion date."

Required Resources
----------------
"Resources Required: Estimated funding or manpower resources required to resolve the security vulnerability (i.e., full-time equivalent)."

Milestones
---------
"Milestone with Completion Dates: A milestone identifies specific requirements for correcting an identified vulnerability. The initial milestones and completion dates may not be altered. Any changes to the milestones should be noted in the Milestone Changes within the POAM extension panel."

Risk Assessment Fields
====================

Residual Risk
------------
"Residual Risk is automatically determined by the Adjusted Severity Value. If the Adjusted Severity Value is not present, the Residual Risk is determined by the Raw Severity."

Likelihood
---------
"Likelihood is automatically determined by the Adjusted Severity Value. If the Adjusted Severity Value is not present, the Likelihood is determined by the Raw Severity."

Mitigations
----------
"Mitigations: Any currently implemented mitigations and/or compensating Controls that will reduce the risk. A planned mitigation or compensating Control cannot lower risk until implemented."

