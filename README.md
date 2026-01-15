# Zigbee Map

[![Latest release](https://badgers.space/codeberg/release/dan-danache/ha-zigbee-map)](https://codeberg.org/dan-danache/ha-zigbee-map/releases)

**Zigbee Map** is a custom panel for Home Assistant that provides a dynamic, real-time visualization of your Zigbee mesh network by actively querying connected devices.

## Screenshots

![Zigbee graph](img/screenshot-1.png 'Zigbee Map')

![Devices list](img/screenshot-2.png 'Zigbee Map')

![Zigbee log](img/screenshot-3.png 'Zigbee Log')

## Requirements

Zigbee Map works with Zigbee2MQTT installations that expose a WebSocket API.

You can use it in two ways:

1. **Automatic mode**: Zigbee2MQTT installed as a Home Assistant Add-on
   The integration automatically detects the WebSocket URL through the Supervisor API.

1. **Manual mode**: Zigbee2MQTT running outside Home Assistant
   You can manually enter the WebSocket URL in the Zigbee Map configuration options.

## Features

Zigbee Map connects to your Zigbee2MQTT instance through its WebSocket interface.

When running as an add-on, the WebSocket URL is auto-detected.
When running externally, you can manually specify the WebSocket URL in the integration options.

It deploys an external extension into Zigbee2MQTT to enable direct communication with Zigbee devices.

The app retrieves the full list of Zigbee devices, including the coordinator, repeaters and end-devices.

It then queries the Zigbee coordinator device for Link Quality Indicator (LQI) data, which includes:

- The list of neighbors (repeaters) and children (end-devices).
- Each entry includes its LQI value (range: 0-255).

All repeater devices are added to a processing queue, where each repeater is queried for its own neighbor data, recursively expanding the network map.

End-devices are skipped, as they are likely sleeping and unable to respond to queries.

As data is collected, a visual graph is built:

- Nodes represent devices:
    - Blue nodes = Repeaters, usually mains-powered.
    - Green nodes = End-devices, usually battery-powered.
    - Magenta = Repeaters that might be out of range, powered off, or not responding to LQI queries.

- Links represent radio connections between devices; link colors indicate signal quality (LQI) between devices:
    - Green and Cyan links = strong connections.
    - Red and Violet links = weaker connections; consider adding more repeaters.

The mapping process completes once all repeaters have been queried and the processing queue is empty.

## Interpreting LQI Values

LQI (Link Quality Index) values are often unreliable for troubleshooting Zigbee communication issues. Although they are presented as positive
numbers (ranging from 0 to 255), with higher values generally indicating better link quality, the lack of standardization across Zigbee stacks
and device manufacturers makes them difficult to interpret consistently.

Different vendors calculate LQI in different ways, which may not be relevant to the overall network performance. For example, Silicon Labs
and Texas Instruments use different scaling methods, and environmental interference can skew the results, making them less meaningful for
assessing overall network health.

That said, while comparing LQI values across different devices is generally not useful, you can still use the values reported by the same
device to evaluate relative signal quality toward its neighboring devices. This approach can help identify weak links or potential routing
issues within that device's local mesh.

## Installation

You can install the Zigbee Map custom panel using one of the following methods:

### Manual Installation (Recommended)

1. Download the [zigbee-map-panel.js](https://codeberg.org/dan-danache/ha-zigbee-map/raw/branch/master/custom_components/zigbee_map/panel/dist/zigbee-map-panel.js)
   and [zigbee-log-panel.js](https://codeberg.org/dan-danache/ha-zigbee-map/raw/branch/master/custom_components/zigbee_map/panel/dist/zigbee-log-panel.js) panel scripts.

1. Place them into `config/www` (create the `www` directory if it does not exist).

1. Add the following configuration to your `config/configuration.yaml` file:

    ```yaml
    panel_custom:
      - name: zigbee-map-panel
          url_path: zigbee-map
          module_url: /local/zigbee-map-panel.js
          sidebar_title: Zigbee Map
          sidebar_icon: mdi:hub

      - name: zigbee-log-panel
          url_path: zigbee-log
          module_url: /local/zigbee-log-panel.js
          sidebar_title: Zigbee Log
          sidebar_icon: mdi:list-box-outline
    ```

1. Restart Home Assistant.

1. The **Zigbee Map** and **Zigbee Log** panels should now appear in your sidebar.

#### Connecting to Zigbee2MQTT instances not installed as an add‑on

If your Zigbee2MQTT installation is running outside Home Assistant (Docker, another machine, etc.), the integration cannot auto‑detect the WebSocket URL. You must manually specify it:

```yaml
panel_custom:
    - name: zigbee-map-panel
      url_path: zigbee-map
      module_url: /local/zigbee-map-panel.js
      sidebar_title: Zigbee Map
      sidebar_icon: mdi:hub
      config:
          websocket-url: ws://192.168.1.200:8099/api?token=abc123

    - name: zigbee-log-panel
      url_path: zigbee-log
      module_url: /local/zigbee-log-panel.js
      sidebar_title: Zigbee Log
      sidebar_icon: mdi:list-box-outline
      config:
          websocket-url: ws://192.168.1.200:8099/api?token=abc123
```

### Automatic Installation (via GPM)

If you'd prefer not to manually edit configuration files, you can install the Zigbee Map integration using [GPM (Git Package Manager)](https://github.com/tomasbedrich/gpm). This method also enables automatic updates.

> Note: Zigbee Map is not available via HACS, as HACS only supports GitHub repositories and Zigbee Map is hosted on [Codeberg](https://codeberg.org/).

Steps to Install via GPM

1. Navigate to **Settings** → **Devices & services** → **GPM**

1. Click **Add entry**

1. Paste the repository URL: `https://codeberg.org/dan-danache/ha-zigbee-map`

1. Click **Submit**

1. Restart Home Assistant

1. Go back to **Settings** → **Devices & services**

1. Click **Add integration** (bottom right corner)

1. Search for **Zigbee Map** and select it

1. Click **Submit**, then **Finish**

1. The panel(s) should now appear in your sidebar

#### Connecting to Zigbee2MQTT instances not installed as an add‑on

If your Zigbee2MQTT installation is running outside Home Assistant (Docker, another machine, etc.), the integration cannot auto‑detect the WebSocket URL. You must manually specify it:

1. Go to **Settings** → **Devices & services**

1. Open the **Zigbee Map** integration

1. Click the **Configure** icon

1. Enter the correct details in the **Zigbee2MQTT WebSocket URL** field.
   Examples:
    - `ws://192.168.1.50:9001`
    - `ws://192.168.1.200:8099/api?token=abc123`

1. Click **Submit**

> Note: Leaving the **Zigbee2MQTT WebSocket URL** field empty switches the integration back to auto‑detect mode, which only works when Zigbee2MQTT is installed as a Home Assistant add‑on.

---

[<img src="https://codeberg.org/dan-danache/hubitat/raw/branch/main/bmac.png" alt="Buy Me A Coffee">](https://www.buymeacoffee.com/dandanache)
