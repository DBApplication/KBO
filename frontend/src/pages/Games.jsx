import { Link, useLoaderData } from "react-router";
import * as api from "../lib/api.js";
import { displayDate, localToday } from "../lib/format.js";
import { formatStat, shiftDate } from "../lib/records.js";
import { requestQuery, to } from "../lib/query.js";
import { useQuery, useReference } from "../hooks.js";
import {
  Count,
  DataTable,
  Empty,
  ExternalLink,
  Heading,
  NextLink,
  SectionTitle,
} from "../components/common.jsx";
import { DateControl, FilterSelect, TeamSelect } from "../components/controls.jsx";
import { NoGames, gameUrl, statuses } from "./match-shared.jsx";

/** 날짜·팀·경기 상태 조건에 맞는 경기. 조건은 서버(SQL)에서 거른다. */
export async function loader({ request }) {
  const { date, get } = requestQuery(request);
  const filtered = Boolean(get("team") || get("status"));
  const [rows, allDay] = await Promise.all([
    api.matches(date, { teamId: await api.teamId(get("team")), status: get("status") }),
    filtered ? api.matches(date) : null,
  ]);
  return { rows, allDay, filtered };
}

/** 선택 날짜가 속한 주의 월요일부터 일요일까지 날짜 이동 링크. */
function Week() {
  const { date, here } = useQuery();
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  const monday = shiftDate(date, -((day + 6) % 7));
  return (
    <div className="week">
      {Array.from({ length: 7 }, (_, i) => {
        const d = shiftDate(monday, i);
        return (
          <Link key={d} to={here({ date: d })} className={d === date ? "active" : ""}>
            <small>{"월화수목금토일"[i]}</small>
            <b>{Number(d.slice(8))}</b>
          </Link>
        );
      })}
    </div>
  );
}

/** 영상 한 개는 외부 재생 링크로, 여러 개는 경기 상세의 영상 목록으로 연결한다 (서버의 버튼 규칙 actions). */
function HighlightLink({ game: g }) {
  if (g.actions.highlightUrl)
    return <ExternalLink href={g.actions.highlightUrl}>하이라이트</ExternalLink>;
  if (g.actions.highlightList) return <NextLink to={gameUrl(g)}>하이라이트 목록</NextLink>;
  return null;
}

/** 날짜·팀·경기 상태 조건에 맞는 일정을 표시하고 경기 상세로 연결한다. */
export default function Games() {
  const { rows, allDay, filtered } = useLoaderData();
  const { date, get, here } = useQuery();
  const { shortTeam } = useReference();

  let body;
  if (rows.length)
    body = (
      <DataTable
        caption="경기 목록"
        className="matches"
        headers={["시각", "구장", "원정", "점수", "홈", "상태", "기록"]}
        rows={rows.map((g) => [
          g.match_time || "—",
          g.stadium + (Number(g.doubleheader) ? ` · DH${g.doubleheader}` : ""),
          shortTeam(g.away_team_code),
          <strong>
            {formatStat("score", g.away_score)} : {formatStat("score", g.home_score)}
          </strong>,
          shortTeam(g.home_team_code),
          statuses[g.status] || g.status,
          <div className="row-actions">
            <NextLink to={gameUrl(g)}>경기 기록</NextLink>
            <HighlightLink game={g} />
          </div>,
        ])}
      />
    );
  else if (filtered && allDay.length)
    body = (
      <Empty title="조건에 맞는 경기가 없습니다.">
        <NextLink to={to("games", { date })}>필터 초기화</NextLink>
      </Empty>
    );
  else body = <NoGames />;

  return (
    <div className="wrap page">
      <Heading title="경기 기록" sub="날짜별 경기 결과를 확인하세요." />
      <div className="toolbar">
        <div className="controls">
          <DateControl />
          <Link className="button" to={here({ date: localToday() })}>
            오늘
          </Link>
        </div>
        <div className="controls">
          <TeamSelect />
          <FilterSelect
            name="status"
            label="경기 상태"
            selected={get("status")}
            values={[
              ["", "전체 상태"],
              ["FINISHED", "경기 종료"],
              ["CANCELED", "경기 취소"],
            ]}
          />
        </div>
      </div>
      <Week />
      <SectionTitle title={displayDate(date, true) + " 경기"}>
        <Count>{rows.length}경기</Count>
      </SectionTitle>
      {body}
    </div>
  );
}
