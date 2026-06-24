import logging
from pathlib import Path
from string import Template

logger = logging.getLogger(__name__)

_TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"
_cache: dict[str, str] = {}


def _load_raw(name: str) -> str:
    if name not in _cache:
        _cache[name] = (_TEMPLATES_DIR / name).read_text(encoding="utf-8")
    return _cache[name]


def render_template(template_name: str, context: dict) -> str:
    if "/" in template_name or "\\" in template_name or ".." in template_name:
        raise ValueError(f"Invalid template name: {template_name!r}")

    content_html = Template(_load_raw(template_name)).safe_substitute(context)
    base_html = Template(_load_raw("base.html")).safe_substitute(
        {**context, "content": content_html}
    )
    return base_html
