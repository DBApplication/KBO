import { Link } from "react-router";
import { useUrl } from "@/shared/lib";

/** 이전·다음 페이지 링크. 한 페이지뿐이면 숨긴다. */
export function Pager({ current, pages }: { current: number; pages: number }) {
  const { here } = useUrl();
  if (pages <= 1) return null;
  return (
    <div className="pager">
      {current > 1 ? <Link to={here({ page: current - 1 })}>이전</Link> : null}
      <span>
        {current} / {pages}
      </span>
      {current < pages ? <Link to={here({ page: current + 1 })}>다음</Link> : null}
    </div>
  );
}
