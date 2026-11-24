import type { QueryClient } from "@tanstack/react-query";
import type { RouteObject } from "react-router";
import { recordSeasonsQuery } from "@/entities/record";
import { standingSeasonsQuery } from "@/entities/standing";
import { teamsQuery } from "@/entities/team";
import { ComparePage, compareLoader } from "@/pages/compare";
import { DailyPage, dailyLoader } from "@/pages/daily";
import { GamePage, gameLoader } from "@/pages/game";
import { GamesPage, gamesLoader } from "@/pages/games";
import { HomePage, homeLoader } from "@/pages/home";
import { NotFoundPage } from "@/pages/not-found";
import { PlayerPage, playerLoader } from "@/pages/player";
import { PlayersPage, playersLoader } from "@/pages/players";
import { SearchPage, searchLoader } from "@/pages/search";
import { TeamsPage, teamsLoader } from "@/pages/teams";
import { AppLayout, AppLoading, RootError, RouteError } from "@/widgets/layout";

/**
 * 화면 주소 ↔ 화면. 각 화면의 로더가 필요한 쿼리를 캐시에 채운 뒤(ensureQueryData) 화면을 그리고,
 * 화면 컴포넌트는 같은 쿼리를 useSuspenseQuery 로 읽는다. 응답을 기다리는 동안 다른 화면으로
 * 이동하면 라우터가 늦게 온 결과를 버린다. 주소는 #/players?season=2025 같은 해시 방식이다.
 */
export function createRoutes(qc: QueryClient): RouteObject[] {
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
      Component: AppLayout,
      HydrateFallback: AppLoading,
      ErrorBoundary: RootError,
      children: [
        {
          ErrorBoundary: RouteError,
          children: [
            { index: true, loader: homeLoader(qc), Component: HomePage },
            { path: "home", loader: homeLoader(qc), Component: HomePage },
            { path: "daily", loader: dailyLoader(qc), Component: DailyPage },
            { path: "games", loader: gamesLoader(qc), Component: GamesPage },
            { path: "game", loader: gameLoader(qc), Component: GamePage },
            { path: "players", loader: playersLoader(qc), Component: PlayersPage },
            { path: "player", loader: playerLoader(qc), Component: PlayerPage },
            { path: "teams", loader: teamsLoader(qc), Component: TeamsPage },
            { path: "compare", loader: compareLoader(qc), Component: ComparePage },
            { path: "search", loader: searchLoader(qc), Component: SearchPage },
            { path: "*", Component: NotFoundPage },
          ],
        },
      ],
    },
  ];
}
