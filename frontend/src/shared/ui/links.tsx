import type { ReactNode } from "react";
import { Link } from "react-router";
import { safeLink } from "@/shared/lib";

/** 다음 화면으로 이동하는 텍스트 링크에 방향 표시를 붙인다. */
export function NextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="textlink" to={to}>
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

/** 유효한 외부 주소를 새 탭에서 여는 링크. 주소가 없거나 http(s) 가 아니면 그리지 않는다. */
export function ExternalLink({ href, children }: { href: string | null | undefined; children: ReactNode }) {
  const safe = safeLink(href);
  if (!safe) return null;
  return (
    <a className="textlink" href={safe} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}
