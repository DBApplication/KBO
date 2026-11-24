import { loadReference } from "./lib/api.js";
import { Layout, Loading, NotFound, RootError, RouteError } from "./components/Layout.jsx";
import * as Home from "./pages/Home.jsx";
import * as Daily from "./pages/Daily.jsx";
import * as Games from "./pages/Games.jsx";
import * as Game from "./pages/Game.jsx";
import * as Players from "./pages/Players.jsx";
import * as Player from "./pages/Player.jsx";
import * as Teams from "./pages/Teams.jsx";
import * as Compare from "./pages/Compare.jsx";
import * as Search from "./pages/Search.jsx";

/** 화면 모듈(loader + default 컴포넌트)을 라우트 객체로 바꾼다. */
const page = (path, mod) => ({ path, loader: mod.loader, Component: mod.default });

/**
 * 화면은 로더가 API 응답을 다 받은 뒤에 그린다. 응답을 기다리는 동안 다른 화면으로 이동하면
 * 라우터가 늦게 온 결과를 버린다. 주소는 #/players?season=2025 처럼 예전 화면과 같다.
 */
export const routes = [
  {
    id: "root",
    path: "/",
    // 팀 목록(필터·팀명 표시)과 기록이 있는 시즌 목록은 처음 한 번만 받는다.
    loader: () => loadReference(),
    shouldRevalidate: () => false,
    Component: Layout,
    HydrateFallback: Loading,
    ErrorBoundary: RootError,
    children: [
      {
        ErrorBoundary: RouteError,
        children: [
          { index: true, loader: Home.loader, Component: Home.default },
          page("home", Home),
          page("daily", Daily),
          page("games", Games),
          page("game", Game),
          page("players", Players),
          page("player", Player),
          page("teams", Teams),
          page("compare", Compare),
          page("search", Search),
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
];
