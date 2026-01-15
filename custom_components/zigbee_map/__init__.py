"""Initialize Zigbee Map integration."""

import logging
import os

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import frontend, panel_custom
from homeassistant.helpers import translation
from homeassistant.loader import async_get_integration

from .const import DOMAIN
from .helpers.translation import localize

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """YAML-mode setup (no-op)."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the Zigbee panels from a UI config entry."""
    _LOGGER.info("Setting up %s entry %s", DOMAIN, entry.entry_id)
    integration = await async_get_integration(hass, entry.domain)

    static_dir = os.path.join(os.path.dirname(__file__), "panel", "dist")

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                url_path=f"/api/panel_custom/{DOMAIN}",
                path=static_dir,
                cache_headers=False,
            )
        ]
    )

    data = {**entry.data, **entry.options}

    # Remove any existing panels to avoid overwrite errors
    if "zigbee-map" in hass.data.get(DOMAIN, {}):
        frontend.async_remove_panel(hass, "zigbee-map")
        hass.data[DOMAIN].pop("zigbee-map", None)
    if "zigbee-log" in hass.data.get(DOMAIN, {}):
        frontend.async_remove_panel(hass, "zigbee-log")
        hass.data[DOMAIN].pop("zigbee-log", None)

    # Register panels based on options
    map_title = await localize(hass, "panel.map", "Zigbee Map")
    log_title = await localize(hass, "panel.log", "Zigbee Log")

    # Build shared config for both panels
    panel_config = {}
    websocket_url = data.get("websocket_url", "") or ""
    if websocket_url:
        panel_config["websocket-url"] = websocket_url

    if data.get("enable_map"):
        await panel_custom.async_register_panel(
            hass,
            webcomponent_name="zigbee-map-panel",
            frontend_url_path="zigbee-map",
            module_url=f"/api/panel_custom/{DOMAIN}/zigbee-map-panel.js?v={integration.version}",
            sidebar_title=map_title,
            sidebar_icon="mdi:hub",
            require_admin=True,
            config=panel_config,
            config_panel_domain=DOMAIN,
        )
        hass.data.setdefault(DOMAIN, {})["zigbee-map"] = True
        _LOGGER.info(
            "Registered Zigbee Map panel (websocket_url=%s)",
            websocket_url if websocket_url else "auto-detect",
        )

    if data.get("enable_log"):
        await panel_custom.async_register_panel(
            hass,
            webcomponent_name="zigbee-log-panel",
            frontend_url_path="zigbee-log",
            module_url=f"/api/panel_custom/{DOMAIN}/zigbee-log-panel.js?v={integration.version}",
            sidebar_title=log_title,
            sidebar_icon="mdi:list-box-outline",
            require_admin=True,
            config=panel_config,
            config_panel_domain=DOMAIN,
        )
        hass.data.setdefault(DOMAIN, {})["zigbee-log"] = True
        _LOGGER.info(
            "Registered Zigbee Log panel (websocket_url=%s)",
            websocket_url if websocket_url else "auto-detect",
        )

    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading %s entry %s", DOMAIN, entry.entry_id)

    # Remove panels only if registered
    if "zigbee-map" in hass.data.get(DOMAIN, {}):
        frontend.async_remove_panel(hass, "zigbee-map")
        hass.data[DOMAIN].pop("zigbee-map", None)
    if "zigbee-log" in hass.data.get(DOMAIN, {}):
        frontend.async_remove_panel(hass, "zigbee-log")
        hass.data[DOMAIN].pop("zigbee-log", None)

    hass.data.pop(DOMAIN, None)
    return True


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload integration when options change."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Migrate old entry data to new format with options."""
    _LOGGER.info(
        "Migrating %s entry %s from version %s", DOMAIN, entry.entry_id, entry.version
    )

    if entry.version < 2:
        new_options = dict(entry.options)
        if "enable_map" not in new_options:
            new_options["enable_map"] = True
        if "enable_log" not in new_options:
            new_options["enable_log"] = False

        hass.config_entries.async_update_entry(entry, options=new_options, version=2)
        _LOGGER.info("Migration to version 2 successful")

    if entry.version < 3:
        new_options = dict(entry.options)
        if "websocket_url" not in new_options:
            new_options["websocket_url"] = ""

        hass.config_entries.async_update_entry(entry, options=new_options, version=3)
        _LOGGER.info("Migration to version 3 successful")

    return True
