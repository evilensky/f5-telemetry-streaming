.. _installation:

Downloading and installing the Telemetry Streaming package
----------------------------------------------------------
The Telemetry Streaming package is an RPM file you download, and then upload to the BIG-IP system using the iControl/iApp LX framework. Alternatively, you can see our :doc:`quick-start`.

Downloading the RPM file
~~~~~~~~~~~~~~~~~~~~~~~~
The first task is to download the latest RPM file.  Go to the |github|, and download the latest (highest numbered) RPM file.

Uploading and installing the Telemetry Streaming file on the BIG-IP
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
After you download the RPM, you must upload and then install it on your BIG-IP system. You can use the BIG-IP Configuration utility or cURL (you can alternatively use SCP to upload the file to **/var/config/rest/downloads**, but you would still have to use cURL command to install the package).  Use only one of the following procedures.

.. _installgui-ref:

Installing Telemetry Streaming using the BIG-IP Configuration utility
`````````````````````````````````````````````````````````````````````

From the Configuration utility:

1. If you are using a BIG-IP version prior to 14.0,  before you can use the Configuration utility, you must enable the framework using the BIG-IP command line. From the CLI, type the following command:  ``touch /var/config/rest/iapps/enable``.  You only need to run this command once (per BIG-IP system).
2. Click **iApps > Package Management LX**.  Your Telemetry Streaming version number may be different than the one shown in the following example.

   .. image:: /images/install1.png

3. Click the **Import** button.

   .. image:: /images/install2.png

4. Click **Choose File** and then browse to the location you saved the RPM file, and then click **Ok**.
5. Click the **Upload** button.

   .. image:: /images/install3.png


|

.. _installcurl-ref:

Installing Telemetry Streaming using cURL from the Linux shell
``````````````````````````````````````````````````````````````

If you want to use cURL to install Telemetry Streaming, use the following command syntax. First, set the file name and the BIG-IP IP address and credentials, making sure you use the appropriate RPM file name, including build number (36 in the following example), and BIG-IP credentials.

.. code-block:: shell

    FN=f5-telemetry-1.0.0-1.noarch.rpm

    CREDS=admin:password

    IP=IP address of BIG-IP

|

Copy the following commands to upload the package. If you uploaded the RPM by another method, you can skip these commands.

.. code-block:: shell

    LEN=$(wc -c $FN | cut -f 1 -d ' ')

    curl -kvu $CREDS https://$IP/mgmt/shared/file-transfer/uploads/$FN -H 'Content-Type: application/octet-stream' -H "Content-Range: 0-$((LEN - 1))/$LEN" -H "Content-Length: $LEN" -H 'Connection: keep-alive' --data-binary @$FN

|

Copy the following commands to install the package.

.. code-block:: shell

    DATA="{\"operation\":\"INSTALL\",\"packageFilePath\":\"/var/config/rest/downloads/$FN\"}"


    curl -kvu $CREDS "https://$IP/mgmt/shared/iapp/package-management-tasks" -H "Origin: https://$IP" -H 'Content-Type: application/json;charset=UTF-8' --data $DATA

|

Updating Telemetry Streaming
````````````````````````````
When F5 releases a new version of Telemetry Streaming, use the same procedure you used to initially install the RPM. For example, if you used the Configuration utility, when you click Import and then select the new RPM, the system recognizes you are upgrading Telemetry:


Reverting to a previous version of Telemetry Streaming
``````````````````````````````````````````````````````
If for any reason you want to revert to a previous version of Telemetry Streaming, you must first remove the version of Telemetry Streaming on your BIG-IP system (:guilabel:`iApps > Package Management LX > f5-telemetry > Uninstall`).  After you uninstall, you can import the RPM for the version of Telemetry Streaming you want to use.

.. |github| raw:: html

   <a href="https://github.com/F5Networks/f5-telemetry-streaming" target="_blank">F5 Telemetry site on GitHub</a>

|

.. _hash-ref:

Verifying the integrity of the Telemetry RPM package
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
F5 Networks provides a checksum for each of our Telemetry Streaming releases so you can confirm the integrity of the RPM package.

You can get a checksum for a particular template by running one of the following commands, depending on your operating system:

Linux: ``sha256sum <path_to_template>``

Windows using CertUtil: ``CertUtil –hashfile <path_to_template> SHA256``

You can compare the checksum produced by that command against the **.sha256** file in the **dist** directory (https://github.com/F5Networks/f5-telemetry-streaming/tree/master/dist).
