import asyncio
import re
from collections import Counter
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse

import httpx


MODELSCOPE_BASE_URL = "https://modelscope.cn"
MODELSCOPE_TIMEOUT = 4.0


def _default_response() -> Dict[str, Any]:
    return {"dimensions": {"modelscope_contributions": 0}, "evidence": [], "errors": []}


def _extract_identifier(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""

    if raw.startswith("@"):
        raw = raw[1:]

    if raw.startswith("http://") or raw.startswith("https://"):
        parsed = urlparse(raw)
        if "modelscope.cn" in parsed.netloc.lower():
            parts = [part for part in parsed.path.split("/") if part]
            if parts and parts[0] == "profile" and len(parts) > 1:
                return parts[1].strip()
    return raw


def _candidate_identifiers(value: str) -> List[str]:
    base = _extract_identifier(value)
    if not base:
        return []

    variants = [base, base.lower(), base.capitalize()]
    if re.search(r"\s+", base):
        words = [part for part in re.split(r"\s+", base) if part]
        compact = "".join(words)
        title_compact = "".join(word[:1].upper() + word[1:] for word in words)
        variants.extend([compact, compact.lower(), title_compact])

    deduped: List[str] = []
    for item in variants:
        normalized = item.strip()
        if normalized and normalized not in deduped:
            deduped.append(normalized)
    return deduped


async def _fetch_profile(client: httpx.AsyncClient, identifier: str) -> Tuple[Dict[str, Any] | None, str | None]:
    try:
        response = await client.get(f"{MODELSCOPE_BASE_URL}/api/v1/profile/{identifier}", timeout=MODELSCOPE_TIMEOUT)
        if response.status_code in {404, 500}:
            return None, None
        response.raise_for_status()
        payload = response.json()
        if not payload.get("Success"):
            return None, None
        return payload.get("Data") or {}, None
    except Exception as exc:
        return None, str(exc)


async def _search_namespace_from_query(client: httpx.AsyncClient, query: str) -> str | None:
    try:
        response = await client.get(
            f"{MODELSCOPE_BASE_URL}/api/v1/dolphin/agg/query",
            params={"Query": query},
            timeout=MODELSCOPE_TIMEOUT,
        )
        response.raise_for_status()
        payload = response.json()
        raw_items = []
        if isinstance(payload, dict):
            data = payload.get("Data") or payload.get("data") or {}
            if isinstance(data, dict):
                for key in ["Models", "models", "Items", "items"]:
                    if isinstance(data.get(key), list):
                        raw_items = data[key]
                        break
        namespaces = []
        for item in raw_items[:10]:
            repo_name = item.get("Name") or item.get("name") or item.get("Path") or ""
            if "/" in repo_name:
                namespace = repo_name.split("/", 1)[0].strip()
                if namespace:
                    namespaces.append(namespace)
        if namespaces:
            namespace, count = Counter(namespaces).most_common(1)[0]
            return namespace if count >= 2 else None
    except Exception:
        return None
    return None


def _extract_counts(profile_data: Dict[str, Any]) -> Tuple[int, int, int, int]:
    model_count = int(((profile_data.get("Model") or {}).get("TotalCount")) or 0)
    dataset_count = int(((profile_data.get("Dataset") or {}).get("TotalCount")) or 0)
    studio_count = int(((profile_data.get("Studio") or {}).get("TotalCount")) or 0)
    star_count = int(((profile_data.get("User") or {}).get("Stars")) or 0)
    return model_count, dataset_count, studio_count, star_count


def _build_score(model_count: int, dataset_count: int, studio_count: int, star_count: int) -> int:
    return min(20, (model_count * 2) + dataset_count + studio_count + min(5, star_count // 10))


async def analyze_modelscope(username: str) -> Dict[str, Any]:
    """
    Fetch and analyze ModelScope public profile signals.
    Accepts exact username or profile URL; for brand-like queries, tries a best-effort namespace inference.
    """
    default_resp = _default_response()
    identifiers = _candidate_identifiers(username)
    if not identifiers:
        return default_resp

    errors: List[str] = []
    async with httpx.AsyncClient(timeout=MODELSCOPE_TIMEOUT, headers={"User-Agent": "JobOS/AI-Radar"}) as client:
        profile_data: Dict[str, Any] | None = None
        chosen_identifier = identifiers[0]

        for identifier in identifiers:
            data, error = await _fetch_profile(client, identifier)
            if error:
                errors.append(f"ModelScope: {error}")
                continue
            if data is not None:
                chosen_identifier = identifier
                profile_data = data
                break

        if profile_data is None:
            inferred_namespace = await _search_namespace_from_query(client, username)
            if inferred_namespace:
                data, error = await _fetch_profile(client, inferred_namespace)
                if error:
                    errors.append(f"ModelScope: {error}")
                elif data is not None:
                    chosen_identifier = inferred_namespace
                    profile_data = data

        if profile_data is None:
            default_resp["errors"] = [
                "ModelScope: 未找到可验证的魔搭个人主页。请填写准确的魔搭用户名或个人主页链接。"
            ]
            return default_resp

        model_count, dataset_count, studio_count, star_count = _extract_counts(profile_data)
        if model_count == 0 and dataset_count == 0 and studio_count == 0 and star_count == 0:
            return default_resp

        score = _build_score(model_count, dataset_count, studio_count, star_count)
        evidence = [{
            "dimension": "modelscope_contributions",
            "original_text": f"魔搭公开资产：模型 {model_count} 个、数据集 {dataset_count} 个、创空间 {studio_count} 个、获赞 {star_count} 次。",
            "source_link": f"{MODELSCOPE_BASE_URL}/profile/{chosen_identifier}",
            "analysis": "根据魔搭公开个人主页的模型、数据集、创空间和获赞数据估算模型社区贡献度。",
        }]
        return {
            "dimensions": {"modelscope_contributions": score},
            "evidence": evidence,
            "errors": [],
        }
