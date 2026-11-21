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
  /** ASCII diagram rendered in a <pre> block. Omit when the project ships a custom
   *  SVG diagram component instead (weather-dining-pipeline). */
  architecture?: string;
  results: ResultMetric[];
  github_url?: string;
}

export interface Project {
  id: string;
  title: string;
  short_description: string;
  motivation: string;
  /** Achievement list shown in full on the project detail page's Results & Impact
   *  section. Keep each bullet to one or two plain sentences. */
  achievements: string[];
  /** Short, homepage-card-only highlights (3 one-liners). Falls back to the first
   *  3 entries of `achievements` when omitted. */
  card_achievements?: string[];
  tech_stack: string[];
  technical_details: string;
  status: ProjectStatus;
  link: string;
  hero_image?: string; // optional background image for the hero banner
  detail?: ProjectDetail;
}

export const projects: Project[] = [
  {
    id: 'deep-cube-solver',
    title: 'Maltese Gear Cube Solver: Reinforcement Learning Meets Group Theory',
    short_description:
      'A solver for a geared puzzle cube with about 4.5×10⁵⁸ positions. It splits the cube into five smaller puzzles and solves each with an exact lookup table or a neural network: 100 of 100 deep scrambles solved, about 12 seconds each.',
    motivation:
      'My first try, one neural network for the whole cube, couldn\'t solve anything more than 24 moves from solved. Instead of a bigger network, I used group theory to break the puzzle into pieces small enough to handle.',
    card_achievements: [
      'Solved 100 of 100 random scrambles, each 2,000 to 5,000 moves deep, in about 12 seconds apiece.',
      'Five stages: three solved by exact lookup tables, two by neural networks for the parts too big to store.',
      'Every solution is replayed on a simulator and only counts if the cube ends up solved.',
    ],
    achievements: [
      'Solved all 100 test scrambles, each 2,000 to 5,000 random moves deep, in 12 seconds on average on one laptop GPU, at 406 moves per solution.',
      'Split one impossible search into five manageable ones (corners, then the gears, then the middle ring), each using only move sequences that keep earlier stages solved, with a group-theory check that every stage can always be finished.',
      'Used exact lookup tables where a stage fits in memory (up to 8.4 million positions) and trained neural networks only for the two stages that don\'t (up to 5.4×10²² positions).',
      'Caught a silent failure: one gear stage looked solvable on paper, yet 8 of the first 9 deep scrambles stalled there. Giving that stage 244 extra move sequences took the benchmark to 100 of 100.',
      'Reported the trade-off honestly: solutions run about 2.6× longer than the reference table-based solver\'s, which needs about 50 GB of tables against this one\'s 0.5 GB.',
      'Built nothing cube-specific into the core: the same code has since solved a second puzzle, the DaYan Tangram Cube Extreme, starting from its 3D model.',
    ],
    tech_stack: ['PyTorch', 'CUDA', 'Deep RL', 'Group Theory', 'Beam Search', 'SymPy', 'NumPy', 'Python', 'three.js'],
    technical_details:
      'Python, PyTorch (CUDA), NumPy, SymPy, pytest; deep approximate value iteration (DeepCubeA / DeepXube), Schreier coset graphs, meet-in-the-middle macro harvesting, GPU Dijkstra tables, batched GPU beam search; 3D simulator in TypeScript, three.js and manifold-3d',
    status: 'complete',
    link: '/projects/deep-cube-solver',
    detail: {
      problem_statement:
        'The Maltese Gear Cube looks like a Rubik\'s cube until you turn it. Every turn also drags the middle layer around and spins 24 gears, which gives it about 4.5×10⁵⁸ positions, more than there are atoms in the Sun. My first attempt, a single neural network guiding a search over the whole cube, could not solve anything more than 24 moves from solved. The goal was a solver that handles any scramble, however deep, and proves every answer is correct.',
      approach: [
        {
          step: 'Teach the Computer the Puzzle',
          detail:
            'Each move is written as an exact shuffle of 216 tracked points: stickers, gears and gear angles. From those moves alone, the code works out what the pieces are (7 corners, 18 ring pieces and 24 gears) without being told.',
        },
        {
          step: 'Break It Into Five Smaller Puzzles',
          detail:
            'Like solving a Rubik\'s cube layer by layer, the solver fixes one group of pieces at a time: corners, then the gears in three stages, then the middle ring. Each stage only uses move sequences that leave earlier stages alone, and a group-theory check proves every stage can always be finished.',
        },
        {
          step: 'Look Up What Fits, Learn What Doesn\'t',
          detail:
            'The three small stages (up to 8.4 million positions) get exact lookup tables of the best move from every position, built on the GPU in about a minute. The two huge ones (up to 5.4×10²² positions) can\'t be stored, so a neural network learns to estimate how far any position is from solved.',
        },
        {
          step: 'Search, Then Double-Check',
          detail:
            'For the two learned stages, a GPU search follows the network\'s estimates, keeping the 4,096 most promising options at each step. The five stage solutions are joined, back-to-back turns are merged, and the result is replayed on a simulator. It only counts if the cube comes out solved.',
        },
      ],
      architecture: `
  ── BUILD  -  once, about 80 minutes on one GPU ─────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ The puzzle's moves        U, L, F and their reverses             │
  │   each one written as a shuffle of 216 tracked points            │
  │   (stickers, gears and gear angles)                              │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Split the cube into 5 stages, solved in this order:              │
  │   1 corners   2-3 gear angles   4 gear positions   5 the ring    │
  │   a stage only uses moves that leave earlier stages solved       │
  └────────────────────────────────┬─────────────────────────────────┘
                ┌──────────────────┴──────────────────┐
                ↓                                     ↓
  ┌───────────────────────────┐         ┌───────────────────────────┐
  │ 3 SMALL STAGES            │         │ 2 HUGE STAGES             │
  │ up to 8.4M positions      │         │ up to 5.4 x 10^22         │
  │ exact lookup table:       │         │ a neural network learns   │
  │ best move for each one    │         │ how far each position     │
  │ built in about a minute   │         │ is from solved            │
  └───────────────────────────┘         └───────────────────────────┘
                └──────────────────┬──────────────────┘
                                   ↓  saved to disk, about 0.5 GB

  ── SOLVE  -  every scramble, about 12 seconds ──────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ Scrambled cube                                                   │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Stages 1-3   follow the lookup tables, one best move at a time   │
  │ Stages 4-5   GPU search guided by the networks,                  │
  │              keeping the best 4,096 options at each step         │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Join the five stage solutions, merge back-to-back turns          │
  │ Replay on the simulator: it only counts if the cube is solved    │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
                    Verified solution, about 406 moves
`,
      results: [
        { metric: 'Scrambles Solved', value: '100 / 100', description: 'Each 2,000 to 5,000 random moves deep' },
        { metric: 'Average Solve Time', value: '12 s', description: 'On one laptop GPU' },
        { metric: 'Moves per Solution', value: '406', description: 'Average, counted in quarter turns' },
        { metric: 'Possible Positions', value: '4.5×10⁵⁸', description: 'More than the atoms in the Sun' },
        { metric: 'Stages', value: '5', description: '3 lookup tables, 2 neural networks' },
        { metric: 'Memory Needed', value: '0.5 GB', description: 'vs. ~50 GB for a table-based solver' },
      ],
      github_url: 'https://github.com/TirthPatel3223/deeprubik-ladder',
    },
  },
  {
    id: 'puzzle-lab',
    title: 'Puzzle Lab: Six Real Twisty Puzzles, Rebuilt in 3D',
    short_description:
      'Playable browser copies of six real twisty puzzles, built from photos and their true cut geometry. Every move the real puzzle allows works, and nothing else does.',
    motivation:
      'Solving a puzzle with code starts with an exact model of it. These simulators are that model: the Tangram Cube solver reads its pieces and moves straight from the app.',
    card_achievements: [
      'Six puzzles by four designers, each rebuilt from photos of the real puzzle and its published geometry.',
      'Only legal moves: Curvy Copter turns are checked against the real piece shapes, and blocked turns glow red.',
      'The Maltese engine was cross-checked against more than 5,000 move sequences from my own model of the puzzle.',
    ],
    achievements: [
      'Rebuilt six real puzzles for the browser: the DaYan Tangram Cube and Tangram Cube Extreme, Meffert\'s Curvy Copter and Curvy Copter Plus, the Maltese Gear Cube and David\'s Gear Cube.',
      'Built every piece from the puzzle\'s real cuts. The Curvy Copter\'s curved cuts are cones tilted 32°, Meffert\'s own figure, and a fit to a photo gave 32.5°.',
      'Allowed every move the real puzzle allows, and only those: a Curvy Copter turn that would make pieces collide is refused, and the pieces in the way glow red.',
      'Geared the Maltese Gear Cube exactly: a 90° face turn drives the middle layer 45° and spins its 8 gears 270°, checked against the real puzzle.',
      'Cross-checked the Maltese engine against more than 5,000 move sequences from my own model of the puzzle, and David\'s Gear Cube against published centre-swapping algorithms.',
      'Exported the Tangram Cube\'s pieces and moves for the solving pipeline, which compiles them into permutation tables.',
    ],
    tech_stack: ['TypeScript', 'three.js', 'manifold-3d', 'WebAssembly', 'Vite', 'Vitest', 'Python', 'Group Theory'],
    technical_details:
      'TypeScript, three.js, manifold-3d (mesh booleans in WebAssembly), Vite, Vitest; Python fitting tools for stickers and gear outlines; deployed to GitHub Pages with GitHub Actions',
    status: 'complete',
    link: '/projects/puzzle-lab',
    detail: {
      problem_statement:
        'Geared and shape-shifting puzzles are hard to reason about on paper: one turn of the Maltese Gear Cube moves a face, drags the middle layer and spins eight gears. I wanted exact, playable 3D copies of six real puzzles, accurate enough for a solver to trust: every piece from the real cut geometry, every legal move, and no illegal ones.',
      approach: [
        {
          step: 'Measure the Real Puzzles',
          detail:
            'Each puzzle was rebuilt from photos and published descriptions. The Tangram Cube\'s cut depth came from a photo (11 shapes per face), and the Maltese Gear Cube was measured from my own puzzle.',
        },
        {
          step: 'Cut the Pieces Exactly',
          detail:
            'Pieces come from the puzzle\'s real cut planes and cones, built with mesh booleans in WebAssembly (manifold-3d), with rounded edges like the physical puzzles.',
        },
        {
          step: 'Model Every Move',
          detail:
            'Each puzzle has its own engine. Pieces sit in exact, discrete positions, so a turn is a table lookup rather than a physics guess. The Curvy Copter checks each turn against the real piece shapes and refuses any that would collide.',
        },
        {
          step: 'Test Against the Real Thing',
          detail:
            'Test suites cover the engines, notation, undo history and meshes. The Maltese engine was cross-checked against more than 5,000 move sequences, and David\'s Gear Cube against published algorithms.',
        },
      ],
      architecture: `
  ┌──────────────────────────────────────────────────────────────────┐
  │ Real puzzles: photos, measurements, published descriptions       │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Geometry: real cut planes, cones and traced gear outlines        │
  │   pieces built with mesh booleans (manifold-3d, WebAssembly)     │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ One engine per puzzle: exact piece positions and move tables     │
  │   legal moves only, tested with Vitest                           │
  └────────────────────────────────┬─────────────────────────────────┘
                ┌──────────────────┴──────────────────┐
                ↓                                     ↓
  ┌───────────────────────────┐         ┌───────────────────────────┐
  │ 3D app (three.js)         │         │ Export for the solver     │
  │ click or type moves,      │         │ pieces and moves as       │
  │ undo, scramble, themes    │         │ JSON, compiled into       │
  │ on GitHub Pages           │         │ permutation tables        │
  └───────────────────────────┘         └───────────────────────────┘
`,
      results: [
        { metric: 'Puzzles', value: '6', description: 'By four designers' },
        { metric: 'Sequences Checked', value: '5,000+', description: 'Maltese engine vs. my own model' },
        { metric: 'Visible Tangram Pieces', value: '44', description: '11 shapes per face' },
        { metric: 'Curvy Cut Angle', value: '32°', description: 'A photo fit gave 32.5°' },
        { metric: 'Maltese Gears', value: '24', description: 'Each face turn spins 8 of them 270°' },
        { metric: 'Runs In', value: 'Browser', description: 'three.js on GitHub Pages' },
      ],
      github_url: 'https://github.com/TirthPatel3223/combinatorics-puzzle-simulator',
    },
  },
  {
    id: 'mapblazer-wait-time-prediction',
    title: 'Theme Park Wait-Time Forecasting: Production MLOps Pipeline',
    short_description:
      'A production ML pipeline that forecasts theme park wait times a week ahead, retrains itself weekly on Databricks and runs for $0/month. It powers the Mapblazer routing engine.',
    motivation:
      'A route planned on 9 AM wait times is already wrong by 1 PM. Mapblazer\'s router needed a forecast for every ride at every time of day, a week out.',
    card_achievements: [
      'Forecasts 109 rides in 5 parks, 7 days ahead, fully unattended for $0/month.',
      'Cut forecast error 26.3% below baseline (7.01 vs. 9.51 min); 76.6% of forecasts land within 10 minutes.',
      'A new model ships only if it beats the current one, and 12 automated checks keep a bad run off the dashboard.',
    ],
    achievements: [
      'Built a weekly forecasting system for 109 attractions across 5 California parks, 7 days ahead at 30-minute resolution, running unattended on Databricks for $0/month.',
      'Cut holdout error 26.3% below the per-ride baseline (MAE 7.01 vs. 9.51 min), raised within-10-minute accuracy from 64.5% to 76.6% and cut severe misses (over 15 min) by 42.1%, on a 78,110-observation time-ordered holdout.',
      'Designed ingestion as a push agent on the database\'s own host, so Postgres never accepts an inbound connection, and made every run safe to repeat: a crashed run re-reads the same range and nothing needs fixing by hand.',
      'Trained four model families every week on a strict time-ordered split; a challenger replaces the champion only if it cuts error by at least 1%, and rollback is a one-line edit.',
      'Kept the dashboard working through failures: each run writes to a staging copy, 12 quality gates check it, and only a fully passing run is promoted. One gate is a timezone tripwire that fails any run whose busiest hour falls outside 11:00 to 20:00.',
      'Published to Supabase with a single-transaction table swap, so readers never see half an update, and served the public dashboard as one static HTML file with no JavaScript.',
    ],
    tech_stack: ['Python', 'Databricks', 'PySpark', 'Delta Lake', 'Prophet', 'XGBoost', 'Supabase', 'PostgreSQL', 'GitHub Actions', 'AWS EC2', 'pandas', 'SQL'],
    technical_details:
      'A Databricks Asset Bundle deploying one serverless job (bronze to silver to train to KPIs to gold, then quality gates and atomic promotion), a hardened systemd ingestion agent on the source EC2 host, four model families (Prophet fleet, global XGBoost, per-ride XGBoost, per-ride mean baseline) on a chronological split, a 1%-improvement champion/challenger promotion gate with file-based model artifacts behind a serving pointer, and a GitHub Actions publish path into Supabase PostgREST plus a zero-JavaScript static dashboard on GitHub Pages.',
    status: 'complete',
    link: '/projects/mapblazer-wait-time-prediction',
    hero_image: '/mapblazer_hero.png',
    detail: {
      problem_statement:
        'Mapblazer plans a guest\'s ride itinerary from wait times, but a plan built at 9 AM is already wrong by 1 PM, and each stale estimate cascades into the next. The router needs a forecast for every ride at every possible arrival time, a week ahead, refreshed automatically and visibly fresh. That makes this an operations problem as much as a modelling one: where the data comes from each hour, what retrains the model as crowds drift, and what happens when a run fails at 6 AM on a Sunday.',
      approach: [
        {
          step: 'Ingestion: A Push Agent on the Source Host',
          detail:
            'An hourly agent runs on the same EC2 host as the wait-time Postgres and pushes new rows out over HTTPS. That was a deliberate choice: pulling would have meant exposing Postgres to a rotating set of CI runner IPs. The agent reads its position back from the destination table, so an interrupted run simply repeats and the insert-only merge absorbs the overlap.',
        },
        {
          step: 'Cleaning That Decides the Numbers',
          detail:
            'Raw (bronze) data is never edited. The silver layer drops duplicates, sentinel values and junk rides, and converts timestamps to park-local time before filtering to operating hours: done the other way round, it quietly deletes the evening peak while the data still looks fine. Every ride is then resampled to a 30-minute grid.',
        },
        {
          step: 'Four Models, One Honest Split',
          detail:
            'Each run trains a per-ride Prophet fleet, a global XGBoost, a per-ride XGBoost and a per-ride average as the floor, on a strict time-ordered 80/20 split, because random splits leak the future. Models are scored on seven KPIs, including peak-hour and long-queue error, since 37% of readings are zero and a single average flatters a model that always predicts short queues.',
        },
        {
          step: 'Champion, Challenger and Quality Gates',
          detail:
            'A new model ships only if it beats the incumbent by at least 1%; otherwise the incumbent re-forecasts the coming week. Every run writes to _current tables, 12 gates check them, and only a passing run is promoted to _last, which is all the dashboard ever reads.',
        },
        {
          step: 'Failing Without Going Dark',
          detail:
            'If anything fails, the last good model still refreshes the forecast window, the job still raises an alert, and the dashboard labels the week as a fallback instead of quietly serving stale numbers.',
        },
        {
          step: 'Serving With No JavaScript',
          detail:
            'Databricks Free Edition jobs have no outbound internet, so GitHub Actions pulls the results out, loads them into Supabase and swaps tables inside one Postgres transaction. The public dashboard is a single static HTML file with inline SVG charts.',
        },
      ],
      architecture: `
  ── INGEST  -  AWS EC2, hourly systemd timer ────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ deploy/ec2/ingest.py      runs beside the source Postgres        │
  │   pushes outbound by design: the database connection stays       │
  │   on the loopback interface, no firewall rule to change,         │
  │   and the only access needed is outbound HTTPS                   │
  │   watermark = MAX(wait_time_id) read back from bronze            │
  │   land Parquet -> MERGE insert-only, so a killed run just        │
  │   re-reads the same range and the overlap is absorbed            │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  Free Edition has no outbound net
                                   ↓

  ── PIPELINE  -  Databricks serverless, Sunday 06:00 UTC ────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ bronze.wait_times_raw         842,539 rows                       │
  │   append-only audit trail, never edited in place                 │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ silver.wait_times_current     ~390K rows . 109 attractions       │
  │   UTC -> local time first, then park operating hours             │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  chronological 80/20 split
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ train    four families every run, holdout MAE in minutes         │
  │                                                                  │
  │   Prophet fleet    7.01  <- champion                             │
  │   XGB global       8.26      XGB per-ride    8.45                │
  │   Ride mean        9.51  <- floor, not a candidate               │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ gold.kpis_current  +  gold.predictions_current                   │
  │   7 KPIs x 4 models . 7-day forecast + backtest rows             │
  └────────────────────────────────┬─────────────────────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ 12 quality gates  ->  promote _current to _last                  │
  │   atomic DEEP CLONE . serving.json pointer written last          │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  pulled out, never pushed
                                   ↓

  ── SERVE  -  GitHub Actions, Sunday 08:00 UTC ──────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ publish.py              reads gold _last over the Databricks     │
  │                         SQL warehouse                            │
  │ publish_serving() RPC   staging and serving renamed inside       │
  │                         one Postgres transaction                 │
  └────────────────────────────────┬─────────────────────────────────┘
                ┌──────────────────┴──────────────────┐
                ↓                                     ↓
  ┌───────────────────────────┐         ┌───────────────────────────┐
  │ Supabase PostgREST        │         │ GitHub Pages              │
  │   read-only API           │         │   dashboard.py, zero JS   │
  └───────────────────────────┘         └───────────────────────────┘
                └──────────────────┬──────────────────┘
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Mapblazer routing solver                                         │
  │   the whole cost surface: every ride x every arrival time        │
  └──────────────────────────────────────────────────────────────────┘
`,
      results: [
        { metric: 'Champion MAE', value: '7.01 min', description: 'Prophet fleet, vs. a 9.51 min baseline' },
        { metric: 'Accuracy Gain', value: '26.3%', description: 'MAE reduction vs. per-ride mean baseline' },
        { metric: 'Within 10 min', value: '76.6%', description: 'Up from 64.5% at baseline' },
        { metric: 'Severe Misses', value: '42.1% fewer', description: 'Errors over 15 min: 23.5% to 13.6%' },
        { metric: 'Retrain Cadence', value: 'Weekly', description: 'Unattended, Sunday 06:00 UTC' },
        { metric: 'Infra Cost', value: '$0/mo', description: 'Databricks Free, Supabase, GH Pages' },
      ],
      github_url: 'https://github.com/TirthPatel3223/Mapblazer_Wait_Time_Prediction',
    },
  },
  {
    id: 'knee-mri-data-efficiency',
    title: 'Knee MRI Diagnosis: How Much Labeled Data Does a Hospital Need?',
    short_description:
      'How many labeled MRI exams does a hospital need to build its own knee-MRI triage model? A learning-curve study of five vision models on multi-site data, run on one laptop GPU with no patient data leaving the machine.',
    motivation:
      'Expert labels cost about $45,000 per 1,000 exams, while compute costs a few dollars. So the deciding question for a hospital is how many exams to label, and whether the model choice changes it. A two-person team project for UCLA\'s Healthcare Analytics course.',
    card_achievements: [
      'Ran 1,729 training runs across 5 models, 7 data sizes and 5 unseen-hospital test sets on one laptop GPU.',
      'Fine-tuned DINOv3 ConvNeXt-B reaches AUC 0.80 at a new hospital with ~1,300 exams; frozen models would need 6,000+.',
      'Labeled 4,407 radiology reports with a local LLM for about $5, against ~$200k for two radiologists.',
    ],
    achievements: [
      'Measured learning curves for five pretrained vision models on 4,407 multi-site knee MRI studies, from 65 to 2,600 training exams: 1,729 runs on one 12 GB laptop GPU, about 55 GPU-hours (roughly $32 at cloud rates).',
      'Found no plateau within 2,600 exams: AUC climbs about +0.031 per doubling of data when fine-tuning and +0.020 when frozen (difference +0.011, p < 0.001).',
      'Located where fine-tuning starts to pay: frozen wins at 65 exams, the two tie from 130 to 520, and fine-tuning leads from 1,040 on (+0.068 at 2,600). The best model reaches 0.828 AUC at an unseen hospital and 0.837 on expert labels.',
      'Turned the curves into a budget: about 313 labeled exams for AUC 0.75 and 1,333 for 0.80 when fine-tuning, against an extrapolated 6,355 or more for frozen models. Labels outweigh compute by about four orders of magnitude.',
      'Built the training labels without patient data leaving the machine: a local 14B LLM read every report, in 9+ languages, into 12 findings, scoring 0.866 macro AUC against the expert-labeled studies.',
      'Reported a pre-registered hypothesis that failed: older ImageNet weights beat the newer DINOv3 weights on the same architecture at every data size and on all five test sites.',
      'Caught a silent evaluation bug mid-sweep, a cache keyed on Python object ids that scored some runs against the wrong studies, then flagged the 99 affected runs and reran them before any analysis.',
    ],
    tech_stack: ['PyTorch', 'timm', 'Computer Vision', 'Vision Transformers', 'DINOv3', 'ConvNeXt', 'Medical Imaging', 'Multiple-Instance Learning', 'Local LLMs (Ollama)', 'Mixed-Effects Models', 'Bootstrap Inference'],
    technical_details:
      'A controlled learning-curve study on the RSNA 2026 Knee Abnormality Detection data (4,407 studies, 819,078 slices, ~20 sites). Slices are resampled to 0.5 mm, canonicalized lateral to medial and sorted into six sequence slots; a backbone embeds each slice and a shared attention multiple-instance head with 12 learned queries outputs one probability per finding. Five backbones chosen in controlled pairs are trained frozen (all five) or fine-tuned with LP-FT and layer-wise learning-rate decay (the two DINOv3 models) on nested subsets of 65 to 2,600 exams, tested on rotating scanner-grouped folds that each act as an unseen hospital. Labels come from a local qwen3:14b reading the free-text reports; results are checked against 58 expert-labeled studies. Comparisons are paired with study-level bootstrap intervals and Holm correction, curves are fit by AIC model selection, and a cost model converts exams-to-target into GPU-hours and labeling dollars.',
    status: 'complete',
    link: '/projects/knee-mri-data-efficiency',
    detail: {
      problem_statement:
        'A knee MRI is a lot to read: a median of 162 slices across 5 sequences, about 8 minutes of radiologist time. A model that flags likely abnormalities could cut that load, but for a hospital the hard part is the labels. Two radiologists cost about $45,400 per 1,000 exams, and privacy rules usually rule out sending scans to a hosted API. So the deciding questions are budget questions: how many labeled exams reach a useful AUC at a hospital the model has never seen, when does fine-tuning beat a frozen model, and does the newest foundation model actually help? The RSNA 2026 knee dataset (4,407 studies from about 20 sites, 12 findings) is a realistic place to answer them.',
      approach: [
        {
          step: 'A Cost Curve, Not a Leaderboard',
          detail:
            'Instead of one accuracy number, the study measures how AUC grows as training data doubles from 65 to 2,600 exams, then converts each target into exams, GPU-hours and labeling dollars. All five hypotheses were time-stamped before the main runs, so a failed one is reported as failed.',
        },
        {
          step: 'Labels That Never Leave the Machine',
          detail:
            'Only 58 studies carry expert labels, so a local qwen3:14b model (via Ollama) read all 4,407 reports, in 9+ languages, and marked each of 12 findings positive, negative or not mentioned, in 8.4 GPU-hours. Hand audits located its weak spots, and a rewritten prompt that scored worse was rejected.',
        },
        {
          step: 'Every Test Set Is a New Hospital',
          detail:
            'Studies were grouped by scanner into five folds of about 870 that differ sharply (one is 80% Philips, another all 1.5 T), and each takes a turn as the unseen test site. Training sets are nested, so each size contains the smaller ones.',
        },
        {
          step: 'Model Pairs That Change One Thing',
          detail:
            'Five backbones were chosen so each comparison isolates one factor: transformer vs. CNN with the same pretraining, and self-supervised vs. ImageNet weights with the same architecture, plus an older foundation model and a from-scratch floor. Everything else is identical.',
        },
        {
          step: 'One Study-Level Head, at Laptop Scale',
          detail:
            'Each exam is standardized (0.5 mm pixels, lateral side first, and no left/right flips, which would swap medial and lateral labels). Every slice is embedded, and an attention head with one query per finding decides which slices matter. Fine-tuning fit on a 12 GB GPU with bf16, a hard VRAM cap and a 48-slice limit.',
        },
        {
          step: 'Statistics That Match the Design',
          detail:
            'Comparisons are paired on identical exams, with 2,000-sample bootstrap intervals and Holm correction across findings, and a mixed model estimates how much faster fine-tuned models improve. The pre-registered power law lost to a log-linear fit on 8 of 10 curves, so no plateau is claimed.',
        },
      ],
      architecture: `
  ── DATA ────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ RSNA 2026 knee MRI           4,407 studies, ~20 sites            │
  │   24,371 series . 819,078 slices . 5 vendors . 1.5T / 3.0T       │
  │   free-text radiology reports in 9+ languages                    │
  │   58 studies with expert image labels (2 MSK radiologists)       │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                ↓                                     ↓
  ┌───────────────────────────┐         ┌───────────────────────────┐
  │ LABELS  (stays on the PC) │         │ IMAGES                    │
  │ qwen3:14b via Ollama      │         │ resample to 0.5 mm/px     │
  │ reads every report        │         │ lateral-to-medial order   │
  │ 12 findings: pos/neg/n.a. │         │ 6 sequence slots          │
  │ 8.4 GPU-h, ~6.9 s/report  │         │ 224 px slices             │
  │ gold-58 macro AUC 0.866   │         │ no left/right flips       │
  └───────────────────────────┘         └───────────────────────────┘
                └──────────────────┬──────────────────┘
                                   │  one target table + pixel cache
                                   ↓

  ── DESIGN ──────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ Scanner-grouped splits   5 folds of ~870, by vendor/model/coil   │
  │   test fold  = an unseen site     (rotated through all 5)        │
  │   val fold   = model selection only                              │
  │   pool       = remaining 3 folds, ~2,610 studies                 │
  │   nested N   = 65, 130, 260, 520, 1,040, 2,080, 2,600            │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  same subsets for every model
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Slice encoder, one of five backbones                             │
  │   M1  ViT-B/16      DINOv3       |  M4  ViT-B/14   DINOv2        │
  │   M2  ConvNeXt-B    DINOv3       |  M5  ResNet-18  from scratch  │
  │   M3  ConvNeXt-B    ImageNet                                     │
  │   frozen: embed once, train the head only                        │
  │   fine-tuned: LP-FT, layer-wise LR decay 0.75, bf16              │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Study head (identical for every backbone)                        │
  │   attention MIL over every slice of every sequence               │
  │   12 learned queries  ->  12 finding probabilities               │
  │   soft-label weighted BCE, n.a. cells at weight 0.5              │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  1,729 runs, one 12 GB GPU
                                   ↓

  ── EVALUATION ──────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ Scored once, after selection on the val fold                     │
  │   unseen-site test fold   report labels, ~870 studies            │
  │   gold-58                 expert image labels, +/- 0.03 AUC      │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Analysis                                                         │
  │   learning curves: power law vs log-linear vs saturating (AIC)   │
  │   paired bootstrap, 2,000 resamples, Holm over 12 findings       │
  │   mixed model   AUC ~ model x regime x log2(N)                   │
  │   cost model    exams, GPU-hours, labelling dollars              │
  └──────────────────────────────────────────────────────────────────┘
`,
      results: [
        { metric: 'Best Unseen-Site AUC', value: '0.828', description: 'Fine-tuned DINOv3 ConvNeXt-B at 2,600 exams; 0.837 on expert labels' },
        { metric: 'Exams to AUC 0.80', value: '1,333', description: 'Fine-tuned ConvNeXt-B; frozen needs 6,355+ (extrapolated)' },
        { metric: 'Gain per Doubling', value: '+0.031', description: 'AUC per doubling, fine-tuned (frozen +0.020); no plateau' },
        { metric: 'Training Runs', value: '1,729', description: '5 backbones, 7 sizes, 5 unseen-site folds, one laptop GPU' },
        { metric: 'Compute per Model', value: '< $2', description: 'vs. ~$45k of expert labels per 1,000 exams' },
        { metric: 'Labels for 4,407 Reports', value: '~$5', description: 'Local 14B LLM; no patient data leaves the PC' },
      ],
    },
  },
  {
    id: 'airline-crew-pairing-rl',
    title: 'Airline Crew Pairing: Transformer Deep-RL Scheduler',
    short_description:
      'A transformer-based Deep Q-Network that builds a month of legal airline crew schedules one flight at a time, published as an interactive replay you can scrub decision by decision.',
    motivation:
      'Crew cost is second only to fuel for most airlines. I wanted to know whether a learned policy could follow a real rulebook exactly, handle a month it had never seen, and build schedules that hold up when a flight runs late.',
    card_achievements: [
      'Every scheduling rule lives in the action mask, so the agent can never build an illegal pairing.',
      'Reached 0.658 coverage on 8 schedules it never trained on, within 0.05 of its training score.',
      'Reused the trained network as a search guide for about 4 more points of coverage, with no retraining.',
    ],
    achievements: [
      'Framed crew pairing as a step-by-step build (open a pairing, add flights, close it back at base) over a 31-day, 1,013-flight GERAD benchmark, about 935 decisions per episode.',
      'Moved every rule into the action mask: duty limits, rest, legs per duty, time away from base, credit caps, crew availability and a check that the crew can still get home. The network is never offered an illegal move, and an independent re-checker confirms zero violations.',
      'Trained across 40 perturbed schedules and tested on 8 unseen ones: 0.658 coverage for cabin crews and 0.629 for cockpit, against 0.47 for a random legal policy, with a train-vs-test gap of 0.00 to 0.05.',
      'Built far more delay-resilient schedules than the benchmark\'s reference solution: 85 fragile connections against its 310. The reference covers more flights by repositioning crews throughout, so the honest trade is coverage for resilience.',
      'Used a ViT-style transformer that scores a variable-size set of candidate flights, so one network handles 56 options at the start of a pairing and 4 near its end.',
      'Reused the trained network for beam search at inference, adding about 4 coverage points with no retraining, and traced the coverage ceiling to its causes: about 52% of uncovered flights are stranded at non-base airports.',
    ],
    tech_stack: ['PyTorch', 'Transformers', 'Deep RL', 'Double DQN', 'CUDA', 'NumPy', 'FastAPI', 'pytest', 'TensorBoard', 'Python', 'Operations Research'],
    technical_details:
      'A ViT-style Double/Dueling DQN with prioritized experience replay over a sequential pairing-construction MDP, where all feasibility is enforced in the action mask and verified by an independent re-checker; trained per crew class across 40 seeded perturbations of a GERAD/Quesnel monthly instance and evaluated on a disjoint 8-variant held-out split; a multi-objective reward over coverage, credit cost, schedule robustness and crew preferences; Q-guided beam and anytime best-first search at inference; and a FastAPI live training dashboard plus a zero-backend GitHub Pages replay site built from recorded solves.',
    status: 'complete',
    link: '/projects/airline-crew-pairing-rl',
    detail: {
      problem_statement:
        'A crew pairing is a legal multi-day trip: a run of flights that leaves a crew base, splits into workdays with overnight rests, and comes back home, all within strict limits on duty hours, rest and time away. Covering a month of flights with cheap, legal pairings is the costliest step in crew scheduling, and the classical method (column generation) has to be rebuilt for every schedule. This project learns a construction policy instead, with three requirements: every schedule must be fully legal, the policy must work on months it never trained on, and its numbers must be measured against the benchmark\'s own reference solution.',
      approach: [
        {
          step: 'Choosing the Decision, Not Just the Model',
          detail:
            'The agent opens a pairing at a base, adds flights and closes it back at that base, repeating until every flight is covered or nothing legal remains. Building whole pairings keeps the reward on the trip that earned it. Deadheads (crews flying as passengers to reposition) are ordinary moves, not a repair step.',
        },
        {
          step: 'Feasibility Lives in the Action Mask',
          detail:
            'Every rule is checked before a move is offered, including a backward check that the crew can still reach home from where the move leaves it. The network therefore cannot produce an illegal schedule, so no reward is spent teaching it the rulebook and nothing needs repairing afterward.',
        },
        {
          step: 'A Transformer Over the Candidate Set',
          detail:
            'Each step presents up to 64 candidate flights as tokens of 30 features each. A four-layer transformer lets every candidate attend to the others, and a dueling head scores each one, with illegal moves masked out so they can never be picked.',
        },
        {
          step: 'A Reward With Four Switchable Terms',
          detail:
            'Coverage, cost, robustness (reward tight turns that follow the aircraft, penalize fragile connections) and crew preferences. Every weight and on/off switch sits in one YAML file, so an ablation is a config edit.',
        },
        {
          step: 'Training for Generalization',
          detail:
            'Double DQN with prioritized replay. Each episode samples one of 40 perturbed months, and every 20 episodes the policy is scored on 8 held-out months; the checkpoint kept is the best on held-out data, and the train-vs-test gap is logged as its own metric.',
        },
        {
          step: 'The Network as a Search Guide',
          detail:
            'At inference, beam search ranks partial schedules by reward so far plus the network\'s estimate of what is left: about 4 points more coverage for about 3× the run time. An 84-test suite guards the feasibility guarantee.',
        },
      ],
      architecture: `
  ── DATA ────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ GERAD / Quesnel          the monthly benchmark instances         │
  │   instance1: 31 days, 1,013 legs, 26 airports, 3 crew bases      │
  │   plus a reference solution from a classical cost optimizer      │
  │   synth_perturb.py: jitter, subsample, resample, all seeded      │
  │   40 training variants . 8 held-out, seeds never trained on      │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  one episode samples one variant
                                   ↓
  ── ENVIRONMENT  -  FEASIBLE BY CONSTRUCTION ────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ env/crew_pairing_env     one month, one crew class               │
  │   START(leg) -> APPEND(leg)* -> CLOSE, then open the next        │
  │   DEADHEAD(leg) to reposition: half credit, 4 per pairing        │
  │   no legal continuation -> discard, refund, -8.0, carry on       │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  every candidate leg, before it is offered
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ env/masking.py           an illegal move never exists            │
  │   connection window . duty flying time . legs per duty           │
  │   duty span . duties per pairing . time away from base           │
  │   per-base credit cap . per-base daily crew availability         │
  │   backward-DP "can I still get home?" reachability guard         │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  tokens [K,30] . mask [K] . global [10]
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ models/vit_dqn.py        set encoder over the candidates         │
  │   airport embeddings + numeric projection -> d_model 192         │
  │   learned context token (the ViT CLS) holds global state         │
  │   TransformerEncoder: depth 4, heads 4, d_ff 384, pre-norm       │
  │   dueling pointer head -> one Q per action, masked to -inf       │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  argmax Q at eval, epsilon-greedy while training
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ env/reward.py            multi-objective, gamma = 1              │
  │   coverage   +1.0 per leg covered, -4.0 per leg left open        │
  │   cost       -0.15 / excess TAFB h, -0.5 / pairing opened        │
  │   robustness +0.5 short connection, -0.5 critical one            │
  │   preference +0.3 scaled by the leg score for that base          │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  (s, a, r, s') transitions
                                   ↓
  ── LEARNING ────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ train.py                 Double DQN over 500 episodes            │
  │   prioritized replay . Huber loss . grad clip 10 . AMP           │
  │   hard target sync every 2,500 env steps . 8.3 s / episode       │
  │   greedy eval on the held-out split every 20 episodes            │
  │   keep the best-by-eval-coverage checkpoint as best.pt           │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │
                                   ↓
  ── INFERENCE  -  THE SAME NETWORK AS A SEARCH HEURISTIC ────────────

  best.pt
    |-- greedy      argmax Q, about 3 s per instance
    |-- beam W x M  keep the W best partial constructions, expand
    |               the top-M actions, score by g + max Q of the child
    '-- anytime A*  priority queue on f = g + h, seeded with a greedy
                    dive, so the answer is never worse than greedy
                                   │
                                   ↓
  demo.py -> events.jsonl -> viz/build_site.py -> GitHub Pages replay
`,
      results: [
        { metric: 'Held-out Coverage', value: '0.658', description: 'Cabin policy on 8 unseen instances; cockpit 0.629' },
        { metric: 'Feasibility Violations', value: '0', description: 'Independent re-checker over random rollouts' },
        { metric: 'Fragile Connections', value: '3.6× fewer', description: '85, against the GERAD reference solution’s 310' },
        { metric: 'Generalization Gap', value: '≤ 0.05', description: 'Train vs. held-out coverage at plateau' },
        { metric: 'Search Lift', value: '+4 pts', description: 'Beam 8×4 over greedy, with no retraining' },
        { metric: 'Planning Horizon', value: '31 days', description: '1,013 legs, 26 airports, 3 crew bases' },
      ],
      github_url: 'https://github.com/TirthPatel3223/Deep-Reinforcement-Learning-Approach-to-solving-the-Airline-Crew-Pairing-Problem',
    },
  },
  {
    id: 'airbnb-superhost-rdd',
    title: 'Airbnb Superhost Badge: Causal Impact Study (Regression Discontinuity)',
    short_description:
      'Does Airbnb\'s Superhost badge still help hosts now that Guest Favorite runs search? A regression discontinuity study at the 4.8 rating cutoff: five of six outcomes show no effect, and only review volume moves.',
    motivation:
      'A 2023 study found the badge lifted bookings and revenue. Then Airbnb launched Guest Favorite and removed the Superhost search filter. I re-ran the same design on current data and reported the answer it gave.',
    card_achievements: [
      'Re-tested a published 2023 finding: five of six outcomes show no significant effect at the same cutoff.',
      'Built a 125,685-host panel from 34 U.S. metros and compared hosts within ±0.05 of the 4.8 cutoff.',
      'Tested six outcomes at once, so no conclusion rests on a hand-picked metric.',
    ],
    achievements: [
      'Re-tested a published causal finding (Mishra, Huang & Kalwani, 2023) on post-Guest-Favorite data: the badge effect appears on only one of six outcomes.',
      'Built a host-level panel from ~3 GB of raw Inside Airbnb data across 34 U.S. metros: unioned the cities, scored review text with VADER sentiment, and rolled listings up to 125,685 hosts.',
      'Built the rating that decides treatment carefully: weighted by each listing\'s review count, so one new, barely reviewed listing cannot push a host across the cutoff.',
      'Compared 4,308 badge holders just above 4.80 with 2,003 non-holders just below, holding Airbnb\'s other criteria roughly fixed, using OLS with robust standard errors on six outcomes.',
      'Found no effect on review sentiment or value ratings (p from 0.225 to 0.974). Review volume does jump (+79 reviews, p = 0.02), but reviews pile up over a host\'s whole history, so that reads more like a pre-existing difference than a badge effect.',
      'Documented the limits: demand side only, no manipulation, balance or bandwidth checks, a single snapshot in time, and Guest Favorite status not observable in the data.',
    ],
    tech_stack: ['Python', 'Causal Inference', 'Regression Discontinuity', 'statsmodels', 'Econometrics', 'pandas', 'NumPy', 'VADER NLP', 'seaborn', 'Matplotlib'],
    technical_details:
      'A sharp regression discontinuity design on Airbnb\'s 4.8 Superhost rating cutoff, estimated on a 125,685-host panel built from Inside Airbnb listings, reviews and calendar data across 34 U.S. metros. Listing review text is scored with VADER and rolled up to the host by review-count-weighted averaging, which also defines the running variable. Within a ±0.05 bandwidth and response-rate / review-count inclusion filters, each of six outcomes is regressed on the centered rating and a treatment dummy with HC1 robust standard errors, and the discontinuity is plotted with separate fits on either side of the cutoff.',
    status: 'complete',
    link: '/projects/airbnb-superhost-rdd',
    detail: {
      problem_statement:
        'Airbnb awards the Superhost badge to hosts rated at least 4.8 who also clear a few other bars. A 2023 study used that cutoff to show the badge boosted bookings and revenue. Since then, Guest Favorite has launched and the Superhost search filter is gone, so the main way guests found Superhosts no longer exists. Comparing Superhosts with everyone else would measure host quality, not the badge. But a host at 4.79 and a host at 4.81 are, on average, the same host, and the badge is the main thing that differs between them. Comparing those two narrow groups is the whole design.',
      approach: [
        {
          step: 'Why a Discontinuity, and Not a Comparison',
          detail:
            'Superhosts were better hosts before they got the badge, so a plain comparison mostly measures quality. Right around an arbitrary cutoff, though, the badge is close to randomly assigned, so a jump in outcomes exactly at 4.80 can be credited to the badge. The price: the estimate holds only near the cutoff.',
        },
        {
          step: 'A Host-Level Panel From 34 Cities',
          detail:
            'Inside Airbnb publishes per-city files, so the pipeline unions 34 U.S. metros (~3 GB), scores each listing\'s reviews with VADER sentiment, summarizes prices and availability, and rolls listings up to 125,685 hosts.',
        },
        {
          step: 'The Weighting That Matters',
          detail:
            'The badge is awarded per host but ratings are per listing, so each host\'s rating is averaged with weights by review count. Unweighted, one new listing can drag a host into the wrong group.',
        },
        {
          step: 'Treatment and Control Around 4.80',
          detail:
            'Treatment is 4,308 badge holders rated 4.80 to 4.85; control is 2,003 non-holders rated 4.75 to 4.80. Both need a response rate of at least 90% and at least 3 reviews, and hosts whose badge disagrees with their side of the cutoff are dropped rather than mislabeled.',
        },
        {
          step: 'Six Outcomes, Read Honestly',
          detail:
            'The same OLS model, with robust standard errors, runs on six outcomes: four sentiment scores, review volume and the value rating. Five show no jump. Review volume does, but it accumulates over a host\'s history, so the cautious reading is a pre-existing difference rather than a badge effect.',
        },
      ],
      architecture: `
  ── DATA ────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ Inside Airbnb            34 U.S. metro areas, ~3 GB raw          │
  │   listings . reviews . calendar, one set of files per city       │
  │   NYC, LA, Chicago, Boston, Seattle, Broward, 28 more            │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  union all 34 cities
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Listing-level enrichment                                         │
  │   VADER sentiment over each listing's review text                │
  │     pos / neg / neu / compound, averaged per listing             │
  │   calendar rollup: avg nightly price, availability ratio         │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  roll listings up to their host
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Host-level table          125,685 U.S. hosts                     │
  │   host_rating = mean review_scores_rating across a host's        │
  │                 listings, WEIGHTED by each listing's             │
  │                 review count  <- the running variable            │
  └──────────────────────────────────────────────────────────────────┘

  ── DESIGN  -  THE 4.8 CUTOFF ───────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ Running variable   host_rating,   cutoff c = 4.8                 │
  │   bandwidth +/- 0.05         treatment D = 1 if rating >= c      │
  │   a host is kept only if the badge AGREES with their side,       │
  │   so a stale quarterly badge cannot mis-label a row              │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  hold the other criteria fixed
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Inclusion filters                                                │
  │   host_response_rate  >=  90%    (Airbnb's own bar)              │
  │   total_reviews       >=  3      (activity floor)                │
  └────────────────────────────────┬─────────────────────────────────┘
                ┌──────────────────┴──────────────────┐
                ↓                                     ↓
  ┌───────────────────────────┐         ┌───────────────────────────┐
  │ CONTROL                   │         │ TREATMENT                 │
  │ rating 4.75 - 4.80        │         │ rating 4.80 - 4.85        │
  │ host_is_superhost = f     │         │ host_is_superhost = t     │
  │ 2,003 hosts               │         │ 4,308 hosts               │
  └───────────────────────────┘         └───────────────────────────┘
                └──────────────────┬──────────────────┘
                                   │  6,311 hosts in the sample
                                   ↓

  ── ESTIMATION ──────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ statsmodels OLS, HC1 heteroskedasticity-robust errors            │
  │                                                                  │
  │     y  =  b0  +  b1 (rating - 4.8)  +  b2 D  +  e                │
  │                                           ^                      │
  │                      b2 is the jump at the cutoff, i.e.          │
  │                      the causal effect of the badge              │
  └────────────────────────────────┬─────────────────────────────────┘
                                   │  one model per outcome
                                   ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ Outcomes      pos / neg / neu / compound sentiment,              │
  │               total reviews, review_scores_value                 │
  │                                                                  │
  │ Verdict       5 of 6 show no jump at the 5% level                │
  │               p from 0.2253 to 0.9744 on those five              │
  │               total reviews is the exception: +79.07, p = 0.02   │
  └──────────────────────────────────────────────────────────────────┘
`,
      results: [
        { metric: 'Significant Effects', value: '1 of 6', description: 'Only review volume jumps at the 4.8 cutoff' },
        { metric: 'p-value Range', value: '0.225 – 0.974', description: 'Across the five null outcomes, HC1 robust' },
        { metric: 'Analysis Sample', value: '6,311 hosts', description: '4,308 treated, 2,003 control' },
        { metric: 'Panel Built', value: '125,685 hosts', description: 'From 34 U.S. metros, ~3 GB raw' },
        { metric: 'Bandwidth', value: '± 0.05', description: 'Ratings 4.75 – 4.85 around the cutoff' },
        { metric: 'Review Volume', value: '+79.07', description: 'Reviews per host at the cutoff, p = 0.02' },
      ],
      github_url: 'https://github.com/TirthPatel3223/airbnb-superhost-rdd',
    },
  },
  {
    id: 'course-rag-pipeline',
    title: 'Course Material Q&A Assistant: Agentic RAG System',
    short_description:
      'A production agentic RAG assistant that answers UCLA MSBA students\' questions about lecture slides, transcripts and deadlines. Live at tirth-courserag.duckdns.org.',
    motivation:
      'With 4 courses running at once and materials scattered across a shared Drive, students lose time hunting for answers. I built an assistant that checks its own deadline answers and shows its sources, for about $1–4 a month.',
    card_achievements: [
      'A 13-node LangGraph agent routes each question down one of 5 paths: deadlines, summaries, uploads, Q&A or sources.',
      'Deadline answers are double-checked with a second search, and conflicts are flagged instead of guessed.',
      'New uploads wait for human approval before they enter the search index.',
    ],
    achievements: [
      'Built a 13-node LangGraph agent that routes each question to one of 5 paths: deadline, summary, upload, general Q&A or source explanation.',
      'Made deadline answers self-verifying: after extracting a date, the agent searches again with a rephrased query and flags any conflict with a confidence level.',
      'Boosted deadline content in retrieval by tagging deadline chunks at ingestion, so a due date mentioned in a side note still surfaces.',
      'Added human-in-the-loop upload approval: the agent proposes a Drive folder, the user approves or edits it, and only then is the file embedded.',
      'Added an OpenAI Vision fallback for scanned PDFs, with timeouts and concurrency limits so one bad file cannot stall the pipeline.',
      'Deployed with Docker and Caddy on Oracle Cloud\'s free tier for ~$1–4/month, solving 9 production issues along the way, from firewall rules to domain expiry.',
    ],
    tech_stack: ['LangGraph', 'FastAPI', 'ChromaDB', 'Claude Haiku', 'OpenAI', 'Google Drive API', 'Docker', 'Python', 'SQLite', 'WebSocket'],
    technical_details: 'LangGraph, FastAPI, ChromaDB, Claude Haiku, GPT-4o-mini, OpenAI Embeddings, Google Drive API, PyMuPDF, Docker, Caddy, Oracle Cloud',
    status: 'complete',
    link: '/projects/course-rag-pipeline',
    detail: {
      problem_statement:
        'UCLA MSBA students juggle 4 courses at once, each with slides, transcripts, homework and deadlines spread across a shared Google Drive. Searching by hand is slow, and for deadlines a wrong answer is worse than none. The goal: an assistant that answers questions over course PDFs, verifies its own deadline answers, lets students add files without polluting the index, and shows exactly which sources it used, at near-zero cost.',
      approach: [
        {
          step: 'LangGraph Orchestration',
          detail:
            'A 13-node graph whose router tries cheap pattern matching first and calls an LLM only when that fails, then sends each question down one of five branches.',
        },
        {
          step: 'Self-Verifying Deadlines',
          detail:
            'After extracting a date, the system re-queries ChromaDB with a rephrased search and cross-checks the result. If two sources disagree, it shows both and flags the conflict.',
        },
        {
          step: 'Deadline-Boosted Retrieval',
          detail:
            'Chunks with deadline keywords are tagged at ingestion, and results from a deadline-only search are merged with general results, so due dates surface even when they are buried in side notes.',
        },
        {
          step: 'Human-in-the-Loop Uploads',
          detail:
            'An upload pauses the graph (a LangGraph interrupt plus a SQLite checkpointer) while the user approves, edits or rejects the proposed Drive folder. Only approved files are chunked and embedded.',
        },
        {
          step: 'Vision Fallback for Scanned PDFs',
          detail:
            'Pages with almost no extractable text go to GPT-4o-mini Vision for transcription, with a 25-second timeout per page, at most 2 calls at once, and an early stop after 5 failures in a row.',
        },
        {
          step: 'Deployment & Infrastructure',
          detail:
            'Docker Compose on an Oracle Cloud Always Free ARM server, with Caddy for automatic HTTPS and DuckDNS for the domain. Total cost is ~$1–4/month, essentially just LLM usage.',
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
    id: 'mapblazer-route-optimization',
    title: 'Theme Park Route Optimization: Time-Dependent MILP Solver',
    short_description:
      'An exact Gurobi optimization model that plans a whole park day: which rides, in what order and at what time, with every queue priced by the 30-minute slot you arrive in. The routing engine behind Mapblazer.',
    motivation:
      'Ride order sets arrival times, arrival times set queues, and queues set the best order. I wanted to solve that loop exactly instead of with a greedy rule.',
    card_achievements: [
      'Saves 22 minutes of queueing per itinerary on average against the LLM planner it replaced, up to an hour on a 12-hour day.',
      'Plans a day in 10 seconds instead of 60: 83.3% faster, with no per-query token cost.',
      'Solves the day exactly, pricing each ride by the 30-minute slot the plan actually reaches it in.',
    ],
    achievements: [
      'Modelled the park day as a time-dependent orienteering problem and solved it exactly in Gurobi, where a greedy "shortest queue next" rule fails because when you ride decides how long you wait.',
      'Replaced MapBlazer\'s original LLM planner, which could not react once queues shifted: the solver saves 22 minutes of queueing per itinerary on average, and the gap widens with length of stay, up to a full hour on a 12-hour day.',
      'Cut response time 83.3% (a 10-second solve against a 60-second LLM average) and removed token costs, saving $0.75 per query.',
      'Fixed an objective that let walking and idling go free: charging for the length of the whole day finishes the same seven-ride Disneyland day 130 minutes earlier.',
      'Kept time-varying queues inside a linear model, and replaced about a trillion possible loop-breaking constraints with ones generated only when the solver actually finds a loop.',
      'Benchmarked the time limit instead of guessing it: 10 seconds lands within 0.4% of a 60-second search on 12- and 16-ride days.',
    ],
    tech_stack: ['Python', 'Gurobi', 'Mixed-Integer Programming', 'Operations Research', 'Combinatorial Optimization', 'FastAPI', 'Pydantic', 'pytest'],
    technical_details:
      'A time-dependent orienteering problem with mandatory nodes, solved exactly as a Gurobi MILP over arc, visit, slot, arrival, departure and wait variables, with connectivity enforced by lazily generated subtour cuts from a MIPSOL callback. The objective maximises priority-weighted rides less a scaled charge on the day\'s makespan; breaks and operating hours are linearised disjunctions and repeatable rides become virtual twin nodes. Queue costs come from the companion Prophet forecasting service at 30-minute resolution over a 7-day horizon, joined on normalised ride names, and the fixed plan is replayed minute by minute into a ranked itinerary served by both a CLI and a FastAPI endpoint.',
    status: 'complete',
    link: '/projects/mapblazer-route-optimization',
    detail: {
      problem_statement:
        'Given a guest\'s must-do and nice-to-have rides, a start time and a time budget, decide which rides to visit, in what order and when. Three things make this harder than a classic routing problem: you cannot do every ride, a ride\'s cost is its queue, which depends on when you arrive, and some rides are mandatory. So the order sets the arrival times, the arrival times set the queues, and the queues set the best order. Greedy rules break on exactly that loop. The question was whether the whole day, breaks and opening hours included, could be written as one linear model and solved to optimality.',
      approach: [
        {
          step: 'Naming the Problem Before Modelling It',
          detail:
            'The day is a loop from the park entrance and back. Unlike a classic tour, any ride can be skipped, so choosing which rides and choosing their order happen in the same solve.',
        },
        {
          step: 'An Objective That Charges for the Whole Day',
          detail:
            'The model maximizes priority-weighted rides minus a small charge on when the day ends. An earlier version charged only queue time, so walking and idling were free and every plan ran to closing. Charging the whole day fixed that, and it means the solver waits for a cheaper slot only when the wait saves more time than it costs.',
        },
        {
          step: 'A Ride Is Never Traded for an Early Finish',
          detail:
            'The per-minute charge is set below the smallest ride priority divided by the time budget, which guarantees an extra ride always outweighs finishing sooner.',
        },
        {
          step: 'Time-Dependent Queues, Kept Linear',
          detail:
            'The day is cut into 30-minute slots that match the forecast. Two inequalities pin each arrival to its slot, and that slot\'s forecast sets the wait. Because the forecast is a fixed table, the model stays linear.',
        },
        {
          step: 'Breaks, Opening Hours and Second Rides',
          detail:
            'A lunch break becomes a linearized "finish before or start after" choice, opening hours use the same pattern, and a ride worth doing twice becomes a twin node tied to the original.',
        },
        {
          step: 'Connectivity Without Writing Every Constraint',
          detail:
            'Ruling out stray loops upfront would take 2^|R| constraints, about a trillion at forty rides. Instead, a callback inspects each candidate solution and adds a constraint only for the loops it actually finds, so the result is still exact.',
        },
        {
          step: 'Knowing When to Stop Searching',
          detail:
            'Good routes appear fast, but proving them optimal past about ten rides does not finish. Measured on 12- and 16-ride days, a 10-second limit lands within 0.4% of a 60-second search, and the status is reported honestly as a time limit.',
        },
      ],
      architecture: `
  ── INPUTS ──────────────────────────────────────────────────────────

  ┌───────────────────────────────┐  ┌───────────────────────────────┐
  │ Wait-Time Forecast API        │  │ data/parks.json               │
  │   Prophet fleet . 7-day       │  │   5 parks . 116 rides         │
  │   horizon . 30-minute slots   │  │   durations . operating hours │
  │ predictions.py                │  │ data/walk_times.json          │
  │   pages PostgREST, joins on   │  │   ride-to-ride walk minutes   │
  │   letters-and-digits names    │  │   per park                    │
  └───────────────┬───────────────┘  └───────────────┬───────────────┘
                  │ W[ride, slot]                    │ c[i,j] . d[i]
                  └─────────────────┬────────────────┘
                                    ↓

  ── MODEL  -  solver.py ─────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ nodes  depot 0 . one node per selected ride . a twin per repeat  │
  │ vars   x[i,j] arc . y[i] visit . z[i,s] slot . a[i] e[i] w[i]    │
  │                                                                  │
  │ max    sum p[i]*y[i]   -   gamma * a[0]                          │
  │        reward every ride reached, charge the whole loop's time   │
  └─────────────────────────────────┬────────────────────────────────┘
                                    ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ constraints                                                      │
  │   degree tied to selection: in/out degree is y[i], not 1         │
  │   time carried along the route by a big-M switch on x[i,j]       │
  │   the arrival slot pins z[i,s], which prices w[i] = W[ride(i),s] │
  │   breaks as a linearised finish-before or start-after choice     │
  │   per-ride opening and closing hours                             │
  └─────────────────────────────────┬────────────────────────────────┘
                                    ↓

  ── SEARCH  -  Gurobi ───────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ branch and bound . TimeLimit 10s . solution pool for alternates  │
  └─────────────────────────────────┬────────────────────────────────┘
                                    │  every integer-feasible candidate
                                    ↓
  ┌──────────────────────────────────────────────────────────────────┐
  │ MIPSOL callback   _eliminate_subtours                            │
  │   read the arcs, walk successor[], find components   O(|N|)      │
  │   a cycle with no depot -> cbLazy exactly that subset's cut      │
  │   reject the candidate; the cut stays in the model               │
  └─────────────────────────────────┬────────────────────────────────┘
                                    │  repeat until no cycle remains
                                    ↓

  ── OUTPUT ──────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │ replay the fixed plan minute by minute, idling included          │
  │ ranked itineraries + metadata: status . wait source . gaps       │
  └────────────────┬────────────────────────────────┬────────────────┘
                   ↓                                ↓
               cli.py  markdown day             api.py  POST /solve
`,
      results: [
        { metric: 'Queue Time Saved', value: '22 min avg', description: 'Vs. the legacy LLM planner, per itinerary, up to a full hour on a 12-hour day' },
        { metric: 'Response Time', value: '83.3% faster', description: '10 s solver budget vs. 60 s legacy LLM average' },
        { metric: 'Cost per Query', value: '$0.75 saved', description: 'Token costs eliminated entirely' },
        { metric: 'Day Shortened', value: '130 min', description: 'Makespan objective vs. queue-time only, same 7 rides' },
        { metric: 'Gap to a 60s Search', value: '0.4%', description: 'Measured on 12- and 16-ride days' },
        { metric: 'Optimality', value: 'Exact', description: 'Proven optimal to ~10 rides, best-found beyond' },
      ],
      github_url: 'https://github.com/TirthPatel3223/Mapblazer_Route_Optimization_Algorithm',
    },
  },
  {
    id: 'weather-dining-pipeline',
    title: 'Weather-Driven Restaurant Sentiment: Big Data ETL & NLP Pipeline',
    short_description:
      'An end-to-end data pipeline that joins Yelp restaurant reviews with weather data in PySpark, Snowflake and Airflow, across 2M+ records, to measure how weather changes dining habits.',
    motivation:
      'Does the weather change how people dine out and rate restaurants? I built a pipeline to answer that at scale, from raw data to a Tableau dashboard.',
    achievements: [
      'Found a "cold weather paradox": freezing days cut volume to 101 reviews a day yet carry the highest sentiment (0.71).',
      'Identified extreme heat as the biggest deterrent to dining out: about 30 reviews a day and the lowest sentiment (0.65).',
      'Showed rain and snow cut review volume 50.7% (143 a day vs. 290) while sentiment held at 0.69, the same as pleasant days.',
      'Built regional heatmaps that isolate the cities where weather skews ratings most.',
      'Designed a Snowflake star schema that serves 2M+ records with sub-5-second queries.',
    ],
    tech_stack: ['PySpark', 'Snowflake', 'Airflow', 'Tableau', 'VADER NLP', 'Python'],
    technical_details: 'PySpark, Snowflake, Apache Airflow, Tableau, VADER NLP, Python',
    status: 'complete',
    link: '/projects/weather-dining-pipeline',
    detail: {
      problem_statement:
        'Does weather actually change how people dine out and rate restaurants? To answer that at scale, I joined the Yelp Academic Dataset with historical OpenWeatherMap data in PySpark, scored review sentiment, warehoused the result in Snowflake, scheduled it with Airflow, and surfaced the patterns for restaurant operators in Tableau.',
      approach: [
        {
          step: 'Data Ingestion',
          detail:
            'Bulk-loaded the Yelp Academic Dataset (~8 GB of reviews and business data) and pulled 5 years of historical weather for 15 U.S. cities from the OpenWeatherMap API.',
        },
        {
          step: 'PySpark ETL',
          detail:
            'Cleaned and deduplicated 2M+ records on a 3-node PySpark cluster, joined reviews to weather on (city, date), and handled schema drift, missing values and time zones.',
        },
        {
          step: 'Sentiment Analysis',
          detail:
            'Scored every review with VADER and bucketed the scores into positive, neutral and negative, checking a 2,000-review sample against manual labels (85%+ agreement).',
        },
        {
          step: 'Snowflake Data Warehouse',
          detail:
            'Loaded the results into a star schema (one fact row per business per day, with weather, business and calendar dimensions), clustered on date for sub-5-second queries.',
        },
        {
          step: 'Airflow Orchestration',
          detail:
            'A daily incremental DAG runs the API pull, transform, scoring and Snowflake upsert, with email alerts on failures and missed SLAs; the first run backfilled 5 years.',
        },
        {
          step: 'Tableau Visualization',
          detail:
            'Connected Tableau to Snowflake and built 12 interactive dashboards: precipitation vs. review volume, temperature vs. ratings, and sentiment heatmaps by city and season.',
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
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.id === slug);
}
