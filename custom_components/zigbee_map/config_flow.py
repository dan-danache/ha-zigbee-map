"""Config flow for Zigbee Map."""

import logging
import voluptuous as vol

from homeassistant import config_entries

from .const import DOMAIN
from .helpers.translation import localize
from .options_flow import ZigbeeMapOptionsFlowHandler

_LOGGER = logging.getLogger(__name__)


class ZigbeeMapConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Zigbee Map."""

    VERSION = 3

    async def async_step_user(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="user",
                data_schema=vol.Schema(
                    {
                        vol.Optional("enable_map", default=True): bool,
                        vol.Optional("enable_log", default=False): bool,
                        vol.Optional(
                            "websocket_url", description={"suggested_value": ""}
                        ): str,
                    }
                ),
            )

        # Ensure empty string is stored when user clears the field
        user_input["websocket_url"] = user_input.get("websocket_url", "").strip()

        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        title = await localize(self.hass, "config.entry_title", "Zigbee Panels")
        return self.async_create_entry(title=title, data=user_input)

    @staticmethod
    def async_get_options_flow(config_entry):
        return ZigbeeMapOptionsFlowHandler()
