import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";

/** 목록에서 들어왔으면 뒤로 가서 필터·스크롤을 그대로 되살리고, 주소로 바로 열었으면 목록으로 이동한다. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <Link
      className="back"
      to={href}
      onClick={(e) => {
        if ((window.history.state as { idx?: number } | null)?.idx) {
          e.preventDefault();
          navigate(-1);
        }
      }}
    >
      {children}
    </Link>
  );
}
