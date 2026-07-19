"use client";

import { MessageSquare, MessageSquarePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentHistoryItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface AgentHistorySidebarProps {
  items: AgentHistoryItem[];
  activeId?: string;
  open: boolean;
  collapsed?: boolean;
  loading?: boolean;
  label?: string;
  storageNote?: string;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AgentHistorySidebar({
  items,
  activeId,
  open,
  collapsed = false,
  loading = false,
  label = "对话历史",
  storageNote = "对话仅保存在当前浏览器",
  onNew,
  onSelect,
  onDelete,
}: AgentHistorySidebarProps) {
  return (
    <aside
      className={cn(
        "absolute inset-y-0 left-0 z-20 flex w-[218px] flex-col border-r border-border/70 bg-[#fcfbf9] transition-transform sm:static sm:z-auto sm:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        collapsed && "sm:hidden"
      )}
    >
      <div className="border-b border-border/60 p-3">
        <button
          type="button"
          onClick={onNew}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-[11px] font-bold text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <MessageSquarePlus className="h-4 w-4" />
          新建对话
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="mb-2 flex items-center justify-between px-2 pt-1">
          <span className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">{items.length}</span>
        </div>
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg border transition-colors",
                activeId === item.id
                  ? "border-primary/20 bg-white shadow-sm"
                  : "border-transparent hover:bg-white/80"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                disabled={loading}
                className="flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2.5 text-left disabled:cursor-not-allowed"
              >
                <MessageSquare
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    activeId === item.id ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[8px] text-muted-foreground">
                    {formatTime(item.updatedAt)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                disabled={loading}
                className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-all hover:bg-red-50 hover:text-red-600 disabled:hidden sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`删除对话：${item.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60 px-3 py-2.5 text-[8px] leading-relaxed text-muted-foreground">
        {storageNote}
      </div>
    </aside>
  );
}
