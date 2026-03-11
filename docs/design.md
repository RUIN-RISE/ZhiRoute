# AI Talent Radar Design Document

## 1. API Design
*   **Endpoint**: `POST /analyze/ai-radar`
*   **Request Body**:
    ```json
    {
      "resume_id": "string",
      "github_username": "string",
      "hf_username": "string",
      "arxiv_name": "string"
    }
    ```
*   **Response Body**:
    ```json
    {
      "total_score": 85,
      "dimensions": {
        "github_stars": 20,
        "github_commits": 15,
        "github_prs": 15,
        "hf_contributions": 20,
        "arxiv_papers": 15
      },
      "evidence": [
        {
          "dimension": "hf_contributions",
          "original_text": "Created model X with 10k downloads",
          "source_link": "https://huggingface.co/username/modelX",
          "analysis": "High impact open source AI contribution."
        }
      ],
      "interview_questions": [
        "Can you explain the architecture of model X you published on Hugging Face?"
      ]
    }
    ```

## 2. Database ER
*   **New Table**: `ai_radar_cache`
    *   `resume_id` (TEXT, Primary Key)
    *   `total_score` (INTEGER)
    *   `radar_data_json` (TEXT)
    *   `evidence_json` (TEXT)
    *   `cache_timestamp` (REAL)
    *   (Foreign Keys or Relationships: None required, only caching output)

## 3. Frontend Component Tree
*   `temp_frontend/src/App.tsx` (modifications)
    *   `ExecutionDashboard` -> Modified to handle AI Discovery Tab.
    *   `ExecutionDashboard` -> Modified to add AI Radar button in `CandidateCard` or Results list.
*   `temp_frontend/src/components/AITalentRadar.tsx` (New Component)
    *   `RadarChart` (Custom SVG or standard CSS based on project norms)
    *   `EvidenceTable` (Table rendering evidence chain)
    *   `InterviewQuestionGenerator` (Section for AI question generation relying on existing LLM services)

## 4. Prompt Template
```text
Analyze the following candidate's AI capabilities based on their GitHub, Hugging Face, and ArXiv data.
You must output a JSON array of evidence items. Each item MUST have exactly this format:
{
  "dimension": "string (e.g. hf_contributions or arxiv_papers)",
  "original_text": "exact quote or data point",
  "source_link": "direct URL to the evidence",
  "analysis": "your brief analysis of its value"
}
Output ONLY valid JSON.
```

**设计已冻结**
