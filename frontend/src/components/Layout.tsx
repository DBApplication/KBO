import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Link,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigation,
  useRevalidator,
} from "react-router";
import { useUrl } from "../hooks.ts";
import { to } from "../lib/query.ts";
import { Empty, NextLink } from "./common.tsx";
import { SearchForm } from "./controls.tsx";

// 상단 메뉴에 보이는 화면. 상세 화면은 소속 메뉴를 강조한다 (경기 상세 → 경기 기록).
const NAV = [
  ["home", "홈"],
  ["games", "경기 기록"],
  ["players", "선수 기록"],
  ["teams", "팀 기록"],
  ["compare", "선수 비교"],
] as const;
const NAV_PARENT: Record<string, string> = { game: "games", player: "players", daily: "home" };
const TITLES: Record<string, string> = {
  ...Object.fromEntries(NAV),
  game: "경기 상세",
  player: "선수 상세",
  daily: "일별 선수 기록",
  search: "검색",
};

/** 주소 첫 단계로 화면 이름을 정한다 ("/" 는 홈). */
function pageOf(pathname: string): string {
  return pathname.replace(/^\//, "").split("/")[0] || "home";
}

/** 로고, 주 메뉴, 통합 검색. 좁은 화면에서는 메뉴 버튼으로 펼친다. */
function Header({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const { get } = useUrl();
  const current = NAV_PARENT[page] || page;
  return (
    <header>
      <div className="wrap topbar">
        <Link className="brand" to={to("home")}>
          DIAMOND <span>/ KBO</span>
        </Link>
        <button
          className="menu-button"
          aria-controls="site-nav"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          메뉴
        </button>
        <nav id="site-nav" aria-label="주 메뉴">
          {NAV.map(([key, label]) => (
            <Link key={key} to={to(key)} aria-current={key === current ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <SearchForm
          scope="global"
          value={page === "search" ? get("q") : ""}
          placeholder="선수 또는 팀 검색"
        />
      </div>
    </header>
  );
}

/** 모든 화면이 공유하는 틀: 본문 바로가기, 머리글, 본문, 바닥글. */
function Shell({
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
          <strong>
            DIAMOND <span>/ KBO</span>
          </strong>
          <span>KBO 경기 · 선수 · 팀 기록</span>
        </div>
      </footer>
    </>
  );
}

/** 루트 화면. 응답을 기다리는 동안에는 이전 화면을 그대로 두고 aria-busy 로 알린다. */
export function Layout() {
  const location = useLocation();
  const navigation = useNavigation();
  const page = pageOf(location.pathname);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    document.title = (TITLES[page] || "페이지 없음") + " · DIAMOND / KBO";
  }, [page]);

  // 첫 화면이 아니면 이동한 화면의 본문으로 포커스를 옮겨 스크린 리더가 새 내용을 읽게 한다.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.key]);

  return (
    <Shell busy={navigation.state === "loading"} mainRef={mainRef}>
      <Outlet />
      {/* 뒤로·앞으로 이동하면 그 화면의 스크롤 위치를 복원한다 (데이터를 받은 뒤 그려진 화면 기준) */}
      <ScrollRestoration />
    </Shell>
  );
}

/** 백엔드 응답 실패 안내와 다시 시도 버튼. */
function LoadError() {
  const revalidator = useRevalidator();
  return (
    <div className="wrap">
      <Empty
        title="기록을 불러오지 못했습니다."
        sub="백엔드 서버(localhost:8080)가 켜져 있는지 확인해 주세요."
      >
        <button onClick={() => revalidator.revalidate()}>다시 시도</button>
      </Empty>
    </div>
  );
}

/** 화면 데이터 조회에 실패했을 때 (머리글은 그대로 둔다). */
export function RouteError() {
  return <LoadError />;
}

/** 첫 화면 전에 받는 팀·시즌 목록 조회에 실패했을 때. */
export function RootError() {
  return (
    <Shell>
      <LoadError />
    </Shell>
  );
}

/** 첫 화면 전에 팀·시즌 목록을 받는 동안. */
export function Loading() {
  return (
    <Shell busy>
      <div className="wrap empty" role="status">
        경기 기록을 불러오는 중입니다…
      </div>
    </Shell>
  );
}

/** 없는 주소. */
export function NotFound() {
  return (
    <div className="wrap">
      <Empty title="페이지를 찾을 수 없습니다.">
        <NextLink to={to("home")}>홈으로</NextLink>
      </Empty>
    </div>
  );
}
