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
  hero_image?: string; // optional background image for the hero banner
  detail?: ProjectDetail;
}

export const projects: Project[] = [
  {
    id: 'mapblazer-wait-time-prediction',
    title: 'Mapblazer Wait Time Prediction',
    short_description:
      'An end-to-end machine learning pipeline that predicts real-time theme park ride wait times — powering the Mapblazer routing engine by forecasting how crowds will shift hours into a guest\'s day. Beats the historical baseline by 53.8%.',
    motivation:
      'Mapblazer optimizes a guest\'s theme park itinerary from their must-ride list, live wait times, and walking distances. But a route built on the "current" 9 AM wait times falls apart by the time the guest reaches their 1 PM attraction — crowds shift all day, cascading one bad estimate into a ruined plan. The routing algorithm needed to see the future, not the present. I built the predictive engine that forecasts wait times across the day so the optimizer can anticipate crowd flow instead of chasing it.',
    achievements: [
      'Architected an end-to-end ML pipeline comparing three distinct architectures (Facebook Prophet, XGBoost Local, and XGBoost Global) across 1.5M+ theme park wait-time telemetry records spanning 6 Southern California parks.',
      'Cut the historical-baseline prediction error by 53.8% with a fine-tuned Prophet time-series model — slashing Mean Absolute Error from 7.08 minutes to just 3.27 minutes.',
      'Engineered cyclical sin/cosine temporal features so gradient-boosted trees could model continuous daily and seasonal crowd flow on a sub-year dataset — without breaking on the 23:59→00:00 and Dec→Jan boundaries.',
      'Eliminated catastrophic "fat-tail" prediction failures, achieving a 90.38% error-containment rate (predictions within ±10 minutes of reality) versus the baseline\'s 74%.',
      'Slashed severe misses (errors > 10 minutes) by 62.9% — dropping the severe-error rate from 25.9% to 9.6% across a 50,000+ sample holdout set.',
      'Built a live API inference harness that pulls the Queue-Times API in real time, computes live temporal features, and benchmarks all three architectures against the historical baseline simultaneously to monitor live model drift.',
    ],
    tech_stack: ['Python', 'XGBoost', 'Facebook Prophet', 'Pandas', 'NumPy', 'scikit-learn', 'Matplotlib', 'Queue-Times API'],
    technical_details:
      'Facebook Prophet (flat growth, daily/weekly seasonality, US holiday regressors), XGBoost (local per-ride models with RandomizedSearchCV tuning + a unified global model using native categorical embeddings), cyclical sin/cosine feature engineering, domain-aware ETL, and a real-time Queue-Times API inference harness.',
    status: 'complete',
    link: '/projects/mapblazer-wait-time-prediction',
    hero_image: '/mapblazer_hero.png',
    detail: {
      problem_statement:
        'Mapblazer is an AI theme park routing app that builds a guest\'s optimal ride itinerary from their must-visit attractions, real-time wait times, and walking distances. The flaw: the optimizer relied on "current" wait times pulled from park APIs, but wait times are highly dynamic — a route optimized at 9:00 AM is already wrong by the time a guest reaches their 1:00 PM attraction, cascading small errors into a broken plan. The routing engine needed accurate forward predictions of wait times to anticipate how crowds shift through the day. Building those models meant solving two hard problems: the dataset spanned less than a full year, so tree-based models like XGBoost couldn\'t reliably extrapolate raw chronological datetime inputs, and irregular US holidays violently disrupt the normal daily and weekly crowd cycles. The challenge was to engineer features and architectures that learn the underlying rhythm of park crowds — accurately enough to forecast, not just describe.',
      approach: [
        {
          step: 'Domain-Aware Data Filtering',
          detail:
            'Raw wait-time telemetry is noisy: a "0-minute" wait can mean a true walk-on during operating hours or an artifact of an overnight park closure or a scraping outage. The ETL layer (data_utils.py) preserves genuine walk-on zeros while discarding closure zeros using per-park operating-hour windows and start dates, caps wait times below 900 minutes to drop sensor errors, and resamples every ride to a clean 30-minute grid to smooth high-frequency micro-fluctuations.',
        },
        {
          step: 'Cyclical Feature Engineering',
          detail:
            'With under a year of data, gradient-boosted trees can\'t extrapolate raw datetime values — they only learn splits inside the dates they\'ve seen. I encoded continuous time into cyclical sin/cosine embeddings of the hour and month, so the model sees 23:59 and 00:00 (and Dec and Jan) as adjacent rather than maximally distant. These joined explicit dayofweek, is_weekend, and is_holiday flags to let the trees map the true daily and seasonal shape of crowd flow regardless of the specific calendar date.',
        },
        {
          step: 'Three Competing Architectures',
          detail:
            'I built and benchmarked three model families. Prophet: a dedicated time-series model per ride with flat growth, daily/weekly seasonality, and explicit US-holiday regressors to capture the irregular surges trees struggle with. XGBoost Local: an independent, RandomizedSearchCV-tuned gradient-boosted tree for every single ride, specialized to its unique pattern. XGBoost Global: one unified tree trained across all parks and rides, using park and ride names as native categorical features so it can borrow signal across attractions — and train far faster than hundreds of local loops.',
        },
        {
          step: 'Leakage-Free Chronological Validation',
          detail:
            'Every model uses a strict chronological 80/20 split rather than a random one — training only on the past and validating on the future, exactly mirroring how the model is used in production. Rides with insufficient historical mass (fewer than 50 resampled points) are skipped to avoid overfitting on thin data. Models were then evaluated on a 50,000+ sample holdout, measuring not just average error but the full error distribution and severe-miss rate.',
        },
        {
          step: 'Real-Time Inference Harness',
          detail:
            'A production-style harness synchronously hits the Queue-Times API for every mapped park, flattens the ride hierarchy across park "lands", computes live temporal features for the current timestamp, and runs inference across all three architectures plus the historical baseline simultaneously. It enforces the exact categorical ontology learned at training time and writes a side-by-side comparison matrix — making live model drift directly observable second by second.',
        },
        {
          step: 'Error-Distribution Analysis',
          detail:
            'Beyond MAE, I profiled the full signed error distribution (predicted − actual) for each architecture against the baseline on both standard holdout and high-traffic weekend/holiday data. This surfaced how each model controls the dangerous "fat tails" — the large misses that actually break a route — proving Prophet not only lowers average error but dramatically tightens the worst-case behavior the optimizer is most sensitive to.',
        },
      ],
      architecture: `
                     ┌───────────────────────────────────────────┐
                     │   Raw Wait-Time Telemetry  (1.5M+ rows)   │
                     │               6 SoCal parks               │
                     └───────────────────────────────────────────┘
                                           │
                                           v
                   ┌───────────────────────────────────────────────┐
                   │             data_utils.py  -  ETL             │
                   │   keep walk-on 0s, drop closure / outage 0s   │
                   │      per-park open / close hour windows       │
                   │    cap < 900 min / resample to 30-min grid    │
                   └───────────────────────────────────────────────┘
                                           │
                                           v
                    ┌─────────────────────────────────────────────┐
                    │        Cyclical Feature Engineering         │
                    │   hour & month -> sin / cos  (continuous)   │
                    │     dayofweek / is_weekend / is_holiday     │
                    └─────────────────────────────────────────────┘
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
           v                               v                               v
┌─────────────────────┐        ┌───────────────────────┐        ┌─────────────────────┐
│       Prophet       │        │     XGBoost Local     │        │   XGBoost Global    │
│   per-ride model    │        │    per-ride model     │        │  one unified tree   │
│    flat growth +    │        │  RandomizedSearchCV   │        │   park & ride as    │
│  daily / weekly +   │        │      hyper-tuned      │        │  native categories  │
│     US holidays     │        │                       │        │                     │
│      MAE  3.27      │        │       MAE  4.39       │        │      MAE  3.91      │
└─────────────────────┘        └───────────────────────┘        └─────────────────────┘
           │                               │                               │
           └───────────────────────────────┼───────────────────────────────┘
                                           │
                                           v
                   ┌───────────────────────────────────────────────┐
                   │          Real-Time Inference Harness          │
                   │       Queue-Times API -> live features        │
                   │   3 architectures + baseline, side by side    │
                   │     -> live model-drift comparison matrix     │
                   └───────────────────────────────────────────────┘`,
      results: [
        { metric: 'Prophet MAE', value: '3.27 min', description: 'Down from a 7.08 min historical baseline' },
        { metric: 'Accuracy Gain', value: '53.8%', description: 'MAE reduction vs. baseline (Prophet)' },
        { metric: 'Error Containment', value: '90.38%', description: 'Predictions within ±10 min (vs. 74% baseline)' },
        { metric: 'Severe Misses', value: '−62.9%', description: 'Errors > 10 min: 25.9% → 9.6%' },
        { metric: 'Records Processed', value: '1.5M+', description: 'Wait-time telemetry points' },
        { metric: 'ML Architectures', value: '3', description: 'Prophet · XGBoost Local · XGBoost Global' },
      ],
      github_url: 'https://github.com/TirthPatel3223/Mapblazer_Wait_Time_Prediction',
    },
  },
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
      'End-to-end data engineering pipeline correlating weather patterns with Yelp restaurant sentiment using PySpark, Snowflake, Airflow, and Tableau — processing 2M+ records.',
    motivation:
      'Curious whether weather drives restaurant ratings and business patterns, I built a production-grade data pipeline ingesting the full Yelp Academic Dataset and OpenWeatherMap API, performing distributed ETL at scale, NLP sentiment scoring, and surfacing insights through an executive Tableau dashboard.',
    achievements: [
      'Discovered the "Cold Weather Sentiment Paradox": Freezing weather drops volume to 101/day but yields the highest average sentiment index (0.71)',
      'Identified Extreme Heat as the major deterrent to dining out, dropping review volume to ~30/day with the lowest sentiment (0.65)',
      'Found that Rainy/Snowy weather causes a 50.7% drop in volume (143/day vs 290/day) but retains a resilient sentiment index identical to pleasant days (0.69)',
      'Generated Regional Penalty Heatmaps highlighting specific cities where weather unfairly skews ratings, isolating weather biases',
      'Designed a Snowflake star-schema data warehouse with sub-5-second query latency processing 2M+ records',
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
            'Cleaned and deduplicated 2M+ records using distributed PySpark on a 3-node local cluster. Joined review and weather datasets on composite (city_slug, date) keys. Handled schema drift, null imputation, and timezone normalization.',
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
              |  Clean & Join        |      2M+ records
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
        { metric: 'Records Processed',  value: '2M+',    description: 'Yelp reviews + weather data'       },
        { metric: 'Peak Sentiment',      value: '0.71',   description: 'Freezing weather paradox'          },
        { metric: 'Query Latency',       value: '< 5s',   description: 'Snowflake star-schema DW'          },
        { metric: 'Avg Review Stars',    value: '3.85★',  description: 'Across all weather types'          },
        { metric: 'Volume Drop (Rain)',  value: '50.7%',  description: 'vs. pleasant-day baseline'         },
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
    tech_stack: ['PyTorch', 'TensorFlow', 'CUDA', 'Deep Learning', 'Deep RL', 'Python', 'NumPy'],
    technical_details: 'PyTorch, TensorFlow, CUDA, Deep Learning, Deep Reinforcement Learning, Python, NumPy',
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
      "Interactive Tableau visualization analyzing COVID-19's impact on India — tracking vaccination rollout, weekly case surges, and death rate trajectories with demographic context.",
    motivation:
      "To quantify the pandemic's real-world effects on India through vaccination rates, case trajectories, and death rates — contextualised by demographic indicators like HDI, median age, and population density — and surface actionable patterns through interactive Tableau dashboards built entirely from joined public datasets.",
    achievements: [
      'Visualized the dramatic impact of vaccination on death rates — sharp decline in death rate even though there is a sharp increase in the number of cases after vaccination',
      'Captured India\'s devastating second wave: weekly new cases peaked at 2.2M+ around February 2021',
      'Tracked vaccination milestone of 140M+ total people vaccinated with clear inflection points',
      'Built demographic context layer showing HDI (0.6), median age (28.2), and population density (450.4) for analytical framing',
      'Created before/after vaccination comparison revealing vaccination as the critical intervention in reducing mortality',
    ],
    tech_stack: ['Tableau', 'Data Visualization', 'SQL'],
    technical_details: 'Tableau (data joins, calculated fields, interactive filters), SQL for data preparation',
    status: 'complete',
    link: '/projects/covid-impact-analysis',
    detail: {
      problem_statement:
        "The COVID-19 pandemic generated massive amounts of data across countries, but raw numbers alone don't tell the story. The challenge was to build an interactive visualization that contextualises India's pandemic trajectory — vaccination progress, case surges, and death rates — against demographic indicators like Human Development Index, median age, and population density. The goal: surface clear before-and-after vaccination patterns and make the data explorable for anyone, built entirely within Tableau using joined public datasets.",
      approach: [
        {
          step: 'Data Collection & Joining',
          detail:
            'Imported multiple public COVID-19 datasets into Tableau, including daily case counts, vaccination records, death statistics, and country-level demographic indicators (HDI, median age, population density). Performed data joins directly within Tableau on country and date keys to create a unified analytical dataset.',
        },
        {
          step: 'Demographic Context Layer',
          detail:
            'Created a KPI header showing India\'s key demographic indicators — Human Development Index (0.6), Median Age (28.2), Population Density (450.4) — alongside pandemic-specific metrics: Percentage of Population Vaccinated (1.929%), Percentage Population Dead (0.035%), and Percentage of Population Infected (1.389%). These provide essential context for interpreting the pandemic data.',
        },
        {
          step: 'Temporal Trend Visualization',
          detail:
            'Built three interconnected time-series charts — Total People Vaccinated (cumulative), Weekly New Cases (with wave identification), and Weekly Death Rate — all aligned on the same time axis (March 2020 – May 2021). Color-coded bars distinguish pre-vaccination (orange) from post-vaccination (blue) periods to highlight the intervention effect.',
        },
        {
          step: 'Vaccination Impact Analysis',
          detail:
            'Overlaid vaccination introduction markers on death rate and case charts to visually demonstrate the causal relationship between vaccine rollout and declining mortality. The death rate chart clearly shows a sharp decline in death rate even though there is a sharp increase in the number of cases after vaccination, while case volume shows the second wave\'s severity was not matched by proportional mortality.',
        },
      ],
      architecture: `
┌───────────────────────┐         ┌───────────────────────┐
│  COVID-19 Case Data   │         │  Vaccination Records  │
│  (daily by country)   │         │  (daily by country)   │
└───────────────────────┘         └───────────────────────┘
            │                                 │
            └────────────────┬────────────────┘
                             │
                             v
              ┌─────────────────────────────┐
              │     + Demographic Data      │
              │  joined on country + date   │
              └─────────────────────────────┘
                             │
                             v
               ┌───────────────────────────┐
               │      Tableau Desktop      │
               │    calculated fields /    │
               │   interactive filters /   │
               │  before & after coloring  │
               └───────────────────────────┘
                             │
                             v
                ┌─────────────────────────┐
                │  Interactive Dashboard  │
                │  KPI cards + 3 charts:  │
                │  vaccination / cases /  │
                │    death-rate trends    │
                └─────────────────────────┘`,
      results: [
        { metric: 'Peak Weekly Cases', value: '2.2M+', description: 'India second wave (Feb 2021)' },
        { metric: 'Vaccinated', value: '140M+', description: 'Total people vaccinated' },
        { metric: 'Death Rate Decline', value: 'Sharp Drop', description: 'Despite increase in cases after vaccination' },
        { metric: 'Population Infected', value: '1.389%', description: 'Of total population' },
        { metric: 'HDI', value: '0.6', description: 'Human Development Index' },
        { metric: 'Median Age', value: '28.2', description: 'Years' },
      ],
    },
  },
  {
    id: 'msba-orders-analysis',
    title: 'E-Commerce Seller & Logistics Analytics',
    short_description:
      'Multi-dashboard Tableau analytics dissecting seller performance, shipping logistics, and product characteristics across 89K+ e-commerce orders — revealing revenue concentration, delivery patterns, and cost structures.',
    motivation:
      'To provide a comprehensive analytical view of e-commerce operations by building interconnected Tableau dashboards that dissect seller performance, shipping efficiency, and product characteristics — enabling data-driven decisions on seller management, logistics optimization, and pricing strategy.',
    achievements: [
      'Built 3 interconnected dashboards covering seller revenue, shipping logistics, and product analysis across 89,316 orders',
      'Identified extreme revenue concentration — top sellers drive the majority of $2.44M total revenue with average order value of $340.9',
      'Discovered shipping cost disparity — median shipping cost is 22.18% of price vs. average of 62.91%, revealing heavy-product outliers inflating costs',
      'Achieved 90.34% on-time delivery rate with median order cycle time of 10 days across all product categories',
      'Created interactive filters by city, seller ID, product category, and delivery date enabling granular segment analysis',
      'Mapped São Paulo as the dominant market with 14K+ orders, followed by Rio de Janeiro and Belo Horizonte',
    ],
    tech_stack: ['Tableau', 'Data Visualization', 'SQL'],
    technical_details: 'Tableau (data joins, calculated fields, interactive filters, multi-dashboard navigation), SQL for data preparation',
    status: 'complete',
    link: '/projects/msba-orders-analysis',
    detail: {
      problem_statement:
        'E-commerce platforms generate vast transactional data across sellers, orders, shipping, and products — but without structured analysis, patterns in revenue concentration, delivery performance, and cost drivers remain hidden. The challenge: build a comprehensive multi-dashboard Tableau visualization that dissects seller performance (revenue and sales volume), shipping logistics (cycle time, on-time rates, cost structures), and product characteristics (weight, volume, category distributions) — all with interactive filtering to enable segment-specific insights at the city, seller, and product category level.',
      approach: [
        {
          step: 'Data Integration & Joining',
          detail:
            'Imported e-commerce transactional tables (orders, order items, sellers, products, customers, payments) into Tableau and performed joins on order ID, seller ID, and product ID keys to create a unified dataset spanning 89,316 orders with complete seller, shipping, and product metadata.',
        },
        {
          step: 'Seller Performance Dashboard',
          detail:
            'Built the first dashboard visualizing revenue per company (horizontal bar chart ranked by seller), revenue distribution (pie chart by product category — toys at 75.52% dominance), MoM sales and revenue growth (bar charts with positive/negative indicators), and time-series trends for sales per month and revenue per month. Added KPI cards for total revenue ($2,441,873) and average order value ($340.9).',
        },
        {
          step: 'Shipping & Delivery Dashboard',
          detail:
            'Created the second dashboard analyzing orders per city (São Paulo leading at 14K+), sales per seller, estimated vs. actual delivery delta (histogram showing most deliveries arrive early), shipping cost distribution, order cycle time distribution, and shipping cost as percentage of price. Added KPI cards: median order cycle time (10 days), on-time delivery rate (90.34%), median shipping cost/price (22.18%), and average shipping cost/price (62.91%).',
        },
        {
          step: 'Product Analysis Dashboard',
          detail:
            'Designed the third dashboard mapping product characteristics: sales per seller by order count, product category distribution (pie chart), product weight distribution (gradient histogram from 0–40K+ grams), product volume distribution (histogram), and a treemap/heatmap visualization of product dimensions. Added KPI cards: average product weight (2,087g) and average product volume (15,248cc).',
        },
        {
          step: 'Interactive Filtering & Cross-Dashboard Navigation',
          detail:
            'Implemented interactive filters across all dashboards — filtering by customer city, seller ID, product category, order status, delivery date range, and order cycle time. Enabled cross-dashboard navigation so users can drill from seller revenue to their specific shipping performance to product characteristics.',
        },
      ],
      architecture: `
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│     Orders    │   │  Order Items  │   │    Sellers    │   │    Products   │   │   Customers   │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │                   │                   │
        └───────────────────┴───────────────────┼───────────────────┴───────────────────┘
                                                │
                                                v
                                 ┌─────────────────────────────┐
                                 │        Tableau Joins        │
                                 │  on order_id / seller_id /  │
                                 │  product_id / customer_id   │
                                 └─────────────────────────────┘
                                                │
                                                v
                                   ┌─────────────────────────┐
                                   │     Unified Dataset     │
                                   │  89,316 orders joined   │
                                   └─────────────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
                 v                              v                              v
       ┌───────────────────┐        ┌───────────────────────┐       ┌─────────────────────┐
       │    Dashboard 1    │        │      Dashboard 2      │       │     Dashboard 3     │
       │  Seller Revenue   │        │  Shipping & Delivery  │       │  Product Analysis   │
       └───────────────────┘        └───────────────────────┘       └─────────────────────┘`,
      results: [
        { metric: 'Total Orders', value: '89,316', description: 'Across all sellers and cities' },
        { metric: 'Total Revenue', value: '$2.44M', description: 'Across all product categories' },
        { metric: 'Avg Order Value', value: '$340.9', description: 'Per order' },
        { metric: 'On-Time Delivery', value: '90.34%', description: 'Delivered by estimated date' },
        { metric: 'Median Cycle Time', value: '10 days', description: 'Order to delivery' },
        { metric: 'Shipping/Price', value: '22.18%', description: 'Median shipping cost ratio' },
      ],
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.id === slug);
}
