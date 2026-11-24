import type { ReactNode } from "react";

/** 자료나 검색 결과가 없을 때 표시할 문구와 이동 동작. */
export function Empty({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {sub ? <p>{sub}</p> : null}
      {children}
    </div>
  );
}
