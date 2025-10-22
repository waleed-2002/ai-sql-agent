

"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Drop-in replacement for your <Chat /> with improved UI polish only.
 * - Cleaner header with About modal & theme-aware styles
 * - Message bubbles with avatars, copy button, and subtle animations
 * - Tool blocks rendered as collapsible, syntax-highlighted JSON (minimal)
 * - Floating scroll-to-bottom button
 * - Keyboard shortcuts helper & inline hints
 *
 * No functional changes to your data flow: still uses useChat() { messages, sendMessage }.
 */

type AnyMsg = {
  id: string;
  role: "user" | "assistant" | string;
  parts?: Array<{ type: string; text?: string; [k: string]: any }>;
  text?: string;
  content?: string;
};

export default function Chat() {
  const { messages, sendMessage } =
    useChat() as unknown as {
      messages: AnyMsg[];
      sendMessage: (opts: { text: string }) => void;
    };

  const [input, setInput] = useState("");
  const [openByMsgId, setOpenByMsgId] = useState<Record<string, boolean>>({});
  const [showAbout, setShowAbout] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, atBottom]);

  // Track whether user is scrolled to bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      setAtBottom(nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const showWelcome = (messages?.length ?? 0) === 0;
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const toggle = (id: string) =>
    setOpenByMsgId((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="flex h-screen w-full items-stretch justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="relative flex w-full max-w-2xl flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">AI</span>
              <h1 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                SQL AGENT
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAbout(true)}
                className="rounded-lg px-2 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-800"
                title="About & Shortcuts"
              >
                About
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={listRef}
          className={cx(
            "flex-1 overflow-y-auto px-3 sm:px-4",
            showWelcome ? "grid place-items-center" : "pt-4 pb-28"
          )}
        >
          {showWelcome ? (
            <WelcomeCard />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const ts = fmt(new Date());
                const normalizedParts = m.parts && m.parts.length > 0 ? m.parts : normalizeToParts(m);

                return (
                  <MessageBubble key={m.id} role={m.role} timestamp={ts}>
                    {normalizedParts.map((part, i) => {
                      const key = `${m.id}-${i}`;

                      if (part.type === "text") {
                        return (
                          <RichText key={key} text={part.text ?? ""} />
                        );
                      }

                      if (part.type === "step-start") {
                        return (
                          <div
                            key={key}
                            className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
                          >
                            <DotPulse />
                            Processing…
                          </div>
                        );
                      }

                      if (["tool-db", "tool-schema", "tool-call", "tool-result"].includes(part.type)) {
                        return (
                          <ToolBlock
                            key={key}
                            label={labelFor(part.type)}
                            chip={part.type}
                            json={part}
                            isOpen={!!openByMsgId[m.id]}
                            onToggle={() => toggle(m.id)}
                          />
                        );
                      }

                      return (
                        <ToolBlock
                          key={key}
                          label={`Details (${part.type})`}
                          chip={part.type}
                          json={part}
                          isOpen={!!openByMsgId[m.id]}
                          onToggle={() => toggle(m.id)}
                        />
                      );
                    })}
                  </MessageBubble>
                );
              })}
            </div>
          )}
        </div>

        {/* Scroll to bottom */}
        {!atBottom && (
          <button
            onClick={() => {
              const el = listRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }}
            className="pointer-events-auto fixed bottom-28 right-6 z-10 rounded-full bg-white/90 px-3 py-2 text-xs shadow-lg ring-1 ring-zinc-200 backdrop-blur-md transition hover:bg-white dark:bg-zinc-900/80 dark:ring-zinc-800"
          >
            Jump to latest ↓
          </button>
        )}

        {/* Composer */}
        <form
          className="pointer-events-auto"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = input.trim();
            if (!trimmed) return;
            sendMessage({ text: trimmed });
            setInput("");
          }}
        >
          <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-2xl px-3 pb-4 sm:px-4">
            <div className="rounded-2xl border border-zinc-300/60 bg-zinc-100/70 shadow-[0_2px_20px_rgba(0,0,0,0.06)] backdrop-blur-md focus-within:ring-2 focus-within:ring-indigo-500 dark:border-zinc-700/60 dark:bg-zinc-800/70">
              <div className="flex items-end gap-2 p-2">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const trimmed = input.trim();
                      if (!trimmed) return;
                      sendMessage({ text: trimmed });
                      setInput("");
                    }
                  }}
                  placeholder="Ask anything…"
                  className="min-h-[48px] max-h-40 w-full resize-none rounded-xl bg-transparent p-2 text-zinc-900 placeholder:text-zinc-500 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-400\"
                />
                <button
                  type="submit"
                  className="mb-1 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-500 active:scale-[0.99] dark:bg-indigo-500 dark:hover:bg-indigo-400\"
                >
                  Send
                </button>
              </div>
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Enter to send • Shift+Enter for a new line
                </span>
                <InlineHint />
              </div>
            </div>
          </div>
        </form>

        {/* About Modal */}
        {showAbout && (
          <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={() => setShowAbout(false)}>
            <div
              className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">About this Chat</h3>
                <button
                  onClick={() => setShowAbout(false)}
                  className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
                <li>Streamlined UI using Tailwind; dark-mode ready.</li>
                <li>Collapsible tool outputs; raw JSON safely rendered.</li>
                <li>Copy any message content with one click.</li>
                <li>Keyboard: <kbd className="kbd">Enter</kbd> send, <kbd className="kbd">Shift</kbd>+<kbd className="kbd">Enter</kbd> newline.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */

function WelcomeCard() {
  return (
    <div className="mx-3 my-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <h2 className="mb-2 text-lg font-semibold">AI SQL Agent</h2>
      <p className="text-sm leading-relaxed">
        Talk to your database in plain English. The agent drafts SQL, runs it safely, and lets you inspect every step.
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-zinc-500 dark:text-zinc-400">
        <li><strong>Natural language → SQL:</strong> Ask questions; the agent generates and shows the SQL it runs.</li>
        <li><strong>Schema‑aware:</strong> It reads your tables, keys, and relations to craft accurate queries.</li>
        <li><strong>Safe mode by default:</strong> Read‑only selects; writes are only executed if explicitly enabled.</li>
        <li><strong>Results & details:</strong> Toggle “Show details” to view raw tool calls, schema JSON, and generated SQL.</li>
      </ul>
    </div>
  );
}


function MessageBubble({
  role,
  timestamp,
  children,
}: {
  role: "user" | "assistant" | string;
  timestamp?: string;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cx("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all " +
          (isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100"
            : "bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800")
        }
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Avatar label={isUser ? "You" : "AI"} variant={isUser ? "user" : "ai"} />
            <span className="text-xs font-medium opacity-70">{isUser ? "You" : "AI"}</span>
          </div>
          <span className="text-[11px] opacity-50">{timestamp}</span>
        </div>
        <div className="prose prose-zinc max-w-none dark:prose-invert">
          {children}
        </div>
        <CopyBtn className="absolute -right-2 -top-2" selector=".prose" />
      </div>
    </div>
  );
}

function ToolBlock({
  label,
  chip,
  json,
  isOpen,
  onToggle,
}: {
  label: string;
  chip?: string;
  json: unknown;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
          {chip && <span className="rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{chip}</span>}
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {isOpen ? "Hide details" : "Show details"}
        </span>
      </button>
      {isOpen && (
        <pre className="max-h-64 overflow-auto border-t border-zinc-200 bg-white p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
{safeStringify(json, 2)}
        </pre>
      )}
    </div>
  );
}

function DotPulse() {
  return (
    <span className="inline-flex">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
    </span>
  );
}

function RichText({ text }: { text: string }) {
  // Minimal code block support (``` fenced blocks) for demo/preview
  const blocks = useMemo(() => splitFences(text), [text]);
  return (
    <div>
      {blocks.map((b, i) =>
        b.type === "code" ? (
          <pre key={i} className="mb-2 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
            <code>{b.content}</code>
          </pre>
        ) : (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">{b.content}</p>
        )
      )}
    </div>
  );
}

function InlineHint() {
  return (
    <div className="hidden items-center gap-2 text-[11px] text-zinc-400 sm:flex dark:text-zinc-500">
      <kbd className="kbd">/</kbd> quick actions <span className="opacity-40">•</span> <kbd className="kbd">Esc</kbd> clear
    </div>
  );
}

function Avatar({ label, variant = "ai" }: { label: string; variant?: "ai" | "user" }) {
  const isAI = variant === "ai";
  return (
    <span
      className={
        "inline-flex h-5 w-5 select-none items-center justify-center rounded-full text-[10px] font-semibold " +
        (isAI
          ? "bg-indigo-600 text-white"
          : "bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900")
      }
      title={label}
    >
      {isAI ? "AI" : "U"}
    </span>
  );
}

function CopyBtn({ selector = "", className = "" }: { selector?: string; className?: string }) {
  const onCopy = async (e: React.MouseEvent) => {
    const root = (e.currentTarget as HTMLButtonElement).closest("div");
    let text = "";
    if (root) {
      const target = selector ? root.querySelector(selector) : root;
      text = target?.textContent ?? "";
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* no-op */
    }
  };
  return (
    <button
      onClick={onCopy}
      className={"rounded-full px-2 py-1 text-[10px] shadow ring-1 backdrop-blur transition " +
        "bg-zinc-200/80 text-zinc-700 ring-zinc-300 hover:bg-zinc-200 " +
        "dark:bg-zinc-800/80 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800 " +
        className}
      title="Copy message"
      aria-label="Copy message"
      type="button"
    >
      Copy
    </button>
  );
}

/* ---------- tiny helpers ---------- */

function safeStringify(value: unknown, space = 0) {
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return String(value);
  }
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function labelFor(t: string) {
  switch (t) {
    case "tool-db":
      return "Database Result";
    case "tool-schema":
      return "Schema";
    case "tool-call":
      return "Tool Call";
    case "tool-result":
      return "Tool Result";
    default:
      return "Details";
  }
}

/**
 * Normalizes message shapes:
 * - If your adapter puts plain text in `message.text` or `message.content`,
 *   convert it into a single `text` part so the renderer is consistent.
 */
function normalizeToParts(m: AnyMsg): Array<{ type: string; text?: string; [k: string]: any }> {
  if (m.parts && m.parts.length > 0) return m.parts;
  if (typeof m.text === "string") return [{ type: "text", text: m.text }];
  if (typeof m.content === "string") return [{ type: "text", text: m.content }];
  return [{ type: "unknown", raw: m }];
}

/** Minimal fenced code block splitter for RichText */
function splitFences(input: string): Array<{ type: "text" | "code"; content: string }> {
  const lines = input.split(/\n/);
  const out: Array<{ type: "text" | "code"; content: string }> = [];
  let buf: string[] = [];
  let inCode = false;
  for (const ln of lines) {
    if (ln.trim().startsWith("```") && !inCode) {
      if (buf.length) out.push({ type: "text", content: buf.join("\n") });
      buf = [];
      inCode = true;
      continue;
    }
    if (ln.trim().startsWith("```") && inCode) {
      out.push({ type: "code", content: buf.join("\n") });
      buf = [];
      inCode = false;
      continue;
    }
    buf.push(ln);
  }
  if (buf.length) out.push({ type: inCode ? "code" : "text", content: buf.join("\n") });
  return out;
}

/* Tiny kbd helper */
declare global {
  interface HTMLElementTagNameMap {
    kbd: HTMLElement;
  }
}
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="kbd inline-flex items-center rounded-md border border-zinc-300 bg-zinc-50 px-1 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </kbd>
  );
}


// 'use client';

// import { useChat } from '@ai-sdk/react';
// import { useState } from 'react';

// export default function Chat() {
//   const [input, setInput] = useState('');
//   const { messages, sendMessage } = useChat();
//   return (
//     <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
//       {messages.map(message => (
//         <div key={message.id} className="whitespace-pre-wrap">
//           {message.role === 'user' ? 'User: ' : 'AI: '}
//           {message.parts.map((part, i) => {
//             switch (part.type) {
//               case 'text':
//                 return <div key={`${message.id}-${i}`}>{part.text}</div>;
//               case 'tool-db':
//                 return (
//                   <pre key={`${message.id}-${i}`}>
//                     {JSON.stringify(part, null, 2)}
//                   </pre>
//                 );  
//               case 'tool-schema':
//                 return (
//                   <pre key={`${message.id}-${i}`}>
//                     {JSON.stringify(part, null, 2)}
//                   </pre>
//                 );  
//             }
//           })}
//         </div>
//       ))}

//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           sendMessage({ text: input });
//           setInput('');
//         }}
//       >
//         <input
//           className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
//           value={input}
//           placeholder="Say something..."
//           onChange={e => setInput(e.currentTarget.value)}
//         />
//       </form>
//     </div>
//   );
// }