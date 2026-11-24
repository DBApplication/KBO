import { useRevalidator } from "react-router";
import { Empty } from "../Empty";
import { Shell } from "./Shell";

/** 백엔드 응답 실패 안내와 다시 시도 버튼. */
function LoadError() {
  const revalidator = useRevalidator();
  return (
    <div className="wrap">
      <Empty title="기록을 불러오지 못했습니다." sub="백엔드 서버(localhost:8080)가 켜져 있는지 확인해 주세요.">
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
export function AppLoading() {
  return (
    <Shell busy>
      <div className="wrap empty" role="status">
        경기 기록을 불러오는 중입니다…
      </div>
    </Shell>
  );
}
