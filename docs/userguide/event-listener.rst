.. _eventlistener-ref:

Event Listener
--------------

Telemetry Streaming collects event logs from all BIG-IP sources, including LTM, ASM, AFM, and APM.

The Request Logging profile gives you the ability to configure data within a log file for HTTP requests and responses, in accordance with specified parameters.


.. _configurelogpub-ref:

Configure the Log Publisher
```````````````````````````

1. Create a pool in tmsh, replacing the example address with a valid TS listener address, for example, the mgmt IP:

.. code-block:: json

    create ltm pool telemetry-local monitor tcp members replace-all-with { 192.0.2.1:6514 }


2. Create a log destination (Remote HSL):

User interface: :menuselection:`System --> Logs --> Configuration --> Log Destinations`

- Name: telemetry-hsl
- Type: Remote HSL
- Protocol: TCP
- Pool: telemetry-local

TMSH: 

.. code-block:: python

    create sys log-config destination remote-high-speed-log telemetry-hsl protocol tcp pool-name telemetry-local


3. Create a log destination (Format):

User interface: :menuselection:`System --> Logs --> Configuration --> Log Destinations`

- Name: telemetry-formatted
- Forward To: telemetry-hsl

TMSH:

.. code-block:: python

    create sys log-config destination splunk telemetry-formatted forward-to telemetry-hsl


4. Create Log Publisher

User interface: :menuselection:`System --> Logs --> Configuration --> Log Destinations`

- Name: telemetry-publisher
- Destinations: telemetry-formatted

.. code-block:: python

    create sys log-config publisher telemetry-publisher destinations replace-all-with { telemetry-formatted }




LTM Request Log profile
```````````````````````

To configure an LTM request profile, use these tmsh commands:

.. sidebar:: :fonticon:`fa fa-info-circle fa-lg` Note:

  All keys should be in lower case to enable classication (tenant/application).

1. Create a pool in tmsh: 

.. code-block:: python

    create ltm pool telemetry-local monitor tcp members replace-all-with { 192.0.2.1:6514 }

Replace the example address with a valid Telemetry Streaming listener address, for example the mgmt IP.

2. Create an LTM Request Log Profile: 

.. code-block:: python

    create ltm profile request-log telemetry request-log-pool telemetry-local request-log-protocol mds-tcp request-log-template event_source=\"request_logging\",hostname=\"$BIGIP_HOSTNAME\",client_ip=\"$CLIENT_IP\",server_ip=\"$SERVER_IP\",http_method=\"$HTTP_METHOD\",http_uri=\"$HTTP_URI\",virtual_name=\"$VIRTUAL_NAME\" request-logging enabled

3. Attach the profile to the virtual server, for example:

.. NOTE:: The example below shows a snippet of an AS3 declaration.

.. code-block:: python
   :linenos:

    {
      "serviceMain": {
        "class": "Service_HTTP",
        "virtualAddresses": ["192.0.2.1"],
        "virtualPort": 80,
        "profileTrafficLog": {
          "bigip": "/Common/telemetry"
        }
      }
    }


Example Output:

.. code-block:: json
   :linenos:

    {
        "event_source":"request_logging",
        "hostname":"hostname",
        "client_ip":"177.47.192.42",
        "server_ip":"",
        "http_method":"GET",
        "http_uri":"/",
        "virtual_name":"/Common/app.app/app_vs",
        "tenant":"Common",
        "application":"app.app",
        "telemetryEventCategory": "event"
    }


AFM Request Log profile
```````````````````````

1. Create and :ref:`configurelogpub-ref`.

2. Create a Security Log Profile in TMSH:

.. code-block:: python
   
   create security log profile telemetry network replace-all-with { telemetry { filter { log-acl-match-drop enabled log-acl-match-reject enabled } publisher telemetry-publisher } }

3. Attach the profile to the virtual server, for example:

.. code-block:: python
   :linenos:

    {
        "serviceMain": {
            "class": "Service_HTTP",
            "virtualAddresses": ["192.0.2.1"],
            "virtualPort": 80,
            "securityLogProfiles": [
                {
                    "bigip": "/Common/telemetry"
                }
            ]
        }
    }


Example output:

.. code-block:: json
   :linenos:

    {
        "acl_policy_name":"/Common/app",
        "acl_policy_type":"Enforced",
        "acl_rule_name":"ping",
        "action":"Reject",
        "hostname":"telemetry.bigip.com",
        "bigip_mgmt_ip":"10.0.1.100",
        "context_name":"/Common/app.app/app_vs",
        "context_type":"Virtual Server",
        "date_time":"Dec 17 2018 22:46:04",
        "dest_fqdn":"unknown",
        "dest_ip":"10.0.2.101",
        "dst_geo":"Unknown",
        "dest_port":"80",
        "device_product":"Advanced Firewall Module",
        "device_vendor":"F5",
        "device_version":"14.0.0.1.0.0.2",
        "drop_reason":"Policy",
        "errdefs_msgno":"23003137",
        "errdefs_msg_name":"Network Event",
        "flow_id":"0000000000000000",
        "ip_protocol":"TCP",
        "severity":"8",
        "partition_name":"Common",
        "route_domain":"0",
        "sa_translation_pool":"",
        "sa_translation_type":"",
        "source_fqdn":"unknown",
        "source_ip":"50.206.82.144",
        "src_geo":"US/Washington",
        "source_port":"62204",
        "source_user":"unknown",
        "source_user_group":"unknown",
        "translated_dest_ip":"",
        "translated_dest_port":"",
        "translated_ip_protocol":"",
        "translated_route_domain":"",
        "translated_source_ip":"",
        "translated_source_port":"",
        "translated_vlan":"",
        "vlan":"/Common/external",
        "send_to_vs":"",
        "tenant":"Common",
        "application":"app.app",
        "telemetryEventCategory":"event"
    }


ASM Log
```````

1. Create a Security Log Profile using TMSH:

.. code-block:: python
   
   create security log profile telemetry application replace-all-with { telemetry { filter replace-all-with { request-type { values replace-all-with { all } } } logger-type remote remote-storage splunk servers replace-all-with { 192.0.2.1:6514 {} } } }

2. Attach the profile to the virtual server, for example:

.. code-block:: json

    {
        "serviceMain": {
            "class": "Service_HTTP",
            "virtualAddresses": ["192.0.2.1"],
            "virtualPort": 80,
            "securityLogProfiles": [
                {
                    "bigip": "/Common/telemetry"
                }
            ]
        }
    }


Example output:

.. code-block:: json
   :linenos:

    {
        "hostname":"hostname",
        "management_ip_address":"10.0.1.4",
        "management_ip_address_2":"",
        "http_class_name":"/Common/app.app/app_policy",
        "web_application_name":"/Common/app.app/app_policy",
        "policy_name":"/Common/app.app/app_policy",
        "policy_apply_date":"2018-11-19 22:17:57",
        "violations":"Evasion technique detected",
        "support_id":"1730614276869062795",
        "request_status":"blocked",
        "response_code":"0",
        "ip_client":"50.206.82.144",
        "route_domain":"0",
        "method":"GET",
        "protocol":"HTTP",
        "query_string":"",
        "x_forwarded_for_header_value":"50.206.82.144",
        "sig_ids":"",
        "sig_names":"",
        "date_time":"2018-11-19 22:34:40",
        "severity":"Critical",
        "attack_type":"Detection Evasion,Path Traversal",
        "geo_location":"US",
        "ip_address_intelligence":"N/A",
        "username":"N/A",
        "session_id":"f609d8a924419638",
        "src_port":"49804",
        "dest_port":"80",
        "dest_ip":"10.0.2.10",
        "sub_violations":"Evasion technique detected:Directory traversals",
        "virus_name":"N/A",
        "violation_rating":"3",
        "websocket_direction":"N/A",
        "websocket_message_type":"N/A",
        "device_id":"N/A",
        "staged_sig_ids":"",
        "staged_sig_names":"",
        "threat_campaign_names":"",
        "staged_threat_campaign_names":"",
        "blocking_exception_reason":"N/A",
        "captcha_result":"not_received",
        "uri":"/directory/file",
        "fragment":"",
        "request":"GET /admin/..%2F..%2F..%2Fdirectory/file HTTP/1.0\\r\\nHost: host.westus.cloudapp.azure.com\\r\\nConnection: keep-alive\\r\\nCache-Control: max-age",
        "tenant":"Common",
        "application":"app.app",
        "telemetryEventCategory": "event"
    }


APM Log
```````

1. Create and :ref:`configurelogpub-ref`.

2. Create an APM Log Profile. For example:

.. code-block:: python
   
   create apm log-setting telemetry access replace-all-with { access { publisher telemetry-publisher } }

3. Attach the profile to the APM policy.

4. Attach the APM policy to the virtual server. For example:

.. code-block:: python
   :linenos:

       {
        "serviceMain": {
            "class": "Service_HTTP",
            "virtualAddresses": ["192.0.2.1"],
            "virtualPort": 80,
            "policyIAM": {
                "bigip": "/Common/my_apm_policy"
            }
        }
    }

Example output:

.. code-block:: json
   :linenos:

    {
        "hostname":"telemetry.bigip.com",
        "errdefs_msgno":"01490102:5:",
        "partition_name":"Common",
        "session_id":"ec7fd55d",
        "Access_Profile":"/Common/access_app",
        "Partition":"Common",
        "Session_Id":"ec7fd55d",
        "Access_Policy_Result":"Logon_Deny",
        "tenant":"Common",
        "application":"",
        "telemetryEventCategory":"event"
    }


System Log
``````````

1. Modify the system syslog configuration by adding a destination:

Using TMSH:

.. code-block:: json

    modify sys syslog remote-servers replace-all-with { server { host 10.0.1.100 remote-port 6515 } }

User interface: :menuselection:`System --> Logs --> Configuration --> Remote Logging`

2. Modify system logging configuration to update what gets logged:

Using TMSH: 

.. code-block:: json

    modify sys daemon-log-settings mcpd audit enabled

User interface: :menuselection:`System --> Logs --> Configuration --> Options`

Example output:

.. code-block:: json
   :linenos:

    {
    "data":"<85>Feb 12 21:39:43 telemetry notice sshd[22277]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=218.92.1.148  user=root",
    "telemetryEventCategory":"event"
    }

