import { Link } from "react-router";
import { useUrl } from "@/shared/lib";

const TABS = [
  ["bat", "타자"],
  ["pit", "투수"],
] as const;

/** 타자·투수 탭. 전환하면 이전 종류에 종속된 정렬·비교 조건을 초기화한다. */
export function KindTabs() {
  const { kind, here } = useUrl();
  return (
    <div className="tabs" aria-label="기록 종류">
      {TABS.map(([v, n]) => (
        <Link
          key={v}
          className={"button " + (kind === v ? "active" : "")}
          to={here({ type: v, sort: "", dir: "", page: "", min: "", left: "", right: "" })}
        >
          {n}
        </Link>
      ))}
    </div>
  );
}
