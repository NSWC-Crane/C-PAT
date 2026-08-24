.. _reverse-proxy:


Deploy with TLS 
########################################



Configure a Reverse Proxy or Kubernetes Ingress Controller
==========================================================

To support HTTPS connections, C-PAT components should be situated behind a reverse proxy or in a Kubernetes cluster.  Configure the reverse proxy (such as nginx) or the Kubernetes Ingress Controller in accordance with publisher documentation, local security requirements, and Keycloak documentation.
In either case, you will have to set Keycloak environment variable `PROXY_ADDRESS_FORWARDING=true`  and make sure appropriate headers are forwarded.



.. _subpath:

Deploy at a Subpath
====================

By default, C-PAT is served from the root of its origin, for example ``https://cpat.example.com/``. To host C-PAT under a path prefix instead, such as ``https://cpat.example.com/cpat/``, set the ``CPAT_BASE_PATH`` :ref:`Environment Variable <Environment Variables>` to that prefix. The value is normalized to a leading and trailing slash before it is written to the ``base`` element, so ``cpat``, ``/cpat``, and ``/cpat/`` all serve the client from the same location. The OIDC redirect URI is the one exception, and is described under `OIDC Provider`_ below.

The API writes the normalized value into the ``base`` element of the web client's ``index.html``. The client resolves its bundles, router URLs, documentation links, and API requests relative to that element.

.. warning::
  The API is not relocated by this setting. It always mounts ``/api``, ``/api-docs``, ``/docs``, and ``/init`` at the root of the port it listens on. The reverse proxy must strip the prefix before forwarding, otherwise client requests arrive as ``/cpat/api/...`` and are not routed.

.. note::
  Leave ``CPAT_API_BASE`` at its default value of ``api``. It is resolved relative to the ``base`` element, so the default produces requests to ``https://cpat.example.com/cpat/api/...``. Giving it a leading slash makes the browser resolve it against the origin instead, which bypasses the prefix and the requests are not routed.

Nginx
------

A minimal nginx location block is shown below. The trailing slash on ``proxy_pass`` is what strips the prefix and is required:

.. code-block:: nginx

  location /cpat/ {
      proxy_pass http://c-pat:8086/;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }

Kubernetes Ingress
-------------------

An Ingress Controller strips the prefix with a rewrite rule. With `ingress-nginx <https://kubernetes.github.io/ingress-nginx/>`_, the ``path`` expression captures everything following the prefix and the rewrite forwards only that capture. ``pathType`` must be ``ImplementationSpecific`` for the capture groups to be honored:

.. code-block:: yaml

  metadata:
    annotations:
      nginx.ingress.kubernetes.io/rewrite-target: /$2
  spec:
    rules:
      - http:
          paths:
            - path: /cpat(/|$)(.*)
              pathType: ImplementationSpecific
              backend:
                service:
                  name: c-pat
                  port:
                    number: 8086

Because the prefix is stripped before the request reaches the API, the API cannot infer it from the request. Set ``CPAT_BASE_PATH`` to the same prefix on the C-PAT container.

.. warning::
  The Ingress Controller must terminate TLS. C-PAT listens for plain HTTP, and a TLS passthrough configuration leaves the controller unable to read the request, so the rewrite rule has no effect.

OIDC Provider
--------------

The OIDC Provider must be updated as well. The web client redirects to the subpath rather than to the origin, so the C-PAT client registration needs ``https://cpat.example.com/cpat/*`` in its Valid Redirect URIs, and the same subpath as its post-logout redirect URI. See :ref:`authentication`.

.. note::
  The trailing slash is significant here, and only here. The redirect URI reproduces ``CPAT_BASE_PATH`` exactly as it is set, so ``/cpat`` redirects to ``https://cpat.example.com/cpat`` while ``/cpat/`` redirects to ``https://cpat.example.com/cpat/``. The wildcard shown above matches either form. Register the exact value instead of a wildcard only if you also match the trailing slash to the one you configured.


Nginx for TLS
==============

C-PAT provides two branches on GitHub with sample RMF Tools nginx deployments with a configuration file that may be useful to those setting up a Production deployment of C-PAT and STIG Manager:



With CAC Authentication
------------------------

https://github.com/NSWC-Crane/C-PAT-RMF-ORCHESTRATION/tree/rmftools-orchestration-cac



Without CAC Authentication
---------------------------

https://github.com/NSWC-Crane/C-PAT-RMF-ORCHESTRATION/tree/demo-auth-no-cac



------------------------------------------

.. thumbnail:: /assets/images/component-diagram.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram with Reverse Proxy

------------------------------------------

.. thumbnail:: /assets/images/k8-component-diagram.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram with Kubernetes


|
|




