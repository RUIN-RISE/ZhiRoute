---
title: JobOS - AI Recruitment Copilot
emoji: 🚀
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
---

# JobOS - AI Recruitment Copilot

JobOS is an intelligent recruitment agent designed to streamline the hiring process for non-technical HRs or small teams.

## Features
- **Job Description Generation**: Chat with AI to clarify requirements and auto-generate structured JDs.
- **Resume Parsing & Matching**: Upload resumes (PDF/ZIP) and get instant match scores and analysis.
- **AI Interviewer**: Auto-generate interview questions and offer/rejection letters.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: FastAPI + Python
- **AI**: Multi-model support (GLM,DeepSeek, Qwen, etc.) via ModelScope/OpenAI API.

## Deployment
This project is configured for ModelScope Spaces using Docker.
