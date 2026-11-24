/** 화면 표시용 날짜·문자열 변환. */

/** 날짜를 연·월·일과 요일, 또는 구역 제목용 월·일 형식으로 표시한다. */
export function displayDate(value, long = false) {
  const d = new Date(value + "T12:00:00Z");
  return long
    ? `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`
    : value.replaceAll("-", ".") +
        ` (${["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()]})`;
}

/** 브라우저 시간대 기준 오늘 날짜(YYYY-MM-DD). */
export function localToday() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/** 검색 문자열의 유니코드 표기, 공백, 영문 대소문자 차이를 정규화한다. */
function norm(s) {
  return String(s || "")
    .normalize("NFKC")
    .replace(/\s/g, "")
    .toLowerCase();
}

/** 이름이나 팀명에 정규화한 검색어가 포함되는지 확인한다. */
export function includes(value, q) {
  return norm(value).includes(norm(q));
}
