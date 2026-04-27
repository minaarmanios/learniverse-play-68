import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <TopBar />
    <main className="flex-1 max-w-md w-full mx-auto px-4 py-4">{children}</main>
    <BottomNav />
  </div>
);
