"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type IntroPhase = "hero" | "waterfall" | "app" | "done";

interface IntroCtx {
  phase: IntroPhase;
  advance: () => void;
  skip: () => void;
}

const Ctx = createContext<IntroCtx>({ phase: "hero", advance: () => {}, skip: () => {} });

const ORDER: IntroPhase[] = ["hero", "waterfall", "app", "done"];

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>("hero");
  const advance = useCallback(() => {
    setPhase((p) => {
      const idx = ORDER.indexOf(p);
      return ORDER[Math.min(idx + 1, ORDER.length - 1)];
    });
  }, []);
  const skip = useCallback(() => setPhase("done"), []);
  return <Ctx.Provider value={{ phase, advance, skip }}>{children}</Ctx.Provider>;
}

export function useIntro() {
  return useContext(Ctx);
}
