"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChefHat,
  Database,
  History,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  askRecipeFinderAgent,
  type RecipeFinderChatMessage,
} from "@/lib/recipe-finder-agent";
import {
  type RecipeFinderConversation,
  type StoredRecipeFinderMessage,
  useRecipeFinderAgentStore,
} from "@/store/recipe-finder-agent-store";
import { AgentHistorySidebar } from "@/components/agent-history-sidebar";
import { RecipeCard } from "@/components/home/recipe-card";
import { cn } from "@/lib/utils";

const QUICK_QUESTIONS = [
  "我是新手，推荐几道不容易翻车的菜",
  "我有鸡蛋、西红柿和土豆，能做什么？",
  "想做一道 20 分钟以内的下饭菜",
];

function createWelcomeMessage(): StoredRecipeFinderMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content:
      "告诉我你的厨艺、手头食材或今天想吃的口味。我会继续追问必要信息，再去真实菜谱库里帮你挑。",
  };
}

function createConversation(): RecipeFinderConversation {
  const now = new Date().toISOString();
  return {
    id: `pick_${crypto.randomUUID().replace(/-/g, "").slice(0, 31)}`,
    title: "新对话",
    createdAt: now,
    updatedAt: now,
    messages: [createWelcomeMessage()],
  };
}

export function RecipeFinderAgent() {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversations = useRecipeFinderAgentStore((state) => state.conversations);
  const activeConversationId = useRecipeFinderAgentStore(
    (state) => state.activeConversationId
  );
  const upsertConversation = useRecipeFinderAgentStore(
    (state) => state.upsertConversation
  );
  const removeConversation = useRecipeFinderAgentStore(
    (state) => state.removeConversation
  );
  const setActiveConversation = useRecipeFinderAgentStore(
    (state) => state.setActiveConversation
  );
  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations]
  );
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const messages = activeConversation?.messages || [];

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const handleOpen = () => {
    const state = useRecipeFinderAgentStore.getState();
    const storedConversations = [...state.conversations].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    const active = storedConversations.find(
      (conversation) => conversation.id === state.activeConversationId
    );
    const conversation = active || storedConversations[0] || createConversation();

    if (!active && storedConversations.length === 0) {
      state.upsertConversation(conversation);
    } else {
      state.setActiveConversation(conversation.id);
    }
    setOpen(true);
  };

  const startNewConversation = () => {
    if (loading) return;
    upsertConversation(createConversation());
    setInput("");
    setError("");
    setHistoryOpen(false);
  };

  const openConversation = (conversationId: string) => {
    if (loading) return;
    setActiveConversation(conversationId);
    setInput("");
    setError("");
    setHistoryOpen(false);
  };

  const deleteConversation = (conversationId: string) => {
    if (loading) return;
    const wasActive = conversationId === activeConversationId;
    const remaining = sortedConversations.filter((item) => item.id !== conversationId);
    removeConversation(conversationId);
    if (wasActive && remaining.length === 0) upsertConversation(createConversation());
  };

  const sendQuestion = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    let conversation = useRecipeFinderAgentStore
      .getState()
      .conversations.find((item) => item.id === activeConversationId);
    if (!conversation) {
      conversation = createConversation();
      upsertConversation(conversation);
    }

    const userMessage: StoredRecipeFinderMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };
    const assistantMessageId = crypto.randomUUID();
    const nextHistory: RecipeFinderChatMessage[] = [
      ...conversation.messages.map(({ role, content }) => ({ role, content })),
      { role: "user", content: trimmedQuestion },
    ];
    const title =
      conversation.title === "新对话"
        ? trimmedQuestion.replace(/\s+/g, " ").slice(0, 24)
        : conversation.title;
    const pendingConversation: RecipeFinderConversation = {
      ...conversation,
      title,
      updatedAt: new Date().toISOString(),
      messages: [
        ...conversation.messages,
        userMessage,
        { id: assistantMessageId, role: "assistant", content: "" },
      ],
    };
    upsertConversation(pendingConversation);
    setInput("");
    setError("");
    setLoading(true);
    scrollToBottom();

    let streamedText = "";
    try {
      const result = await askRecipeFinderAgent(
        nextHistory,
        conversation.id,
        (text) => {
          streamedText += text;
          const current = useRecipeFinderAgentStore
            .getState()
            .conversations.find((item) => item.id === conversation.id);
          if (!current) return;
          upsertConversation({
            ...current,
            messages: current.messages.map((message) =>
              message.id === assistantMessageId
                ? { ...message, content: message.content + text }
                : message
            ),
          });
          scrollToBottom();
        }
      );
      const current = useRecipeFinderAgentStore
        .getState()
        .conversations.find((item) => item.id === conversation.id);
      if (current) {
        upsertConversation({
          ...current,
          updatedAt: new Date().toISOString(),
          messages: current.messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: result.message,
                  recommendations: result.recommendations,
                }
              : message
          ),
        });
      }
    } catch (caughtError) {
      const current = useRecipeFinderAgentStore
        .getState()
        .conversations.find((item) => item.id === conversation.id);
      if (current && !streamedText) {
        upsertConversation({
          ...current,
          messages: current.messages.filter((message) => message.id !== assistantMessageId),
        });
      }
      setError(
        caughtError instanceof Error ? caughtError.message : "选菜助手暂时没有回应，请稍后重试。"
      );
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(input);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:border-primary/25 hover:bg-primary/10"
        aria-label="打开 AI 选菜助手"
      >
        <ChefHat className="h-3.5 w-3.5" />
        <span>帮我选菜</span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setOpen(false);
                    setHistoryOpen(false);
                  }}
                  className="fixed inset-0 z-50 bg-neutral-900/20 backdrop-blur-[2px]"
                  aria-label="关闭选菜 Agent"
                />
                <motion.section
                  initial={{ opacity: 0, y: 20, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className={cn(
                    "fixed inset-x-3 bottom-3 top-16 z-50 flex flex-col overflow-hidden rounded-xl border border-border/80 bg-[#fdfdfd] shadow-[0_20px_60px_-20px_rgba(120,70,30,0.35)] transition-[width] sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[min(720px,calc(100vh-3rem))]",
                    sidebarCollapsed
                      ? "sm:w-[440px]"
                      : "sm:w-[min(760px,calc(100vw-3rem))]"
                  )}
                  aria-label="AI 选菜助手"
                >
                  <header className="flex shrink-0 items-center gap-3 border-b border-border/70 bg-white px-4 py-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/20">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black tracking-tight text-foreground">Vibe 选菜</h2>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary">
                          Agent
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">先了解你，再去菜谱库里挑</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((current) => !current)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:hidden"
                      aria-label="查看对话历史"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarCollapsed((current) => !current)}
                      className="hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:flex"
                      aria-label={sidebarCollapsed ? "展开对话历史" : "收起对话历史"}
                      title={sidebarCollapsed ? "展开对话历史" : "收起对话历史"}
                    >
                      {sidebarCollapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setHistoryOpen(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      aria-label="关闭"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </header>

                  <div className="relative flex min-h-0 flex-1">
                    {historyOpen && (
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(false)}
                        className="absolute inset-0 z-10 bg-neutral-900/15 sm:hidden"
                        aria-label="关闭对话历史"
                      />
                    )}
                    <AgentHistorySidebar
                      items={sortedConversations}
                      activeId={activeConversationId}
                      open={historyOpen}
                      collapsed={sidebarCollapsed}
                      loading={loading}
                      label="选菜记录"
                      onNew={startNewConversation}
                      onSelect={openConversation}
                      onDelete={deleteConversation}
                    />

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex shrink-0 items-center gap-2 border-b border-dashed border-border bg-orange-50/50 px-4 py-2">
                        <Database className="h-3.5 w-3.5 text-success" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          实时菜谱库
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-foreground">
                          推荐只来自 Vibe Cook 真实菜谱
                        </span>
                      </div>

                      <div
                        ref={scrollRef}
                        className="flex-1 space-y-4 overflow-y-auto p-4"
                        style={{
                          backgroundColor: "#fdfdfd",
                          backgroundImage:
                            "radial-gradient(circle, #e8e8e8 1px, transparent 1px)",
                          backgroundSize: "18px 18px",
                        }}
                      >
                        {messages.map((message) => (
                          <div key={message.id} className="space-y-2.5">
                            <div
                              className={cn(
                                "flex gap-2",
                                message.role === "user" ? "justify-end" : "justify-start"
                              )}
                            >
                              {message.role === "assistant" && (
                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                                  <ChefHat className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  "max-w-[84%] rounded-xl border px-3.5 py-2.5 text-xs leading-5 shadow-sm",
                                  message.role === "user"
                                    ? "rounded-br-sm border-primary/20 bg-primary/10 text-foreground"
                                    : "rounded-bl-sm border-border/70 bg-white text-foreground"
                                )}
                              >
                                {message.role === "assistant" ? (
                                  message.content ? (
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: ({ children }) => (
                                          <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>
                                        ),
                                        ul: ({ children }) => (
                                          <ul className="my-1.5 list-disc space-y-1 pl-4">{children}</ul>
                                        ),
                                        ol: ({ children }) => (
                                          <ol className="my-1.5 list-decimal space-y-1 pl-4">{children}</ol>
                                        ),
                                        strong: ({ children }) => (
                                          <strong className="font-black">{children}</strong>
                                        ),
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  ) : (
                                    <span className="animate-pulse text-muted-foreground">
                                      正在理解条件并查询菜谱…
                                    </span>
                                  )
                                ) : (
                                  <span className="whitespace-pre-wrap">{message.content}</span>
                                )}
                              </div>
                            </div>

                            {message.recommendations && message.recommendations.length > 0 && (
                              <div className="ml-9 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                                {message.recommendations.map((recommendation) => (
                                  <div key={recommendation.id} className="w-52 shrink-0">
                                    <RecipeCard recipe={recommendation} />
                                    <div className="mx-1 -mt-1 rounded-b-xl border border-t-0 border-primary/10 bg-primary/[0.045] px-2.5 pb-2 pt-2 text-[10px] leading-relaxed text-muted-foreground">
                                      <span className="font-bold text-primary">适合你：</span>
                                      {recommendation.reason}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {loading && (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" />
                            Agent 正在思考并查询数据库…
                          </div>
                        )}
                        {error && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
                            {error}
                          </div>
                        )}
                      </div>

                      {messages.length === 1 && (
                        <div className="shrink-0 border-t border-dashed border-border bg-orange-50/35 px-4 py-2.5">
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {QUICK_QUESTIONS.map((question) => (
                              <button
                                key={question}
                                type="button"
                                onClick={() => void sendQuestion(question)}
                                className="shrink-0 rounded-lg border border-border bg-white px-3 py-1.5 text-[10px] font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <form
                        onSubmit={handleSubmit}
                        className="flex shrink-0 items-end gap-2 border-t border-border/70 bg-white p-3"
                      >
                        <textarea
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          rows={1}
                          placeholder="例如：我是新手，家里有鸡蛋和西红柿…"
                          className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-border bg-neutral-50/70 px-3 py-2.5 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-white"
                        />
                        <button
                          type="submit"
                          disabled={!input.trim() || loading}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="发送选菜需求"
                        >
                          {loading ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.section>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
