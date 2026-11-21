/* The Course RAG assistant's LangGraph, exactly as documented in the project notes
   (course-rag-context.md): 13 nodes plus START/END, five branches, one shared
   retriever, and a human-approval interrupt on the upload branch. Coordinates are a
   hand-laid layered layout (x = step through the graph, z = branch lane). */

export type AgentNodeKind = 'terminal' | 'node' | 'retriever' | 'gate';

export interface AgentNode {
  id: string;
  label: string;
  x: number;
  z: number;
  kind: AgentNodeKind;
  detail: string;
}

export const AGENT_NODES: AgentNode[] = [
  { id: 'start', label: 'START', x: -4.8, z: -0.4, kind: 'terminal', detail: 'A message arrives over the WebSocket.' },
  { id: 'input_handler', label: 'input_handler', x: -3.6, z: -0.4, kind: 'node', detail: 'Loads chat history from SQLite and parses the message.' },
  { id: 'router', label: 'router', x: -2.3, z: -0.4, kind: 'node', detail: 'Picks the query type and spots the course. Pattern matching runs first; the LLM is the fallback.' },
  { id: 'retriever', label: 'retriever', x: -0.9, z: -1.4, kind: 'retriever', detail: 'ChromaDB search: 5 chunks for deadlines (deadline-boosted), 10 for summaries, 7 otherwise.' },
  { id: 'deadline_extractor', label: 'deadline_extractor', x: 0.5, z: -2.6, kind: 'node', detail: 'The LLM pulls out the assignment, date, time and a confidence.' },
  { id: 'deadline_verifier', label: 'deadline_verifier', x: 1.9, z: -2.6, kind: 'node', detail: 'Searches again with reworded text and cross-checks the date.' },
  { id: 'summary_redirector', label: 'summary_redirector', x: 0.5, z: -1.4, kind: 'node', detail: 'Finds the right files and returns Drive links with page numbers.' },
  { id: 'general_responder', label: 'general_responder', x: 0.5, z: -0.2, kind: 'node', detail: 'Answers from the retrieved text and cites the sources.' },
  { id: 'upload_handler', label: 'upload_handler', x: -0.9, z: 1.2, kind: 'node', detail: 'Reads a preview of the uploaded file.' },
  { id: 'location_classifier', label: 'location_classifier', x: 0.5, z: 1.2, kind: 'node', detail: 'The LLM proposes a Drive folder and says why.' },
  { id: 'human_approval_gate', label: 'human_approval_gate', x: 1.9, z: 1.2, kind: 'gate', detail: 'The graph pauses here until a person approves, edits or rejects the folder.' },
  { id: 'upload_executor', label: 'upload_executor', x: 3.0, z: 1.2, kind: 'node', detail: 'Uploads to Drive, splits the file into chunks, embeds them and stores them in ChromaDB.' },
  { id: 'source_explainer', label: 'source_explainer', x: -0.9, z: 2.6, kind: 'node', detail: 'Finds the earlier answer in the session and returns the exact source text.' },
  { id: 'response_output', label: 'response_output', x: 3.4, z: -0.6, kind: 'node', detail: 'Saves the turn to SQLite and streams the reply back.' },
  { id: 'end', label: 'END', x: 4.6, z: -0.6, kind: 'terminal', detail: 'Done.' },
];

export const AGENT_EDGES: Array<[string, string]> = [
  ['start', 'input_handler'],
  ['input_handler', 'router'],
  ['router', 'retriever'],
  ['router', 'upload_handler'],
  ['router', 'source_explainer'],
  ['retriever', 'deadline_extractor'],
  ['deadline_extractor', 'deadline_verifier'],
  ['deadline_verifier', 'response_output'],
  ['retriever', 'summary_redirector'],
  ['summary_redirector', 'response_output'],
  ['retriever', 'general_responder'],
  ['general_responder', 'response_output'],
  ['upload_handler', 'location_classifier'],
  ['location_classifier', 'human_approval_gate'],
  ['human_approval_gate', 'upload_executor'],
  ['upload_executor', 'response_output'],
  ['source_explainer', 'response_output'],
  ['response_output', 'end'],
];

export const NODE_BY_ID: Record<string, AgentNode> = Object.fromEntries(AGENT_NODES.map((n) => [n.id, n]));

export interface AgentQuery {
  id: string;
  label: string;
  prompt: string;
  path: string[];
  /** Chunks the retriever returns on this branch (0 when it is skipped). */
  k: number;
  /** The branch pauses at the approval gate until the visitor approves. */
  needsApproval?: boolean;
  /** What happens at each node worth narrating, in path order. */
  steps: Array<{ node: string; text: string }>;
  answer: string;
}

/* The four end-to-end flows documented in the project notes, word for word where
   the notes quote them. */
export const AGENT_QUERIES: AgentQuery[] = [
  {
    id: 'deadline',
    label: 'Deadline',
    prompt: 'When is HW3 due for MSA408?',
    path: ['start', 'input_handler', 'router', 'retriever', 'deadline_extractor', 'deadline_verifier', 'response_output', 'end'],
    k: 5,
    steps: [
      { node: 'router', text: 'Router: a deadline question about course MSA408' },
      { node: 'retriever', text: 'Retriever: deadline-boosted search returns 5 chunks' },
      { node: 'deadline_extractor', text: 'Extractor: HW3, April 30, 2026, 11:59 PM' },
      { node: 'deadline_verifier', text: 'Verifier: searches again, and the dates agree' },
    ],
    answer: 'HW3 is due April 30 at 11:59 PM (verified). Source: Lecture 5 Slides p.15',
  },
  {
    id: 'summary',
    label: 'Summary',
    prompt: 'Summarize the regression lecture',
    path: ['start', 'input_handler', 'router', 'retriever', 'summary_redirector', 'response_output', 'end'],
    k: 10,
    steps: [
      { node: 'router', text: 'Router: a summary request' },
      { node: 'retriever', text: 'Retriever: 10 chunks about regression' },
      { node: 'summary_redirector', text: 'Redirector: links to the slides and the transcript' },
    ],
    answer: 'Returns Drive links to the regression slides and transcript, and suggests running the summary in your own LLM, which can read the whole file.',
  },
  {
    id: 'upload',
    label: 'Upload',
    prompt: 'Drops Lecture6.pdf into the upload zone',
    path: ['start', 'input_handler', 'router', 'upload_handler', 'location_classifier', 'human_approval_gate', 'upload_executor', 'response_output', 'end'],
    k: 0,
    needsApproval: true,
    steps: [
      { node: 'router', text: 'Router: a file upload' },
      { node: 'location_classifier', text: 'Classifier proposes Spring2026/MSA408:Operations_Analytics/slides/Lecture6.pdf' },
      { node: 'human_approval_gate', text: 'The graph pauses until a person approves the folder' },
      { node: 'upload_executor', text: 'Executor: uploads, chunks, embeds and stores the file' },
    ],
    answer: 'Ready to query! Indexed 14 chunks.',
  },
  {
    id: 'source',
    label: 'Source follow-up',
    prompt: 'Why did you give me the Lecture 5 slides?',
    path: ['start', 'input_handler', 'router', 'source_explainer', 'response_output', 'end'],
    k: 0,
    steps: [
      { node: 'router', text: 'Router: matches "why did you" without calling the LLM' },
      { node: 'source_explainer', text: 'Source explainer: finds the earlier HW3 answer in the session' },
    ],
    answer: 'Returns the exact text chunks from the Lecture 5 slides that contained the HW3 deadline.',
  },
];
