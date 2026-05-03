import logging

import httpx

from config import API_BASE_URL

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
_MAX_RETRIES = 3


async def _request(method: str, path: str, **kwargs) -> dict:
    url = f"{API_BASE_URL}{path}"
    last_exc: Exception | None = None

    for attempt in range(_MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await getattr(client, method)(url, **kwargs)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "HTTP %s on %s (attempt %d/%d): %s",
                exc.response.status_code, url, attempt + 1, _MAX_RETRIES, exc.response.text,
            )
            raise
        except httpx.RequestError as exc:
            last_exc = exc
            logger.warning("Request error on %s (attempt %d/%d): %s", url, attempt + 1, _MAX_RETRIES, exc)

    raise last_exc  # type: ignore[misc]


async def create_anonymous_candidate() -> dict:
    return await _request("post", "/candidates/anonymous")


async def create_interview(candidate_id: str) -> dict:
    return await _request("post", "/interviews", json={"candidate_id": candidate_id})


async def update_interview_status(interview_id: str, new_status: str) -> dict:
    return await _request("patch", f"/interviews/{interview_id}/status", json={"status": new_status})


async def save_ocean_scores(interview_id: str, ocean_scores: dict) -> dict:
    return await _request("patch", f"/interviews/{interview_id}/scores", json={"ocean_scores": ocean_scores})
