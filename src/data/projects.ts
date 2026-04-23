export type ProjectStatus = 'complete' | 'coming-soon';

export interface ApproachStep {
  step: string;
  detail: string;
}

export interface ResultMetric {
  metric: string;
  value: string;
  description?: string;
}

export interface ProjectDetail {
  problem_statement: string;
  approach: ApproachStep[];
  architecture: string; // ASCII diagram rendered in a <pre> block
  results: ResultMetric[];
  github_url?: string;
}

export interface Project {
  id: string;
  title: string;
  short_description: string;
  motivation: string;
  achievements: string[];
  tech_stack: string[];
  technical_details: string;
  status: ProjectStatus;
  link: string;
  detail?: ProjectDetail;
}

export const projects: Project[] = [
  {
    id: 'course-rag-pipeline',
    title: 'Course RAG Pipeline',
    short_description:
      'Production-deployed agentic RAG system for UCLA MSBA students to query course materials — lecture slides, transcripts, and PDFs — using natural language. Live at tirth-courserag.duckdns.org.',
    motivation:
      'The UCLA MSBA program runs 4 simultaneous courses, each with its own slides, transcripts, homework deadlines, and deliverables spread across a shared Google Drive. Students constantly lose time hunting for information manually. I built a fully agentic system that classifies every query, self-verifies deadline answers, supports human-approved file uploads, and can explain exactly which source chunks drove any answer — deployed at effectively zero infrastructure cost on Oracle Cloud Free Tier.',
    achievements: [
      'Built a 13-node LangGraph agent with conditional routing across 5 query types: deadline, summary, upload, general Q&A, and source explanation',
      'Implemented self-verifying deadline extraction: LLM extracts date → re-queries ChromaDB with rephrased search → cross-references results → surfaces conflicts with confidence indicator',
      'Designed human-in-the-loop upload approval using LangGraph interrupt-before + SQLite checkpointer: LLM proposes a Drive folder path, user approves/edits before embedding — preventing vector store pollution',
      'Built deadline-boosted retrieval: chunks tagged with contains_deadline metadata at ingestion, merged and re-ranked with general results to surface deadline content even when semantic score is not highest',
      'Added OpenAI Vision fallback for scanned PDFs: 25-sec timeout per page, max 2 concurrent calls, early bail-out after 5 consecutive failures',
      'Deployed on Oracle Cloud Always Free ARM VPS (4 CPU, 24 GB RAM) using Docker + Caddy + DuckDNS at ~$1–4/month total',
      'Solved 9 distinct production issues during deployment including Oracle iptables blocking (iptables -I fix), DuckDNS expiry (cron ping job), and OAuth credentials not accessible in Docker (docker cp fix)',
    ],
    tech_stack: ['LangGraph', 'FastAPI', 'ChromaDB', 'Claude Haiku', 'OpenAI', 'Google Drive API', 'Docker', 'Python', 'SQLite', 'WebSocket'],
    technical_details: 'LangGraph, FastAPI, ChromaDB, Claude Haiku, GPT-4o-mini, OpenAI Embeddings, Google Drive API, PyMuPDF, Docker, Caddy, Oracle Cloud',
    status: 'complete',
    link: '/projects/course-rag-pipeline',
    detail: {
      problem_statement:
        'UCLA MSBA students juggle 4 simultaneous courses — each with lecture slides, transcripts, homework deadlines, and project deliverables scattered across a shared Google Drive. Manual search is slow and error-prone, especially for deadline-critical queries ("when is HW3 due?"). The challenge: build a production-grade agentic system that can answer natural-language questions over course PDFs, verify its own deadline answers to prevent hallucination, let students upload new files safely without polluting the vector store, and explain exactly which source chunks it used — all at zero ongoing infrastructure cost.',
      approach: [
        {
          step: 'LangGraph Agentic Orchestration',
          detail:
            'Designed a 13-node LangGraph graph with a priority-based router that first checks for pending clarifications, then tries regex pattern matching (e.g., "why did you", "where did that come from"), and only falls back to LLM classification if patterns fail — saving ~200 tokens per source-explanation follow-up. The router classifies each query into one of five types and routes to the appropriate branch.',
        },
        {
          step: 'Self-Verifying Deadline Extraction',
          detail:
            'Deadline queries carry the highest accuracy requirement — a wrong date is worse than no answer. After extracting a deadline with the LLM, the system immediately re-queries ChromaDB with a rephrased version of the search and cross-references the extracted date against the new results. If two chunks give different dates for the same assignment, the response surfaces both and flags the discrepancy with a confidence indicator.',
        },
        {
          step: 'Deadline-Boosted Retrieval',
          detail:
            'Chunks containing deadline keywords (due, deadline, submit, homework, exam, etc.) are tagged with a contains_deadline metadata flag during ingestion. The ChromaService.query_with_deadline_boost() method merges results from a deadline-filtered query with results from a general query, deduplicates, and re-ranks — ensuring deadline-containing chunks appear at the top even when the semantic similarity score is not highest (deadline keywords often appear as side notes with lower embedding similarity).',
        },
        {
          step: 'Human-in-the-Loop Upload Approval',
          detail:
            'When a user uploads a file, the LangGraph graph pauses at a human_approval_gate node using LangGraph\'s interrupt_before mechanism with a SQLite checkpointer. The UI shows an approval dialog with the LLM\'s proposed Drive folder path and its reasoning. The user can approve, modify the path, or reject. Only approved uploads are chunked, embedded with OpenAI text-embedding-3-small, and stored in ChromaDB — preventing mis-categorised files from polluting the vector store.',
        },
        {
          step: 'Vision Fallback for Scanned PDFs',
          detail:
            'PyMuPDF text extraction returns fewer than 30 characters for pages that are images (scanned slides, photographed documents). In this case, the PDFProcessor sends the page image to OpenAI Vision (GPT-4o-mini) with a strict verbatim-transcription prompt. To prevent API timeouts from hanging the pipeline: 25-second timeout per page, maximum 2 concurrent vision calls, and an early bail-out after 5 consecutive failures on a single file.',
        },
        {
          step: 'Deployment & Infrastructure',
          detail:
            'Fully containerised with Docker Compose on an Oracle Cloud Always Free ARM VPS (4 CPU, 24 GB RAM). Caddy handles reverse proxying and automatic HTTPS via Let\'s Encrypt. DuckDNS provides the free dynamic domain (with a cron job pinging every 30 minutes to prevent expiry). Total infrastructure cost: ~$1–4/month — essentially just LLM API usage. Solved production issues including Oracle iptables blocking ports 80/443 (fixed via iptables -I to insert ACCEPT before the blanket REJECT rule) and Google OAuth credentials not accessible inside the running container (fixed via docker cp).',
        },
      ],
      architecture: `
START
  ↓
input_handler       → loads chat history from SQLite
  ↓
router              → priority: pending clarification → regex → LLM
  ↓
[CONDITIONAL ROUTING by query_type]

  deadline branch:
    retriever         → ChromaDB deadline-boosted search (k=5)
    deadline_extractor → LLM: {assignment, date, time, confidence}
    deadline_verifier  → re-query + cross-reference → flag conflicts
    response_output

  summary branch:
    retriever         → ChromaDB search (k=10)
    summary_redirector → return Drive links + page numbers
    response_output

  upload branch:
    upload_handler    → extract file content preview
    location_classifier → LLM proposes Drive folder path
    human_approval_gate [INTERRUPT] ← user approves/edits/rejects
    upload_executor   → Drive upload + chunk + embed + ChromaDB
    response_output

  general branch:
    retriever         → ChromaDB search (k=7)
    general_responder → LLM answer with cited sources
    response_output

  source_explanation branch:
    source_explainer  → scan session history → return raw chunks
    response_output

END

Services: LLMService (Claude Haiku → GPT-4o-mini fallback)
          EmbeddingService (text-embedding-3-small, 1536-dim)
          ChromaService (metadata filter: course_id + quarter, fallback on zero results)
          DriveService (Google Drive API, OAuth 2.0)
          PDFProcessor (PyMuPDF + Vision fallback for scanned pages)`,
      results: [
        { metric: 'LangGraph Nodes', value: '13', description: 'Plus 1 interrupt point for human-in-the-loop' },
        { metric: 'Query Types', value: '5', description: 'Deadline, summary, upload, general, source explanation' },
        { metric: 'Infra Cost', value: '~$1–4/mo', description: 'Oracle Cloud Free Tier + DuckDNS + Let\'s Encrypt' },
        { metric: 'Courses Indexed', value: '4', description: 'MSA408, MSA409, MSA410, MSA413' },
        { metric: 'Production Bugs Solved', value: '9', description: 'iptables, domain expiry, Docker creds, ChromaDB filters, and more' },
        { metric: 'Test Count', value: '33', description: '20 Phase 1 + 13 Phase 2 tests' },
      ],
    },
  },
  {
    id: 'weather-dining-pipeline',
    title: 'Yelp & Weather Intelligence Pipeline',
    short_description:
      'End-to-end data engineering pipeline correlating weather patterns with Yelp restaurant sentiment using PySpark, Snowflake, Airflow, and Tableau — processing 10M+ records.',
    motivation:
      'Curious whether weather drives restaurant ratings and business patterns, I built a production-grade data pipeline ingesting the full Yelp Academic Dataset and OpenWeatherMap API, performing distributed ETL at scale, NLP sentiment scoring, and surfacing insights through an executive Tableau dashboard.',
    achievements: [
      'Discovered the "Cold Weather Sentiment Paradox": Freezing weather drops volume to 101/day but yields the highest average sentiment index (0.71)',
      'Identified Extreme Heat as the major deterrent to dining out, dropping review volume to ~30/day with the lowest sentiment (0.65)',
      'Found that Rainy/Snowy weather causes a 50.7% drop in volume (143/day vs 290/day) but retains a resilient sentiment index identical to pleasant days (0.69)',
      'Generated Regional Penalty Heatmaps highlighting specific cities where weather unfairly skews ratings, isolating weather biases',
      'Designed a Snowflake star-schema data warehouse with sub-5-second query latency processing 10M+ records',
    ],
    tech_stack: ['PySpark', 'Snowflake', 'Airflow', 'Tableau', 'VADER NLP', 'Python'],
    technical_details: 'PySpark, Snowflake, Apache Airflow, Tableau, VADER NLP, Python',
    status: 'complete',
    link: '/projects/weather-dining-pipeline',
    detail: {
      problem_statement:
        'Does weather actually affect how people dine out and rate restaurants? To answer this at scale, I built a full data engineering pipeline ingesting the Yelp Academic Dataset (JSON/CSV) and live weather data from OpenWeatherMap, transforming and joining them in PySpark, warehousing in Snowflake, and orchestrating the pipeline with Airflow — culminating in a Tableau dashboard that reveals actionable weather–revenue correlations for restaurant operators.',
      approach: [
        {
          step: 'Data Ingestion',
          detail:
            'Pulled the Yelp Academic Dataset (reviews + business metadata, ~8GB JSON) via bulk download and supplemented with OpenWeatherMap historical weather records fetched via paginated REST API calls, covering 15 major US cities over 5 years.',
        },
        {
          step: 'PySpark ETL',
          detail:
            'Cleaned and deduplicated 10M+ records using distributed PySpark on a 3-node local cluster. Joined review and weather datasets on composite (city_slug, date) keys. Handled schema drift, null imputation, and timezone normalization.',
        },
        {
          step: 'Sentiment Analysis',
          detail:
            'Applied VADER NLP to raw review text to produce compound sentiment scores per review. Bucketed scores into positive (≥0.05), neutral, and negative (≤−0.05). Validated a random 2,000-review sample against manual labels, achieving 85%+ accuracy.',
        },
        {
          step: 'Snowflake Data Warehouse',
          detail:
            'Loaded enriched data into a Snowflake star schema: fact table daily_review_weather (grain: business × date) with dimension tables for weather_condition, business, and calendar. Applied auto-clustering on date partitions for sub-5s query latency.',
        },
        {
          step: 'Airflow Orchestration',
          detail:
            'Scheduled a daily incremental DAG in Apache Airflow: API pull → PySpark transform → VADER scoring → Snowflake upsert. Configured email alerting on task failure and SLA misses. Backfilled 5 years of historical data on first run.',
        },
        {
          step: 'Tableau Visualization',
          detail:
            'Connected Tableau Desktop to Snowflake via native connector. Built 12 interactive dashboards covering: precipitation vs. review volume, temperature vs. star rating distribution, sentiment heatmaps by city and season, and revenue anomaly detection overlaid with weather events.',
        },
      ],
      architecture: `
  +---------------------+    +----------------------+
  |    Yelp Dataset     |    |  OpenWeatherMap API  |
  |  (JSON / CSV bulk)  |    |  (REST, paginated)   |
  +---------+-----------+    +----------+-----------+
            |                           |
            +------------+--------------+
                         |  Raw data
                         v
              +----------------------+
              |     PySpark ETL      |  <-- 3-node cluster
              |  Clean & Join        |      10M+ records
              |  Deduplicate         |      ~4 hrs full run
              +----------+-----------+
                         |  Enriched records
                         v
              +----------------------+
              |      VADER NLP       |  <-- Sentiment scoring
              |  500K+ reviews       |      per (business, date)
              +----------+-----------+
                         |  Scored reviews
                         v
              +----------------------+
              |      Snowflake       |  <-- Star schema DWH
              |  fact: daily_reviews |      auto-clustered
              |  dims: weather, biz  |      on date partition
              +----------+-----------+
                         |
               +---------+----------+
               |                    |
               v                    v
      +------------------+  +------------------+
      |     Airflow      |  |     Tableau      |
      |  Daily DAG       |  |  Regional heat-  |
      |  + SLA Alerting  |  |  maps & metrics  |
      +------------------+  +------------------+`,
      results: [
        { metric: 'Freezing Sentiment', value: '0.71' },
        { metric: 'Avg Review Stars', value: '3.85' },
        { metric: 'Overall Sentiment', value: '0.58' },
        { metric: 'Records Processed', value: '10M+' },
        { metric: 'Snowflake Latency', value: '<5s' },
        { metric: 'Dashboards', value: 'Live', description: 'Interactive executive dashboard available on Tableau Public' },
      ],
      github_url: 'https://github.com/TirthPatel3223/Yelp-Weather-Pipeline',
    },
  },
  {
    id: 'deep-cube-solver',
    title: 'DeepCubeA Maltese Gear Cube Solver',
    short_description:
      'Deep reinforcement learning agent that solves the Maltese Gear Cube using a CUDA-accelerated neural heuristic.',
    motivation:
      'To apply the DeepCubeA algorithm to a novel, higher-complexity puzzle and validate whether deep RL can generalize to unseen combinatorial state spaces.',
    achievements: [
      'Trained a value network on 50M+ self-generated cube states using PyTorch + CUDA',
      'Implemented batched A* search guided by learned heuristic, solving cubes optimally',
      'Achieved 100% solve rate on test set within optimal or near-optimal move counts',
      'Reduced training time 40% through symmetry-based data augmentation',
    ],
    tech_stack: ['PyTorch', 'CUDA', 'Deep RL', 'Python', 'NumPy'],
    technical_details: 'PyTorch, CUDA, Deep Reinforcement Learning, Python, NumPy',
    status: 'complete',
    link: '/projects/deep-cube-solver',
    detail: {
      problem_statement:
        'The Maltese Gear Cube is a higher-order mechanical puzzle with an estimated state space of ~10¹⁹ configurations — featuring non-standard gear-linked move sets that invalidate the symmetry assumptions of solvers designed for the standard 3×3 Rubik\'s Cube. Classical search algorithms (BFS, IDA*) are computationally intractable at this scale. The core challenge: can a neural network learn a generalizable distance-to-solved heuristic without any hand-crafted domain knowledge, and can that heuristic guide an efficient search to optimality?',
      approach: [
        {
          step: 'State Representation',
          detail:
            'Encoded each cube configuration as a flattened one-hot tensor of sticker positions (630-dimensional vector), capturing all face colors and gear orientations. This representation is permutation-sensitive and fully differentiable.',
        },
        {
          step: 'Backward Induction Data Generation',
          detail:
            'Generated 50M+ training samples using the DeepCubeA backward induction strategy: starting from the solved state, applied k random legal moves (k ~ Uniform[1, 26]) and labeled each resulting state with k as the approximate distance-to-solved. This avoids the need for any ground-truth optimal solver.',
        },
        {
          step: 'Neural Network Training',
          detail:
            'Trained a 4-layer fully-connected value network (630→1024→512→256→1) with ReLU activations using MSE loss on distance estimates. Trained on NVIDIA RTX GPU with PyTorch; used learning rate warmup and cosine annealing. Total training: ~18 hours.',
        },
        {
          step: 'Symmetry-Based Data Augmentation',
          detail:
            'Exploited the Maltese Gear Cube\'s rotational symmetry group to generate 8 equivalent representations of each training state, effectively multiplying usable training data 8× at zero additional solve cost — reducing training time by 40%.',
        },
        {
          step: 'Batched Weighted A* Search',
          detail:
            'At inference, ran batched weighted A* search with f(n) = g(n) + λ·V_θ(n), where V_θ is the learned value function and λ is a weight hyperparameter. Used beam width 128 to explore candidate states in parallel on GPU, terminating when the solved state is found.',
        },
        {
          step: 'Evaluation',
          detail:
            'Tested on 1,000 held-out cubes scrambled with 25 random moves. Measured: solve rate, average solution length vs. known-optimal (computed via brute-force on small depth), and generalization to unseen scramble depths (up to 35 moves).',
        },
      ],
      architecture: `
  ── Training Phase ──────────────────────────────────────

  Solved State
       │
       ▼
  Random Scrambler ──→ 50M (state, distance) pairs
  k ∈ Uniform[1..26]      labeled by scramble depth
       │
       │  8× Symmetry Augmentation
       ▼
  ┌───────────────────────────────────────┐
  │         Value Network (PyTorch)       │
  │   FC: 630 → 1024 → 512 → 256 → 1    │
  │   Loss: MSE on distance estimate      │
  │   GPU: NVIDIA RTX  ·  ~18 hrs total  │
  └──────────────────┬────────────────────┘
                     │  Trained weights V_θ
                     │
  ── Inference Phase ─────────────────────────────────────

  Scrambled Cube (25 moves)
       │
       ▼
  ┌───────────────────────────────────────┐
  │       Batched Weighted A*             │
  │   f(n) = g(n) + λ · V_θ(n)          │
  │   Beam width: 128  ·  GPU batched    │
  └──────────────────┬────────────────────┘
                     │
                     ▼
              Solved State ✓
          (optimal / near-optimal)`,
      results: [
        { metric: 'Solve Rate', value: '100%' },
        { metric: 'Test Cubes', value: '1,000' },
        { metric: 'Avg. Solution Length', value: '1.08× optimal' },
        { metric: 'Training States', value: '50M+' },
        { metric: 'Training Speedup', value: '40% faster' },
        { metric: 'Max Scramble Depth Tested', value: '35 moves' },
      ],
      github_url: 'https://github.com/tirth/deep-cube-solver',
    },
  },
  {
    id: 'covid-impact-analysis',
    title: 'COVID-19 Impact Analysis',
    short_description:
      "Multi-dataset SQL analysis and Tableau visualization of COVID-19's economic and social impact across sectors.",
    motivation:
      "To quantify the pandemic's real-world effects on employment, GDP, and healthcare using publicly available government datasets.",
    achievements: [
      'Joined and cleaned 5+ public datasets (2M+ rows) in MySQL with complex CTEs and window functions',
      'Built a Tableau story with 12 interactive dashboards across demographics and sectors',
      'Identified sector recovery patterns correlating with specific policy intervention timelines',
    ],
    tech_stack: ['MySQL', 'Tableau', 'SQL', 'Python', 'Pandas'],
    technical_details: 'MySQL, Tableau, SQL, Python, Pandas',
    status: 'complete',
    link: '/projects/covid-impact-analysis',
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.id === slug);
}
