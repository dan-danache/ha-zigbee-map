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

Install using HACS:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=dan-danache&repository=ha-zigbee-map&category=integration)

---

[<img src="https://codeberg.org/dan-danache/hubitat/raw/branch/main/bmac.png" alt="Buy Me A Coffee">](https://www.buymeacoffee.com/dandanache)
