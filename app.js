"use strict";
/* v0 · 인천시청역 교통약자 안내 (설치형 웹앱)
   모든 정보는 station.js에 있고, 역무원 입력·즐겨찾기·의견은 이 폰에만 저장된다. */

const ST = window.STATION;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "v0.incheon-cityhall";
const BOOT = Date.now();
const EMBED = !!window.UHG_EMBED;

const TAG = { site: "공사 홈페이지", confirm: "공사 확인", pub: "공공데이터", todo: "현장 확인 예정", ex: "예시" };
const STATE = { ok: "정상 운행", out: "사용 불가", unknown: "확인 전" };
const FLOOR_IDX = Object.fromEntries(ST.floors.map((f, i) => [f.id, i]));
const P = id => ST.places[id];
const FAC = Object.fromEntries(ST.facilities.map(f => [f.id, f]));
const SPOT = Object.fromEntries(ST.spots.map(s => [s.code, s]));
const LINE = Object.fromEntries(ST.lines.map(l => [l.id, l]));
const tag = s => s && TAG[s] ? `<span class="tag ${s}">${TAG[s]}</span>` : "";

const IC = {
  ev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 3v18M8.5 9.5 10 8l1.5 1.5M12.5 14.5 14 16l1.5-1.5"/></svg>',
  wheel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="3.8" r="1.6"/><path d="M11 7v6h5l2.5 5"/><path d="M8 10.5a5 5 0 1 0 6.5 6.5"/><path d="M4 21h16"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.01"/></svg>',
  okc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.01"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>'
};

/* ---------- 저장 ---------- */
const S = { spot: ST.defaultSpot, fromQR: false, scale: 0, favs: new Set(), log: {}, exCleared: false, alerts: [], feedback: [], mode: "wheel", dest: null, openDetour: null, install: null };
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (SPOT[d.spot]) { S.spot = d.spot; S.fromQR = !!d.fromQR; }
    if ([0, 1, 2].includes(d.scale)) S.scale = d.scale;
    if (Array.isArray(d.favs)) S.favs = new Set(d.favs.filter(id => FAC[id]));
    if (d.log && typeof d.log === "object") S.log = d.log;
    S.exCleared = !!d.exCleared;
    if (Array.isArray(d.alerts)) S.alerts = d.alerts.slice(0, 30);
    if (Array.isArray(d.feedback)) S.feedback = d.feedback.slice(0, 100);
    if (["wheel", "nostairs", "all"].includes(d.mode)) S.mode = d.mode;
  } catch (e) { }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ spot: S.spot, fromQR: S.fromQR, scale: S.scale, favs: [...S.favs], log: S.log, exCleared: S.exCleared, alerts: S.alerts, feedback: S.feedback, mode: S.mode })); } catch (e) { }
}

/* ---------- 상태 ---------- */
function statusOf(id) {
  const e = S.log[id];
  if (e) return { ...e, ex: false };
  if (!S.exCleared) {
    const x = ST.exampleStatus.find(x => x.id === id);
    if (x) return { state: x.state, at: x.minutesAgo != null ? BOOT - x.minutesAgo * 60000 : null, by: x.by, eta: x.eta, ex: true };
  }
  return { state: "unknown", ex: false };
}
const isOut = id => statusOf(id).state === "out";
function ago(t) {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h < 24) return r ? `${h}시간 ${r}분 전` : `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}
const fmtT = t => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const stale = s => s.at && s.state !== "unknown" && Date.now() - s.at > ST.staleHours * 3600000;

function evRow(f, opts = {}) {
  const s = statusOf(f.id);
  const meta = s.at ? `${esc(s.by || "확인")} 확인 · ${fmtT(s.at)} (${ago(s.at)})` : "아직 확인 기록이 없습니다";
  return `<li class="ev">
    <span class="st ${s.state}">${STATE[s.state]}</span>
    <div style="min-width:0">
      <div class="ev-name">${esc(f.name)} ${opts.tags === false ? "" : tag(f.src)}${s.ex ? tag("ex") : ""}</div>
      <div class="ev-sub">${esc(f.span)}</div>
      ${s.state === "out" && s.eta ? `<div class="ev-eta">복구 예정 ${esc(s.eta)}</div>` : ""}
      ${s.memo ? `<div class="ev-sub">${esc(s.memo)}</div>` : ""}
      <div class="ev-meta">${meta}</div>
      ${f.note && opts.note !== false ? `<div class="ev-meta dim">${esc(f.note)}</div>` : ""}
    </div>
    ${stale(s) ? `<div class="stale">확인한 지 ${ST.staleHours}시간이 넘었습니다. 출발 전에 역무실에 전화로 확인해 주세요.</div>` : ""}
    ${opts.tools ? `<div class="ev-tools">${opts.tools}</div>` : ""}
  </li>`;
}

/* ---------- 길 찾기 ---------- */
const MODES = { wheel: { label: "휠체어·유모차", allow: ["ev"] }, nostairs: { label: "계단 없이", allow: ["ev", "es"] }, all: { label: "빠른 길", allow: ["ev", "es", "st"] } };
const COST = { ev: 3, es: 2, st: 2 };
function edges(mode, skip = new Set()) {
  const out = [];
  for (const f of ST.facilities) {
    if (!MODES[mode].allow.includes(f.type) || skip.has(f.id) || isOut(f.id)) continue;
    const s = statusOf(f.id);
    const w = COST[f.type] + (s.state === "unknown" ? 0.4 : 0) + (f.src === "ex" || f.src === "todo" ? 0.3 : 0);
    for (const [a, b, dir] of f.links) {
      out.push({ a, b, f, w });
      if (dir !== "up") out.push({ a: b, b: a, f, w });
    }
  }
  return out;
}
function findPath(from, to, mode, skip) {
  const targets = new Set(Array.isArray(to) ? to : [to]);
  if (targets.has(from)) return { steps: [], cost: 0 };
  const E = edges(mode, skip), dist = { [from]: 0 }, prev = {}, done = new Set();
  while (true) {
    let u = null, best = Infinity;
    for (const k in dist) if (!done.has(k) && dist[k] < best) { best = dist[k]; u = k; }
    if (u === null) return null;
    if (targets.has(u)) { const steps = []; let c = u; while (c !== from) { steps.unshift(prev[c]); c = prev[c].a; } return { steps, cost: best, end: u }; }
    done.add(u);
    for (const e of E) if (e.a === u) { const nd = best + e.w; if (nd < (dist[e.b] ?? Infinity)) { dist[e.b] = nd; prev[e.b] = e; } }
  }
}
function verb(a, b) { const d = FLOOR_IDX[P(b).floor] - FLOOR_IDX[P(a).floor]; return d > 0 ? "내려가기" : d < 0 ? "올라가기" : "이동"; }
const jong = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 : 0; };
const ro = w => { const j = jong(w); return j && j !== 8 ? "으로" : "로"; };
const iga = w => jong(w) ? "이" : "가";
const placeLabel = id => { const p = P(id); return `${p.name}${p.floor !== "1F" ? `(${p.floor})` : ""}`; };

function stepsHTML(from, path, dest) {
  let n = 0, h = `<ol class="steps"><li class="step"><span class="sno">${++n}</span><div><div class="step-text">${esc(SPOT[S.spot]?.place === from ? SPOT[S.spot].label : placeLabel(from))}에서 출발</div></div></li>`;
  for (const e of path.steps) {
    const f = e.f, s = statusOf(f.id), to = P(e.b);
    const how = f.type === "st" ? `${f.name}${ro(f.name)}` : `${f.name} 타고`;
    h += `<li class="step fac"><span class="sno">${++n}</span><div style="min-width:0"><div class="step-text">${esc(how)} ${esc(to.name)}${ro(to.name)} ${verb(e.a, e.b)}</div>
      <div class="step-sub"><span class="floor">${esc(P(e.a).floor)} → ${esc(to.floor)}</span><span class="st ${s.state}" style="min-width:0;padding:2px 8px;font-size:.78rem">${STATE[s.state]}</span>${tag(f.src)}${s.ex ? tag("ex") : ""}</div>
      ${f.note ? `<div class="step-sub">${esc(f.note)}</div>` : ""}</div></li>`;
  }
  const end = P(path.end || from);
  const car = end.line === "L1" ? " · 휠체어 전용공간은 3-1, 6-4 칸" : "";
  h += `<li class="step end"><span class="sno">${++n}</span><div><div class="step-text">${esc(end.name)} 도착</div>${car ? `<div class="step-sub">${esc(car.slice(3))} ${tag("site")}</div>` : ""}</div></li></ol>`;
  return h;
}

/* ---------- 화면 ---------- */
function header() {
  $("#lineChips").innerHTML = ST.lines.map(l => `<span class="lchip"><span class="lno" style="--c:${l.color}">${l.no}</span><span class="lcode">${l.code}</span>${esc(l.name)}</span>`).join("");
  const sp = SPOT[S.spot];
  $("#hereRow").innerHTML = `<span class="muted">지금 위치</span><b>${esc(sp.label)}</b><span class="code">${esc(sp.code)}</span>`;
  $("#hereNote").textContent = S.fromQR ? "QR로 확인한 위치예요" : "예시 위치예요 · 역에 붙은 QR을 찍으면 바뀌어요";
  document.documentElement.dataset.scale = S.scale;
  $("#bigBtn").setAttribute("aria-pressed", S.scale > 0);
  $("#bigBtn").textContent = S.scale === 2 ? "글자 더 크게" : "글자 크게";
}
function footer() {
  $("#foot").innerHTML = `<p>${esc(ST.team)} · ${esc(ST.event)} 시범 페이지 v0 · 인천교통공사 공식 서비스 아님</p>
    <p>출처: ${esc(ST.sources)}</p>
    <p><button class="linkish" type="button" data-go="staff">역무원 입력 화면(시험용)</button></p>`;
}
function backBtn() { return `<button class="back" type="button" data-go="home">${IC.back}인천시청</button>`; }

function renderBanner() {
  const top = S.alerts.find(a => !a.read);
  const b = $("#banner");
  b.hidden = !top;
  if (!top) return;
  const up = top.state !== "out";
  b.className = "banner" + (up ? " up" : "");
  b.setAttribute("role", "alert");
  b.innerHTML = `<div class="banner-ico">${up ? IC.okc : IC.warn}</div><div style="min-width:0"><div class="banner-title">${esc(top.title)}</div><div class="muted">${esc(top.sub || "")}</div></div>
    <div class="banner-actions">${up ? "" : `<button class="btn sm warn" type="button" data-detour="${top.id}">돌아가는 길 보기</button>`}<button class="btn sm" type="button" data-dismiss="${esc(top.key)}">확인</button></div>`;
}

const VIEWS = {};
VIEWS.home = () => {
  const evs = ST.facilities.filter(f => f.type === "ev");
  const rank = f => { const s = statusOf(f.id); return (s.state === "out" ? 0 : 10) + (s.ex || S.log[f.id] ? 0 : 5) + (S.favs.has(f.id) ? -1 : 0); };
  const shown = evs.slice().sort((a, b) => rank(a) - rank(b)).slice(0, 3);
  const anyEx = shown.some(f => statusOf(f.id).ex);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  return `
  <div class="notice-box"><p><b>시범 페이지 v0</b> · ${esc(ST.team.replace(/ 팀$/, " 팀"))}이 만든 시험용 안내입니다. 인천교통공사 공식 서비스가 아니며, 일부 정보는 현장조사(10월 31일) 후 채웁니다.</p>
    <div class="tags">${tag("site")}${tag("confirm")}${tag("todo")}${tag("ex")}</div></div>
  <div class="panel"><div class="panel-head"><h2 class="sec-title">오늘의 엘리베이터</h2>${anyEx ? `<span class="flag">예시 상태 · 실제 운행 아님</span>` : ""}</div>
    <ul class="evs">${shown.map(f => evRow(f, { tags: false, note: false })).join("")}</ul>
    <button class="linkish muted" type="button" data-go="elevator" style="margin-top:6px">엘리베이터 ${evs.length}대 모두 보기</button></div>
  <button class="hub" type="button" data-go="elevator"><span class="ico">${IC.ev}</span><span><span class="hub-title">엘리베이터를 쓸 수 있나요?</span><div class="hub-sub">운행 상태 · 고장일 때 돌아가는 길</div></span><span class="chev">›</span></button>
  <button class="hub" type="button" data-go="wheelchair"><span class="ico">${IC.wheel}</span><span><span class="hub-title">휠체어로 열차 타기</span><div class="hub-sub">안전발판 · 휠체어 전용공간 위치</div></span><span class="chev">›</span></button>
  <button class="hub help" type="button" data-go="help"><span class="ico">${IC.phone}</span><span><span class="hub-title">역무원 도움 요청</span><div class="hub-sub">역무실 바로 전화 · 승하차 동행</div></span><span class="chev">›</span></button>
  <div class="grid2">
    <button class="gbtn" type="button" data-go="route">이동 경로</button>
    <button class="gbtn" type="button" data-go="facility">역 편의시설</button>
    <button class="gbtn" type="button" data-go="exit">역 밖으로</button>
    <button class="gbtn" type="button" data-go="feedback">의견 남기기</button>
  </div>
  ${standalone || EMBED ? "" : installCard()}`;
};
function installCard() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="panel" style="display:grid;gap:8px"><h3>폰에 앱으로 설치</h3>
    ${ios ? `<p class="muted">Safari 아래쪽 <b>공유</b> → <b>홈 화면에 추가</b>를 누르세요. 홈 화면 아이콘으로 열면 알림도 켤 수 있어요.</p>`
      : `<p class="muted">브라우저 메뉴에서 <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르세요. 한 번 설치하면 지하에서 신호가 없어도 열려요.</p>${S.install ? `<div><button class="btn primary" type="button" data-install>지금 설치</button></div>` : ""}`}</div>`;
}

const EV_GROUPS = [
  ["출구 ↔ 대합실", ["EV7", "EV8", "EV9"]],
  ["대합실 ↔ 2호선 승강장", ["EV1", "EV2"]],
  ["2호선 승강장 ↔ 환승홀", ["EVT"]],
  ["환승홀 ↔ 1호선 승강장", ["EV3", "EV4", "EV5", "EV6"]]
];
function detourFor(f) {
  // 이 엘리베이터가 잇던 두 곳을 다른 엘리베이터로 이어 본다
  const pairs = [], seen = new Set();
  for (const [a, b] of f.links) for (const [x, y] of [[a, b], [b, a]]) {
    const k = x + ">" + y; if (seen.has(k)) continue; seen.add(k);
    if (FLOOR_IDX[P(x).floor] > FLOOR_IDX[P(y).floor]) continue; // 위→아래 방향만 대표로
    pairs.push([x, y]);
  }
  const res = [];
  for (const [x, y] of pairs.slice(0, 2)) {
    const skip = new Set([f.id]);
    let p = findPath(x, y, "wheel", skip), via = null;
    if (!p && P(x).exit) {
      // 다른 출구 엘리베이터로 들어가기
      for (const ex of ST.exits) {
        const xid = "X" + ex.no; if (xid === x) continue;
        const q = findPath(xid, y, "wheel", skip);
        if (q && (!p || q.cost < p.cost)) { p = q; via = xid; }
      }
    }
    const es = p ? null : findPath(x, y, "nostairs", skip);
    res.push({ x, y, p, via, es });
  }
  return res;
}
function detourHTML(f) {
  return detourFor(f).map(({ x, y, p, via, es }) => {
    const title = `${placeLabel(x)} → ${placeLabel(y)}`;
    if (p) return `<div class="detour"><div class="detour-title">${esc(title)}</div>${via ? `<p class="muted">지상에서 ${esc(P(via).name)}${ro(P(via).name)} 가서 들어가세요.</p>` : ""}${stepsHTML(via || x, p)}</div>`;
    return `<div class="detour"><div class="detour-title">${esc(title)}</div>
      <div class="alert bad">${IC.warn}<div class="grow"><b>엘리베이터로 갈 수 있는 다른 길이 없어요.</b> 역무원 도움을 요청하세요.</div></div>
      ${es ? `<p class="muted">에스컬레이터를 탈 수 있다면:</p>${stepsHTML(x, es)}` : ""}
      <div><button class="btn sm" type="button" data-go="help">${IC.phone}역무원 도움 요청</button></div></div>`;
  }).join("");
}
VIEWS.elevator = () => {
  const outs = ST.facilities.filter(f => f.type === "ev" && isOut(f.id));
  let h = `${backBtn()}<h2 class="page-title">엘리베이터를 쓸 수 있나요?</h2>
    <p class="lede">역무원이 확인한 시각과 함께 보여줘요. 확인한 지 ${ST.staleHours}시간이 넘었으면 출발 전에 역무실에 전화로 확인하세요.</p>`;
  if (outs.length) h += `<div class="alert bad">${IC.warn}<div class="grow"><b>${outs.map(f => esc(f.name)).join(", ")}</b> 사용 불가. 아래에서 돌아가는 길을 확인하세요.</div></div>`;
  for (const [label, ids] of EV_GROUPS) {
    h += `<div class="group-label">${esc(label)}</div><div class="panel" style="padding-block:6px"><ul class="evs">${ids.map(id => {
      const f = FAC[id], on = S.favs.has(id), out = isOut(id), open = S.openDetour === id || (out && S.openDetour == null);
      const tools = `<button class="btn sm" type="button" data-fav="${id}" aria-pressed="${on}">${IC.bell}${on ? "알림 받는 중" : "고장 나면 알림"}</button>${out ? `<button class="btn sm" type="button" data-toggle-detour="${id}" aria-expanded="${open}">돌아가는 길 ${open ? "접기" : "보기"}</button>` : ""}`;
      return evRow(f, { tools }).replace(/<\/li>$/, "") + (out && open ? `<div style="grid-column:1/-1">${detourHTML(f)}</div>` : "") + "</li>";
    }).join("")}</ul></div>`;
  }
  h += `<p class="muted" style="font-size:.9rem">인천교통공사 누리집의 <a href="${esc(ST.officialFaultPage)}" target="_blank" rel="noopener">승강설비 고장현황</a>도 함께 확인할 수 있어요.</p>`;
  return h;
};

VIEWS.wheelchair = () => {
  const g = ST.transferGuide;
  return `${backBtn()}<h2 class="page-title">휠체어로 열차 타기</h2>
  <div class="panel"><ul class="list">${ST.wheelchair.map(w => `<li><div class="row-title">${w.line ? `<span class="lno" style="--c:${LINE[w.line].color}">${LINE[w.line].no}</span>` : ""}${esc(w.title)} ${tag(w.src)}</div><div class="row-sub" style="color:var(--ink);font-size:1rem">${esc(w.body)}</div>${w.note ? `<div class="row-sub">${esc(w.note)} ${tag("todo")}</div>` : ""}</li>`).join("")}</ul></div>
  <div class="panel"><div class="panel-head"><h3>갈아탈 때 탈 칸·내릴 칸</h3>${tag(g.src)}</div>
    <p class="muted" style="margin-bottom:8px">엘리베이터 2번 · 약 ${g.minutes}분. 인천교통공사 인천시청역 환승 안내 기준이에요.</p>
    <div class="tscroll"><table class="tg"><thead><tr><th>내리는 곳</th><th>내릴 칸</th><th>갈아탈 곳</th><th>탈 칸</th></tr></thead><tbody>
    ${g.rows.map(r => `<tr><td>${esc(P(r.from).name)}</td><td class="mono">${esc(r.off)}</td><td>${esc(P(r.to).name)}</td><td class="mono">${esc(r.on)}</td></tr>${r.warn ? `<tr><td colspan="4" style="color:var(--warn)">${esc(r.warn)}</td></tr>` : ""}`).join("")}
    </tbody></table></div></div>
  <button class="hub help" type="button" data-go="help"><span class="ico">${IC.phone}</span><span><span class="hub-title">안전발판 요청하기</span><div class="hub-sub">역무실에 전화해서 승하차 도움 받기</div></span><span class="chev">›</span></button>`;
};

let helpNeed = "열차 타는 것";
VIEWS.help = () => {
  const sp = SPOT[S.spot];
  const script = `지금 인천시청역 ${sp.label}(${sp.code})에 있어요. ${helpNeed} 도와주세요.`;
  return `${backBtn()}<h2 class="page-title">역무원 도움 요청</h2>
  <div class="panel"><ul class="list" style="display:grid">${ST.help.map(c => `<li class="tel-card"><div style="min-width:0"><div class="tel-name">${esc(c.name)} ${tag(c.src)}</div><div class="tel-num">${esc(c.tel)}</div>${c.sub ? `<div class="row-sub">${esc(c.sub)}</div>` : ""}</div><a class="call" href="tel:${c.tel.replace(/[^0-9]/g, "")}">${IC.phone}전화</a></li>`).join("")}</ul></div>
  <div class="panel" style="display:grid;gap:12px"><h3>전화할 때 이렇게 말하세요</h3>
    <div class="chips" role="group" aria-label="필요한 도움">${["열차 타는 것", "열차에서 내리는 것", "엘리베이터가 멈춰서 이동하는 것", "길 찾는 것"].map(n => `<button class="chip" type="button" data-need="${esc(n)}" aria-pressed="${n === helpNeed}">${esc(n.replace(/ 것$/, ""))}</button>`).join("")}</div>
    <div class="script" id="script">${esc(script)}</div>
    <div><button class="btn" type="button" data-copy="script">${IC.copy}문장 복사</button></div></div>
  <div class="panel"><h3 style="margin-bottom:4px">받을 수 있는 도움</h3><ul class="list">${ST.helpServices.map(s => `<li><div class="row-title">${esc(s.name)} ${tag(s.src)}</div><div class="row-sub">${esc(s.body)}</div></li>`).join("")}</ul></div>`;
};

function destGroups() {
  return [
    ["열차 타기", ["P1G", "P1Y", "P2S", "P2C"]],
    ["역 밖으로", ST.exits.map(e => "X" + e.no)],
    ["역 안", ["CONC", "HALL"]]
  ];
}
VIEWS.route = () => {
  const from = SPOT[S.spot].place;
  let h = `${backBtn()}<h2 class="page-title">이동 경로</h2>
  <p class="lede">출발: <b style="color:var(--ink)">${esc(SPOT[S.spot].label)}</b> <span class="code">${esc(S.spot)}</span></p>
  <div class="seg" role="group" aria-label="이동 방식">${Object.entries(MODES).map(([k, m]) => `<button type="button" data-mode="${k}" aria-pressed="${S.mode === k}">${m.label}</button>`).join("")}</div>`;
  for (const [label, ids] of destGroups()) {
    h += `<div class="group-label">${label}</div><div class="chips">${ids.filter(id => id !== from).map(id => {
      const p = P(id), mark = p.line ? `<span class="lno" style="--c:${LINE[p.line].color};width:1.3rem;height:1.3rem;font-size:.75rem">${LINE[p.line].no}</span>` : "";
      return `<button class="chip" type="button" data-dest="${id}" aria-pressed="${S.dest === id}">${mark}${esc(p.short || p.name)}</button>`;
    }).join("")}</div>`;
  }
  if (S.dest && S.dest !== from) {
    let p = findPath(from, S.dest, S.mode), via = null;
    if (!p && P(from).exit) {
      // 이 출구로는 못 들어가면 다른 출구로 들어가는 길
      for (const ex of ST.exits) { const xid = "X" + ex.no; if (xid === from) continue; const q = findPath(xid, S.dest, S.mode); if (q && (!p || q.cost < p.cost)) { p = q; via = xid; } }
    }
    const outs = ST.facilities.filter(f => isOut(f.id) && MODES[S.mode].allow.includes(f.type));
    h += `<div class="panel" id="routeResult"><div class="panel-head"><h3>${esc(placeLabel(S.dest))}까지</h3><span class="flag">${MODES[S.mode].label}</span></div>`;
    if (outs.length) h += `<div class="alert warn" style="margin-bottom:8px">${IC.info}<div class="grow">멈춘 ${outs.map(f => esc(f.name)).join(", ")}${outs.length > 1 ? "는" : (jong(outs[0].name) ? "은" : "는")} 빼고 안내해요.</div></div>`;
    if (p) {
      if (via) h += `<div class="alert warn" style="margin-bottom:8px">${IC.warn}<div class="grow">${esc(P(from).name)}에서는 ${esc(MODES[S.mode].label)}${ro(MODES[S.mode].label)} 들어갈 수 없어요. 지상에서 <b>${esc(P(via).name)}</b>${ro(P(via).name)} 가서 들어가세요.</div></div>`;
      h += stepsHTML(via || from, p);
      const tg = ST.transferGuide.rows.find(r => r.from === from && r.to === S.dest);
      if (tg) h += `<div class="detour"><div class="detour-title">공사 환승 안내 ${tag(ST.transferGuide.src)}</div><p>내릴 칸 <b class="mono">${esc(tg.off)}</b> → 탈 칸 <b class="mono">${esc(tg.on)}</b> · 약 ${ST.transferGuide.minutes}분</p><p class="muted">${esc(tg.walk)}</p>${tg.warn ? `<p style="color:var(--warn)">${esc(tg.warn)}</p>` : ""}</div>`;
      if (p.steps.some(e => e.f.src === "todo" || e.f.src === "ex")) h += `<p class="muted" style="margin-top:8px;font-size:.9rem">‘현장 확인 예정’·‘예시’ 표시가 있는 시설은 아직 현장에서 확인하지 않았어요.</p>`;
    } else {
      h += `<div class="alert bad">${IC.warn}<div class="grow"><b>${MODES[S.mode].label}${ro(MODES[S.mode].label)} 갈 수 있는 길이 없어요.</b> 엘리베이터가 멈췄거나 아직 확인되지 않은 구간이에요. 역무원 도움을 요청하세요.</div></div>
        <div style="margin-top:10px"><button class="btn" type="button" data-go="help">${IC.phone}역무원 도움 요청</button></div>`;
    }
    h += `</div>`;
  }
  return h;
};

VIEWS.facility = () => `${backBtn()}<h2 class="page-title">역 편의시설</h2>
  <p class="lede">인천교통공사 누리집에 나온 시설이에요. 정확한 층과 위치는 현장조사 후 채워요.</p>
  <div class="panel"><ul class="list">${ST.amenities.map(a => `<li><div class="row-title">${esc(a.name)} ${tag(a.src)}</div>${a.where ? `<div class="row-sub">${esc(a.where)}</div>` : `<div class="row-sub">위치 ${tag("todo")}</div>`}</li>`).join("")}</ul></div>
  <div class="panel"><h3 style="margin-bottom:6px">층별 안내 ${tag("site")}</h3><ul class="list">${ST.floors.map(f => `<li class="row-title"><span class="floor">${f.id}</span>${esc(f.name)}</li>`).join("")}</ul></div>`;

VIEWS.exit = () => `${backBtn()}<h2 class="page-title">역 밖으로</h2>
  <p class="lede">출구 9곳. 엘리베이터가 있는 출구는 7번·8번이에요. ${tag("site")}</p>
  <div class="panel"><ul class="list">${ST.exits.map(e => {
    const evs = ST.facilities.filter(f => f.type === "ev" && f.links.some(l => l.includes("X" + e.no)));
    return `<li><div class="row-title"><span class="code">${e.no}</span>${e.no}번 출구 ${evs.map(f => `<span class="st ${statusOf(f.id).state}" style="min-width:0;padding:2px 8px;font-size:.78rem">${esc(f.name.replace("엘리베이터 ", "엘베 "))} ${STATE[statusOf(f.id).state]}</span>${f.src !== "site" ? tag(f.src) : ""}`).join("")}</div>
      <div class="row-sub">${esc(e.near.join(" · "))}</div>
      <div style="margin-top:8px"><button class="btn sm" type="button" data-route-to="X${e.no}">여기로 가는 길</button></div></li>`;
  }).join("")}</ul></div>`;

let fbKind = "엘리베이터";
VIEWS.feedback = () => `${backBtn()}<h2 class="page-title">의견 남기기</h2>
  <p class="lede">불편했던 점이나 틀린 정보를 알려주세요. 지금 위치(${esc(S.spot)})가 함께 저장돼요. 시범 버전이라 이 폰에만 저장돼요.</p>
  <div class="panel" style="display:grid;gap:12px">
    <div class="chips" role="group" aria-label="종류">${["엘리베이터", "길 안내", "정보가 틀려요", "기타"].map(k => `<button class="chip" type="button" data-fbkind="${esc(k)}" aria-pressed="${k === fbKind}">${esc(k)}</button>`).join("")}</div>
    <div class="field"><label for="fbText">내용</label><textarea id="fbText" class="input" placeholder="예: 9번 출구 엘리베이터 버튼이 높아서 누르기 어려워요"></textarea></div>
    <div><button class="btn primary" type="button" data-fb-save>남기기</button></div></div>
  ${S.feedback.length ? `<div class="panel"><div class="panel-head"><h3>남긴 의견 ${S.feedback.length}</h3><button class="btn sm" type="button" data-copy-fb>${IC.copy}모두 복사</button></div><ul class="list">${S.feedback.map(f => `<li><div class="row-sub mono">${fmtT(f.t)} · ${esc(f.spot)} · ${esc(f.kind)}</div><div>${esc(f.text)}</div></li>`).join("")}</ul></div>` : ""}`;

VIEWS.staff = () => {
  const evs = ST.facilities.filter(f => f.type === "ev");
  return `${backBtn()}<h2 class="page-title">역무원 입력 화면 <span class="flag" style="vertical-align:middle">시험용</span></h2>
  <p class="lede">엘리베이터를 확인하면 상태를 눌러 저장하세요. 저장한 시각이 이용자 화면에 함께 보여요. 시범 버전이라 이 폰에만 저장돼요.</p>
  ${S.exCleared ? "" : `<div class="alert info">${IC.info}<div class="grow">지금 화면에는 초안 예시 상태가 섞여 있어요. <button class="linkish" type="button" data-clear-ex>예시 상태 지우기</button></div></div>`}
  ${evs.map(f => {
    const s = statusOf(f.id);
    return `<div class="staff-ev" data-staff="${f.id}"><div><div class="ev-name">${esc(f.name)} ${tag(f.src)}</div><div class="ev-sub">${esc(f.span)}</div>
      <div class="ev-meta">지금: ${STATE[s.state]}${s.at ? ` · ${fmtT(s.at)} (${ago(s.at)})` : ""}${s.ex ? " · 예시" : ""}</div></div>
      <div class="seg" role="group" aria-label="상태">${Object.entries(STATE).map(([k, lab]) => `<button type="button" data-st="${k}" aria-pressed="${s.state === k}">${lab}</button>`).join("")}</div>
      <div class="staff-row"><input class="input" type="time" aria-label="복구 예정 시각" data-eta value="${esc(s.eta || "")}"><select class="input" aria-label="확인한 곳" data-by>${["1호선 역무실", "2호선 역무실", "현장조사 팀"].map(o => `<option${(s.by || "") === o ? " selected" : ""}>${o}</option>`).join("")}</select></div>
      <input class="input" type="text" placeholder="메모 (예: 버튼 고장, 점검 중)" aria-label="메모" data-memo value="${esc(s.ex ? "" : s.memo || "")}">
      <div><button class="btn primary" type="button" data-staff-save="${f.id}">지금 확인한 걸로 저장</button></div></div>`;
  }).join("")}
  <div class="panel" style="display:grid;gap:10px"><div class="panel-head"><h3>위치 QR 만들기</h3>${EMBED ? "" : `<button class="btn sm no-print" type="button" data-print>인쇄</button>`}</div>
    <p class="muted">역 곳곳에 붙일 QR이에요. 앱의 <b>위치 찍기</b>나 폰 카메라로 찍으면 그 위치에서 안내가 시작돼요.</p>
    <div class="qr-grid">${ST.spots.map(s => `<div class="qr-card"><div class="qr-plate">${qrSVG(spotURL(s.code))}</div><div class="qr-label"><span class="code">${s.code}</span>${esc(s.label)}</div>${tag(s.src)}</div>`).join("")}</div></div>`;
};

/* ---------- 라우팅 ---------- */
let view = "home";
function go(v, push = true) {
  if (!VIEWS[v]) v = "home";
  view = v;
  if (push && location.hash !== "#" + v) history.pushState(null, "", v === "home" ? location.pathname : "#" + v);
  render(); window.scrollTo({ top: 0 });
}
function render() {
  header(); renderBanner();
  $("#view").innerHTML = VIEWS[view]();
  stopSpeak();
}

/* ---------- 알림 ---------- */
function pushAlert(f, s) {
  const out = s.state === "out";
  const a = { key: Date.now().toString(36), id: f.id, state: s.state, t: Date.now(), read: false,
    title: out ? `${f.name}${iga(f.name)} 멈췄어요` : `${f.name} ${STATE[s.state]}`, sub: `${f.span}${out && s.eta ? ` · 복구 예정 ${s.eta}` : ""}` };
  S.alerts.unshift(a); S.alerts = S.alerts.slice(0, 30);
  notify(`인천시청역 · ${a.title}`, a.sub);
  try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) { }
}
async function notify(title, body) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker?.getRegistration();
    const o = { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "v0-" + Date.now(), data: { hash: "#elevator" } };
    if (reg) await reg.showNotification(title, o); else new Notification(title, o);
  } catch (e) { }
}

/* ---------- QR ---------- */
function spotURL(code) {
  if (EMBED) return `V0#at=${code}`;
  return location.origin + location.pathname.replace(/index\.html$/, "") + "#at=" + code;
}
function qrSVG(text) {
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(); let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" role="img" aria-label="QR"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
let stream = null, raf = 0, detector = null, busy = false, last = 0;
const cvs = document.createElement("canvas");
let jsqrP = null;
const loadJsQR = () => window.jsQR ? Promise.resolve() : (jsqrP ||= new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/jsQR.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
async function openScanner() {
  $("#scanner").hidden = false;
  const msg = $("#scanMsg");
  if (EMBED) { msg.textContent = "미리보기 링크에서는 카메라를 바로 켤 수 없어요. 아래 ‘사진으로 읽기’를 눌러 QR을 찍어 주세요."; return; }
  if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = "이 브라우저는 카메라를 바로 쓸 수 없어요. ‘사진으로 읽기’를 눌러 주세요."; return; }
  msg.textContent = "카메라를 켜는 중…";
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    const v = $("#scanVideo"); v.srcObject = stream; await v.play();
    msg.textContent = "QR을 찾는 중…";
    if ("BarcodeDetector" in window) { try { if ((await BarcodeDetector.getSupportedFormats()).includes("qr_code")) detector = new BarcodeDetector({ formats: ["qr_code"] }); } catch (e) { detector = null; } }
    if (!detector) await loadJsQR();
    loop();
  } catch (e) { msg.textContent = e?.name === "NotAllowedError" ? "카메라 권한이 꺼져 있어요. 설정에서 허용하거나 ‘사진으로 읽기’를 써 주세요." : "카메라를 켜지 못했어요. ‘사진으로 읽기’를 써 주세요."; }
}
function closeScanner() { cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; $("#scanner").hidden = true; }
async function loop() {
  raf = requestAnimationFrame(loop);
  const v = $("#scanVideo");
  if (busy || !stream || v.readyState < 2 || performance.now() - last < 160) return;
  busy = true; last = performance.now();
  try {
    let text = null;
    if (detector) { const r = await detector.detect(v); if (r[0]) text = r[0].rawValue; }
    else {
      const k = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight)), w = Math.round(v.videoWidth * k), h = Math.round(v.videoHeight * k);
      cvs.width = w; cvs.height = h; const g = cvs.getContext("2d", { willReadFrequently: true }); g.drawImage(v, 0, 0, w, h);
      const r = window.jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" }); if (r) text = r.data;
    }
    if (text && useCode(text)) closeScanner();
  } catch (e) { }
  busy = false;
}
async function scanPhoto(file) {
  const msg = $("#scanMsg"); msg.textContent = "사진에서 QR을 찾는 중…";
  try {
    const bmp = await createImageBitmap(file); let text = null;
    if ("BarcodeDetector" in window) { try { const r = await new BarcodeDetector({ formats: ["qr_code"] }).detect(bmp); if (r[0]) text = r[0].rawValue; } catch (e) { } }
    if (!text) {
      await loadJsQR();
      for (const max of [1000, 1600, 640]) {
        const k = Math.min(1, max / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
        cvs.width = w; cvs.height = h; const g = cvs.getContext("2d", { willReadFrequently: true }); g.drawImage(bmp, 0, 0, w, h);
        const r = window.jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" }); if (r) { text = r.data; break; }
      }
    }
    if (!text) { msg.textContent = "사진에서 QR을 못 찾았어요. QR이 크게 나오게 다시 찍어 주세요."; return; }
    if (useCode(text)) closeScanner();
  } catch (e) { msg.textContent = "사진을 읽지 못했어요."; }
}
function useCode(text) {
  const m = String(text).match(/#at=([A-Za-z0-9]{1,4})/);
  if (!m || !SPOT[m[1].toUpperCase()]) { $("#scanMsg").textContent = "인천시청역 위치 QR이 아니에요."; return false; }
  setSpot(m[1].toUpperCase(), true); return true;
}
function setSpot(code, fromQR) {
  S.spot = code; S.fromQR = fromQR; S.dest = null; save();
  toast(`지금 위치: ${SPOT[code].label}`);
  try { navigator.vibrate && navigator.vibrate(60); } catch (e) { }
  render();
}

/* ---------- 소리로 듣기 ---------- */
let speaking = false;
function stopSpeak() { try { speechSynthesis.cancel(); } catch (e) { } speaking = false; const b = $("#sayBtn"); if (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "소리로 듣기"; } }
function speak() {
  if (!("speechSynthesis" in window)) { toast("이 기기는 소리로 읽기를 지원하지 않아요"); return; }
  if (speaking) { stopSpeak(); return; }
  const sp = SPOT[S.spot];
  const clone = $("#view").cloneNode(true);
  clone.querySelectorAll(".tag, .flag, svg, .no-print, .qr-grid, .chev").forEach(n => n.remove());
  const body = clone.innerText.replace(/[›→↔]/g, ", ").replace(/\n+/g, ". ").replace(/\s+/g, " ").trim();
  const text = `인천시청역. 지금 위치 ${sp.label}. ${body}`;
  const parts = text.match(/[^.!?。]{1,180}[.!?。]?/g) || [text];
  const voice = speechSynthesis.getVoices().find(v => /ko/i.test(v.lang));
  speaking = true; $("#sayBtn").setAttribute("aria-pressed", "true"); $("#sayBtn").textContent = "읽기 멈추기";
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim()); u.lang = "ko-KR"; u.rate = 0.95; if (voice) u.voice = voice;
    if (i === parts.length - 1) u.onend = () => stopSpeak();
    speechSynthesis.speak(u);
  });
}

/* ---------- 이벤트 ---------- */
let toastT;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600); }
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast("복사했어요"); } catch (e) { toast("복사하지 못했어요. 길게 눌러 선택해 주세요"); } }

document.addEventListener("click", async e => {
  const t = e.target.closest("button, [data-go]"); if (!t) return;
  const d = t.dataset;
  if (d.go) { go(d.go); return; }
  if ("scan" in d) { openScanner(); return; }
  if ("closeScan" in d) { closeScanner(); return; }
  if (d.fav) {
    const on = !S.favs.has(d.fav); on ? S.favs.add(d.fav) : S.favs.delete(d.fav); save();
    if (on && "Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch (err) { } }
    toast(on ? "고장 나면 알려드릴게요" : "알림을 껐어요"); render(); return;
  }
  if (d.toggleDetour) { S.openDetour = S.openDetour === d.toggleDetour ? "" : d.toggleDetour; render(); return; }
  if (d.detour) { S.alerts.forEach(a => { if (a.id === d.detour) a.read = true; }); S.openDetour = d.detour; save(); go("elevator"); return; }
  if (d.dismiss) { const a = S.alerts.find(x => x.key === d.dismiss); if (a) a.read = true; save(); renderBanner(); return; }
  if (d.mode) { S.mode = d.mode; save(); render(); return; }
  if (d.dest) { S.dest = d.dest; render(); const r = $("#routeResult"); if (r) r.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  if (d.routeTo) { S.dest = d.routeTo; go("route"); setTimeout(() => $("#routeResult")?.scrollIntoView({ block: "start" }), 50); return; }
  if (d.need) { helpNeed = d.need; render(); return; }
  if (d.copy === "script") { copyText($("#script").textContent); return; }
  if (d.fbkind) { fbKind = d.fbkind; const txt = $("#fbText")?.value; render(); if (txt) $("#fbText").value = txt; return; }
  if ("fbSave" in d) {
    const text = $("#fbText").value.trim(); if (!text) { toast("내용을 적어 주세요"); return; }
    S.feedback.unshift({ t: Date.now(), spot: S.spot, kind: fbKind, text }); save(); toast("고마워요. 의견을 남겼어요"); render(); return;
  }
  if ("copyFb" in d) { copyText(S.feedback.map(f => `[${fmtT(f.t)} · ${f.spot} · ${f.kind}] ${f.text}`).join("\n")); return; }
  if (d.st) { const box = t.closest("[data-staff]"); box.querySelectorAll("[data-st]").forEach(b => b.setAttribute("aria-pressed", b === t)); return; }
  if (d.staffSave) {
    const id = d.staffSave, box = t.closest("[data-staff]"), f = FAC[id];
    const state = box.querySelector('[data-st][aria-pressed="true"]')?.dataset.st || "unknown";
    const prev = statusOf(id).state;
    const entry = { state, at: Date.now(), by: box.querySelector("[data-by]").value, eta: state === "out" ? box.querySelector("[data-eta]").value : "", memo: box.querySelector("[data-memo]").value.trim() };
    S.log[id] = entry;
    if (S.favs.has(id) && prev !== state) pushAlert(f, entry);
    save(); toast(`${f.name} · ${STATE[state]} 저장했어요`); render(); return;
  }
  if ("clearEx" in d) { S.exCleared = true; save(); toast("예시 상태를 지웠어요"); render(); return; }
  if ("print" in d) { window.print(); return; }
  if ("install" in d && S.install) { S.install.prompt(); S.install = null; render(); return; }
});
$("#bigBtn").addEventListener("click", () => { S.scale = (S.scale + 1) % 3; save(); header(); });
$("#sayBtn").addEventListener("click", speak);
$("#scanPhoto").addEventListener("change", e => { const f = e.target.files?.[0]; if (f) scanPhoto(f).finally(() => e.target.value = ""); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#scanner").hidden) closeScanner(); });
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); S.install = e; if (view === "home") render(); });
function fromHash() {
  const h = location.hash;
  const m = h.match(/^#at=([A-Za-z0-9]{1,4})$/);
  if (m && SPOT[m[1].toUpperCase()]) { history.replaceState(null, "", location.pathname); view = "home"; setSpot(m[1].toUpperCase(), true); return; }
  const v = h.slice(1);
  view = VIEWS[v] ? v : "home"; render();
}
window.addEventListener("popstate", fromHash);

load();
footer();
fromHash();
setInterval(() => { if (document.visibilityState === "visible" && (view === "home" || view === "elevator")) render(); }, 60000);
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost") && !EMBED) {
  navigator.serviceWorker.register("sw.js").catch(() => { });
}
