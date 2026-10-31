/* v0 · 인천시청역 데이터
 *
 * 현장조사 뒤에는 이 파일만 고치면 앱 전체가 바뀌어요.
 * src(출처 표시)는 화면의 태그가 돼요:
 *   site    공사 홈페이지   (인천교통공사 누리집에서 확인)
 *   confirm 공사 확인       (인천교통공사 담당자에게 직접 확인)
 *   pub     공공데이터      (국토교통부 등 공공데이터포털)
 *   todo    현장 확인 예정  (아직 확인 못 함)
 *   ex      예시            (초안용 예시. 실제 아님)
 */
window.STATION = {
  name: "인천시청",
  dataDate: "2026-10-31",
  staleHours: 3, // 확인한 지 이 시간이 넘으면 경고

  lines: [
    { id: "L1", no: "1", code: "I124", name: "인천1호선", color: "#7AA2E3", office: "1호선 역무실", tel: "032-441-3124", src: "site" },
    { id: "L2", no: "2", code: "I221", name: "인천2호선", color: "#F0921E", office: "2호선 역무실", tel: "032-451-4321", src: "site" }
  ],

  floors: [
    { id: "1F", name: "지상" },
    { id: "B1", name: "대합실" },
    { id: "B2", name: "2호선 승강장" },
    { id: "B3", name: "환승홀" },
    { id: "B4", name: "1호선 승강장" }
  ],

  /* 역 안의 장소 */
  places: {
    X1: { name: "1번 출구", floor: "1F", exit: 1 },
    X2: { name: "2번 출구", floor: "1F", exit: 2 },
    X3: { name: "3번 출구", floor: "1F", exit: 3 },
    X4: { name: "4번 출구", floor: "1F", exit: 4 },
    X5: { name: "5번 출구", floor: "1F", exit: 5 },
    X6: { name: "6번 출구", floor: "1F", exit: 6 },
    X7: { name: "7번 출구", floor: "1F", exit: 7 },
    X8: { name: "8번 출구", floor: "1F", exit: 8 },
    X9: { name: "9번 출구", floor: "1F", exit: 9 },
    CONC: { name: "대합실", floor: "B1" },
    P2S: { name: "2호선 석바위시장 방면 승강장", short: "석바위시장 방면", floor: "B2", line: "L2", bound: "검단오류행" },
    P2C: { name: "2호선 석천사거리 방면 승강장", short: "석천사거리 방면", floor: "B2", line: "L2", bound: "운연행" },
    HALL: { name: "환승홀", floor: "B3" },
    P1G: { name: "1호선 간석오거리 방면 승강장", short: "간석오거리 방면", floor: "B4", line: "L1", bound: "계양행" },
    P1Y: { name: "1호선 예술회관 방면 승강장", short: "예술회관 방면", floor: "B4", line: "L1", bound: "송도달빛축제공원행" }
  },

  /* QR을 붙일 위치. code가 QR과 화면에 나와요 */
  spots: [
    { code: "E9", place: "X9", label: "9번 출구 엘리베이터 앞", src: "ex" },
    { code: "E8", place: "X8", label: "8번 출구 엘리베이터 앞", src: "site" },
    { code: "E7", place: "X7", label: "7번 출구 엘리베이터 앞", src: "site" },
    { code: "C1", place: "CONC", label: "대합실 고객센터 앞", src: "todo" },
    { code: "T3", place: "HALL", label: "환승홀", src: "site" },
    { code: "1G", place: "P1G", label: "1호선 간석오거리 방면 승강장", src: "site" },
    { code: "1Y", place: "P1Y", label: "1호선 예술회관 방면 승강장", src: "site" },
    { code: "2S", place: "P2S", label: "2호선 석바위시장 방면 승강장", src: "site" },
    { code: "2C", place: "P2C", label: "2호선 석천사거리 방면 승강장", src: "site" }
  ],
  defaultSpot: "E9",

  /* 이동 시설. links: [출발, 도착, "both"|"up"] — up은 그 방향(출발→도착)으로만 운행
     엘리베이터 호기·구간은 인천교통공사 역정보(인천시청, 2호선) 기준 */
  facilities: [
    { id: "EV1", type: "ev", name: "엘리베이터 1호기", span: "대합실(B1) ↔ 2호선 승강장(B2)", links: [["CONC", "P2S"], ["CONC", "P2C"]], src: "site", note: "어느 방면 승강장과 이어지는지 현장 확인 예정" },
    { id: "EV2", type: "ev", name: "엘리베이터 2호기", span: "대합실(B1) ↔ 2호선 승강장(B2)", links: [["CONC", "P2S"], ["CONC", "P2C"]], src: "site", note: "어느 방면 승강장과 이어지는지 현장 확인 예정" },
    { id: "EV3", type: "ev", name: "엘리베이터 3호기", span: "환승홀(B3) ↔ 1호선 승강장(B4)", links: [["HALL", "P1G"], ["HALL", "P1Y"]], src: "site", note: "방면별 배치 현장 확인 예정" },
    { id: "EV4", type: "ev", name: "엘리베이터 4호기", span: "환승홀(B3) ↔ 1호선 승강장(B4)", links: [["HALL", "P1G"], ["HALL", "P1Y"]], src: "site", note: "방면별 배치 현장 확인 예정" },
    { id: "EV5", type: "ev", name: "엘리베이터 5호기", span: "환승홀(B3) ↔ 1호선 승강장(B4)", links: [["HALL", "P1G"], ["HALL", "P1Y"]], src: "site", note: "방면별 배치 현장 확인 예정" },
    { id: "EV6", type: "ev", name: "엘리베이터 6호기", span: "환승홀(B3) ↔ 1호선 승강장(B4)", links: [["HALL", "P1G"], ["HALL", "P1Y"]], src: "site", note: "방면별 배치 현장 확인 예정" },
    { id: "EV7", type: "ev", name: "엘리베이터 7호기", span: "지상 8번 출구 ↔ 대합실(B1)", links: [["X8", "CONC"]], src: "site" },
    { id: "EV8", type: "ev", name: "엘리베이터 8호기", span: "지상 7번 출구 ↔ 대합실(B1)", links: [["X7", "CONC"]], src: "site" },
    { id: "EVT", type: "ev", name: "2호선 승강장 엘리베이터", span: "2호선 승강장(B2) ↔ 환승홀(B3)", links: [["P2S", "HALL"], ["P2C", "HALL"]], src: "todo", note: "공사 환승 안내에 나오는 엘리베이터. 호기 번호 현장 확인 예정" },
    { id: "EV9", type: "ev", name: "9번 출구 엘리베이터", span: "지상 9번 출구 ↔ 1호선 승강장(B4)", links: [["X9", "P1G"], ["X9", "P1Y"]], src: "ex", note: "초안 예시. 실제 연결 층 현장 확인 예정" },

    { id: "ES1-4", type: "es", name: "에스컬레이터 1~4호기", span: "대합실(B1) ↔ 2호선 승강장(B2)", links: [["CONC", "P2S"], ["CONC", "P2C"]], src: "site" },
    { id: "ES5", type: "es", name: "에스컬레이터 5호기 (계양 방면 상행)", span: "1호선 승강장(B4) → 환승홀(B3)", links: [["P1G", "HALL", "up"]], src: "site" },
    { id: "ES6", type: "es", name: "에스컬레이터 6호기 (송도 방면 상행)", span: "1호선 승강장(B4) → 환승홀(B3)", links: [["P1Y", "HALL", "up"]], src: "site" },
    { id: "ES7-8", type: "es", name: "에스컬레이터 7·8호기 (상행)", span: "환승홀(B3) → 2호선 승강장(B2)", links: [["HALL", "P2S", "up"], ["HALL", "P2C", "up"]], src: "site" },
    { id: "ES9-10", type: "es", name: "에스컬레이터 9·10호기", span: "지상 8번 출구 ↔ 대합실(B1)", links: [["X8", "CONC"]], src: "site" },
    { id: "ES11-12", type: "es", name: "에스컬레이터 11·12호기", span: "지상 7번 출구 ↔ 대합실(B1)", links: [["X7", "CONC"]], src: "site" },

    { id: "ST-X", type: "st", name: "출구 계단", span: "각 출구 ↔ 대합실(B1)", links: [["X1", "CONC"], ["X2", "CONC"], ["X3", "CONC"], ["X4", "CONC"], ["X5", "CONC"], ["X6", "CONC"], ["X7", "CONC"], ["X8", "CONC"], ["X9", "CONC"]], src: "todo" },
    { id: "ST-2", type: "st", name: "2호선 승강장 계단", span: "대합실(B1) ↔ 2호선 승강장(B2)", links: [["CONC", "P2S"], ["CONC", "P2C"]], src: "todo" },
    { id: "ST-T", type: "st", name: "환승 계단", span: "2호선 승강장(B2) ↔ 환승홀(B3) ↔ 1호선 승강장(B4)", links: [["P2S", "HALL"], ["P2C", "HALL"], ["HALL", "P1G"], ["HALL", "P1Y"]], src: "todo" }
  ],

  /* 출구별 주변 (인천교통공사 역정보) */
  exits: [
    { no: 1, near: ["간석1동행정복지센터", "인천예술고등학교"] },
    { no: 2, near: ["간석1동행정복지센터", "인천예술고등학교"] },
    { no: 3, near: ["서해그랑블아파트", "인천시청후문 버스정류장"] },
    { no: 4, near: ["인천시청", "인천시의회", "인천시청후문 버스정류장"] },
    { no: 5, near: ["중앙도서관", "인천시교육청", "인천시청", "인천시의회", "한국방송통신대학교"] },
    { no: 6, near: ["중앙공원"] },
    { no: 7, near: ["중앙공원", "상인천여자중학교", "동인천중학교", "극동·금호아파트 버스정류장"] },
    { no: 8, near: ["중앙공원", "남인천우체국", "극동·금호아파트 버스정류장"] },
    { no: 9, near: ["중앙공원", "주원고개"] }
  ],

  /* 공사 환승 안내 (인천교통공사 인천시청역 환승 동선). 모든 경로 엘리베이터 2회, 약 7분 */
  transferGuide: {
    minutes: 7, src: "site",
    rows: [
      { from: "P1G", to: "P2S", off: "3-1", on: "2-1", walk: "좌측 80m · 5m 직진 · 11시 방향 30m · 120m 직진" },
      { from: "P1G", to: "P2C", off: "3-1", on: "2-1", walk: "좌측 80m · 5m 직진 · 1시 방향 30m · 120m 직진" },
      { from: "P2S", to: "P1G", off: "2-1", on: "6-4", walk: "좌측 120m · 10m 직진 · 우측 30m · 70m 직진" },
      { from: "P2S", to: "P1Y", off: "2-1", on: "3-1", walk: "좌측 120m · 1시 방향 30m · 우측 5m · 70m 직진" },
      { from: "P2C", to: "P1G", off: "2-1", on: "6-4", walk: "우측 120m · 10시 방향 10m · 우측 10m · 70m 직진" },
      { from: "P2C", to: "P1Y", off: "2-1", on: "3-1", walk: "우측 120m · 10시 방향 30m · 우측 5m · 70m 직진" },
      { from: "P1Y", to: "P2S", off: "6-4", on: "2-1", walk: "우측 70m · 10시 방향 10m · 좌측 10m · 120m 직진" },
      { from: "P1Y", to: "P2C", off: "6-4", on: "2-1", walk: "우측 70m · 11시 방향 30m · 80m 직진", warn: "공사 안내 그림에는 '우측 50m · 80m 직진, 승차 1-3'으로 달리 적혀 있어요" }
    ]
  },

  wheelchair: [
    { line: "L1", title: "인천1호선 휠체어 전용공간", body: "8량 열차의 3-1, 6-4 칸 쪽에서 타고 내리세요.", src: "site" },
    { line: "L2", title: "인천2호선 휠체어 전용공간", body: "칸 위치는 현장에서 확인해 채울 예정이에요.", src: "todo" },
    { line: null, title: "안전발판", body: "인천시청역에는 승강장 틈을 덮는 안전발판이 있어요. 필요하면 역무실에 요청하세요.", src: "site", note: "요청 방법과 걸리는 시간은 현장 확인 예정" },
    { line: "L2", title: "2호선 승강장", body: "상대식 승강장이에요. 반대편 승강장으로 건너갈 수 있어요.", src: "site" }
  ],

  help: [
    { name: "1호선 역무실", tel: "032-441-3124", src: "site" },
    { name: "2호선 역무실", tel: "032-451-4321", src: "site" },
    { name: "인천교통약자이동지원센터", tel: "1577-0320", sub: "장애인 콜택시 등 이동 지원", src: "site" },
    { name: "인천교통공사 고객센터", tel: "1899-4446", src: "site" }
  ],
  helpServices: [
    { name: "승하차 동행", body: "역무원이 승강장까지 함께 가고 열차 타는 것을 도와요.", src: "todo" },
    { name: "도착역 마중", body: "내릴 역에 미리 알려 승강장에서 맞이해요.", src: "todo" }
  ],

  amenities: [
    { name: "고객센터", src: "site" },
    { name: "장애인 화장실", src: "site" },
    { name: "화장실 (개찰구 밖)", src: "site" },
    { name: "수유실", src: "site" },
    { name: "전동휠체어 충전설비", src: "site" },
    { name: "휴대폰 충전설비", src: "site" },
    { name: "경사로", where: "대합실 1곳(인천1호선 방향), 7번·8번 출구 외부 엘리베이터 쪽 각 1곳", src: "site" },
    { name: "자전거 보관소", src: "site" },
    { name: "승차권 자동발매기", src: "site" },
    { name: "제세동기 · 비상콜폰", src: "site" }
  ],

  /* 초안의 '오늘의 엘리베이터' 예시 상태. 역무원 입력이 생기면 그 값으로 바뀌어요 */
  exampleStatus: [
    { id: "EV7", state: "ok", by: "2호선 역무실", minutesAgo: 269 },
    { id: "EV9", state: "out", by: "1호선 역무실", minutesAgo: 39, eta: "16:30" },
    { id: "EVT", state: "unknown" }
  ],

  team: "무경계 팀",
  event: "2026 인천지역 공기업 ESG 아이디어 공모전",
  sources: "인천교통공사 홈페이지(역정보, 장애인 편의시설, 인천시청역 환승 동선, 역무실 전화), 국토교통부 철도역 환승 이동경로, 2025 인천교통공사 지속가능경영보고서, 인천교통공사 ESG 담당자 확인",
  officialFaultPage: "https://www.ictr.or.kr/main/railway/guidance/elevator.jsp"
};
