import { useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation, useNavigation } from "react-router";
import { TITLES } from "@/constants";
import { pageOf } from "@/utils";
import { Shell } from "./Shell";

/** 루트 화면. 응답을 기다리는 동안에는 이전 화면을 그대로 두고 aria-busy 로 알린다. */
export function AppLayout() {
  const location = useLocation();
  const navigation = useNavigation();
  const page = pageOf(location.pathname);
  const mainRef = useRef<HTMLElement>(null);
  // 첫 화면의 주소. 개발 모드(StrictMode)는 effect 를 두 번 실행하므로 "처음인지"를 횟수가 아니라 주소로 판단한다.
  const firstKey = useRef(location.key);
  const busy = navigation.state === "loading";

  useEffect(() => {
    document.title = (TITLES[page] || "페이지 없음") + " · KBO";
  }, [page]);

  // 다른 화면으로 이동했으면 본문으로 포커스를 옮겨 스크린 리더가 새 내용을 읽게 한다.
  useEffect(() => {
    if (location.key !== firstKey.current) mainRef.current?.focus({ preventScroll: true });
  }, [location.key]);

  return (
    <Shell busy={busy} mainRef={mainRef}>
      {/* 응답을 기다리는 동안 화면 맨 위에 진행 표시줄을 보여 준다 */}
      <div className="progress" hidden={!busy} aria-hidden="true" />
      <Outlet />
      {/* 뒤로·앞으로 이동하면 그 화면의 스크롤 위치를 복원한다 (데이터를 받은 뒤 그려진 화면 기준) */}
      <ScrollRestoration />
    </Shell>
  );
}
