import type { ReactNode } from "react";

/** 구역 제목. children 은 옆에 두는 기록 수나 전체 보기 링크. */
export function SectionTitle({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

/** 구역 제목 옆의 개수 표시. */
export function Count({ children }: { children: ReactNode }) {
  return <span className="count">{children}</span>;
}
