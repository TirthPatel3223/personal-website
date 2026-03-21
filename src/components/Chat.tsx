import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Loader2, Sparkles, User, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
// ... existing code, skipping lines to the render area ...
// (I will write the actual diff matching the file lines)
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  // @ai-sdk/react v3 API: useChat returns sendMessage, messages, status
  const { messages, sendMessage, status } = useChat({
    onError: (error: Error) => {
      console.error(error);
      alert('Chat Error: ' + error.message);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    // Pass full UIMessage shape with parts[] array
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: trimmed }],
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[calc(100vw-2rem)] max-w-[400px] flex flex-col bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-200">Ask Tirth's AI</p>
                  <p className="text-xs text-neutral-500">Powered by Claude + GPT</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <p className="text-neutral-500 text-sm text-center mt-10 leading-relaxed">
                  Ask about my experience,
                  <br />
                  projects, or background...
                </p>
              )}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-1">
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-teal-600 text-white rounded-tr-sm'
                        : 'bg-neutral-800 text-neutral-200 rounded-tl-sm'
                    }`}
                  >
                    <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800">
                      <ReactMarkdown>
                        {getMessageText(m)}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-300 shrink-0 mt-1">
                      <User size={14} />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-neutral-800 text-neutral-400 text-sm rounded-tl-sm">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-800">
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
                  className="w-full bg-neutral-800/50 text-neutral-100 placeholder:text-neutral-500 rounded-full py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-teal-500/50 border border-neutral-700/50 text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-teal-500 hover:bg-teal-400 text-neutral-950 disabled:opacity-50 disabled:hover:bg-teal-500 transition-colors"
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

      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 text-neutral-950 shadow-lg shadow-teal-500/25 flex items-center justify-center transition-colors"
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="sparkles"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
