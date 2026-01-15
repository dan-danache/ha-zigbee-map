"""Options flow for Zigbee Panels."""

import voluptuous as vol
from homeassistant import config_entries
from .const import DOMAIN


class ZigbeeMapOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle options for Zigbee Map."""

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        if user_input is not None:
            user_input["websocket_url"] = user_input.get("websocket_url", "").strip()
            return self.async_create_entry(title="", data=user_input)

        options = self.config_entry.options
        data = self.config_entry.data

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        "enable_map",
                        default=options.get("enable_map", data.get("enable_map", True)),
                    ): bool,
                    vol.Optional(
                        "enable_log",
                        default=options.get(
                            "enable_log", data.get("enable_log", False)
                        ),
                    ): bool,
                    vol.Optional(
                        "websocket_url",
                        description={
                            "suggested_value": options.get(
                                "websocket_url", data.get("websocket_url", "")
                            )
                        },
                    ): str,
                }
            ),
        )
