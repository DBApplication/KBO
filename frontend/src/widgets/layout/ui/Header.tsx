import { useState } from "react";
import { Link } from "react-router";
import { SearchForm } from "@/features/search";
import { to, useUrl } from "@/shared/lib";
import { NAV, NAV_PARENT } from "./nav";

/** 로고, 주 메뉴, 통합 검색. 좁은 화면에서는 메뉴 버튼으로 펼친다. */
export function Header({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const { get } = useUrl();
  const current = NAV_PARENT[page] || page;
  return (
    <header>
      <div className="wrap topbar">
        <Link className="brand" to={to("home")}>
          DIAMOND <span>/ KBO</span>
        </Link>
        <button
          className="menu-button"
          aria-controls="site-nav"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          메뉴
        </button>
        <nav id="site-nav" aria-label="주 메뉴">
          {NAV.map(([key, label]) => (
            <Link key={key} to={to(key)} aria-current={key === current ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <SearchForm scope="global" value={page === "search" ? get("q") : ""} placeholder="선수 또는 팀 검색" />
      </div>
    </header>
  );
}
