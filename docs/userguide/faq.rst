Telemetry Streaming Frequently Asked Questions (FAQ)
----------------------------------------------------


**What is Telemetry Streaming?**

Telemetry Streaming (TS) is an iControl LX Extension delivered as a TMOS-independent RPM file. Installing the TS Extension on BIG-IP enables you to declaratively aggregate, normalize, and forward statistics and events from the BIG-IP to a consumer application. You can do all of this by POSTing a single TS JSON declaration to Telemetry Streaming's declarative REST API endpoint.

*Telemetry Streaming is:*

-  A javascript |ilx| plug-in
-  A project based on the intent of the |iapp|
-  A |declare| interface for configuring telemetry on BIG-IP
-  |atomic| (TS declarations)

*BUT... it is:*

-  **not** created to include a graphical interface (GUI)

|

**Where can I download Telemetry Streaming?**

Telemetry Streaming is available on |github| and is community-supported.

|


**When is Telemetry Streaming a good fit and when it is not?**

*Telemetry Streaming is a good fit where:*

- You require a simple method to send stats/events to external analytics consumers

*Telemetry Streaming may not be a good fit where:*

- Declarative interface is not desirable
- Organization is unwilling or unable to deploy iControl Extension RPM on BIG-IP

|


**Which TMOS versions does Telemetry Streaming support?**

Telemetry Streaming supports TMOS 13.x and up.

|

**How do I get started with Telemetry Streaming?**

See the :doc:`quick-start` to jump right into using TS.

|

**What is a "Telemetry Streaming Declaration"?**

- Telemetry Streaming uses a declarative model, meaning you provide a JSON declaration rather than a set of imperative commands.
- Telemetry Streaming is well-defined according to the rules of the JSON Schema, and validates declarations according to the JSON Schema.

|

**What is the delivery cadence for Telemetry Streaming?**

Telemetry Streaming is on a monthly delivery cadence, typically at beginning of every month.

|

.. _upgrade-ref:

**What if I upgrade my BIG-IP system, how to I migrate my Telemetry Streaming configuration?**

When you upgrade your BIG-IP system, you simply install Telemetry Streaming on the upgraded BIG-IP system and re-deploy your declaration.  For example, you installed Telemetry Streaming on your BIG-IP running version 13.1 and deployed a declaration.  You decide to upgrade your BIG-IP system to 14.1. Once the upgrade to 14.1 is complete, you must install Telemetry Streaming on the BIG-IP.  After you install Telemetry Streaming, you send the same declaration you used pre-upgrade to the 13.1 BIG-IP system. Your upgraded BIG-IP will then have the same configuration as the previous version.

|

**What happens on the front-end and back-end of Telemetry Streaming?**

- *Front-end*:  
  Telemetry Streaming exposes a declarative iControl LX REST API on the front-end: /mgmt/shared/telemetry/declare.

- *Back-end*:  
  Telemetry Streaming uses iControl REST APIs on the back-end to communicate with BIG-IP. Telemetry Streaming can use 3rd party REST APIs to communicate with 3rd party systems, enabling integration opportunities.

|

**How do I report issues, feature requests, and get help with Telemetry Streaming?**

- You can use |issues| to submit feature requests or problems with Telemetry Streaming.

|




.. |intro| raw:: html

   <a href="https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/3/#introduction" target="_blank">Introduction</a>

.. |ilx| raw:: html

   <a href="https://clouddocs.f5.com/products/iapp/iapp-lx/latest/" target="_blank">iControl LX</a>

.. |iapp| raw:: html

   <a href="https://github.com/F5Networks/f5-application-services-integration-iApp" target="_blank">appsvcs_integration iApp</a>

.. |declare| raw:: html

   <a href="https://f5.com/about-us/blog/articles/in-container-land-declarative-configuration-is-king-27226" target="_blank">declarative</a>

.. |apps| raw:: html

   <a href="https://f5.com/resources/white-papers/automating-f5-application-services-a-practical-guide-29792" target="_blank">configuring applications</a>

.. |idempotent| raw:: html

   <a href="https://whatis.techtarget.com/definition/idempotence" target="_blank">idempotent</a>

.. |support| raw:: html

   <a href="https://f5.com/support/support-policies" target="_blank">supported by F5</a>

.. |atomic| raw:: html

   <a href="https://www.techopedia.com/definition/3466/atomic-operation" target="_blank">atomic</a>

.. |multi| raw:: html

   <a href="https://en.wikipedia.org/wiki/Multitenancy" target="_blank">multi-tenancy</a>

.. |rd| raw:: html

   <a href="https://support.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/tmos-routing-administration-13-1-0/9.html#guid-ebe7b3ea-c89f-4abc-976d-9c98755dd566" target="_blank">route domain</a>

.. |github| raw:: html

   <a href="https://github.com/F5Networks/f5-telemetry-streaming" target="_blank">GitHub</a>


.. |issues| raw:: html

   <a href="https://github.com/F5Networks/f5-telemetry-streaming/issues" target="_blank">GitHub Issues</a>