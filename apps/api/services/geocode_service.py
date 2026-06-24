"""
Geocode service: resolve CEP → (lat, lng) via Nominatim (OpenStreetMap).
In-memory cache + Haversine distance calculation.
"""

import asyncio
import logging
import math
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "WhymeApp/1.0 (matching-service)"
CACHE_TTL = 3600  # 1 hour

# ─── In-memory cache ──────────────────────────────────────────────────────────

_cache: dict[str, tuple[float, float, float]] = {}  # postal_code -> (lat, lng, timestamp)


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in km between two lat/lng points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def geocode(postal_code: str, timeout: float = 3.0) -> Optional[tuple[float, float]]:
    """
    Resolve a postal code to (lat, lng).
    Uses in-memory cache with 1-hour TTL.
    Returns None on any error / not found.
    """
    now = time.time()

    # Cache hit
    if postal_code in _cache:
        lat, lng, ts = _cache[postal_code]
        if now - ts < CACHE_TTL:
            return (lat, lng)

    # Nominatim lookup
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(
                NOMINATIM_URL,
                params={"q": postal_code, "countrycodes": "BR", "format": "json", "limit": 1},
                headers={"User-Agent": USER_AGENT},
            )
            if resp.status_code != 200:
                logger.warning("Nominatim HTTP %s for %s", resp.status_code, postal_code)
                return None

            data = resp.json()
            if not data:
                logger.info("Nominatim no result for %s", postal_code)
                return None

            lat = float(data[0]["lat"])
            lng = float(data[0]["lon"])
            _cache[postal_code] = (lat, lng, now)
            return (lat, lng)

    except asyncio.TimeoutError:
        logger.warning("Nominatim timeout for %s", postal_code)
        return None
    except Exception as exc:
        logger.warning("Nominatim error for %s: %s", postal_code, exc)
        return None


async def distance_km(postal_code_a: str, postal_code_b: str) -> Optional[float]:
    """
    Return distance in km between two postal codes.
    Returns None if either code can't be resolved.
    """
    a = await geocode(postal_code_a)
    b = await geocode(postal_code_b)
    if a is None or b is None:
        return None
    return _haversine(a[0], a[1], b[0], b[1])


def clear_cache():
    """Clear the in-memory geocode cache."""
    _cache.clear()
