"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type DashboardHeaderState = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title?: string;
};

type DashboardHeaderContextValue = {
  header: DashboardHeaderState;
  setHeader: (header: DashboardHeaderState) => void;
};

const defaultHeader: DashboardHeaderState = {};

const DashboardHeaderContext = createContext<DashboardHeaderContextValue | null>(null);

export function DashboardHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<DashboardHeaderState>(defaultHeader);
  const value = useMemo(() => ({ header, setHeader }), [header]);

  return <DashboardHeaderContext.Provider value={value}>{children}</DashboardHeaderContext.Provider>;
}

export function useDashboardHeader(header: DashboardHeaderState) {
  const context = useContext(DashboardHeaderContext);
  if (!context) {
    throw new Error("useDashboardHeader must be used within DashboardHeaderProvider");
  }

  const { setHeader } = context;

  useEffect(() => {
    setHeader(header);
    return () => setHeader(defaultHeader);
  }, [setHeader, header]);
}

export function useDashboardHeaderState() {
  const context = useContext(DashboardHeaderContext);
  if (!context) {
    throw new Error("useDashboardHeaderState must be used within DashboardHeaderProvider");
  }

  return context.header;
}
