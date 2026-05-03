/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";

type AppContextValue = Record<string, never>;

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const value: AppContextValue = {};

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}
