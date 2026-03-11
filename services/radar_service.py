from .github_analyzer import analyze_github
from .modelscope_analyzer import analyze_modelscope
from .arxiv_analyzer import analyze_arxiv
from .radar_db import get_radar_cache, save_radar_cache
from .llm import _call_llm
import json
import asyncio
import hashlib
import re


ANALYZER_TIMEOUTS = {
    "github": 22.0,
    "modelscope": 10.0,
    "arxiv": 10.0,
}
def get_cache_key(resume_id: str, github_username: str, modelscope_username: str, arxiv_name: str) -> str:
    # Normalize keys by stripping whitespace and converting to lowercase
    rid = (resume_id or "").strip().lower()
    gh = (github_username or "").strip().lower()
    ms = (modelscope_username or "").strip().lower()
    arxk = (arxiv_name or "").strip().lower()
    key_str = f"{rid}|{gh}|{ms}|{arxk}"
    return hashlib.md5(key_str.encode()).hexdigest()

# Maximum possible scores per dimension defined by spec
MAX_DIMENSION_SCORES = {
    "github_stars": 20,
    "github_commits": 15,
    "github_prs": 15,
    "modelscope_contributions": 20,
    "arxiv_papers": 15
}

async def analyze_ai_talent(resume_id: str, github_username: str = "", modelscope_username: str = "", arxiv_name: str = "") -> dict:
    """
    Orchestrates the AI Talent Radar analysis.
    Returns the structured radar data including scores, dimensions, evidence, and errors.
    """
    # 1. Check Cache (Wrapped in thread to avoid blocking loop during disk IO)
    cache_key = get_cache_key(resume_id, github_username, modelscope_username, arxiv_name)
    cache_hit = await asyncio.to_thread(get_radar_cache, cache_key)
    if cache_hit:
        print(f"Cache hit for resume: {resume_id} (key: {cache_key})")
        return cache_hit

    print(f"Cache miss for {resume_id}. Fetching fresh data...")
    
    # Base default response structures
    default_github = {"dimensions": {"github_stars": 0, "github_commits": 0, "github_prs": 0}, "evidence": [], "errors": []}
    default_modelscope = {"dimensions": {"modelscope_contributions": 0}, "evidence": [], "errors": []}
    default_arxiv = {"dimensions": {"arxiv_papers": 0}, "evidence": [], "errors": []}

    async def run_analyzer(key: str, analyzer_coro, default_payload: dict) -> tuple[str, dict, list[str]]:
        try:
            result = await asyncio.wait_for(analyzer_coro, timeout=ANALYZER_TIMEOUTS[key])
            if not isinstance(result, dict):
                raise ValueError("Analyzer returned invalid payload")
            result.setdefault("errors", [])
            return key, result, list(result.get("errors", []))
        except asyncio.TimeoutError:
            print(f"Analyzer timeout for {key}")
            timeout_error = f"{key.upper()} Error: Timeout (Partial data only)"
            timed_out_payload = dict(default_payload)
            timed_out_payload["errors"] = [timeout_error]
            return key, timed_out_payload, [timeout_error]
        except Exception as exc:
            print(f"Analyzer exception for {key}: {exc}")
            analyzer_error = f"{key.upper()} Error: {exc}"
            failed_payload = dict(default_payload)
            failed_payload["errors"] = [analyzer_error]
            return key, failed_payload, [analyzer_error]

    jobs = []
    if github_username:
        jobs.append(run_analyzer("github", analyze_github(github_username), default_github))
    if modelscope_username:
        jobs.append(run_analyzer("modelscope", analyze_modelscope(modelscope_username), default_modelscope))
    if arxiv_name:
        jobs.append(run_analyzer("arxiv", analyze_arxiv(arxiv_name), default_arxiv))

    results_dict = {}
    aggregated_errors = []
    if jobs:
        completed_jobs = await asyncio.gather(*jobs)
        for key, result, errors in completed_jobs:
            results_dict[key] = result
            aggregated_errors.extend(errors)

    # 3. Retrieve results (use default if timeout or exception)
    github_data = results_dict.get("github", default_github)
    modelscope_data = results_dict.get("modelscope", default_modelscope)
    arxiv_data = results_dict.get("arxiv", default_arxiv)

    # 4. Aggregate Dimensions (ensure 5 fixed dimensions)
    dimensions = {
        "github_stars": 0,
        "github_commits": 0,
        "github_prs": 0,
        "modelscope_contributions": 0,
        "arxiv_papers": 0
    }
    dimensions.update(github_data.get("dimensions", {}))
    dimensions.update(modelscope_data.get("dimensions", {}))
    dimensions.update(arxiv_data.get("dimensions", {}))

    # 5. Filter and aggregate evidence
    all_evidence = []
    all_evidence.extend(github_data.get("evidence", []))
    all_evidence.extend(modelscope_data.get("evidence", []))
    all_evidence.extend(arxiv_data.get("evidence", []))

    # Calculate a normalized total score (scale 0-100)
    raw_total = sum(dimensions.values())
    max_total = sum(MAX_DIMENSION_SCORES.values()) # 85.0
    total_score = int((raw_total / max_total) * 100) if raw_total > 0 else 0
    total_score = min(100, max(0, total_score))

    final_result = {
        "total_score": total_score,
        "dimensions": dimensions,
        "evidence": all_evidence,
        "errors": aggregated_errors,
        "degraded": len(aggregated_errors) > 0
    }

    # 6. Save healthy results to Cache (skip degraded responses to avoid freezing transient failures)
    if not final_result["degraded"]:
        await asyncio.to_thread(save_radar_cache, cache_key, total_score, dimensions, all_evidence, aggregated_errors, False)

    return final_result

async def generate_ai_interview_questions(resume_id: str, radar_data: dict) -> list:
    """
    Generates AI-specific interview questions based on the radar evidence.
    Runs technical LLM call in a background thread to prevent blocking the event loop.
    """
    evidence_str = json.dumps(radar_data.get("evidence", []), ensure_ascii=False, indent=2)
    prompt = f"""
    Based on the following evidence of a candidate's AI open-source and research contributions:
    {evidence_str}

    Generate 3 specific, highly technical interview questions to ask this candidate.
    Return ONLY a JSON array of strings, where each string is a question. Nothing else.
    """

    messages = [
        {"role": "system", "content": "You are an expert AI engineering interviewer."},
        {"role": "user", "content": prompt}
    ]

    try:
        # Prevent event loop blocking and add a hard 6.0s timeout for LLM safety
        llm_timeout = 5.0
        response = await asyncio.wait_for(
            asyncio.to_thread(_call_llm, messages, llm_timeout, False),
            timeout=llm_timeout + 0.5
        )
        if not response or response.strip() == "{}":
            raise ValueError("Empty LLM response")
        # Robustly extract JSON array using non-greedy regex
        match = re.search(r'\[.*?\]', response, re.DOTALL)
        if match:
            questions = json.loads(match.group(0))
            if isinstance(questions, list) and questions:
                return [str(q) for q in questions]
        
        # Fallback if regex fails but response looks like a dict or single string
        cleaned = response.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        if isinstance(parsed, list) and parsed:
            return [str(q) for q in parsed]
        if isinstance(parsed, dict) and parsed:
            return [str(q) for q in parsed.values() if str(q).strip()]
        raise ValueError("No questions parsed from LLM response")
    except asyncio.TimeoutError:
        print(f"LLM Timeout generating questions for {resume_id}")
        return [
            "Could you explain your recent AI open-source contributions?", 
            "What was the most challenging part of your published research?",
            "How do you evaluate and optimize the performance of the AI models you work with?"
        ]
    except Exception as e:
        print(f"Failed to generate questions: {e}")
        return [
            "Could you explain your recent AI open-source contributions?", 
            "What was the most challenging part of your published research?",
            "How do you evaluate and optimize the performance of the AI models you work with?"
        ]
