
.. _manage-poams:

Manage POAMs
------------

The Manage POAMs component is composed of four interactive sections: the Severity Charts, the Milestone Grid, and the POAM Grid. When the POAM Grid is in its default (non-expanded) state, the charts and milestone grid are visible alongside it. Expanding the POAM Grid hides the charts and milestone grid so the full screen width is available for the table.

Severity Charts
^^^^^^^^^^^^^^^^

Three pie charts display the distribution of POAMs by severity category — CAT I (Critical/High), CAT II (Medium), and CAT III (Low). Each slice represents a POAM status (Approved, Submitted, Extension Requested, etc.) and the total count is shown in the chart title.

For Tenable collections, each chart includes a tab option allowing you to toggle between **All Findings** and **30+ Days** (findings where the plugin has been published for more than 30 days and was last seen within the past 30 days).

Milestone Grid
^^^^^^^^^^^^^^^

The Milestone Grid flattens all milestones from active POAMs in the collection into a single searchable, filterable table. POAMs with a status of Closed or Draft are excluded. Each row represents one milestone and includes the following columns:

- **POAM ID**
- **Vulnerability ID**
- **POAM Status**
- **Milestone Date**
- **Milestone Status**
- **Comments**
- **Change Date**
- **Change Comments**
- **Assigned Teams**

The Milestone Grid has three tabs:

All Milestones
""""""""""""""
Displays every milestone across all active POAMs in the collection.

Needs Attention
""""""""""""""""
Displays milestones whose status is **Pending** and whose Milestone Date is within the next 30 days (or has no date set).

Team Milestones
""""""""""""""""
Displays milestones for POAMs assigned to at least one team that the current user belongs to.

Each tab provides a global search input, column-level filters, and a CSV export button.

POAM Grid
^^^^^^^^^^

All tabs share the same column set:

- POAM ID (links to POAM)
- POAM Status
- Vulnerability Source
- Vulnerability ID
- Affected Assets
- Vulnerability Name
- Task Order #
- IAV
- Adjusted Severity
- Owner
- Submitted Date
- Scheduled Completion
- Last Updated
- Associated Vulnerabilities
- Assigned Teams (color-coded by team completion status)
- Labels

**Filtering**

Each column has an individual filter accessible via the filter icon in the column header. The Status column includes a dropdown filter with all available POAM statuses. By default, POAMs with a status of **Closed** are hidden; use the filter icon on the Status column or the reset button to change this.

A global search field in the toolbar searches across all columns simultaneously.

**Status Sort**

Clicking the **POAM Status** column header cycles through three custom sort modes in addition to clearing the sort:

1. **Critical First** — surfaces Expired and Rejected POAMs first, followed by those awaiting action, then closed/resolved statuses.
2. **In-Progress First** — surfaces Draft, Submitted, and Extension Requested POAMs first.
3. **Completed First** — surfaces Closed, False-Positive, and Approved POAMs first.

Clicking any other sortable column header resets the status sort cycle.

**Export**

Two export options are available in the toolbar of every tab:

- **eMASS Excel Template** — prompts for which POAM statuses to include, then generates an eMASS-formatted ``.xlsx`` file populated with affected device data from STIG Manager or Tenable as appropriate.
- **CSV** — exports the currently displayed rows (after all active filters) to a ``.csv`` file containing all columns.

An additional file upload control accepts an existing eMASSter ``.xlsx`` file and overwrites select fields with current C-PAT data before re-downloading the updated file.

.. note::
   The tabs displayed within the POAM Grid depend on a user's access level within the collection. A user with Access Level 1 (Viewer) sees All POAMs, Needs Attention, and Team POAMs. Submitters (level 2) also see My POAMs. Approvers (level 3 or higher) additionally see Pending Approval.

All POAMs
""""""""""
Displays every POAM in the collection with no additional filtering applied (beyond the default closed-status filter).

Needs Attention
""""""""""""""""
Displays POAMs whose Scheduled Completion Date falls within the next 30 days and whose status is not Draft, Closed, or False-Positive. 

My POAMs
"""""""""
Displays POAMs submitted by or owned by the current user where the POAM status is not Closed. Access Level of 2 (Submitter) or greater is required.

Team POAMs
"""""""""""
Displays POAMs assigned to at least one team that the current user belongs to.

Pending Approval
"""""""""""""""""
Displays POAMs with a status of Submitted, Extension Requested, or Pending CAT-I Approval.
