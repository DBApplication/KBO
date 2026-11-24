import { useNavigate } from "react-router";
import { useUrl } from "@/hooks";

/** 드롭다운을 바꾸면 그 조건을 주소에 반영하고 첫 페이지로 이동한다. */
export function FilterSelect({
  name,
  label,
  values,
  selected,
}: {
  /** 주소의 쿼리 키 */
  name: string;
  label: string;
  /** [값, 표시명] */
  values: [string, string][];
  selected: string;
}) {
  const { here } = useUrl();
  const navigate = useNavigate();
  return (
    <label className="select">
      <span className="sr">{label}</span>
      <select
        aria-label={label}
        value={selected}
        onChange={(e) => navigate(here({ [name]: e.target.value, page: "" }))}
      >
        {values.map(([v, n]) => (
          <option key={v} value={v}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
