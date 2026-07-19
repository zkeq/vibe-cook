"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  ChefHat,
  History,
  LoaderCircle,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { Recipe } from "@/lib/types";
import {
  askRecipeAgent,
  type RecipeAgentSuggestion,
} from "@/lib/recipe-agent";
import { useUserSettingsStore } from "@/store/user-settings-store";
import {
  type RecipeAgentConversation,
  type StoredRecipeAgentMessage,
  useRecipeAgentHistoryStore,
} from "@/store/recipe-agent-history-store";
import { cn } from "@/lib/utils";

type DisplayMessage = StoredRecipeAgentMessage;

interface RecipeAgentProps {
  recipe: Recipe;
  currentStepIndex?: number;
  triggerVariant?: "detail" | "cook-desktop" | "cook-mobile";
}

const QUICK_QUESTIONS = [
  "我想让这道菜多一点汤汁，应该怎么调整？",
  "怎么做能更嫩、更入味？",
  "有哪些容易失败的地方？",
];

function createWelcomeMessage(recipe: Recipe): DisplayMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `我是你的菜谱 Agent。可以直接问我怎么调整「${recipe.title}」，我会把建议对应到具体步骤，确认后再添加进页面。`,
  };
}

function createConversation(recipe: Recipe): RecipeAgentConversation {
  const now = new Date().toISOString();
  return {
    id: `cook_${crypto.randomUUID().replace(/-/g, "").slice(0, 31)}`,
    recipeId: recipe.id,
    recipeTitle: recipe.title,
    title: "新对话",
    createdAt: now,
    updatedAt: now,
    messages: [createWelcomeMessage(recipe)],
  };
}

function formatConversationTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RecipeAgent({
  recipe,
  currentStepIndex,
  triggerVariant = "detail",
}: RecipeAgentProps) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { recipeTipAdditions, addRecipeTips, clearRecipeTips } = useUserSettingsStore();
  const addedTips = recipeTipAdditions[recipe.id] || {};
  const addedTipCount = Object.values(addedTips).reduce(
    (total, stepTips) => total + stepTips.length,
    0
  );
  const conversations = useRecipeAgentHistoryStore((state) => state.conversations);
  const activeConversationByRecipe = useRecipeAgentHistoryStore(
    (state) => state.activeConversationByRecipe
  );
  const upsertConversation = useRecipeAgentHistoryStore(
    (state) => state.upsertConversation
  );
  const removeConversation = useRecipeAgentHistoryStore(
    (state) => state.removeConversation
  );
  const setActiveConversation = useRecipeAgentHistoryStore(
    (state) => state.setActiveConversation
  );
  const activeConversationId = activeConversationByRecipe[recipe.id];
  const recipeConversations = useMemo(
    () =>
      conversations
        .filter((conversation) => conversation.recipeId === recipe.id)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations, recipe.id]
  );

  const openConversation = (conversation: RecipeAgentConversation) => {
    if (loading) return;
    setActiveConversation(recipe.id, conversation.id);
    setMessages(conversation.messages);
    setError("");
    setInput("");
    setHistoryOpen(false);
  };

  const startNewConversation = () => {
    if (loading) return;
    const conversation = createConversation(recipe);
    upsertConversation(conversation);
    setMessages(conversation.messages);
    setError("");
    setInput("");
    setHistoryOpen(false);
  };

  const handleOpen = () => {
    const state = useRecipeAgentHistoryStore.getState();
    const storedConversations = state.conversations
      .filter((conversation) => conversation.recipeId === recipe.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const active = storedConversations.find(
      (conversation) => conversation.id === state.activeConversationByRecipe[recipe.id]
    );
    const conversation = active || storedConversations[0] || createConversation(recipe);

    if (!active && storedConversations.length === 0) {
      state.upsertConversation(conversation);
    } else {
      state.setActiveConversation(recipe.id, conversation.id);
    }
    setMessages(conversation.messages);
    setOpen(true);
  };

  const deleteConversation = (conversationId: string) => {
    if (loading) return;
    const remaining = recipeConversations.filter(
      (conversation) => conversation.id !== conversationId
    );
    removeConversation(recipe.id, conversationId);

    if (activeConversationId === conversationId) {
      const nextConversation = remaining[0] || createConversation(recipe);
      if (remaining.length === 0) upsertConversation(nextConversation);
      setActiveConversation(recipe.id, nextConversation.id);
      setMessages(nextConversation.messages);
    }
  };

  const sendQuestion = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    let conversation = useRecipeAgentHistoryStore
      .getState()
      .conversations.find((item) => item.id === activeConversationId);
    if (!conversation) {
      conversation = createConversation(recipe);
      upsertConversation(conversation);
    }

    const baseMessages = messages.length > 0 ? messages : conversation.messages;
    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };
    const nextHistory = [
      ...baseMessages.map(({ role, content }) => ({ role, content })),
      { role: "user" as const, content: trimmedQuestion },
    ];
    const assistantMessageId = crypto.randomUUID();
    const pendingMessages: DisplayMessage[] = [
      ...baseMessages,
      userMessage,
      { id: assistantMessageId, role: "assistant", content: "" },
    ];
    const title =
      conversation.title === "新对话"
        ? trimmedQuestion.replace(/\s+/g, " ").slice(0, 24)
        : conversation.title;
    upsertConversation({
      ...conversation,
      title,
      updatedAt: new Date().toISOString(),
      messages: [...baseMessages, userMessage],
    });
    setMessages(pendingMessages);
    setInput("");
    setError("");
    setLoading(true);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    let streamedText = "";
    try {
      const result = await askRecipeAgent(
        recipe,
        nextHistory,
        conversation.id,
        currentStepIndex,
        (text) => {
          streamedText += text;
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessageId
                ? { ...message, content: message.content + text }
                : message
            )
          );
        }
      );
      const assistantMessage: DisplayMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: result.message,
        suggestions: result.suggestions,
      };
      const completedMessages = [...baseMessages, userMessage, assistantMessage];
      setMessages(completedMessages);
      upsertConversation({
        ...conversation,
        title,
        updatedAt: new Date().toISOString(),
        messages: completedMessages,
      });
    } catch (caughtError) {
      const savedMessages: DisplayMessage[] = streamedText
        ? [
            ...baseMessages,
            userMessage,
            { id: assistantMessageId, role: "assistant", content: streamedText },
          ]
        : [...baseMessages, userMessage];
      setMessages(savedMessages);
      upsertConversation({
        ...conversation,
        title,
        updatedAt: new Date().toISOString(),
        messages: savedMessages,
      });
      setError(
        caughtError instanceof Error ? caughtError.message : "Agent 暂时没有回应，请稍后重试。"
      );
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(input);
  };

  const suggestionApplied = (suggestion: RecipeAgentSuggestion) => {
    const stepTips = addedTips[suggestion.stepIndex] || [];
    return suggestion.tips.every((tip) => stepTips.includes(tip));
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "inline-flex shrink-0 items-center justify-center transition-all active:scale-[0.97]",
          triggerVariant === "detail" &&
            "gap-2 rounded-lg bg-primary px-3.5 py-2 text-white shadow-sm shadow-primary/15 hover:bg-primary/90",
          triggerVariant === "cook-desktop" &&
            "h-26 w-11 rounded-lg border border-border bg-white text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5",
          triggerVariant === "cook-mobile" &&
            "h-8 w-8 rounded-full border border-primary/20 bg-primary/10 text-primary active:bg-primary/20"
        )}
        aria-label="询问菜谱 Agent"
        title="问主厨 Agent"
      >
        <Sparkles className={cn("h-4 w-4", triggerVariant === "cook-desktop" && "h-4.5 w-4.5")} />
        {triggerVariant === "detail" && (
          <span className="text-xs font-bold">问主厨 Agent</span>
        )}
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
                  aria-label="关闭 Agent"
                />
                <motion.section
                  initial={{ opacity: 0, y: 20, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className="fixed inset-x-3 bottom-3 top-16 z-50 flex flex-col overflow-hidden rounded-xl border border-border/80 bg-[#fdfdfd] shadow-[0_20px_60px_-20px_rgba(120,70,30,0.35)] sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[min(720px,calc(100vh-3rem))] sm:w-[min(760px,calc(100vw-3rem))]"
                  aria-label="菜谱 Agent 对话"
                >
                  <header className="flex shrink-0 items-center gap-3 border-b border-border/70 bg-white px-4 py-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/20">
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black tracking-tight text-foreground">Vibe 主厨</h2>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary">
                          Agent
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">懂菜谱，也懂你的口味</p>
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
                    <aside
                      className={cn(
                        "absolute inset-y-0 left-0 z-20 flex w-[218px] flex-col border-r border-border/70 bg-[#faf7f2] transition-transform sm:static sm:z-auto sm:translate-x-0",
                        historyOpen ? "translate-x-0" : "-translate-x-full"
                      )}
                    >
                      <div className="border-b border-border/60 p-3">
                        <button
                          type="button"
                          onClick={startNewConversation}
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          <MessageSquarePlus className="h-4 w-4" />
                          新建对话
                        </button>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto p-2">
                        <div className="mb-2 flex items-center justify-between px-2 pt-1">
                          <span className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                            本菜谱历史
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground">
                            {recipeConversations.length}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {recipeConversations.map((conversation) => (
                            <div
                              key={conversation.id}
                              className={cn(
                                "group flex items-center gap-1 rounded-lg border transition-colors",
                                activeConversationId === conversation.id
                                  ? "border-primary/20 bg-white shadow-sm"
                                  : "border-transparent hover:bg-white/80"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => openConversation(conversation)}
                                disabled={loading}
                                className="flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2.5 text-left disabled:cursor-not-allowed"
                              >
                                <MessageSquare
                                  className={cn(
                                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                                    activeConversationId === conversation.id
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  )}
                                />
                                <span className="min-w-0">
                                  <span className="block truncate text-[11px] font-bold text-foreground">
                                    {conversation.title}
                                  </span>
                                  <span className="mt-0.5 block text-[8px] text-muted-foreground">
                                    {formatConversationTime(conversation.updatedAt)}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteConversation(conversation.id)}
                                disabled={loading}
                                className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-all hover:bg-red-50 hover:text-red-600 focus:opacity-100 disabled:hidden sm:opacity-0 sm:group-hover:opacity-100"
                                aria-label={`删除对话：${conversation.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-border/60 px-3 py-2.5 text-[8px] leading-relaxed text-muted-foreground">
                        对话仅保存在当前浏览器
                      </div>
                    </aside>

                    <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center gap-2 border-b border-dashed border-border bg-orange-50/50 px-4 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">当前菜谱</span>
                    <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-foreground">{recipe.title}</span>
                    {currentStepIndex !== undefined && (
                      <span className="rounded-md border border-primary/15 bg-white px-2 py-0.5 text-[9px] font-bold text-primary">
                        第 {currentStepIndex + 1} 步
                      </span>
                    )}
                    {addedTipCount > 0 && (
                      <button
                        type="button"
                        onClick={() => clearRecipeTips(recipe.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[9px] font-bold text-red-600 transition-colors hover:bg-red-50"
                        title={`清空当前菜谱的 ${addedTipCount} 条 AI 提示`}
                      >
                        <Trash2 className="h-3 w-3" />
                        清空 AI 标记
                      </button>
                    )}
                  </div>

                  <div
                    ref={scrollRef}
                    className="flex-1 space-y-4 overflow-y-auto p-4"
                    style={{
                      backgroundColor: "#fdfdfd",
                      backgroundImage: "radial-gradient(circle, #e8e8e8 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  >
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
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
                          "max-w-[84%] rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed shadow-sm",
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
                                h2: ({ children }) => (
                                  <h2 className="mb-1.5 mt-3 text-sm font-black first:mt-0">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="mb-1 mt-2.5 text-xs font-black first:mt-0">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="my-1.5 leading-5 first:mt-0 last:mb-0">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="my-1.5 list-disc space-y-1 pl-4">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="my-1.5 list-decimal space-y-1 pl-4">{children}</ol>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-black text-foreground">{children}</strong>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          ) : (
                            <span className="animate-pulse text-muted-foreground">正在组织回答…</span>
                          )
                        ) : (
                          <span className="whitespace-pre-wrap">{message.content}</span>
                        )}
                      </div>
                    </div>

                    {message.suggestions?.map((suggestion, index) => {
                      const step = recipe.steps[suggestion.stepIndex];
                      if (!step) return null;
                      const applied = suggestionApplied(suggestion);

                      return (
                        <div
                          key={`${message.id}-${suggestion.stepIndex}-${index}`}
                          className="ml-9 overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm"
                        >
                          <div className="border-b border-dashed border-border bg-orange-50/45 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-white shadow-sm">
                                {String(suggestion.stepIndex + 1).padStart(2, "0")}
                              </span>
                              <div className="min-w-0">
                                <span className="block text-[8px] font-black uppercase tracking-widest text-primary">建议加入步骤</span>
                                <span className="block truncate text-xs font-bold text-foreground">{step.title}</span>
                              </div>
                            </div>
                            {suggestion.reason && (
                              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                                {suggestion.reason}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 px-3 py-3">
                            {suggestion.tips.map((tip) => (
                              <div key={tip} className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground">
                                <span className="mt-1 h-3 w-0.5 shrink-0 rounded-full bg-primary" />
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            disabled={applied}
                            onClick={() =>
                              addRecipeTips(recipe.id, suggestion.stepIndex, suggestion.tips)
                            }
                            className={cn(
                              "flex w-full items-center justify-center gap-1.5 border-t px-3 py-2 text-[11px] font-bold transition-colors",
                              applied
                                ? "cursor-default border-green-100 bg-green-50 text-green-700"
                                : "border-primary bg-primary text-white hover:bg-primary/90"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {applied ? "已添加到此步骤" : "添加到此步骤"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                    主厨正在结合菜谱分析…
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
                    {error}
                  </div>
                )}
                  </div>

              {messages.length === 1 && (
                <div className="shrink-0 border-t border-dashed border-border bg-orange-50/35 px-4 py-2.5">
                  <span className="mb-2 block text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground">你可以这样问</span>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {QUICK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        onClick={() => void sendQuestion(question)}
                        className="shrink-0 rounded-lg border border-border bg-white px-3 py-1.5 text-[10px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t border-border/70 bg-white p-3">
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
                  placeholder="例如：我想让辣椒炒肉有一点汤汁…"
                  className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-border bg-neutral-50/70 px-3 py-2.5 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/15 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="发送"
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
