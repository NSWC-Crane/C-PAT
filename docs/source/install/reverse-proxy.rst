.. _reverse-proxy:


Deploy with TLS 
########################################



Configure a Reverse Proxy or Kubernetes Ingress Controller
========================

To support HTTPS connections, C-PAT components should be situated behind a reverse proxy or in a Kubernetes cluster.  Configure the reverse proxy (such as nginx) or the Kubernetes Ingress Controller in accordance with publisher documentation, local security requirements, and Keycloak documentation.
In either case, you will have to set Keycloak environment variable `PROXY_ADDRESS_FORWARDING=true`  and make sure appropriate headers are forwarded.



Nginx for TLS
========================

C-PAT provides two branches on GitHub with sample RMF Tools nginx deployments with a configuration file that may be useful to those setting up a Production deployment of C-PAT and STIG Manager:



With CAC Authentication
------------------------------------------

https://github.com/NSWC-Crane/C-PAT/tree/rmftools-orchestration-cac



Without CAC Authentication
------------------------------------------

https://github.com/NSWC-Crane/C-PAT/tree/demo-auth-no-CAC



------------------------------------------

.. thumbnail:: /assets/images/component-diagram.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram with Reverse Proxy

---------------------------

.. thumbnail:: /assets/images/k8-component-diagram.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram with Kubernetes


|
|




