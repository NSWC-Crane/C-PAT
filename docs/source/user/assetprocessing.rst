
.. _assetprocessing:

Asset Processing
----------------

The asset processing component is responsible for displaying all assets pertaining to a specific collection. The following section is seperated into 3 parts; local assets, STIG Manager Assets, and Tenable Assets.
Each section contains global functionality to reduce or add columns to the table view and export the asset table data to a .csv file.

Local Assets
^^^^^^^^^^^^^
When a user is browsing a collection that belongs organically to C-PAT, i.e. the collection was created in C-PAT and not imported from Tenable or STIG Manager, the Asset Processing component will display the local assets view.
The local assets view contains a tabset with 2 tabs, Asset Management and Asset Chart.

The asset management tab displays a table of all assets in the collection with filterable columns for Asset ID, Asset Name, Description, IP Address, and MAC Address. To add an asset to the collection, click "Add Asset" and complete the pop-up form. After an asset is added, it will become an available option to select when manually adding assets to a POAM.

To modify an asset, a user has two options.
   1. Clicking the row of the asset in the table.
   2. Selecting the asset from the dropdown menu located below the table.

Either option will open a pop-up form with the asset's information. The user can modify the asset's information and click "Save" to save the changes.

STIG Manager Assets
^^^^^^^^^^^^^^^^^^^^
The STIG Manager Assets view is displayed when a user is browsing a collection that was imported from STIG Manager. The STIG Manager Assets view contains a single assets table with columns for Asset Name, FQDN, IP Address, MAC Address, Collection Name, and STIG Manager Labels. The table is a display of assets returned from a query to the STIG Manager API at ``/assets?collectionId={collectionId}`` and contains data that is current as of the time that the user opens the Asset Processing component.


Tenable Assets
^^^^^^^^^^^^^^^
The Tenable Assets view is displayed when a user is browsing a collection that was imported from Tenable. The Tenable Assets view contains a single assets table with columns for Plugin ID, Name, Family, Severity, VPR, IP Address, ACR, AES, NetBIOS, DNS, MAC Address, Port, Protocol, Agent ID, and Host ID. The table is a display of assets returned from a query to the Tenable API at ``/analysis`` using the ``listvuln`` tool with a filter for ``repository`` to match the collection that the user is currently viewing. The asset data displayed is current as of the time that the user opens the Asset Processing component.