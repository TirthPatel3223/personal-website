# Course RAG Pipeline — Full Context Document
---

## Project Overview

**Course RAG Pipeline** is a production-deployed, agentic Retrieval-Augmented Generation (RAG) system built for UCLA MSBA students to query their course materials — lecture slides, transcripts, and PDFs — using natural language. Users can ask about deadlines, request file summaries, upload new materials, and ask follow-up questions about where an answer came from.

**Live URL:** `https://tirth-courserag.duckdns.org`

**Who uses it:** UCLA MSBA cohort (Spring 2026), specifically students in MSA408, MSA409, MSA410, and MSA413.

**What makes it different from a basic RAG system:**
- Classifies queries into 4 types and routes them through different processing pipelines
- Verifies deadline answers by re-querying and cross-referencing results (self-check)
- Supports human-in-the-loop file uploads (LLM proposes a folder, user approves)
- Has a dedicated node for answering "Why did you give me that file?" follow-ups
- Fully deployed on Oracle Cloud Free Tier at zero monthly infrastructure cost

---

## Motivation

The MSBA program has 4 courses running simultaneously, each with its own slides, transcripts, homework deadlines, and project deliverables organized across a shared Google Drive. Students constantly need to look things up — "when is HW3 due?", "which file covers regression?" — and doing this manually across a growing Drive folder is time-consuming. A RAG system that can answer these questions instantly, cite its sources, and even organize newly uploaded materials was a clear improvement over the status quo.

The project was also a deliberate exercise in building a full-stack agentic system end-to-end: from designing the LangGraph orchestration layer, to writing the ChromaDB retrieval pipeline, to deploying on a Linux VPS via Docker — handling every production issue that came up along the way.

---

## What Was Built (End-to-End)

A full-stack web application with:
- A **LangGraph-orchestrated AI agent** with 13 nodes handling 5 distinct query types
- A **FastAPI + WebSocket backend** for real-time streaming chat
- A **ChromaDB vector database** for semantic search over course documents
- A **Google Drive integration** as the source of truth for course files
- A **vanilla JS single-page frontend** with chat, drag-drop upload, upload approval dialogs, and an admin panel
- **Docker + Caddy** deployment on Oracle Cloud Always Free ARM VPS with automatic HTTPS

---

## Technical Architecture

### LangGraph Agent (13 Nodes)

The core of the system is a LangGraph graph that classifies every user message and routes it through one of five processing branches. Every branch ends at a shared `response_output` node that saves to SQLite and sends back over WebSocket.

```
START
  ↓
input_handler       → loads chat history from SQLite, parses incoming message
  ↓
router              → classifies query type + detects course/quarter from message text
  ↓
[CONDITIONAL ROUTING by query_type]

  deadline branch:
    retriever         → ChromaDB search (k=5, deadline-boosted)
    deadline_extractor → LLM extracts {assignment, date, time, notes, confidence}
    deadline_verifier  → re-queries ChromaDB with rephrased search, cross-checks dates
    response_output

  summary branch:
    retriever         → ChromaDB search (k=10, generic)
    summary_redirector → finds relevant files, generates Drive links + page numbers
    response_output

  upload branch:
    upload_handler    → extracts content preview from uploaded file
    location_classifier → LLM proposes Drive folder path with reasoning
    human_approval_gate [INTERRUPT] ← pauses graph, sends approval dialog to UI
    upload_executor   → uploads to Drive, chunks, embeds with OpenAI, stores in ChromaDB
    response_output

  general branch:
    retriever         → ChromaDB search (k=7, generic)
    general_responder → LLM answers using retrieved context, cites sources
    response_output

  source_explanation branch:
    source_explainer  → scans session history for matching Q&A pairs, returns raw excerpts
    response_output

END
```

**Agent State (15 fields tracked across nodes):**
`query_type`, `retrieved_chunks`, `retrieval_query`, `detected_course`, `detected_quarter`, `extracted_deadlines`, `verification_result`, `relevant_files`, `upload_file_info`, `proposed_location`, `human_decision`, `upload_result`, `final_response`, `pending_source_clarification`, `session_id`, `llm_provider`, `error`

### Services Layer (6 Core Services)

| Service | Purpose |
|---|---|
| `LLMService` | Claude Sonnet 3.5 Haiku (primary) + GPT-4o-mini (fallback); returns provider name |
| `EmbeddingService` | OpenAI `text-embedding-3-small` (1536-dim); batch-capable (up to 2048 per call) |
| `ChromaService` | ChromaDB wrapper; metadata filtering by course + quarter; deadline-boost retrieval |
| `DriveService` | Google Drive API (OAuth 2.0); upload, download, folder creation, shareable links |
| `PDFProcessor` | PyMuPDF text extraction; OpenAI Vision fallback for scanned/image PDFs |
| `TextProcessor` | Page-level chunking for slides; 1500-char recursive splitting for transcripts |

**Session persistence:** SQLite via `aiosqlite` — stores sessions, messages, query types, and source chunks (as JSON) for multi-turn conversation history.

### API Surface

- `WS /ws/chat` — real-time bidirectional chat (JSON protocol); handles chat messages, file uploads, Drive link ingestion, and upload approvals all over one connection
- `POST /api/login` — HMAC-signed token auth (no JWT dependency)
- `GET /api/admin/stats` — chunk counts, course breakdown, file types
- `POST /api/admin/reembed` — background task to re-embed all Drive files
- `GET /api/admin/drive/tree` — folder hierarchy from Google Drive

### Frontend (Vanilla JS SPA)

Single-page app with no framework:
- Real-time chat with markdown rendering
- Drag-and-drop file upload with sequential queue processing for multiple files
- Upload approval dialog with editable path picker (separate from chat, not inline)
- Expandable source chunk display (capped at 10 chunks)
- Admin panel with stats, re-embed trigger, Drive file browser
- Responsive layout with dark mode support (CSS variables)

### Deployment Infrastructure

| Component | Technology | Cost |
|---|---|---|
| VPS | Oracle Cloud Always Free ARM (4 CPU, 24GB RAM) | $0/month |
| Reverse proxy + HTTPS | Caddy + Let's Encrypt | $0/month |
| Domain | DuckDNS (`tirth-courserag.duckdns.org`) | $0/month |
| Containers | Docker + Docker Compose | $0/month |
| Vector DB | ChromaDB (self-hosted on VPS) | $0/month |
| Session DB | SQLite | $0/month |
| LLM API | Claude (~$1-3/mo) + OpenAI fallback (~$0-1/mo) | ~$1-4/month |
| Embeddings | OpenAI (~$0.01-0.02 per full re-embed) | <$0.05/month |

**Total infrastructure cost: ~$1–4/month** (essentially just API usage).

---

## Key Engineering Decisions

### 1. Self-Verifying Deadline Extraction
Deadline questions carry the highest accuracy requirement — a wrong date is worse than no answer. After extracting a deadline with the LLM, the system immediately re-queries ChromaDB with a rephrased version of the search and cross-references the extracted date against the new results. If there are conflicts (e.g., two chunks give different dates for the same assignment), the response surfaces both and flags the discrepancy with a confidence indicator.

**Why it matters:** Reduces hallucination risk on the most critical query type.

### 2. Human-in-the-Loop Upload Approval
When a user uploads a file, the system doesn't immediately embed it. Instead, the LangGraph graph pauses at a `human_approval_gate` node (using LangGraph's `interrupt_before` mechanism with a SQLite checkpointer). The UI sends the user an approval dialog showing the LLM's proposed Drive folder path and its reasoning. The user can approve, modify the path, or reject. Only approved uploads get embedded into ChromaDB.

**Why it matters:** Prevents mis-categorized files from polluting the vector store; keeps Drive organized.

### 3. Summary Redirection (No LLM Summarization)
When users ask for summaries, the system does not generate a summary with an LLM. Instead, it finds the most relevant files and returns their Drive links and page numbers, directing the user to use their personal LLM. This saves significant API costs (summaries consume large token counts) and prevents hallucination from summarization.

**Why it matters:** Cost optimization + accuracy — the user's personal LLM has access to the full file, not just retrieved chunks.

### 4. Deadline-Boosted Retrieval
Chunks containing deadline-related keywords (`due`, `deadline`, `submit`, `homework`, `exam`, etc.) are tagged with a `contains_deadline` metadata flag during ingestion. The `ChromaService.query_with_deadline_boost()` method merges results from a deadline-filtered query with results from a general query, deduplicates, and re-ranks — ensuring deadline-containing chunks appear at the top for deadline queries even when the semantic similarity score is not highest.

**Why it matters:** Deadline keywords often appear in slides as side notes or headers, which have lower embedding similarity to a natural-language question than the main slide body.

### 5. Priority-Based Router
The router doesn't always call the LLM. It first checks if there's a pending clarification (e.g., the user chose "which source did you use?"), then tries regex/pattern matching (e.g., "why did you", "where did that come from"), and only falls back to LLM classification if pattern matching fails. This saves ~200 tokens per source-explanation follow-up.

**Why it matters:** Token cost reduction + faster response for common follow-up patterns.

### 6. Vision Fallback for Scanned PDFs
PyMuPDF text extraction returns fewer than 30 characters for pages that are images (scanned slides, photographed documents). In this case, the `PDFProcessor` sends the page image to OpenAI Vision (GPT-4o-mini) with a strict transcription prompt (no summarization, verbatim only). To prevent API timeouts from hanging the entire ingestion pipeline: 25-second timeout per page, maximum 2 concurrent vision calls, and an early bail-out after 5 consecutive failures on a single file.

**Why it matters:** Course materials often include scanned handouts and photographed whiteboards.

### 7. LLM Fallback Pattern
Every LLM call tries Claude first (`claude-3-5-haiku-20241022`). On any exception, it falls back to GPT-4o-mini. The response object includes the `provider` field so the UI can show users which model answered their question. Both providers are treated as stateless (no conversation threading in the LLM API calls — session history is managed in SQLite and injected into the prompt).

**Why it matters:** Reliability — neither API has perfect uptime; dual-provider fallback ensures the system stays online.

### 8. Metadata-Filtered Retrieval with Fallback
Every ChromaDB query first applies `$and` filters for `course_id` and `quarter`. If the filter returns zero results (e.g., the user didn't specify a course, or the detected course is wrong), the system automatically retries without the course filter before returning an empty result. This graceful degradation handles ambiguous queries without throwing errors.

**Why it matters:** Users often don't mention which course they're asking about; the system should still return useful results.

---

## Challenges Faced and How They Were Solved

| Challenge | Root Cause | Solution |
|---|---|---|
| **Multiple file uploads failed silently** | UI processed uploads synchronously; second file started before first finished embedding | Added a sequential file queue with per-file progress tracking in the frontend |
| **Upload rejection flow was confusing** | Rejection happened inline in chat as text, making it hard to re-submit | Separated upload approval into a dedicated dialog with a path picker UI; rejection never enters the chat thread |
| **"Why did you give me that?" not handled** | General responder treated follow-ups as new queries, couldn't reference its own sources | Added `source_explainer` node + pattern matching in router to detect source explanation intent |
| **Vision API hung on scanned PDFs** | Some PDFs had 50+ image pages; vision calls stacked up with no timeout | Added 25-sec timeout, max 2 concurrent calls, bail-out after 5 failures; vision disabled for remainder of file |
| **DuckDNS domain expired** | DuckDNS requires periodic pings to keep domain active | Set up `cron` job on VPS to ping DuckDNS every 30 minutes |
| **iptables blocked ports 80/443** | Oracle Cloud default iptables rules had a blanket REJECT rule; new ACCEPT rules were inserted after it | Used `iptables -I INPUT 1 ...` to insert ACCEPT rules before REJECT instead of appending |
| **Google credentials not accessible in Docker container** | OAuth credentials are gitignored; container volume didn't include them | Used `docker cp` to copy `oauth_credentials.json` and `token.pickle` directly into the running container |
| **ChromaDB metadata queries returned zero results** | `$and` filter required both `course_id` and `quarter` to match; course detection was failing on ambiguous queries | Added fallback: retry without `course_id` filter if initial query returns nothing |
| **LangGraph human-in-the-loop required state persistence** | Interrupt-before mechanism needs checkpointer to resume graph after user decision | Integrated `langgraph-checkpoint-sqlite` as the graph checkpointer; same SQLite DB as sessions |
| **Deadline hallucination risk** | Single LLM extraction pass can confidently return wrong dates | Built two-node verification: extract → re-query → cross-reference → surface conflicts |

---

## Technologies and Tools Used

### AI / ML
- **Anthropic Claude** (`claude-3-5-haiku-20241022`) — primary LLM for all classification, extraction, and generation tasks
- **OpenAI GPT-4o-mini** — LLM fallback + Vision API for scanned PDFs
- **OpenAI Embeddings** (`text-embedding-3-small`, 1536 dimensions) — all document and query embeddings
- **LangGraph** — agentic orchestration (13-node graph, conditional routing, interrupt-before for human-in-the-loop)
- **LangChain Core / LangChain Anthropic / LangChain OpenAI** — LLM wrappers and prompt templates
- **ChromaDB** — self-hosted vector database with metadata filtering

### Backend
- **FastAPI** — REST + WebSocket API server
- **Uvicorn** — ASGI server
- **WebSockets** — real-time bidirectional chat protocol
- **PyMuPDF (fitz)** — PDF text extraction
- **Google API Python Client** — Google Drive API (OAuth 2.0)
- **aiosqlite** — async SQLite for session + message storage
- **Pydantic** — request/response data validation
- **LangGraph Checkpoint SQLite** — graph state persistence for human-in-the-loop

### Frontend
- **Vanilla HTML/CSS/JavaScript** — no framework
- **Markdown rendering** — custom parser in `utils.js`

### Infrastructure
- **Docker + Docker Compose** — containerization (multi-platform: x86_64 + ARM64)
- **Caddy** — reverse proxy with automatic HTTPS via Let's Encrypt
- **Oracle Cloud Always Free** — ARM VPS (4 CPU, 24GB RAM)
- **DuckDNS** — free dynamic DNS
- **Ubuntu 22.04 LTS** — VPS OS

### Development & Testing
- **Python 3.11**
- **pytest + pytest-asyncio** — 33 tests across phases 1 and 2
- **python-dotenv** — environment variable management

---

## Project Scale

| Metric | Value |
|---|---|
| LangGraph nodes | 13 (+ 1 interrupt point) |
| Agent state fields | 15 |
| LLM prompt templates | 15+ (279 lines) |
| Backend source files | ~20 files |
| Backend lines of code | ~3,000 |
| Frontend lines of code | ~1,000 |
| Test count | 33 (20 Phase 1, 13 Phase 2) |
| Courses indexed | 4 (MSA408, MSA409, MSA410, MSA413) |
| File types supported | Slides (PDF), Transcripts (TXT), Homeworks (PDF) |
| Infrastructure cost | ~$1–4/month total |

---

## End-to-End User Flows (Examples)

**Deadline query:**
> "When is HW3 due for MSA408?"
→ Router detects deadline + course MSA408 → ChromaDB deadline-boosted search → LLM extracts `{assignment: "HW3", date: "April 30, 2026", time: "11:59 PM"}` → Verifier re-queries → Response: "HW3 is due April 30 at 11:59 PM (verified). Source: Lecture 5 Slides p.15"

**Summary query:**
> "Summarize the regression lecture"
→ Router detects summary → ChromaDB retrieves relevant chunks → System returns Drive links to the regression slides and transcript → Redirects user to use their personal LLM to generate the summary

**Upload flow:**
> User drags a PDF into the upload zone
→ LLM proposes `Spring2026/MSA408:Operations_Analytics/slides/Lecture6.pdf` with reasoning → Approval dialog shown → User approves → File uploaded to Drive, chunked, embedded, stored in ChromaDB → "Ready to query! Indexed 14 chunks."

**Source follow-up:**
> "Why did you give me the Lecture 5 slides?"
→ Router pattern-matches "why did you" → Source explainer finds the prior Q&A pair in session history → Returns the exact raw text chunks from Lecture 5 Slides that contained the HW3 deadline

---

## What This Project Demonstrates

- **Agentic system design** — building a multi-node LangGraph graph with conditional routing, shared state, and a human-in-the-loop interrupt mechanism
- **Full-stack engineering** — owning the entire stack from LLM orchestration and vector database to frontend UI and Linux VPS deployment
- **Production problem-solving** — identifying and fixing 9 distinct production bugs (timeouts, port blocking, credential management, domain expiry, UI flow issues)
- **Cost-conscious architecture** — $0 infrastructure via Oracle Free Tier + DuckDNS + Let's Encrypt; cost-optimized API usage (summary redirection, token-saving router patterns)
- **RAG system design** — chunking strategy, metadata filtering, deadline-boosted retrieval, fallback patterns for zero-result queries
- **LLM reliability patterns** — dual-provider fallback, self-verifying extraction, controlled concurrency for vision API
