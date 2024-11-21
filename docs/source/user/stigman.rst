.. _stigman:
STIG Manager
------------

The STIG Manager component was designed to quickly identify vulnerabilities and automate the POAM process. The STIG Manager component contains the main Findings Grid and an additional Findings Chart to quickly visualize the open findings and filter by POAM existience or POAM status.

Findings Grid
^^^^^^^^^^^^^^^

The STIG Manager findings grid is a display of the results from STIG Manager ``api/collections/{collectionId}/findings`` aggregator: ``groupId`` acceptedOnly: ``false`` projection(s): ``stigs, rules``. The results of this API call are then parsed into columns for Group ID, Rule Title, Benchmark ID, Severity, and [affected] Asset Count. 
The results are simultaneously compared against existing POAM's in CPAT to determine the existience of a POAM and the POAM Status, if applicable. The results of this determination are displayed in the first column, labeled POAM.

The POAM column is color coded to reflect the POAM status. The color coding is as follows:
- Red (X): No POAM exists for this finding.
- Red (Circled Checkmark): POAM exists and is in a status of "Expired", "Rejected", or "Draft".
- Yellow: POAM exists and is in a status of "Submitted", "Pending CAT-I Approval", or "Extension Requested".
- Green: POAM exists and is in a status of "Approved"
- Grey: The vulnerability is listed as being "Associated" with an existing POAM. This result is often the case when one master POAM is sufficient to cover multiple similar findings.
- Black: POAM exists and is in a status of "Closed" or "False-Positive".

.. note::
   The buttons in the POAM column are clickable and will also display a tooltip with additional details when hovered over.

In cases where a POAM exists, clicking the aforementioned icon will direct the user to the POAM details page for further information.

In cases where a POAM does not exist, clicking the aforementioned icon will submit an additional query to STIG Manager ``api/stigs/rules/{ruleId}`` projection(s): ``detail, check, fix`` and a query to ``api/stigs/`` while the user is being directed to the POAM creation page. 
Upon arrival, the user will be presented with a POAM draft that contains a toggleable section that contains STIG Manager Rule, Check, and Fix data. The POAM Description, Source Identifying Control Vulnerability, STIG Title, Source Identifying Control Vulnerability - ID #, Raw Severity value, Adjusted Severity Value, Scheduled Completion Date, Submitted Date, Residual Risk, Liklihood, and Assets automated based upon the data from STIG Manager.

By default, the Scheduled Completion Date will be set to 30 days for CAT I (High), 180 days for CAT II (Medium), and 365 days for CAT III (Low) vulnerabilities. The Scheduled Completion Date can be manually adjusted by the user as needed to align with organizational policy.

.. note::
   If appropriately configured in the Administrative Portal, the A&A Package and Approver fields will also be auto-populated with the appropriate data.