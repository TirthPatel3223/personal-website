'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useScenePalette } from '../../core/palette';
import { useReducedMotion } from '../../core/quality';
import { AGENT_QUERIES, NODE_BY_ID, type AgentQuery } from '../../data/agentGraph';
import ExhibitCanvas, { useInView } from '../ExhibitCanvas';
import ExhibitShell from '../ExhibitShell';
import { ResetButton, Segmented } from '../hud';
import AgentScene from './AgentScene';

type QueryId = AgentQuery['id'];

export default function AgentExhibit({ quality }: { quality: 'low' | 'high' }) {
  const palette = useScenePalette();
  const reduced = useReducedMotion();
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const [queryId, setQueryId] = useState<QueryId>('deadline');
  const [progress, setProgress] = useState(0);
  const [approved, setApproved] = useState(false);
  const [started, setStarted] = useState(false);
  const query = AGENT_QUERIES.find((q) => q.id === queryId) ?? AGENT_QUERIES[0];
  const last = query.path.length - 1;
  const gate = query.needsApproval ? query.path.indexOf('human_approval_gate') : -1;
  const waiting = gate >= 0 && !approved && progress >= gate;
  const done = progress >= last;
  const running = (started || (inView && !reduced)) && !done && !waiting;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - prev) / 1000);
      prev = now;
      setProgress((p) => {
        let next = Math.min(last, p + dt * 1.1);
        if (gate >= 0 && !approved && next >= gate) next = gate;
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, last, gate, approved]);

  const reached = Math.floor(progress + 0.001);
  const retrieverAt = query.path.indexOf('retriever');
  const retrieved = retrieverAt >= 0 && progress >= retrieverAt;
  const visibleSteps = query.steps.filter((s) => query.path.indexOf(s.node) <= reached);
  const here = NODE_BY_ID[query.path[Math.min(last, reached)]];

  const choose = (id: QueryId) => {
    setQueryId(id);
    setProgress(0);
    setApproved(false);
    setStarted(true);
  };

  const side = (
    <div className="space-y-5">
      <div className="agent-bubble">
        <p className="hud-mini">The question</p>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          {query.prompt}
        </p>
      </div>
      <ol className="agent-steps">
        {visibleSteps.map((s, i) => (
          <li key={s.node} data-current={i === visibleSteps.length - 1 && !done}>
            {s.text}
          </li>
        ))}
      </ol>
      {waiting && (
        <div className="agent-gate">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Human in the loop: the graph is paused at <code>human_approval_gate</code>. Approve the proposed folder?
          </p>
          <button type="button" className="hud-btn hud-btn-primary" onClick={() => setApproved(true)}>
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>
      )}
      {done && (
        <div className="agent-answer">
          <p className="hud-mini">The answer</p>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            {query.answer}
          </p>
        </div>
      )}
      {!done && !waiting && here && (
        <p className="hud-note">
          <strong>{here.label}:</strong> {here.detail}
        </p>
      )}
    </div>
  );

  const hud = (
    <>
      <Segmented<QueryId>
        label="Question type"
        value={queryId}
        options={AGENT_QUERIES.map((q) => ({ value: q.id, label: q.label }))}
        onChange={choose}
      />
      <ResetButton label="Run again" onClick={() => choose(queryId)} />
      <span className="hud-count">
        {done ? 'Answered' : waiting ? 'Waiting for approval' : `At ${here?.label ?? ''}`}
      </span>
    </>
  );

  return (
    <div ref={wrapRef}>
      <ExhibitShell
        kicker="Campus · the real graph"
        title="Send a question through the agent"
        accent={palette.accent.indigo}
        side={side}
        hud={hud}
        caption="The graph is the assistant's real LangGraph: 13 nodes, five branches and a pause for human approval on uploads. The cloud of points stands in for the course chunks stored in ChromaDB; their positions are illustrative."
      >
        <ExhibitCanvas quality={quality} camera={[0, 11, 13]} target={[0, 0.6, -0.6]}>
          <AgentScene palette={palette} query={query} progress={progress} retrieved={retrieved} waiting={waiting} />
        </ExhibitCanvas>
      </ExhibitShell>
    </div>
  );
}
