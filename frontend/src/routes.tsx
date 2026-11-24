import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunction, RouteObject } from "react-router";
import { recordSeasonsQuery, standingSeasonsQuery, teamsQuery } from "./api/queries.ts";
import { Layout, Loading, NotFound, RootError, RouteError } from "./components/Layout.tsx";
import * as Home from "./pages/Home.tsx";
import * as Daily from "./pages/Daily.tsx";
import * as Games from "./pages/Games.tsx";
import * as Game from "./pages/Game.tsx";
import * as Players from "./pages/Players.tsx";
import * as Player from "./pages/Player.tsx";
import * as Teams from "./pages/Teams.tsx";
import * as Compare from "./pages/Compare.tsx";
import * as Search from "./pages/Search.tsx";

/** 화면 모듈: 쿼리 클라이언트를 받아 로더를 만드는 함수 + 화면 컴포넌트. */
interface PageModule {
  loader: (qc: QueryClient) => LoaderFunction;
  default: () => React.ReactNode;
}

/**
 * 화면은 로더가 필요한 쿼리를 캐시에 채운 뒤(ensureQueryData) 그린다. 컴포넌트는 같은 쿼리를
 * useSuspenseQuery 로 읽어 바로 데이터를 얻는다. 응답을 기다리는 동안 다른 화면으로 이동하면
 * 라우터가 늦게 온 결과를 버린다. 주소는 #/players?season=2025 처럼 예전 화면과 같다.
 */
export function createRoutes(qc: QueryClient): RouteObject[] {
  const page = (path: string, mod: PageModule): RouteObject => ({
    path,
    loader: mod.loader(qc),
    Component: mod.default,
  });
  return [
    {
      id: "root",
      path: "/",
      // 팀 목록(필터·팀명)과 시즌 목록은 처음 한 번만 받는다.
      loader: async () => {
        await Promise.all([
          qc.ensureQueryData(teamsQuery()),
          qc.ensureQueryData(standingSeasonsQuery()),
          qc.ensureQueryData(recordSeasonsQuery()),
        ]);
        return null;
      },
      shouldRevalidate: () => false,
      Component: Layout,
      HydrateFallback: Loading,
      ErrorBoundary: RootError,
      children: [
        {
          ErrorBoundary: RouteError,
          children: [
            { index: true, loader: Home.loader(qc), Component: Home.default },
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
}
