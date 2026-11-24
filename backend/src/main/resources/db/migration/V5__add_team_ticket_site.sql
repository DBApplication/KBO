-- =====================================================================
-- V5: 구단별 예매 페이지
--   예정 경기의 "예매하기" 버튼은 홈팀 구단의 예매 페이지로 연결한다.
--   KBO 경기 목록 API 에는 경기별 예매 주소가 없어서 구단 단위로 둔다.
--   (matches.ticket_url 에 경기별 주소가 있으면 그 주소가 우선)
--   team 행보다 먼저 만들어질 수 있는 기준 데이터라 team.code 로 연결한다.
-- =====================================================================
CREATE TABLE team_ticket_site
(
    team_code VARCHAR(2) PRIMARY KEY,           -- team.code (OB, LG, ...)
    site_name VARCHAR(50)  NOT NULL,            -- 예매처 이름
    url       VARCHAR(500) NOT NULL,
    CONSTRAINT ck_team_ticket_site_url CHECK (url LIKE 'https://%')
);

INSERT INTO team_ticket_site (team_code, site_name, url)
VALUES ('LG', '티켓링크', 'https://www.ticketlink.co.kr/sports'),
       ('KT', '티켓링크', 'https://www.ticketlink.co.kr/sports'),
       ('HT', '티켓링크', 'https://www.ticketlink.co.kr/sports'),
       ('SS', '티켓링크', 'https://www.ticketlink.co.kr/sports'),
       ('HH', '티켓링크', 'https://www.ticketlink.co.kr/sports'),
       ('SK', 'SSG 티켓', 'https://ticket.ssg.com/ticket'),
       ('LT', '자이언츠 티켓', 'https://ticket.giantsclub.com/loginForm.do'),
       ('NC', 'NC 다이노스 티켓', 'https://ticket.ncdinos.com/login'),
       ('OB', 'NOL 티켓', 'https://nol.yanolja.com/ticket/genre/sports/bears'),
       ('WO', 'NOL 티켓', 'https://nol.yanolja.com/ticket/genre/sports/heroes');
