import asyncio
import os
import httpx
from dotenv import load_dotenv
from typing import Dict, Any

# Load env
load_dotenv()

# Import analyzers (assuming we can import them)
from services.github_analyzer import analyze_github
from services.huggingface_analyzer import analyze_huggingface
from services.arxiv_analyzer import analyze_arxiv
from services.llm import MODEL_CONFIGS, _call_llm

async def test_llm_models():
    print("\n=== Testing LLM Models ===")
    test_messages = [{"role": "user", "content": "Hello, who are you? Reply with model name if possible."}]
    
    for config in MODEL_CONFIGS:
        print(f"\nTesting Model: {config['name']} ({config['id']})")
        if not config["api_key"]:
            print(f"SKIP: No API Key for {config['name']}")
            continue
            
        try:
            # We bypass the automatic fallback logic to test individual models
            # In llm.py, _call_llm rotates. For verification, we want to know each works.
            from openai import OpenAI
            client = OpenAI(base_url=config["base_url"], api_key=config["api_key"])
            response = client.chat.completions.create(
                model=config["id"],
                messages=test_messages,
                timeout=15.0
            )
            content = response.choices[0].message.content
            print(f"SUCCESS: {content[:100]}...")
        except Exception as e:
            print(f"FAILED: {str(e)}")

async def test_analyzers():
    print("\n=== Testing Analyzers ===")
    
    # Test GitHub
    print("\nTesting GitHub (Username: torvalds)...")
    res_gh = await analyze_github("torvalds")
    print(f"GitHub Stars Score: {res_gh['dimensions']['github_stars']}")
    print(f"GitHub Evidence Count: {len(res_gh['evidence'])}")
    if res_gh.get("errors"):
        print(f"GitHub Errors: {res_gh['errors']}")

    # Test HF
    print("\nTesting HuggingFace (Username: osanseviero)...")
    res_hf = await analyze_huggingface("osanseviero")
    print(f"HF Score: {res_hf['dimensions']['hf_contributions']}")
    print(f"HF Evidence: {res_hf['evidence']}")

    # Test ArXiv
    print("\nTesting ArXiv (Author: Yoshua Bengio)...")
    res_arxiv = await analyze_arxiv("Yoshua Bengio")
    print(f"ArXiv Score: {res_arxiv['dimensions']['arxiv_papers']}")
    print(f"ArXiv Evidence: {res_arxiv['evidence']}")

async def main():
    await test_analyzers()
    await test_llm_models()

if __name__ == "__main__":
    asyncio.run(main())
