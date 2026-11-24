import type { ReactNode } from "react";
import { Link } from "react-router";
import { safeLink } from "@/utils";

/** 텍스트 링크는 방향 표시를 붙이고, 버튼은 모양만으로 충분하므로 붙이지 않는다. */
export type LinkVariant = "link" | "button";

/** 다음 화면으로 이동하는 링크. variant="button" 이면 버튼 모양에 화살표 없이 그린다. */
export function NextLink({ to, children, variant = "link" }: { to: string; children: ReactNode; variant?: LinkVariant }) {
  return (
    <Link className={variant === "button" ? "button" : "textlink"} to={to}>
      {children}
      {variant === "link" ? <span aria-hidden="true"> →</span> : null}
    </Link>
  );
}

/** 유효한 외부 주소를 새 탭에서 여는 링크. 주소가 없거나 http(s) 가 아니면 그리지 않는다. */
export function ExternalLink({
  href,
  children,
  variant = "link",
}: {
  href: string | null | undefined;
  children: ReactNode;
  variant?: LinkVariant;
}) {
  const safe = safeLink(href);
  if (!safe) return null;
  return (
    <a className={variant === "button" ? "button" : "textlink"} href={safe} target="_blank" rel="noopener noreferrer">
      {children}
      {variant === "link" ? <span aria-hidden="true"> ↗</span> : null}
    </a>
  );
}
