'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

/* The panel is opened from two places now: the floating pill and the navbar entry
   after Contact. Both need the same state, so it lives here and the provider wraps
   the whole app in layout.tsx. */
type ChatPanel = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const ChatPanelContext = createContext<ChatPanel | null>(null);

export function useChatPanel(): ChatPanel {
  const ctx = useContext(ChatPanelContext);
  if (!ctx) throw new Error('useChatPanel must be used inside <ChatProvider>');
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChatPanelContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((o) => !o),
      }}
    >
      {children}
    </ChatPanelContext.Provider>
  );
}
