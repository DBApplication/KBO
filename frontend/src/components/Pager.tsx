import { Link } from "react-router";
import { useUrl } from "@/hooks";

/** 이전·다음 페이지 링크. 처음·마지막 페이지에서는 비활성으로 두어 위치가 바뀌지 않게 한다. 한 페이지뿐이면 숨긴다. */
export function Pager({ current, pages }: { current: number; pages: number }) {
  const { here } = useUrl();
  if (pages <= 1) return null;
  const step = (page: number, label: string, enabled: boolean) =>
    enabled ? (
      <Link to={here({ page })}>{label}</Link>
    ) : (
      <span className="disabled" aria-disabled="true">
        {label}
      </span>
    );
  return (
    <nav className="pager" aria-label="페이지">
      {step(current - 1, "이전", current > 1)}
      <span className="pager-status" aria-current="page">
        {current} / {pages}
      </span>
      {step(current + 1, "다음", current < pages)}
    </nav>
  );
}
