
.. _documentation:

Documentation
########################################

Build with Docker
^^^^^^^^^^^^^^^^^^

#. Clone the C-PAT repository from GitHub.
#. Navigate to /docs folder of the repository. 
#. Build the Docker image using the following command: ``docker build -t sphinx-w-requirements .``
#. Run the Docker image using the following command: ``docker run --rm -v "$(pwd):/docs" sphinx-w-requirements``
#. The build product is located in ``_build`` in the docs directory.

Alternatively, you can run the ``build.sh`` script located in the /docs directory of the repository. This script will build the Docker image and run the container, generating the documentation.

Build with Python
^^^^^^^^^^^^^^^^^^

To build the documentation locally:

#. Clone the C-PAT repository from GitHub.
#. Install Python
#. Install Sphinx ``pip install sphinx``
#. Navigate to /docs folder of the repository. 
#. Install the documentation build requirements ``pip install -r requirements.txt``
#. Depending on the OS you are using, build the documentation using make.bat or the Makefile, and specify html as the format. Windows PowerShell example: ``./make html``

By default, the build product is located in ``_build`` in the docs directory. 