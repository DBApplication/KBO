import type { ReactNode } from "react";

/** 접근성용 표 제목과 가로 스크롤 영역을 갖춘 기록표. */
export function DataTable({
  headers,
  rows,
  caption,
  className,
  rowClassName,
}: {
  headers: ReactNode[];
  rows: ReactNode[][];
  caption: string;
  className?: string;
  rowClassName?: (index: number) => string | undefined;
}) {
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
