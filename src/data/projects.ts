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
    id: 'weather-dining-pipeline',
    title: 'Yelp & Weather Intelligence Pipeline',
    short_description:
      'End-to-end data engineering pipeline correlating weather patterns with Yelp restaurant sentiment using PySpark, Snowflake, Airflow, and Tableau — processing 10M+ records to reveal statistically significant weather–dining correlations (r = −0.71).',
    motivation:
      'Curious whether weather drives restaurant ratings and business patterns, I built a production-grade data pipeline ingesting the full Yelp Academic Dataset and OpenWeatherMap API, performing distributed ETL at scale, NLP sentiment scoring, and surfacing insights through an executive Tableau dashboard.',
    achievements: [
      'Processed 10M+ records with distributed PySpark jobs across a multi-node cluster',
      'Applied VADER NLP sentiment analysis to 500K+ reviews achieving 85%+ accuracy',
      'Designed a Snowflake star-schema data warehouse with sub-5-second query latency',
      'Orchestrated automated daily ETL workflows via Apache Airflow with SLA alerting',
      'Discovered strong inverse weather–dining correlation (r = −0.71) via Tableau dashboards',
      'Published interactive executive Tableau dashboard on Tableau Public'
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
  ┌─────────────────────┐    ┌──────────────────────┐
  │   Yelp Dataset      │    │  OpenWeatherMap API  │
  │  (JSON / CSV bulk)  │    │  (REST, paginated)   │
  └────────┬────────────┘    └──────────┬───────────┘
           │                            │
           └──────────┬─────────────────┘
                      │  Raw data
                      ▼
           ┌──────────────────────┐
           │     PySpark ETL      │  ← 3-node cluster
           │  Clean · Join        │    10M+ records
           │  Deduplicate         │    ~4 hrs full run
           └──────────┬───────────┘
                      │  Enriched records
                      ▼
           ┌──────────────────────┐
           │     VADER NLP        │  ← Sentiment scoring
           │  500K+ reviews       │    per (business, date)
           └──────────┬───────────┘
                      │  Scored reviews
                      ▼
           ┌──────────────────────┐
           │      Snowflake       │  ← Star schema DWH
           │  fact: daily_reviews │    auto-clustered
           │  dims: weather, biz  │    on date partition
           └──────────┬───────────┘
                      │
            ┌─────────┴──────────┐
            ▼                    ▼
   ┌──────────────────┐  ┌──────────────────┐
   │     Airflow      │  │     Tableau      │
   │  Daily DAG       │  │  12 Dashboards   │
   │  + SLA Alerting  │  │  (exec-level)    │
   └──────────────────┘  └──────────────────┘`,
      results: [
        { metric: 'Records Processed', value: '10M+' },
        { metric: 'Sentiment Accuracy', value: '85%+' },
        { metric: 'Snowflake Query Latency', value: '<5s' },
        { metric: 'Pipeline Runtime', value: '<4 hrs' },
        { metric: 'Weather-Dining Correlation', value: 'r = −0.71' },
        { metric: 'Tableau Dashboards', value: '12 views', description: 'Interactive executive dashboard with 12 visualizations — open directly in Tableau Public' },
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
    id: 'jobscout',
    title: 'JobScout — Job Scraper & Aggregator',
    short_description:
      'Automated multi-source job aggregator with a Streamlit dashboard for filtering, tracking, and exporting opportunities.',
    motivation:
      'To eliminate the tedium of manually checking multiple job boards by centralizing listings into a searchable, deduplicated local database.',
    achievements: [
      'Multi-source scraper ingesting listings from LinkedIn, Indeed, and career pages',
      'SQLite-backed deduplication using fuzzy title/company matching',
      'Streamlit dashboard with dynamic filters, saved searches, and CSV export',
    ],
    tech_stack: ['Python', 'Streamlit', 'SQLite', 'BeautifulSoup', 'Selenium'],
    technical_details: 'Python, Streamlit, SQLite, BeautifulSoup, Selenium',
    status: 'coming-soon',
    link: '/projects/jobscout',
  },
  {
    id: 'movie-recommendation',
    title: 'Movie Recommendation Engine',
    short_description:
      'Collaborative filtering recommendation system with neural embeddings, a FastAPI backend, and a React frontend.',
    motivation:
      'To build a production-grade recommendation system beyond simple cosine similarity, using deep learning to capture latent user-item preferences.',
    achievements: [
      'Matrix factorization model with learned neural embeddings (PyTorch)',
      'FastAPI backend delivering personalized recommendations with sub-100ms latency',
      'React frontend with personalized watchlists, ratings, and explainability tooltips',
    ],
    tech_stack: ['PyTorch', 'FastAPI', 'React', 'Python', 'PostgreSQL'],
    technical_details: 'PyTorch, FastAPI, React, Python, PostgreSQL',
    status: 'coming-soon',
    link: '/projects/movie-recommendation',
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
