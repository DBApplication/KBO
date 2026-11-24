import { useState } from "react";
import { Link } from "react-router";
import { safeLink } from "../lib/records.js";
import { to } from "../lib/query.js";
import { useQuery } from "../hooks.js";

/** 화면 제목과 설명을 표시하고 필요한 경우 오른쪽에 날짜나 시즌 선택기를 배치한다. */
export function Heading({ title, sub, children }) {
  return (
    <div className="heading">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {children}
    </div>
  );
}

/** 구역 제목 옆에 기록 수 또는 전체 보기 링크를 배치한다. */
export function SectionTitle({ title, children }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

/** 구역 제목 옆의 개수 표시. */
export function Count({ children }) {
  return <span className="count">{children}</span>;
}

/** 자료나 검색 결과가 없을 때 표시할 문구와 이동 동작을 구성한다. */
export function Empty({ title, sub, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {sub ? <p>{sub}</p> : null}
      {children}
    </div>
  );
}

/** 다음 화면으로 이동하는 텍스트 링크에 방향 표시를 붙인다. */
export function NextLink({ to: href, children }) {
  return (
    <Link className="textlink" to={href}>
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

/** 유효한 외부 주소를 새 탭에서 여는 링크로 만들고 주소가 없으면 숨긴다. */
export function ExternalLink({ href, children }) {
  const safe = safeLink(href);
  if (!safe) return null;
  return (
    <a className="textlink" href={safe} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}

/** 선수 ID가 확인된 행만 개인 상세로 연결해 동명이인 기록을 잘못 연결하지 않게 한다. */
export function PlayerLink({ id, name, type }) {
  const { season, kind } = useQuery();
  return id ? (
    <Link className="player-link" to={to("player", { id, type: type || kind, season })}>
      {name}
    </Link>
  ) : (
    name
  );
}

/** 선수 사진 영역. 사진이 없거나 로딩에 실패하면 이름 끝 두 글자를 대신 보여 준다. */
export function Photo({ name, src, className = "" }) {
  const [failed, setFailed] = useState(false);
  const url = safeLink(src);
  return (
    <div className={`portrait ${className}`}>
      <span aria-hidden="true">{name?.slice(-2) || "KBO"}</span>
      {url ? (
        <img
          src={url}
          width="94"
          height="118"
          loading="lazy"
          alt={`${name} 선수 사진`}
          hidden={failed}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

/** 머리글과 셀로 접근성용 표 제목과 가로 스크롤 영역을 갖춘 기록표를 만든다. */
export function DataTable({ headers, rows, caption, className, rowClassName }) {
  return (
    <div className="table-scroll">
      <table className={className}>
        <caption className="sr">{caption}</caption>
        <thead>
          <tr>
            {headers.map((n, i) => (
              <th scope="col" key={i}>
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r} className={rowClassName?.(r)}>
              {cells.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
