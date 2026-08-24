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
   *  SVG diagram component instead (weather-dining-pipeline, mapblazer). */
  architecture?: string;
  results: ResultMetric[];
  github_url?: string;
}

export interface Project {
  id: string;
  title: string;
  short_description: string;
  motivation: string;
  /** Full technical achievement list — shown in full on the project detail page's
   *  Results & Impact section, so it can stay long and dense. */
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
    id: 'mapblazer-wait-time-prediction',
    title: 'Theme Park Wait-Time Forecasting: Production MLOps Pipeline',
    short_description:
      'A production ML pipeline that forecasts theme park wait times a week ahead, retrained unattended every week on Databricks and served live for $0/month. Powers the Mapblazer routing engine.',
    motivation:
      'A route built on 9 AM wait times is already wrong by 1 PM, because crowds shift all day and one bad estimate cascades into a ruined plan. I built the forecasting system that predicts wait times across the whole week, so Mapblazer\'s routing engine can anticipate crowd flow instead of chasing it.',
    card_achievements: [
      'Ships fully unattended across 109 attractions in 5 parks, forecasting 7 days out for $0/month in infrastructure.',
      'Cut holdout MAE 26.3% below baseline (7.01 vs 9.51 min) and lifted 10-minute accuracy from 64.5% to 76.6%.',
      'A champion/challenger promotion gate and 12 automated quality checks keep the live dashboard from ever going stale.',
    ],
    achievements: [
      'Shipped a fully unattended weekly forecasting system covering 109 attractions across 5 California theme parks, forecast 7 days ahead at 30-minute resolution, running end to end on Databricks with no manual step and $0/month in infrastructure.',
      'Cut holdout MAE 26.3% below the per-ride mean baseline (7.01 vs 9.51 minutes) and lifted the within-10-minute containment rate from 64.5% to 76.6%, with severe misses over 15 minutes down 42.1%, measured on a 78,110-observation chronological holdout.',
      'Designed a three-runtime architecture around a hard platform constraint: Databricks Free Edition jobs have no outbound internet, so ingestion pushes in from an EC2 systemd agent and serving is pulled out by GitHub Actions, leaving every network hop initiated from outside the job.',
      'Chose a push-based ingestion agent over a pull-based CI runner so the source Postgres never leaves the loopback interface: no inbound firewall rule, no wildcard listen_addresses, and no database credentials crossing the internet.',
      'Made ingestion idempotent and stateless by deriving the watermark from the bronze table itself rather than a local cursor file, so a run killed at any point re-reads the same range and the insert-only MERGE absorbs the overlap, leaving nothing to reconcile by hand.',
      'Trained and benchmarked four model families every run (a per-ride Prophet fleet, a global XGBoost with ride identity as a native categorical, a per-ride XGBoost fleet, and a per-ride historical mean as the floor) on a strict chronological 80/20 split rather than random folds, which leak the future on a time series.',
      'Gated promotion on evidence: a newly trained model ships only if it beats the incumbent\'s recorded MAE by at least 1%, and otherwise the incumbent is reloaded from disk and re-scored, so the forecast window is refreshed either way and rollback is a one-line edit to a serving pointer.',
      'Built a _current/_last table discipline so a bad run can never take down a working dashboard: every run writes only _current, twelve quality gates run against _current, and only a fully passing run promotes via atomic DEEP CLONE, with the serving pointer written last.',
      'Wrote a timezone tripwire into the quality gates, requiring the local hour with the highest mean wait to fall between 11:00 and 20:00, a condition an inverted UTC conversion mathematically cannot satisfy, so the class of bug that silently deletes the evening peak fails the run instead of shipping.',
      'Published serving atomically through a PostgREST RPC that swaps staging and serving tables by rename inside a single Postgres transaction, so readers always see one consistent KPI/forecast pair, and rendered the public dashboard as a single static HTML file with inline SVG and zero JavaScript.',
    ],
    tech_stack: ['Python', 'Databricks', 'PySpark', 'Delta Lake', 'Prophet', 'XGBoost', 'Supabase', 'PostgreSQL', 'GitHub Actions', 'AWS EC2', 'pandas', 'SQL'],
    technical_details:
      'A Databricks Asset Bundle deploying one serverless job (bronze to silver to train to KPIs to gold, then quality gates and atomic promotion), a hardened systemd ingestion agent on the source EC2 host, four model families (Prophet fleet, global XGBoost, per-ride XGBoost, per-ride mean baseline) on a chronological split, a 1%-improvement champion/challenger promotion gate with file-based model artifacts behind a serving pointer, and a GitHub Actions publish path into Supabase PostgREST plus a zero-JavaScript static dashboard on GitHub Pages.',
    status: 'complete',
    link: '/projects/mapblazer-wait-time-prediction',
    hero_image: '/mapblazer_hero.png',
    detail: {
      problem_statement:
        'Mapblazer builds a guest\'s optimal ride itinerary from their must-visit attractions, live wait times, and walking distances. The flaw was that the optimizer routed on "current" wait times: a plan built at 9:00 AM is already wrong by the time the guest reaches their 1:00 PM attraction, and each stale estimate cascades into the next. What the solver actually needs is not a prediction endpoint but the entire cost surface, every attraction at every possible arrival time a week out, which makes this a batch forecasting problem rather than a model-serving one. Producing that surface reliably means answering the operational questions alongside the modelling ones: where the data comes from each hour, what retrains the model as crowd patterns drift, what happens when a run fails at 6am on a Sunday, and how anyone can tell whether the forecast being served right now is fresh or three weeks stale.',
      approach: [
        {
          step: 'Ingestion: A Push Agent on the Source Host',
          detail:
            'The ingestion agent runs on the same EC2 host as the upstream wait-time Postgres and pushes outbound rather than being pulled from. That was a deliberate choice: pulling would have meant exposing Postgres to a rotating set of CI runner IPs, while pushing keeps the database connection on the loopback interface, needs no security-group change, and requires only outbound HTTPS. One hourly systemd run does four things: read the watermark as MAX(wait_time_id) from bronze itself, select the next batch above it, land it as Parquet, and MERGE it in insert-only. Because the watermark comes from the destination rather than a local cursor file, an interrupted run simply re-reads the same range and the MERGE absorbs the overlap. There is no local state that can drift out of sync, and nothing to repair by hand at 3am.',
        },
        {
          step: 'Bronze to Silver: The Cleaning That Decides the Numbers',
          detail:
            'Bronze is append-only and never edited. It is the audit trail, and every correction happens downstream. Silver drops duplicate readings from overlapping batches, the source system\'s 900-minute sentinel, negative waits, a duplicated obsolete park, and an attraction literally named "0". Order matters more than any individual filter: timestamps are converted from UTC to America/Los_Angeles first, and only then filtered against each park\'s local operating hours. Done the other way round it keeps 00:00 to 15:00 local and discards the entire evening peak, the busiest hours of the day, while leaving a dataset that still looks perfectly reasonable. Every ride then resamples onto a fixed 30-minute grid through a single canonical ride-key function, and attractions with under 100 observations are dropped as too thin to model.',
        },
        {
          step: 'Features From Local Wall Time',
          detail:
            'Calendar features are derived from park-local wall time, never UTC: hour, minute, day of week, month, weekend and US-holiday flags. With under a year of history, gradient-boosted trees cannot extrapolate raw datetime values because they only split inside dates they have already seen, so hour and month are additionally encoded as sin/cos pairs, making 23:59 and 00:00 (and December and January) adjacent rather than maximally distant. Training, scoring, and the forecast grid all call the same feature builder and the same ride-key function, so a change cannot silently apply to one path and not the others.',
        },
        {
          step: 'Four Model Families, One Chronological Split',
          detail:
            'Every run trains a per-ride Prophet fleet (flat growth, daily and weekly seasonality, US-holiday regressors, 80% prediction intervals), a single global XGBoost carrying ride identity as a native categorical so it can borrow signal across attractions, a per-ride XGBoost fleet, and a per-ride historical mean as the floor every candidate must clear. The split is strictly chronological, the first 80% by time trains and the last 20% tests, never random, because random folds leak the future into validation on a time series. Hyperparameter search is deliberately absent for the same reason: a RandomizedSearchCV with random K-fold carries that leak straight into model selection, so fixed conservative parameters stand in until there is enough history for a proper rolling-origin search.',
        },
        {
          step: 'KPIs That Do Not Hide Behind an Average',
          detail:
            'About 37% of observations are exactly zero, so a single mean absolute error flatters any model that learns to predict "short queue" everywhere. Each model is scored on seven KPIs: MAE, RMSE, within-10-minute rate, severe-miss rate, bias, high-wait MAE (rides averaging over 10 minutes), and peak-hours MAE (11:00 to 20:00 local), so the segments a router actually cares about stay visible instead of averaging away. The Prophet fleet wins on every one of them, and the margin is widest exactly where it matters, on the long queues.',
        },
        {
          step: 'Champion and Challenger Promotion',
          detail:
            'A newly trained model ships only if its holdout MAE beats the incumbent\'s recorded MAE by at least 1%. If it does not, the incumbent is reloaded from disk and re-scored over the upcoming week, so the forecast window is fresh either way. Model artifacts are plain files, Prophet serialized to JSON per ride and XGBoost through save_model, never pickles of repository classes, which are only loadable by a process that can import the class that made them. They are written to an immutable runs/<run_id>/ directory with a manifest. A small serving.json names the run that serves, and it is written last, after the tables have been promoted. Rolling back is editing that pointer to an earlier run id.',
        },
        {
          step: 'Quality Gates and the _current / _last Discipline',
          detail:
            'Every silver and gold table exists twice. A run writes only _current, the quality gates run against _current, and only a fully passing run promotes _current into _last through atomic DEEP CLONE commits. Supabase and the dashboard read _last only, so a failed or half-finished run can never take down a working dashboard. The gates cover silver row count against last week, attraction count, zero-wait share, nulls, model presence, finite MAEs, serving-model-beats-baseline, forecast ride coverage, interval bound ordering and row-count bands, plus a domain tripwire: the local hour with the highest mean wait must fall between 11:00 and 20:00, a condition an inverted timezone conversion cannot satisfy.',
        },
        {
          step: 'Failing Without Going Dark',
          detail:
            'Any failure, whether a quality gate, a training error or unreadable bronze, drops _current, leaves _last untouched, re-scores the upcoming week with the previous serving model so the dashboard never serves a forecast window that has slid into the past, and still fails the job so the failure alerts. Both gold tables carry run_id, run_status (fresh_model, kept_previous_model, or fallback_after_failure) and generated_at, and the dashboard prints all three, so a fallback week is visibly a fallback rather than a quietly stale one. A first-ever run with nothing to fall back to changes nothing and says so.',
        },
        {
          step: 'Serving: Atomic Swap and a Dashboard With No JavaScript',
          detail:
            'Because the training job has no outbound internet, serving is pulled rather than pushed. A GitHub Actions workflow reads the gold _last tables over the Databricks SQL warehouse once, chunk-loads them into Supabase staging tables with idempotent inserts, then calls a PostgREST RPC that swaps staging and serving by table rename inside a single Postgres transaction, a catalog-only operation that is instant at any row count where the earlier DELETE/INSERT approach hit the free-tier statement timeout at 255K rows. Readers therefore always see one consistent KPI/forecast pair. The same fetch renders the public dashboard: one static HTML file with inline SVG charts and zero JavaScript, so it survives a strict Content-Security-Policy. The dashboard deploys even if the Supabase push fails, and the job still goes red so the failure is visible.',
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
    id: 'mapblazer-route-optimization',
    title: 'Theme Park Route Optimization: Time-Dependent MILP Solver',
    short_description:
      'An exact Gurobi MILP that plans a whole park day at once: which rides to do, in what order, and at what time, with every queue priced by the 30-minute slot you actually arrive in. The routing engine behind Mapblazer.',
    motivation:
      'A park day is not a shortest-path problem: a ride costs whatever its queue costs, the queue changes hour by hour, and the order you pick changes the costs that decide the order. I wanted to solve that feedback loop exactly rather than greedily, with an objective that says when idling for a cheaper slot is worth the wait it costs.',
    card_achievements: [
      'Saves an average of 22 minutes of queue time per itinerary against the legacy LLM planner it replaced — up to a full hour on a 12-hour park day.',
      'Cut itinerary generation from a 60-second LLM average to a 10-second exact solve: 83.3% faster, with per-query token costs eliminated entirely.',
      'Solves the day exactly as a time-dependent orienteering problem, each ride priced by the 30-minute slot the plan actually arrives in.',
    ],
    achievements: [
      'Modelled the park day as a time-dependent orienteering problem with mandatory nodes and solved it exactly in Gurobi rather than with the nearest-shortest-queue heuristic the problem invites: arrival time sets the queue, the queue sets the next arrival, and that feedback is precisely what greedy ordering cannot see.',
      'Replaced the prompt-based LLM planner MapBlazer originally shipped with, which had no mechanism to react once a queue moved after a plan was written and underperformed most sharply on exactly those cascading-wait-time days; the MILP saves an average of 22 minutes of queue time per itinerary against it, and the gap widens with the length of the visit, reaching a full hour saved on a 12-hour park day because the static LLM plan cannot see the afternoon bottlenecks a time-dependent solve routes around.',
      'Cut response time 83.3% by replacing the LLM call with a 10-second solver budget (down from a 60-second LLM average) and removed per-query token costs entirely, saving $0.75 a query.',
      'Rewrote the objective from penalising queue time to charging the makespan of the whole loop, which fixed a concrete failure: the earlier version left walking and idling free and duly spent the entire time budget, finishing at closing time on every instance. The same seven-ride Disneyland day now finishes 130 minutes earlier, with less walking.',
      'Scaled the two objective terms so a ride is never sacrificed to finish sooner: since an extra ride can lengthen the day by at most the whole budget, charging under min(priority)/T per minute makes the ride reward provably dominant, and the default half-of-that factor leaves a full 480-minute day costing half of one optional ride.',
      'Kept the time-dependence linear by pinning arrival to a slot with two big-M inequalities and reading the queue as a constant table times a binary, so a genuinely time-varying cost stays inside a MILP instead of forcing a nonlinear model.',
      'Replaced the exponential subtour-elimination family, 2^|R| constraints and roughly a trillion at forty rides, with lazy generation from a MIPSOL callback that walks the successor map in a single O(|N|) pass and cuts only the cycles it actually finds; the result is still exact, because a candidate surviving with no violated cut is provably one tour.',
      'Expressed lunch breaks as a linearised finish-before-or-start-after disjunction and repeat rides as virtual twin nodes tied back to the original, so a pure routing model can schedule the same attraction twice and refuse to let any ride straddle a break.',
      'Benchmarked the search budget instead of guessing it: the incumbent plateaus early, so the 10-second default lands within 0.4% of a 60-second search on both 12- and 16-ride days, and the finding that per-constraint big-M tightening made no measurable difference was recorded rather than quietly dropped.',
      'Joined the solver to the live forecast service on normalised ride names, since the two datasets disagree on curly apostrophes, trademark symbols and capitalisation, and made uncovered rides a reported field on the response rather than a silent zero-wait assumption that would flatter every plan containing one.',
    ],
    tech_stack: ['Python', 'Gurobi', 'Mixed-Integer Programming', 'Operations Research', 'Combinatorial Optimization', 'FastAPI', 'Pydantic', 'pytest'],
    technical_details:
      'A time-dependent orienteering problem with mandatory nodes, solved exactly as a Gurobi MILP over arc, visit, slot, arrival, departure and wait variables, with connectivity enforced by lazily generated subtour cuts from a MIPSOL callback. The objective maximises priority-weighted rides less a scaled charge on the day\'s makespan; breaks and operating hours are linearised disjunctions and repeatable rides become virtual twin nodes. Queue costs come from the companion Prophet forecasting service at 30-minute resolution over a 7-day horizon, joined on normalised ride names, and the fixed plan is replayed minute by minute into a ranked itinerary served by both a CLI and a FastAPI endpoint.',
    status: 'complete',
    link: '/projects/mapblazer-route-optimization',
    detail: {
      problem_statement:
        'Given a guest\'s must-do and nice-to-have rides, a start time and a time budget, decide which attractions to visit, in what order, and at what time. That is a Time-Dependent Orienteering Problem with mandatory nodes, and each of its three departures from the textbook Travelling Salesman Problem matters. You cannot do every ride, so the subset is part of the answer rather than given. The cost of visiting a node is its queue, which is not a constant but a function of when you arrive. And some rides are non-negotiable while others are merely worth points. The consequence is a circular dependency: the order determines the arrival times, the arrival times determine the queues, and the queues determine which order is best. Greedy rules such as "always take the shortest queue next" fail on exactly this, because the cheapest ride now can be the one that should have been left until the afternoon. The design question was therefore not which heuristic to use, but whether the whole day could be stated as one linear model and solved to optimality, with the time-dependence and the operational realities of breaks, opening hours and repeat rides all inside the model rather than patched on afterwards.',
      approach: [
        {
          step: 'Naming the Problem Before Modelling It',
          detail:
            'The day is a single loop that leaves the park entrance and returns to it, so the depot is the entrance and the rides are nodes on a complete digraph. What separates this from a tour is that in- and out-degree are tied to a selection variable rather than fixed at one, which is the formal difference between orienteering and TSP: an unvisited ride simply carries no arcs and costs nothing, so choosing the subset and choosing the order happen in the same solve rather than in two passes that can disagree.',
        },
        {
          step: 'An Objective That Charges for the Whole Day',
          detail:
            'The model maximises priority-weighted rides minus a small charge on the arrival time back at the entrance, which is the makespan of the day. That single term covers queueing, walking, riding and idling at once. An earlier version penalised queue time alone, which left walking and idling free, and the optimiser exploited it exactly as written: it used the entire time budget and finished at closing time on every instance. Charging the makespan brought the same seven-ride Disneyland day in 130 minutes earlier with less walking, and it also gets the time-dependence right for free, because idling to reach a cheaper slot lengthens the makespan while the smaller queue shortens it. The solver therefore waits only when the queue it skips is bigger than the wait it costs, which is the correct trade and one a queue-only penalty cannot express.',
        },
        {
          step: 'Making Sure a Ride Is Never Traded for an Early Finish',
          detail:
            'Two terms in one objective need a defensible exchange rate, not a tuned constant. An extra ride can lengthen the day by at most the whole budget, so any per-minute charge below the smallest ride priority divided by the budget guarantees the ride reward wins. The default takes half of that bound for margin, which on a 480-minute day means a full-length day costs half of one optional ride and a twentieth of a mandatory one. The same weights are reused to score the reported routes, so the ranking the user sees agrees with what was actually optimised.',
        },
        {
          step: 'Time-Dependent Queues, Kept Linear',
          detail:
            'The visit is cut into 30-minute slots matching the forecast grid. Two big-M inequalities force the slot indicator to the slot the arrival actually falls in, one equation reads that slot\'s forecast out of the wait matrix, and the resulting wait feeds the departure time, which feeds the next arrival. Linearity survives because the forecast is a constant table: the product is a number times a binary, never a variable times a variable. That is the whole mechanism by which choosing when to ride changes the cost of everything downstream while the model stays a MILP.',
        },
        {
          step: 'Breaks, Opening Hours and Second Rides',
          detail:
            'A lunch break is a disjunction, finish before it or start after it, linearised with a binary that selects which of the two inequalities binds while a second big-M term excuses rides that were never visited. Operating hours are the same pattern without the choice. A ride worth doing twice becomes a virtual twin node with its own arrival time, a lower priority, and a constraint tying it to the original, which is what lets a pure routing formulation schedule the same attraction twice without any special-case logic in the search.',
        },
        {
          step: 'Connectivity Without the Exponential Family',
          detail:
            'Degree constraints are local, so they admit a valid depot tour plus free-floating cycles among the ride nodes. The classical repair adds a cut for every subset, 2^|R| of them, about a trillion at forty rides, which cannot be written down. Instead the cuts are discovered rather than enumerated: the model is solved without any of them, and every time the solver reaches an integer-feasible candidate a callback reads the selected arcs, walks the successor map to find the components, and for each cycle that does not contain the depot adds exactly that subset\'s cut and rejects the candidate. Because flow conservation gives every visited node exactly one outgoing arc, the components are simple paths and cycles and the walk is a single linear pass. Nothing about exactness is given up: a candidate that survives with no violated cut is provably a single tour.',
        },
        {
          step: 'Knowing When to Stop Searching',
          detail:
            'Finding a good route is fast; proving it optimal is not, because the root relaxation is already tight and the remaining work is closing one or two percent against a default tolerance that demands no rearrangement of the day saves even a fraction of a minute. Past roughly ten rides that proof does not finish. The incumbent, however, plateaus early, so the time limit was set from measurement rather than taste: on both a 12-ride and a 16-ride day, ten seconds lands within 0.4% of a sixty-second search. The status is reported honestly as a time limit rather than as optimality, and the finding that tightening the big-M constants per constraint made no measurable difference was written down rather than quietly abandoned.',
        },
        {
          step: 'Joining to the Forecast Without Lying About Gaps',
          detail:
            'Queue costs come from the companion Prophet forecasting service, a 7-day horizon at 30-minute resolution across 109 attractions. The two systems key rides differently, so names are compared on letters and digits alone after trademark symbols are stripped, which is also why a misspelling that exists in both systems is left alone rather than corrected: it is the working join key. Rides the forecast does not cover are surfaced as a field on the response, because the fallback is to plan them as zero wait, and a plan that silently treats an unknown queue as no queue is worse than one that says it does not know.',
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
        { metric: 'Queue Time Saved', value: '22 min avg', description: 'Vs. the legacy LLM planner, per itinerary — up to a full hour on a 12-hour day' },
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
    id: 'airline-crew-pairing-rl',
    title: 'Airline Crew Pairing: Transformer Deep-RL Scheduler',
    short_description:
      'A ViT-style Deep Q-Network that builds a month of legal airline crew pairings one leg at a time, feasible by construction, published as an interactive replay you can scrub decision by decision.',
    motivation:
      'Crew cost is second only to fuel for most airlines, and the classical column-generation approach has to be rebuilt for every schedule. I wanted to know whether a learned construction policy could obey a real rulebook exactly, generalize to a month it had never seen, and trade a little coverage for solutions that don\'t shatter when one flight runs late.',
    card_achievements: [
      'Every scheduling rule lives in the action mask, so the agent can never emit an illegal pairing, verified over random rollouts.',
      'Trained on 40 perturbed schedules, reaching 0.658 held-out coverage on 8 unseen instances the policy never trained on.',
      'Reused the trained value network as a search heuristic at inference, no retraining, for a further 4-point coverage lift.',
    ],
    achievements: [
      'Framed crew pairing as a sequential construction MDP (START a pairing, APPEND legs, CLOSE it back at base) over a 31-day, 1,013-leg GERAD benchmark network, so an episode is roughly 935 decisions and credit assignment lands on the tour that actually earned the reward rather than being smeared across a month of flight-by-flight assignments.',
      'Moved every scheduling rule into the action mask: connection windows, duty flying time, legs per duty, duty span, duties per pairing, time away from base, per-base credit caps, daily crew availability, and a backward-DP check that the crew can still get home, so the network is never offered an illegal move and legality costs no penalty term and no repair pass.',
      'Verified that claim independently instead of asserting it: a re-checker that re-derives legality from the finished pairing, run over random rollouts for both crew classes with delay modelling on and off, records zero feasibility violations.',
      'Trained one policy across 40 perturbed variants of the base instance and evaluated it on 8 held-out variants whose seeds were never trained on, reaching 0.658 mean coverage for the cabin policy and 0.629 for cockpit against 0.47 for a random masked policy, with a train-versus-held-out coverage gap of 0.00 to 0.05 at plateau, the number that separates a learned scheduling rule from a memorized schedule.',
      'Closed roughly 10 coverage points of the gap left by single-instance training, which transferred to the same held-out split at only 0.528: the concrete payoff of training on a distribution of schedules instead of on the one in front of you.',
      'Produced markedly more delay-resilient solutions than the benchmark\'s own reference: 85 critical sub-15-minute connections against the reference\'s 310, and about 53 robust short connections against its 10. The reference covers roughly 1.6 times as many legs by deadheading throughout, but even per covered leg its fragile-connection rate is about 2.3 times the policy\'s: the honest trade is coverage for resilience.',
      'Modelled the action space as a set rather than a fixed vector: a ViT-style transformer encoder lets every candidate leg attend to every other one, and a dueling pointer head scores a variable-length, permutation-equivariant action set, so one network handles a 56-way opening step and a 4-way continuation step without reshaping anything.',
      'Reused the trained value network at inference as a search heuristic: beam search, plus an anytime best-first seeded with a full greedy dive so its answer can never be worse than greedy, buying about 4 coverage points for roughly 3 times the wall clock and no retraining, and documented why textbook-optimal A* was rejected: the only admissible bound available here is loose enough that the search degenerates into breadth-first.',
      'Diagnosed the coverage ceiling rather than hand-waving it, with a terminal-state autopsy attributing the 250 to 290 uncovered legs: about 52% orphaned at non-base airports, about 20% blocked by exhausted base availability, about 25% cut off by the stranding guard, and credit caps never binding at all; then ranked the improvement levers by that evidence instead of by intuition.',
      'Made every modelling choice auditable and every ablation a config edit: four YAML files where each value carries a source citation and a HIGH/MEDIUM/LOW confidence tag, an assumption register naming the load-bearing reconstructions, 84 tests, a live FastAPI training dashboard, and a published zero-backend replay site that animates a recorded solve leg by leg with the agent\'s top Q-values at each step.',
    ],
    tech_stack: ['PyTorch', 'Transformers', 'Deep RL', 'Double DQN', 'CUDA', 'NumPy', 'FastAPI', 'pytest', 'TensorBoard', 'Python', 'Operations Research'],
    technical_details:
      'A ViT-style Double/Dueling DQN with prioritized experience replay over a sequential pairing-construction MDP, where all feasibility is enforced in the action mask and verified by an independent re-checker; trained per crew class across 40 seeded perturbations of a GERAD/Quesnel monthly instance and evaluated on a disjoint 8-variant held-out split; a multi-objective reward over coverage, credit cost, schedule robustness and crew preferences; Q-guided beam and anytime best-first search at inference; and a FastAPI live training dashboard plus a zero-backend GitHub Pages replay site built from recorded solves.',
    status: 'complete',
    link: '/projects/airline-crew-pairing-rl',
    detail: {
      problem_statement:
        'A crew pairing is a legal multi-day tour of duty: a sequence of flights that leaves a crew base, splits into workdays separated by overnight layovers, and returns to the same base, all while obeying a thick rulebook of duty-hour limits, rest rules, legs per duty, time away from base, per-base credit caps and crew availability. Covering an airline\'s month with a cheap set of those tours is the first and most expensive stage of crew scheduling, and the classical method (implicitly enumerating an astronomical pool of candidate pairings and solving a set-partitioning integer program by column generation) is well understood but expensive to build, specific to the instance it was built for, and optimizes cost with robustness added afterwards. This project takes the other route and learns a construction policy: the agent walks the connection network, appends legs to an open pairing and closes it back at base, trained on a distribution of perturbed schedules so a changed month does not mean re-solving from scratch. Three things had to be true for that to be worth anything. The schedule it emits must be legal, not approximately legal, which rules out learning legality from a penalty. It must hold up on a month whose seed was never trained on, not only on the month it was fitted to. And the numbers it reports must be measured against something real: the benchmark\'s own reference solution from a classical cost optimizer, scored with the same connection classifiers.',
      approach: [
        {
          step: 'Choosing the Decision, Not Just the Model',
          detail:
            'The source paper assigns crews flight by flight; three granularities were weighed here and sequential pairing construction won. The agent opens a pairing at a base, extends it, and closes it back at that base, repeating until every leg is covered or nothing legal remains. That choice does real work: it concentrates credit assignment on the tour that earned the reward, keeps episodes at roughly the number of legs plus the number of pairings rather than exploding, and maps cleanly onto a network that scores a set of candidate moves. Deadheads (crew riding as passengers to reposition) are first-class actions at half credit with a per-pairing budget and a hop-bounded reachability guard, not a post-processing fix.',
        },
        {
          step: 'Feasibility Lives in the Action Mask',
          detail:
            'Every rule is evaluated before an action is offered: the connection window and its classification into short, sit or layover, maximum flying time and legs and span per duty, duties per pairing, total time away from base, per-base credit caps, per-base daily crew availability reduced by vacations, and a backward dynamic-programming check that the crew can still reach its home base from wherever the move would leave it. A one-step viability lookahead keeps the agent out of dead ends. The consequence is that the network cannot emit an illegal schedule, so no reward budget is spent teaching it the rulebook and no repair heuristic runs afterwards; when an open pairing does run out of legal continuations, it is discarded, its resources refunded and a large strand penalty fired, rather than the episode quietly corrupting.',
        },
        {
          step: 'An Observation That Is a Set, Not a Vector',
          detail:
            'Each step presents up to 64 candidate actions as a token matrix rather than a fixed-width state vector: one 30-feature row per candidate carrying the action type, embedded departure and arrival airports, base flags, day of month, sine and cosine of time of day, block time, buffer to the previous leg, short and critical and NCC indicators, delay risk, the post-append accumulator ratios that say how full the duty and the pairing would become, remaining base credit and availability, preference score, and a can-return-to-base flag. A parallel boolean mask marks which of them are legal, and a 10-feature global vector carries episode context. Because the observation is a set, the number of legal moves can swing from about 56 at an opening step to under 4 at a continuation step without changing a tensor shape.',
        },
        {
          step: 'A Transformer That Scores the Whole Candidate Set',
          detail:
            'The Q-network is a ViT-style encoder: airport identities are embedded, the remaining numerics are projected to a 192-dimensional model width, a learned context token in the ViT CLS role carries the global features, and a four-layer pre-norm transformer encoder lets every candidate attend to every other one. That is the right inductive bias for the question actually being asked (is this the best next leg given what else is on offer and how full my duty already is), which a per-candidate MLP structurally cannot ask. A dueling head then scores each token pointer-style as a shared state value plus a mean-centered advantage, with masked actions driven to negative infinity so they can never be selected or bootstrapped from.',
        },
        {
          step: 'A Reward With Four Terms and an Off Switch on Each',
          detail:
            'Coverage pays +1.0 per leg flown and charges -4.0 for every leg still uncovered at the end. Cost charges excess time away from base, each pairing opened, and each deadhead hour. Robustness pays for short connections, where the crew follows the aircraft, and penalizes fragile critical ones, or switches to the source paper\'s squared non-critical-connection formulation with compensation when the delay-prediction flag is on. Preferences pay a scaled bonus for flying a leg the base\'s crews prefer. Every weight and every enable flag sits in one YAML file, so an ablation is a config edit rather than a code branch, and the discount is 1.0 within an episode because a pairing built on day 3 is worth exactly what it is worth on day 30.',
        },
        {
          step: 'Training for Generalization, Not for One Month',
          detail:
            'Double DQN with a target network, prioritized experience replay, Huber loss, gradient clipping and mixed precision. But the load-bearing design choice is the data, not the optimizer. Each episode samples a fresh instance from 40 seeded perturbations of the base month (departure jitter, leg subsampling, availability and credit resampling, regenerated preferences), and evaluation runs the greedy policy every 20 episodes against a disjoint split of 8 variants whose seeds are never trained on. The reported number is the held-out mean, the checkpoint kept is the best by held-out coverage, and the train-versus-held-out gap is logged as a metric in its own right so overfitting shows up as a curve rather than as a surprise at the end.',
        },
        {
          step: 'Reusing the Value Network as a Search Heuristic',
          detail:
            'A trained Q-function is already an estimate of what a state is worth, so at inference it does double duty. Beam search keeps the best partial constructions and scores frontiers by realized return plus the network\'s best remaining Q, batching every frontier evaluation per depth. An anytime best-first variant runs a priority queue on realized-plus-estimated return, seeded with a full greedy dive so its answer is never worse than greedy and the search budget is pure upside. Beam 8x4 lifted held-out coverage from 0.612 to 0.651 and from 0.613 to 0.647 on two seeds and tied on a third, for about 9 seconds against 3 per instance and no retraining. Textbook-optimal A* was considered and rejected in writing: the only admissible bound available here is loose enough that the search collapses into breadth-first.',
        },
        {
          step: 'Diagnosing the Ceiling, and Proving the Rules',
          detail:
            'Coverage plateaus near 0.63 to 0.66, so the terminal states were dissected rather than explained away. About 52% of the uncovered legs depart non-base airports and were orphaned once their feeder legs got routed elsewhere, about 20% depart a base whose availability has been exhausted, about 25% are blocked by the stranding guard on a thinned-out network, and credit caps never bind at all, which ranks the levers as deadheads first, availability slack second, inference-time search third and a longer exploration schedule fourth. Underneath all of it sits an 84-test suite whose load-bearing member is the feasibility invariant: because all legality lives in the mask, any rule bug surfaces as a random rollout constructing an illegal pairing, which the independent verifier catches.',
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
      'A regression discontinuity re-test of whether Airbnb\'s Superhost badge still moves host outcomes now that Guest Favorite has taken over discovery. None of six outcomes jumps at the 4.8 cutoff.',
    motivation:
      'Published research from 2023 found the Superhost badge causally lifted bookings and revenue at the 4.8-rating cutoff. Then Airbnb launched Guest Favorite and removed the Superhost search filter, so the discovery mechanism behind that finding was gone. I wanted to run the same design on current data and report the answer it gave, not the one that would make a nicer story.',
    card_achievements: [
      'Re-tested a 2023 published finding on a changed platform: this replication finds no significant effect at the same cutoff.',
      'Built a 125,685-host panel from 34 U.S. metros and isolated the badge with a ±0.05 bandwidth around the 4.8 cutoff.',
      'Estimated six outcomes at once so the null result doesn\'t rest on one hand-picked dependent variable.',
    ],
    achievements: [
      'Re-tested a published causal finding against a changed platform: Mishra, Huang & Kalwani (2023) found a significant positive Superhost effect at the same 4.8 cutoff, and this replication on post-Guest-Favorite data finds none: a null result reported as the finding rather than buried.',
      'Built the host-level panel the design needs from raw Inside Airbnb data across 34 U.S. metro areas (~3 GB of listings, reviews and calendar files), unioning cities, scoring every listing\'s review text with VADER, aggregating calendar prices and availability, and rolling listings up to 125,685 hosts.',
      'Got the running variable right where it is easy to get it wrong: Superhost is a host-level badge but the data is listing-level, so host_rating is each host\'s review_scores_rating averaged weighted by listing review count: an unweighted mean lets one brand-new, barely-reviewed listing drag a host across the threshold.',
      'Isolated the badge with a ±0.05 bandwidth around the cutoff (4.75–4.85), holding two of Airbnb\'s other Superhost criteria roughly fixed with a ≥90% response-rate filter and a review-count floor, so crossing 4.80 is close to the only systematic difference between the groups: 4,308 treated hosts against 2,378 controls, 6,686 in the analysis sample.',
      'Handled the badge-versus-rating timing mismatch explicitly (Airbnb re-evaluates Superhost quarterly while the scraped rating is near-live) by requiring a host\'s badge to agree with the side of the cutoff their rating falls on, dropping ambiguous hosts rather than silently mis-assigning them to treatment.',
      'Estimated the discontinuity as an OLS jump term on the centered running variable with HC1 heteroskedasticity-robust standard errors, across six outcomes at once (positive, negative, neutral and compound review sentiment, review volume, and the review-scores value sub-rating) so the conclusion does not rest on a single hand-picked dependent variable.',
      'Found no significant jump on any of the six: effects range from −2.49 reviews to +0.0029 sentiment with p-values from 0.156 to 0.929, and the plotted fits on either side of 4.8 are visually continuous, consistent with the badge\'s demand-side signalling role having faded once Guest Favorite took over discovery.',
      'Wrote up the design\'s limits alongside its result: this estimates the demand-side effect only and says nothing about the supply-side incentive to maintain quality; there is no McCrary manipulation test or covariate-balance check; the sample is one cross-section rather than hosts tracked across the threshold over time; and Guest Favorite status is not observable in the data.',
    ],
    tech_stack: ['Python', 'Causal Inference', 'Regression Discontinuity', 'statsmodels', 'Econometrics', 'pandas', 'NumPy', 'VADER NLP', 'seaborn', 'Matplotlib'],
    technical_details:
      'A sharp regression discontinuity design on Airbnb\'s 4.8 Superhost rating cutoff, estimated on a 125,685-host panel built from Inside Airbnb listings, reviews and calendar data across 34 U.S. metros. Listing review text is scored with VADER and rolled up to the host by review-count-weighted averaging, which also defines the running variable. Within a ±0.05 bandwidth and response-rate / review-count inclusion filters, each of six outcomes is regressed on the centered rating and a treatment dummy with HC1 robust standard errors, and the discontinuity is plotted with separate fits on either side of the cutoff.',
    status: 'complete',
    link: '/projects/airbnb-superhost-rdd',
    detail: {
      problem_statement:
        'Airbnb awards the Superhost badge quarterly to hosts who clear four bars over a trailing year: a rating of at least 4.8, a response rate of at least 90%, a cancellation rate under 1%, and enough completed stays. Historically the badge did two jobs: it pushed hosts to maintain quality, and it signalled trust to guests, who could filter search results by it. A 2023 study used that 4.8 cutoff as a regression discontinuity and found a significant positive effect on bookings and revenue. The platform has since changed: Guest Favorite launched in November 2023 as a listing-level badge covering roughly two million homes, and around January 2024 the Superhost filter was removed from on-site search and replaced by a Guest Favorite one. The badge survives; the discovery mechanism behind half of its value does not. The question is whether the causal effect survived with it. It cannot be answered by comparing Superhosts to everyone else, because the hosts who clear the bar were already better hosts; any gap would be selection, not the badge. What makes the cutoff useful is that it is arbitrary at the margin: a host at 4.79 and a host at 4.81 are, on average, indistinguishable in underlying quality, and the badge is essentially the only systematic difference between them. Comparing those two narrow groups is the whole design.',
      approach: [
        {
          step: 'Why a Discontinuity, and Not a Comparison',
          detail:
            'The naive estimate (average outcomes for Superhosts minus average outcomes for everyone else) measures host quality far more than it measures the badge, because the badge is awarded for quality in the first place. A regression discontinuity sidesteps that by shrinking the comparison to a narrow window around a threshold nobody can precisely control: hosts land at 4.79 or 4.81 for reasons that have nothing to do with which side they would have chosen. Inside that window the badge is as good as randomly assigned, so a jump in outcomes exactly at 4.80 is attributable to the badge rather than to the hosts. That local identification is the trade the design makes: a credible estimate of the effect at the cutoff, and no claim at all about hosts at 4.2 or 5.0.',
        },
        {
          step: 'Building a Host-Level Panel From 34 City Extracts',
          detail:
            'Inside Airbnb publishes per-city files rather than one dataset, so the pipeline unions listings across 34 U.S. metro areas: New York, Los Angeles, Chicago, Boston, Seattle, Broward County and 28 others, roughly 3 GB raw. Each listing\'s review text is scored with VADER into positive, negative, neutral and compound sentiment; the calendar extract is collapsed into an average nightly price and an availability ratio over the scraped window. Only the final analysis notebook and its saved outputs live in the repository, since regenerating the intermediate table means re-running the full multi-gigabyte pipeline.',
        },
        {
          step: 'Aggregating to the Host, and the Weighting That Matters',
          detail:
            'Superhost is a host-level designation while the data is listing-level, so every listing is rolled up into one row per host_id, producing 125,685 U.S. hosts. The load-bearing detail is how the running variable is built: host_rating is the host\'s listings\' review_scores_rating averaged weighted by each listing\'s number of reviews, not a plain mean. Weighted, a host with one heavily-reviewed 4.85 property and one new 4.5 listing stays where their guests actually put them; unweighted, the new listing swings them across the cutoff and into the wrong group. Sentiment scores are aggregated the same way, and review counts are summed.',
        },
        {
          step: 'Defining Treatment and Control Around 4.80',
          detail:
            'Treatment is hosts with a rating in [4.80, 4.85] who actually hold the badge: 4,308 hosts; control is hosts in [4.75, 4.80) who do not: 2,378. Two inclusion filters apply to both sides: an average response rate of at least 90%, which is Airbnb\'s own bar, and at least three reviews as an activity floor. Both exist so that Airbnb\'s other Superhost criteria are held roughly constant and crossing 4.80 is close to the only thing that differs. Conditioning on the badge agreeing with the rating side, rather than on the rating alone, matters because Airbnb re-evaluates Superhost quarterly while the scraped rating is closer to live: hosts whose badge and rating disagree are dropped rather than mis-assigned. The final sample is 6,686 hosts out of 125,685.',
        },
        {
          step: 'The Specification, Stated With Its Assumptions',
          detail:
            'For each outcome the model is an OLS regression of that outcome on the rating centered at 4.8 plus a treatment dummy, fit with HC1 heteroskedasticity-robust standard errors. Centering makes the treatment coefficient read as the jump exactly at the cutoff. The specification runs one common slope across the bandwidth rather than separate slopes on each side, which is a simplification of the fuller sharp-RDD form; hosts with a fully blocked calendar have their average calendar price imputed from the static listing price rather than being dropped; and the response-rate and review-count filters are proxies for Airbnb\'s real criteria, not reproductions of them. Each of those is a stated design choice rather than an unexamined default.',
        },
        {
          step: 'Six Outcomes, Because One Would Be a Choice',
          detail:
            'Running a single dependent variable invites picking the one that cooperates, so the same specification is estimated on six: positive, negative, neutral and compound review sentiment, total reviews across a host\'s listings, and the review-scores value sub-rating. Together they cover guest experience, engagement volume and perceived value. Each model is plotted as well as tabulated (scatter plus separate fits on either side of the dashed 4.8 line) because a discontinuity is something you should be able to see, and its absence is something a reader should be able to check rather than take on trust.',
        },
        {
          step: 'Reading a Null Result Honestly',
          detail:
            'No outcome jumps: the largest effect is +0.0029 on neutral sentiment, review volume moves by −2.49 with a p-value of 0.929, and nothing clears the 5% level. The right reading is narrow. This is the badge\'s demand-side effect at the margin in a post-Guest-Favorite cross-section, and it is consistent with the search-filter removal having drained the discovery channel the earlier finding partly rested on. It says nothing about the supply-side incentive (hosts may still work to keep the badge whether or not guests respond to it) and the design carries real caveats: no manipulation or covariate-balance test, no bandwidth-sensitivity check, one snapshot rather than hosts followed across the threshold over time, and Guest Favorite status not observable in the data to control for directly.',
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
  │ 2,378 hosts               │         │ 4,308 hosts               │
  └───────────────────────────┘         └───────────────────────────┘
                └──────────────────┬──────────────────┘
                                   │  6,686 hosts in the sample
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
  │ Verdict       0 of 6 significant at the 5% level                 │
  │               p ranges from 0.156 to 0.929                       │
  └──────────────────────────────────────────────────────────────────┘
`,
      results: [
        { metric: 'Significant Effects', value: '0 of 6', description: 'No outcome jumps at the 4.8 cutoff' },
        { metric: 'p-value Range', value: '0.156 – 0.929', description: 'Across all six outcomes, HC1 robust' },
        { metric: 'Analysis Sample', value: '6,686 hosts', description: '4,308 treated, 2,378 control' },
        { metric: 'Panel Built', value: '125,685 hosts', description: 'From 34 U.S. metros, ~3 GB raw' },
        { metric: 'Bandwidth', value: '± 0.05', description: 'Ratings 4.75 – 4.85 around the cutoff' },
        { metric: 'Review Volume', value: '−2.49', description: 'Reviews per host at the cutoff, p = 0.93' },
      ],
      github_url: 'https://github.com/TirthPatel3223/airbnb-superhost-rdd',
    },
  },
  {
    id: 'course-rag-pipeline',
    title: 'Course Material Q&A Assistant: Agentic RAG System',
    short_description:
      'Production-deployed agentic RAG system for UCLA MSBA students to query course materials (lecture slides, transcripts, and PDFs) using natural language. Live at tirth-courserag.duckdns.org.',
    motivation:
      'The UCLA MSBA program runs 4 simultaneous courses, each with its own slides, transcripts, homework deadlines, and deliverables spread across a shared Google Drive. Students constantly lose time hunting for information manually. I built a fully agentic system that classifies every query, self-verifies deadline answers, supports human-approved file uploads, and can explain exactly which source chunks drove any answer, deployed at effectively zero infrastructure cost on Oracle Cloud Free Tier.',
    achievements: [
      'Built a 13-node LangGraph agent with conditional routing across 5 query types: deadline, summary, upload, general Q&A, and source explanation',
      'Implemented self-verifying deadline extraction: LLM extracts date → re-queries ChromaDB with rephrased search → cross-references results → surfaces conflicts with confidence indicator',
      'Designed human-in-the-loop upload approval using LangGraph interrupt-before + SQLite checkpointer: LLM proposes a Drive folder path, user approves/edits before embedding, preventing vector store pollution',
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
        'UCLA MSBA students juggle 4 simultaneous courses, each with lecture slides, transcripts, homework deadlines, and project deliverables scattered across a shared Google Drive. Manual search is slow and error-prone, especially for deadline-critical queries ("when is HW3 due?"). The challenge: build a production-grade agentic system that can answer natural-language questions over course PDFs, verify its own deadline answers to prevent hallucination, let students upload new files safely without polluting the vector store, and explain exactly which source chunks it used, all at zero ongoing infrastructure cost.',
      approach: [
        {
          step: 'LangGraph Agentic Orchestration',
          detail:
            'Designed a 13-node LangGraph graph with a priority-based router that first checks for pending clarifications, then tries regex pattern matching (e.g., "why did you", "where did that come from"), and only falls back to LLM classification if patterns fail, saving ~200 tokens per source-explanation follow-up. The router classifies each query into one of five types and routes to the appropriate branch.',
        },
        {
          step: 'Self-Verifying Deadline Extraction',
          detail:
            'Deadline queries carry the highest accuracy requirement: a wrong date is worse than no answer. After extracting a deadline with the LLM, the system immediately re-queries ChromaDB with a rephrased version of the search and cross-references the extracted date against the new results. If two chunks give different dates for the same assignment, the response surfaces both and flags the discrepancy with a confidence indicator.',
        },
        {
          step: 'Deadline-Boosted Retrieval',
          detail:
            'Chunks containing deadline keywords (due, deadline, submit, homework, exam, etc.) are tagged with a contains_deadline metadata flag during ingestion. The ChromaService.query_with_deadline_boost() method merges results from a deadline-filtered query with results from a general query, deduplicates, and re-ranks, ensuring deadline-containing chunks appear at the top even when the semantic similarity score is not highest (deadline keywords often appear as side notes with lower embedding similarity).',
        },
        {
          step: 'Human-in-the-Loop Upload Approval',
          detail:
            'When a user uploads a file, the LangGraph graph pauses at a human_approval_gate node using LangGraph\'s interrupt_before mechanism with a SQLite checkpointer. The UI shows an approval dialog with the LLM\'s proposed Drive folder path and its reasoning. The user can approve, modify the path, or reject. Only approved uploads are chunked, embedded with OpenAI text-embedding-3-small, and stored in ChromaDB, preventing mis-categorised files from polluting the vector store.',
        },
        {
          step: 'Vision Fallback for Scanned PDFs',
          detail:
            'PyMuPDF text extraction returns fewer than 30 characters for pages that are images (scanned slides, photographed documents). In this case, the PDFProcessor sends the page image to OpenAI Vision (GPT-4o-mini) with a strict verbatim-transcription prompt. To prevent API timeouts from hanging the pipeline: 25-second timeout per page, maximum 2 concurrent vision calls, and an early bail-out after 5 consecutive failures on a single file.',
        },
        {
          step: 'Deployment & Infrastructure',
          detail:
            'Fully containerised with Docker Compose on an Oracle Cloud Always Free ARM VPS (4 CPU, 24 GB RAM). Caddy handles reverse proxying and automatic HTTPS via Let\'s Encrypt. DuckDNS provides the free dynamic domain (with a cron job pinging every 30 minutes to prevent expiry). Total infrastructure cost: ~$1–4/month, essentially just LLM API usage. Solved production issues including Oracle iptables blocking ports 80/443 (fixed via iptables -I to insert ACCEPT before the blanket REJECT rule) and Google OAuth credentials not accessible inside the running container (fixed via docker cp).',
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
    title: 'Weather-Driven Restaurant Sentiment: Big Data ETL & NLP Pipeline',
    short_description:
      'End-to-end data engineering pipeline correlating weather patterns with Yelp restaurant sentiment using PySpark, Snowflake, Airflow, and Tableau, processing 2M+ records.',
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
        'Does weather actually affect how people dine out and rate restaurants? To answer this at scale, I built a full data engineering pipeline ingesting the Yelp Academic Dataset (JSON/CSV) and live weather data from OpenWeatherMap, transforming and joining them in PySpark, warehousing in Snowflake, and orchestrating the pipeline with Airflow, culminating in a Tableau dashboard that reveals actionable weather-revenue correlations for restaurant operators.',
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
    title: 'Maltese Gear Cube Solver: Deep Reinforcement Learning & Search',
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
        'The Maltese Gear Cube is a higher-order mechanical puzzle with an estimated state space of ~10¹⁹ configurations, featuring non-standard gear-linked move sets that invalidate the symmetry assumptions of solvers designed for the standard 3×3 Rubik\'s Cube. Classical search algorithms (BFS, IDA*) are computationally intractable at this scale. The core challenge: can a neural network learn a generalizable distance-to-solved heuristic without any hand-crafted domain knowledge, and can that heuristic guide an efficient search to optimality?',
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
            'Exploited the Maltese Gear Cube\'s rotational symmetry group to generate 8 equivalent representations of each training state, effectively multiplying usable training data 8× at zero additional solve cost, reducing training time by 40%.',
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
       ↓
  Random Scrambler ──→ 50M (state, distance) pairs
  k ∈ Uniform[1..26]      labeled by scramble depth
       │
       │  8× Symmetry Augmentation
       ↓
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
       ↓
  ┌───────────────────────────────────────┐
  │       Batched Weighted A*             │
  │   f(n) = g(n) + λ · V_θ(n)          │
  │   Beam width: 128  ·  GPU batched    │
  └──────────────────┬────────────────────┘
                     │
                     ↓
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
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.id === slug);
}
