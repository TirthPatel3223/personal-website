'use client';

import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Loader2, Sparkles, User, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatPanel } from './ChatProvider';

const SUGGESTIONS = [
  'What does the Mapblazer pipeline do?',
  'Walk me through the RAG system',
  'Where has he used Databricks?',
];

export default function Chat() {
  const { isOpen, close, toggle } = useChatPanel();
  const [input, setInput] = useState('');

  // @ai-sdk/react v3 API: useChat returns sendMessage, messages, status
  const { messages, sendMessage, status } = useChat({
    onError: (error: Error) => {
      console.error(error);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    // Pass full UIMessage shape with parts[] array
    sendMessage({ role: 'user', parts: [{ type: 'text', text: trimmed }] });
  };

  const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    send(input);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on Escape, matching the affordance the mobile menu gives
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // Helper: extract displayable text from a UIMessage (v3 uses parts[])
  const getMessageText = (m: { parts?: { type: string; text?: string }[]; content?: string }) => {
    if (m.parts) {
      return m.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join('');
    }
    return m.content ?? '';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="chat-panel glass w-[calc(100vw-2rem)] max-w-[680px] flex flex-col rounded-3xl overflow-hidden"
            style={{ border: '1px solid var(--glass-border)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--title)' }}>
                    Ask me about Tirth
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Answers from his projects, experience, and background
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded-full transition-transform hover:scale-110"
                style={{ color: 'var(--muted)' }}
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[min(60vh,540px)] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--muted)' }}>
                    Ask about Tirth&apos;s experience, projects, or background. Try one of these:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs rounded-full px-3.5 py-2 transition-opacity hover:opacity-70"
                        style={{
                          background: 'var(--chat-fill)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
                      <Bot size={15} />
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'chat-bubble-user rounded-tr-sm'
                        : 'chat-bubble-bot rounded-tl-sm'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-pre:text-xs">
                      <ReactMarkdown>{getMessageText(m)}</ReactMarkdown>
                    </div>
                  </div>
                  {m.role === 'user' && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                      style={{ background: 'var(--chat-fill-strong)', color: 'var(--foreground)' }}
                    >
                      <User size={15} />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    <Loader2 size={15} className="animate-spin" />
                  </div>
                  <div className="chat-bubble-bot px-4 py-3 rounded-2xl rounded-tl-sm text-sm">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
              <form onSubmit={handleSubmit} className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask a question..."
                  className="w-full rounded-full py-3.5 pl-5 pr-14 outline-none text-sm"
                  style={{
                    background: 'var(--chat-fill)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--accent)', color: 'var(--background)' }}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} className="ml-0.5" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle pill */}
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="glass flex items-center gap-2.5 rounded-full pl-4 pr-5 py-3 shadow-lg font-semibold text-sm"
        style={{ color: 'var(--foreground)', border: '1px solid var(--glass-border)' }}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="block"
              style={{ color: 'var(--accent)' }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="sparkles"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="block"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="whitespace-nowrap">{isOpen ? 'Close' : 'Ask me about Tirth'}</span>
      </motion.button>
    </div>
  );
}
