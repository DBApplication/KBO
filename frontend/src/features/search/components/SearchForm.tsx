import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "@/constants";
import { useUrl } from "@/hooks";
import { to } from "@/utils";

/** 검색 폼. local 은 현재 목록의 필터를 유지한 채 검색하고, global 은 통합 검색 화면으로 이동한다. */
export function SearchForm({
  scope,
  value,
  placeholder,
}: {
  scope: "local" | "global";
  value: string;
  placeholder: string;
}) {
  const { here } = useUrl();
  const navigate = useNavigate();
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") || "").trim();
    navigate(scope === "local" ? here({ q, page: "" }) : to(ROUTES.SEARCH, { q }));
  };
  return (
    <form className="search" role="search" onSubmit={submit}>
      {/* key 로 주소의 검색어가 바뀌면 입력란도 그 값으로 다시 맞춘다 */}
      <input
        key={value}
        type="search"
        name="q"
        aria-label={placeholder}
        placeholder={placeholder}
        defaultValue={value}
      />
      <button aria-label="검색">
        <i className="lens" aria-hidden="true" />
      </button>
    </form>
  );
}
