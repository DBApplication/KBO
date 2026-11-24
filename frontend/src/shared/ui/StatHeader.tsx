import { Link } from "react-router";
import { useUrl } from "@/shared/lib";

/** 기록표 열 제목을 누르면 해당 지표로 정렬하고, 같은 열을 다시 누르면 방향을 바꾼다. */
export function StatHeader({
  k,
  label,
  sort,
  asc,
  defaultAsc = false,
}: {
  k: string;
  label: string;
  sort: string;
  asc: boolean;
  defaultAsc?: boolean;
}) {
  const { here } = useUrl();
  const active = k === sort;
  return (
    <Link
      className={"sort" + (active ? " selected" : "")}
      to={here({ sort: k, dir: (active ? !asc : defaultAsc) ? "asc" : "desc", page: "" })}
    >
      {label}
      {active ? (asc ? " ↑" : " ↓") : ""}
    </Link>
  );
}
