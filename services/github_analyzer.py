import asyncio
import os
from typing import Any, Dict, List

import httpx


def _default_response() -> Dict[str, Any]:
    return {
        "dimensions": {"github_stars": 0, "github_commits": 0, "github_prs": 0},
        "evidence": [],
        "errors": [],
    }


def _format_error(exc: Exception) -> str:
    message = str(exc).strip()
    return message or exc.__class__.__name__


async def _fetch_json(client: httpx.AsyncClient, url: str, *, timeout: float, params: dict | None = None) -> Any:
    response = await client.get(url, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()


async def analyze_github(username: str) -> Dict[str, Any]:
    """
    Fetch and analyze GitHub contributions for a given username.
    Returns dimensions (scores), evidence, and non-fatal errors.
    """
    default_resp = _default_response()
    if not username:
        return default_resp

    try:
        github_token = os.environ.get("GITHUB_TOKEN")
        headers = {"Accept": "application/vnd.github.v3+json"}
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        async with httpx.AsyncClient(headers=headers) as client:
            errors: List[str] = []

            try:
                user_data = await _fetch_json(
                    client,
                    f"https://api.github.com/users/{username}",
                    timeout=3.0,
                )
            except Exception as exc:
                print(f"GitHub User API failed for {username}: {exc}")
                exc_text = _format_error(exc)
                err_msg = "GitHub User API rate limit exceeded" if "403" in exc_text else exc_text
                default_resp["errors"] = [f"GitHub Profile: {err_msg}"]
                return default_resp

            public_repos_count = int(user_data.get("public_repos", 0) or 0)

            repo_tasks = [
                asyncio.create_task(
                    _fetch_json(
                        client,
                        f"https://api.github.com/users/{username}/repos",
                        params={"per_page": 100, "page": 1, "type": "owner", "sort": "updated"},
                        timeout=3.0,
                    )
                )
            ]
            if public_repos_count > 100:
                repo_tasks.append(
                    asyncio.create_task(
                        _fetch_json(
                            client,
                            f"https://api.github.com/users/{username}/repos",
                            params={"per_page": 100, "page": 2, "type": "owner", "sort": "updated"},
                            timeout=3.0,
                        )
                    )
                )

            events_task = asyncio.create_task(
                _fetch_json(
                    client,
                    f"https://api.github.com/users/{username}/events/public",
                    params={"per_page": 100},
                    timeout=3.0,
                )
            )
            prs_task = asyncio.create_task(
                _fetch_json(
                    client,
                    "https://api.github.com/search/issues",
                    params={"q": f"type:pr author:{username}"},
                    timeout=3.0,
                )
            )

            repos: List[dict] = []
            try:
                repo_results = await asyncio.gather(*repo_tasks, return_exceptions=True)
                for repo_result in repo_results:
                    if isinstance(repo_result, Exception):
                        raise repo_result
                    repos.extend(repo_result)
                if public_repos_count > 200:
                    errors.append("GitHub stars may be incomplete (only first 200 owner repos scanned).")
            except Exception as repo_exc:
                print(f"GitHub Repos API failed for {username}: {repo_exc}")
                errors.append(f"GitHub Stars: {_format_error(repo_exc)}")

            recent_commit_count = -1
            try:
                events_data = await events_task
                recent_commit_count = sum(
                    len((event.get("payload") or {}).get("commits") or [])
                    for event in events_data
                    if event.get("type") == "PushEvent"
                )
            except Exception as commit_exc:
                print(f"GitHub Events API failed for {username}: {commit_exc}")
                errors.append(f"GitHub Commits: {_format_error(commit_exc)}")

            real_prs = -1
            try:
                pr_data = await prs_task
                real_prs = int(pr_data.get("total_count", 0) or 0)
            except Exception as pr_exc:
                print(f"GitHub PR Search failed for {username}: {pr_exc}")
                errors.append(f"GitHub PRs: {_format_error(pr_exc)}")

            stars = sum((repo.get("stargazers_count", 0) or 0) for repo in repos)
            score_stars = min(20, stars)
            score_commits = min(15, recent_commit_count) if recent_commit_count >= 0 else 0
            score_prs = min(15, real_prs) if real_prs >= 0 else 0

            evidence = []
            if stars > 0:
                top_repos = sorted(repos, key=lambda repo: repo.get("stargazers_count", 0), reverse=True)[:3]
                repo_list_str = ", ".join(
                    f"{repo.get('name', 'unknown')} ({repo.get('stargazers_count', 0)} stars)"
                    for repo in top_repos
                )
                evidence.append({
                    "dimension": "github_stars",
                    "original_text": f"Top public repositories: {repo_list_str}",
                    "source_link": f"https://github.com/{username}?tab=repositories",
                    "analysis": "Aggregated stargazers across the user's public owner repositories.",
                })

            if recent_commit_count > 0:
                evidence.append({
                    "dimension": "github_commits",
                    "original_text": f"Recent public push activity includes {recent_commit_count} commits across the latest 100 public events.",
                    "source_link": f"https://github.com/{username}",
                    "analysis": "Measures recent public coding activity instead of unreliable lifetime commit search totals.",
                })

            if real_prs > 0:
                evidence.append({
                    "dimension": "github_prs",
                    "original_text": f"Has {real_prs} pull requests created on GitHub.",
                    "source_link": f"https://github.com/pulls?q=is%3Apr+author%3A{username}",
                    "analysis": "Verified contribution activity across pull requests authored by the candidate.",
                })

            if public_repos_count > 200:
                evidence.append({
                    "dimension": "github_stars",
                    "original_text": "Star aggregation is capped at the first 200 owner repositories.",
                    "source_link": f"https://github.com/{username}?tab=repositories",
                    "analysis": "This cap keeps latency bounded, but may slightly undercount stars for very large profiles.",
                })

            return {
                "dimensions": {
                    "github_stars": score_stars,
                    "github_commits": score_commits,
                    "github_prs": score_prs,
                },
                "evidence": evidence,
                "errors": errors,
            }

    except Exception as exc:
        print(f"GitHub Analyzer Error for {username}: {exc}")
        default_resp["errors"] = [f"GitHub critical: {_format_error(exc)}"]
        return default_resp
