
.. _manage-poams:

Manage POAMs
------------

The Manage POAMs component is a compilation of charts, tables, and grids that are ultimately designed to assist a user in quickly and easily identifying the data they want or need to view. The Manage POAMs component is broken down into the following interactive sections: POAM Status Grid (tabset), Main POAM Chart, and the Main POAM Chart expansion table.

POAM Main Chart
^^^^^^^^^^^^^^^^

The POAM Main Chart contains a single dataset that is seperated into 4 different viewing formats; POAM Status, Severity, Scheduled Completion, and Labels. Each section is filterable via the filter dropdown located below the chart.
Filters are available for Status, Severity, Scheduled Completion, Labels, and Vulnerability Source. Multiple filters can be applied.

POAM Expanded Grid
^^^^^^^^^^^^^^^^^^^

The expanded POAM grid is a table that dynamically reflects the POAMs from the POAM Main Chart. When the main chart is filtered, the resulting data displayed in the expanded grid will also be filtered. In addition to the filters available in the Main Chart, the expanded POAM grid also contains column filters for the following fields:
Last Updated, POAM ID, Vulnerability ID, POAM Status, Vulnerability Source, STIG Benchmark, Adjusted Severity, Submitter, Assigned Teams, Submitted Date, and Scheduled Completion Date.

The far right column of the expanded POAM grid contains an icon that will direct users to the POAM details page for further information.

.. note::
   POAM's are also exportable from within the expanded grid. The export will contain all POAMs displayed in the grid, formatted into the eMASS excel format.

Assigned Grid
^^^^^^^^^^^^^^

The Assigned Grid is a table that displays POAMs segmented into one of four seperate categories; All POAMs, Needs Attention, My POAMs, and Pending Approval.

.. note::
   The tabs contained within the Assigned Grid are displayed based upon a users assigned permissions within a collection. To see all 4 tabs, a user must be assigned to an access level 3 or higher (Approver).


All POAMs
""""""""""
The All POAMs tab displays all POAMs that are currently available within the collection. No filtering is conducted on the dataset for the All POAMs tab. Access Level of 1 (Viewer) or greater is required to view this tab.


Needs Attention
""""""""""""""""
The Needs Attention tab contains POAMs where the Scheduled Completion Date is less than 30 days for CAT II - Medium or CAT III - Low, less than 7 days for CAT I - High, and where the POAM status is not Draft, Closed, or False Positive. Access Level of 1 (Viewer) or greater is required to view this tab.


My POAMs
"""""""""
The My POAMs tab displays all POAMs that have been submitted by the user where the POAM status is not Closed. Access Level of 2 (Submitter) or greater is required to view this tab.

Pending Approval
"""""""""""""""""
The Pending Approval tab displays all POAMs that are Pending Approval within the current collection [POAM Status of Submitted, Extension Requested, or Pending CAT-I Approval]. Access Level of 3 (Approver) or greater is required to view this tab.
