import type { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return <div className="card card-pad">{children}</div>;
}