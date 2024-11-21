.. _admin-portal:

Administration Portal
---------------------

The Admin Portal is accessible to users with the ``admin`` role assigned by the OIDC provider and subsequently provided to C-PAT via the user's token. Users whose token contains the admin role will automatically be presented with an "Admin Portal" button in the side menu bar. The Admin Portal provides a way to manage users, collections, integrations, and fine-tune options that best align with particular organizational policies and operations.

User Management
---------------

The User Management section allows administrators to view, manage, and modify user accounts within C-PAT.

.. note::
   By default, when a user first logs into C-PAT, they are assigned a ``PENDING`` account status and will not be able to access the application until an administrator approves their account. This step is implemented to ensure that only authorized users have access to the application and administrators have the ability and oversight to dictate more precise permissions and access.

   To approve a user account, an administrator must navigate to the User Management section, select the user account from the dropdown at the bottom of the User Table, and change the Account Status to ``ACTIVE``. Once approved, the user will be able to access the application and navigate to any collections for which they have been assigned permissions.

Assuming a correct C-PAT and OIDC configuration, user data *should* be automatically populated from the OIDC provider. If the user data is not automatically populated, the user data can be manually entered by an administrator. Accurate and complete user data is important to the flow of the C-PAT application, particularly when it comes to exporting into the eMASS excel format. User first name, last name, email, phone number, and office/organization are all pre-populated into a C-PAT export when available.

C-PAT Collection Privileges
^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. list-table::
   :header-rows: 1
   :widths: 20 80

   * - Privilege
     - Allows
   * - Viewer
     - The Viewer role is most commonly attributed to readonly access. Users who have been granted the Viewer role for a collection can view the collection and its associated POAMs, Assets, Labels, etc. Users with the Viewer role however, cannot make any changes or add new items.
   * - Submitter
     - The Submitter role is the recommended role for users who should not be restricted to readonly access and who do not explicitly need POAM approval access for the collection. Users with Submitter access will have access to add and modify data for POAMs, Assets, Labels, etc.
   * - Approver
     - The Approver role is the recommended role for users who need to approve POAMs for the collection. Users with the Approver role will have the same access as that of the Submitter role, in addition to access to issue final approval or rejection for CAT II and CAT III POAMs. In the case of CAT I POAMs, an Approver can (and should) review and mark the POAM as approved, but the final approval must be issued by a CAT I Approver.
   * - CAT I Approver
     - The CAT I Approver role provides the highest level of access to a collection. Users with the CAT I Approver role will have the same access as that of the Approver role, in addition to the ability to issue final approval for CAT I POAMs. CAT I Approvers are the only users who can issue final approval for CAT I POAMs.

Collection Management
---------------------

Collection management provides C-PAT administrators with the ability to manually create new collections, alter existing collections, or export all of the POAMs contained within a collection into the eMASS excel format.

.. warning::
   Manual creation of collections is not recommended when data ingestion from STIG Manager or Tenable is desired. Collections should be automatically imported via the STIG Manager or Tenable Import section within the Admin Portal to ensure the proper collection association.

.. note::
   While the Collection Name is the only required field for a collection, it is strongly recommended that all Collection fields are entered to ensure proper data flow within C-PAT.

Collection Field Mappings
^^^^^^^^^^^^^^^^^^^^^^^^^

- **Collection Name**: The name of the collection. For collections that are imported from STIG Manager or Tenable, the collection name should match the collection name from the respective system. The collection name will be displayed in navigation across C-PAT and be contained in the file name of POAM exports.
- **Collection Description**: A brief description of the collection.
- **System Type**: This field will map to Cell ``L2`` in the eMASS format excel export.
- **System Name**: This field will map to Cell ``D5`` in the eMASS format excel export.
- **CC/S/A/FA**: This field will map to Cell ``D4`` in the eMASS format excel export.
- **A&A Package**: C-PAT provides the ability to associate an A&A package with a collection. When a collection has an A&A package set, this field will be automatically populated for any POAM created within the collection.

Integrations
------------

STIG Manager
^^^^^^^^^^^^

The STIG Manager component allows administrators to import collections from STIG Manager into C-PAT, or more precisely, create a collection shell that will interface with a particular STIG Manager collection. To import collections:

1. Navigate to the "STIG Manager" tab in the Admin Portal.
2. You will see a dropdown menu labeled "Select Collection to Import...".
3. Click on the dropdown to view available collections from STIG Manager.
4. Select the collection you wish to import.
5. Click the "IMPORT SELECTED" button to import the chosen collection.
6. To import all remaining collections at once, click the "IMPORT ALL REMAINING" button.

.. note::
   Once all collections have been imported, the list will be empty, and no items will be displayed.

   After importing a collection, users must still be assigned the appropriate permissions to the newly imported collection before they can view or access it.

Tenable.sc
^^^^^^^^^^

The Tenable Import component enables administrators to import repositories from Tenable.sc as collections in C-PAT. To import repositories:

1. Go to the "TENABLE IMPORT" tab in the Admin Portal.
2. You will see a dropdown menu labeled "Select Repository to Import...".
3. Click on the dropdown to view available repositories from Tenable.sc.
4. Choose the repository you want to import.
5. Click the "IMPORT SELECTED" button to import the selected repository.
6. To import all remaining repositories at once, click the "IMPORT ALL REMAINING" button.

.. note::
   Once all repositories have been imported, the list will be empty, and no items will be displayed.

   After importing a repository, users must still be assigned the appropriate permissions to the newly imported collection before they can view or access it.

The STIG Manager and Tenable Import components streamline the process of creating collections in C-PAT by automatically mapping them to the appropriate external systems, ensuring consistency and reducing manual effort. Currently, there is no way to associate a manually created collection with a STIG Manager collection or Tenable repository.




VRAM IAV Import
---------------

Importing a current VRAM IAV Table into C-PAT is the first step of a two part process as it relates to corelating Navy Comply Dates with Tenable vulnerability findings or plugin IDs. The VRAM IAV Table can be accessed and exported `here <https://vram.navy.mil/iav>`_.

.. note::
   C-PAT will automatically process the date information is current as of, contained in cell ``A1`` of the VRAM IAV export. All subsequent uploads will compare this date when a new file is uploaded.

Column Options
^^^^^^^^^^^^^^
.. note::
   C-PAT is configured to automatically parse the required columns by name, therefore, the default column selections are only a minimum requirement. Additional columns or different column orders in the export are permissible.
   At a minimum, the following fields ARE required: ``IAV`` ``Status`` ``Title`` ``IAV CAT`` ``Type`` ``Release Date`` ``Navy Comply Date`` ``Superseded By`` ``Known Exploits`` ``Known DoD Incidents`` ``Nessus Plugins``

.. image:: /assets/images/vram_step1.png
   :width: 600
   :show_caption: True
   :alt: Step 1 - Locate Column Options
   :title: Step 1 - Locate Column Options

.. image:: /assets/images/vram_columnOptions.png
   :width: 600
   :show_caption: True
   :alt: Step 1.1 - Set Column Options (if necessary)
   :title: Step 1.1 - Set Column Options (if necessary)

Export
^^^^^^

Click to export. The exported file can now be imported to C-PAT.

.. image:: /assets/images/vram_step2.png
   :width: 600
   :show_caption: True
   :alt: Step 2 - Export
   :title: Step 2 - Export


Nessus Plugin Mapping
---------------------

The 'MAP PLUGINS TO IAV' button will initiate the process of mapping IAV data to Tenable plugin IDs. This is an intensive operation that queries the Tenable analysis endpoint to return plugins with a cross reference[xref] for IAVs from 1990 to present. ``IAVA|20*,IAVB|20*,IAVT|20*,IAVA|199*,IAVB|199*,IAVT|199*``

.. note::
   This process will take approximately 60 seconds to complete. Clicking away from the page will terminate the mapping and the process must be started over again.



Set A&A Packages
----------------

C-PAT provides the ability for administrators to set A&A package options for their organization. In addition to populating the list of options when setting an A&A package for a particular collection, the A&A packages entered in the Set A&A Packages component will populate a drop down list of options in POAMs for instances when a POAM entry may require deviation from the pre-populated A&A Package.



Set Assigned Teams
------------------

Similar to the Set A&A Packages component, the Set Assigned Teams component allows administrators to set a list of teams that can be assigned within POAMs. The teams entered in the Set Assigned Teams component will populate a drop down list of options in POAMs (Step 1 -  *Assignees*, Step 8 - *Milestones*, and within the *POAM Extension milestones* section).