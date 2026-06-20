"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IntroProvider } from "@/lib/intro-context";
import { IntroOverlay } from "@/components/home/intro-overlay";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <IntroProvider>
        <IntroOverlay />
        {children}
      </IntroProvider>
    </QueryClientProvider>
  );
}
