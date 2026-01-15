import logging
from homeassistant.helpers import translation
from homeassistant.core import HomeAssistant
from ..const import DOMAIN


async def localize(hass: HomeAssistant, key: str, default: str) -> str:
    """Resolve a localized string for this integration."""

    strings = await translation.async_get_translations(
        hass, hass.config.language, key.split(".", 1)[0], [DOMAIN], False
    )
    return strings.get(f"component.{DOMAIN}.{key}", default)
