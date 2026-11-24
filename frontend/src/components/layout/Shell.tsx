import { useRef, type ReactNode, type RefObject } from "react";
import { useLocation } from "react-router";
import { pageOf } from "@/utils";
import { Header } from "./Header";

/** 모든 화면이 공유하는 틀: 본문 바로가기, 머리글, 본문, 바닥글. */
export function Shell({
  children,
  busy = false,
  mainRef,
}: {
  children: ReactNode;
  busy?: boolean;
  mainRef?: RefObject<HTMLElement | null>;
}) {
  const location = useLocation();
  const fallbackRef = useRef<HTMLElement>(null);
  const ref = mainRef || fallbackRef;
  return (
    <>
      {/* 해시 라우터에서 #content 로 이동하면 화면 주소가 바뀌므로 포커스만 옮긴다 */}
      <a
        className="skip"
        href="#content"
        onClick={(e) => {
          e.preventDefault();
          ref.current?.focus();
        }}
      >
        본문 바로가기
      </a>
      {/* 화면을 옮길 때마다 메뉴가 닫히도록 주소마다 새로 만든다 */}
      <Header key={location.key} page={pageOf(location.pathname)} />
      <main id="content" tabIndex={-1} ref={ref} aria-busy={busy || undefined}>
        {children}
      </main>
      <footer>
        <div className="wrap">
          <strong>KBO</strong>
          <span>KBO 경기 · 선수 · 팀 기록</span>
        </div>
      </footer>
    </>
  );
}
