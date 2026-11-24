import type { ReactNode } from "react";

/** 화면 제목과 설명. children 은 오른쪽에 두는 날짜·시즌 선택기. */
export function Heading({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="heading">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {children}
    </div>
  );
}
