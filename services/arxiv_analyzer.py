import re
import xml.etree.ElementTree as ET
from typing import Any, Dict, List

import httpx


ARXIV_API = "https://export.arxiv.org/api/query"
ARXIV_TIMEOUT = 4.0


def _format_error(exc: Exception) -> str:
    message = str(exc).strip()
    return message or exc.__class__.__name__


def _normalize_name(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _author_matches(query: str, authors: List[str]) -> bool:
    normalized_query = _normalize_name(query)
    if not normalized_query:
        return False

    query_parts = normalized_query.split()
    query_last = query_parts[-1]
    query_first = query_parts[0]

    for author in authors:
        normalized_author = _normalize_name(author)
        if normalized_author == normalized_query:
            return True
        author_parts = normalized_author.split()
        if not author_parts:
            continue
        author_last = author_parts[-1]
        author_first = author_parts[0]
        if author_last == query_last and (author_first == query_first or author_first.startswith(query_first[:1])):
            return True
    return False


def _parse_entries(xml_text: str) -> List[Dict[str, Any]]:
    root = ET.fromstring(xml_text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    entries = []
    for entry in root.findall("atom:entry", ns):
        title_node = entry.find("atom:title", ns)
        id_node = entry.find("atom:id", ns)
        authors = [
            (author.find("atom:name", ns).text or "").strip()
            for author in entry.findall("atom:author", ns)
            if author.find("atom:name", ns) is not None
        ]
        entries.append({
            "title": title_node.text.replace("\n", " ").strip() if title_node is not None and title_node.text else "Unknown Title",
            "link": id_node.text.strip() if id_node is not None and id_node.text else "",
            "authors": authors,
        })
    return entries


async def _fetch_entries(search_query: str, max_results: int) -> List[Dict[str, Any]]:
    async with httpx.AsyncClient(timeout=ARXIV_TIMEOUT) as client:
        response = await client.get(ARXIV_API, params={
            "search_query": search_query,
            "max_results": max_results,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
        })
        response.raise_for_status()
    return _parse_entries(response.text)


async def analyze_arxiv(author_name: str) -> Dict[str, Any]:
    """
    Search arXiv by author with a friendly fuzzy fallback:
    1. exact author query
    2. surname query + author-name filtering
    """
    default_resp = {"dimensions": {"arxiv_papers": 0}, "evidence": [], "errors": []}
    if not author_name:
        return default_resp

    normalized_author = _normalize_name(author_name)
    if not normalized_author:
        return default_resp

    try:
        entries = await _fetch_entries(f'au:"{author_name}"', 5)

        if not entries:
            surname = normalized_author.split()[-1]
            fallback_entries = await _fetch_entries(f"au:{surname}", 12)
            entries = [entry for entry in fallback_entries if _author_matches(author_name, entry["authors"])]

        if not entries:
            return default_resp

        paper_count = len(entries)
        score = min(15, paper_count * 3)
        top_entry = entries[0]
        evidence = [{
            "dimension": "arxiv_papers",
            "original_text": "arXiv \u8bba\u6587\uff1a" + top_entry["title"],
            "source_link": top_entry["link"] or ARXIV_API,
            "analysis": "\u6839\u636e\u4f5c\u8005\u5339\u914d\u7ed3\u679c\u8bc6\u522b\u5230\u516c\u5f00\u8bba\u6587\u8bb0\u5f55\uff0c\u4f5c\u8005\u540d\u5339\u914d\u4e3a\uff1a" + author_name + "\u3002",
        }]

        return {
            "dimensions": {"arxiv_papers": score},
            "evidence": evidence,
            "errors": [],
        }

    except Exception as exc:
        print(f"ArXiv Analyzer Error for {author_name}: {exc}")
        default_resp["errors"] = [f"ArXiv: {_format_error(exc)}"]
        return default_resp
