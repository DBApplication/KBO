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
