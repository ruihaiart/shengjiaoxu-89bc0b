// ============ core: 数据索引、状态、课程生成、通用组件 ============
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const PAGE_W = 1125, PAGE_H = 768;
const BOXES = window.SJX_BOXES || [];
const DICT = window.SJX_DICT;
const LAWS = window.SJX_LAWS;

// 字 → 出现位置列表
const CHAR_INDEX = (() => {
  const m = {};
  BOXES.forEach((b, i) => {
    const [page, col, c, x, y, w, h] = b;
    (m[c] = m[c] || []).push({ i, page, col, c, x, y, w, h });
  });
  return m;
})();
// 帖中顺序的唯一字
const TEXT_ORDER = (() => {
  const seen = new Set(), out = [];
  BOXES.forEach(b => { if (!seen.has(b[2])) { seen.add(b[2]); out.push(b[2]); } });
  return out;
})();

const pageSrc = p => `assets/rubbing/p${String(p).padStart(2, '0')}.jpg`;
const bookSrc = n => `assets/book/f${String(n).padStart(3, '0')}.jpg`;

// ---------- 日期 ----------
const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dkey(new Date(y, m - 1, d + n)); };
const todayKey = () => dkey(new Date());
const dayDiff = (a, b) => { const p = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 864e5); };
const CN_NUM = '〇一二三四五六七八九十';
const cnNum = n => { if (n <= 10) return CN_NUM[n]; if (n < 20) return '十' + (n % 10 ? CN_NUM[n % 10] : ''); const t = Math.floor(n / 10), u = n % 10; return CN_NUM[t] + '十' + (u ? CN_NUM[u] : ''); };
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

// ---------- 记忆间隔 ----------
const INTERVALS = [1, 2, 4, 7, 15];
const BOX_NAMES = ['初见', '生疏', '渐熟', '熟练', '入帖'];

function newCountFor(minutes) { return Math.max(3, Math.min(9, Math.round(minutes / 8))); }
function stepMinutes(total) {
  // 读 · 析 · 临 · 复
  const r = Math.round(total * 0.12), a = Math.round(total * 0.2), v = Math.round(total * 0.12);
  return { read: r, analyze: a, copy: total - r - a - v, review: v };
}

// ---------- 状态 ----------
const STORE_KEY = 'sjx-state-v1';

function seedState() {
  // 示例进度：6 天前开始，前天缺勤一天
  const t = todayKey();
  const s = { start: addDays(t, -6), lessonIdx: 0, days: {}, cards: {},
    settings: { minutes: 45, script: 'trad', theme: 'night', grid: 'mi' }, demo: true };
  const doneOffsets = [-6, -5, -4, -3, -1];
  doneOffsets.forEach((off, li) => {
    const k = addDays(t, off);
    const plan = buildPlan(s, k);
    plan.steps = { read: true, analyze: true, copy: true, review: true };
    plan.minutes = 38 + ((li * 7) % 14);
    plan.done = true;
    s.days[k] = plan;
    plan.chars.forEach((c, j) => {
      const box = Math.min(4, (doneOffsets.length - li) > 3 ? 2 : (j % 3 === 0 ? 0 : 1));
      s.cards[c] = { box, learned: k, due: addDays(k, INTERVALS[box]), ratings: [box > 0 ? 2 : 0] };
    });
    s.lessonIdx++;
  });
  return s;
}

function lessonLaw(idx) { return LAWS[Math.min(idx, LAWS.length - 1)]; }

function buildPlan(s, k) {
  const law = lessonLaw(s.lessonIdx);
  const learned = new Set(Object.keys(s.cards));
  // 自适应：根据上一课评分调整新字数量
  let n = newCountFor(s.settings.minutes);
  let adapt = '保持';
  const prevKeys = Object.keys(s.days).filter(x => x < k && s.days[x].done).sort();
  const prev = prevKeys.length ? s.days[prevKeys[prevKeys.length - 1]] : null;
  if (prev && prev.chars.length) {
    const rs = prev.chars.map(c => (s.cards[c]?.ratings || []).slice(-1)[0]).filter(v => v != null);
    const avg = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 1;
    if (avg < 0.9) { n = Math.max(3, n - 2); adapt = '减量'; }
    else if (avg > 1.6) { n = Math.min(9, n + 1); adapt = '加量'; }
  }
  const pick = [];
  (law.chars || []).forEach(c => { if (!learned.has(c) && !pick.includes(c) && CHAR_INDEX[c] && pick.length < n) pick.push(c); });
  for (const c of TEXT_ORDER) { if (pick.length >= n) break; if (!learned.has(c) && !pick.includes(c)) pick.push(c); }
  const reviews = Object.entries(s.cards).filter(([c, v]) => v.due <= k).map(([c]) => c).slice(0, 12);
  return { lesson: s.lessonIdx, law: law.n, chars: pick, reviews, steps: {}, minutes: 0, adapt, n, done: false };
}

function useStore() {
  const [s, setS] = useState(() => {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return seedState();
  });
  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }, [s]);
  const update = useCallback(fn => setS(prev => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; }), []);
  // 确保今日计划存在
  const tk = todayKey();
  useEffect(() => { if (!s.days[tk]) update(n => { n.days[tk] = buildPlan(n, tk); }); }, [tk, !!s.days[tk]]);
  return [s, update, setS];
}

function rateCard(n, c, r) {
  const t = todayKey();
  const card = n.cards[c] || { box: 0, learned: t, ratings: [] };
  if (r === 0) card.box = 0; else if (r === 2) card.box = Math.min(4, card.box + 1);
  else card.box = Math.max(1, card.box);
  card.due = addDays(t, INTERVALS[card.box]);
  card.ratings = [...(card.ratings || []), r].slice(-8);
  n.cards[c] = card;
}

function streakOf(s) {
  let k = todayKey(), st = 0;
  if (!s.days[k]?.done) k = addDays(k, -1);
  while (s.days[k]?.done) { st++; k = addDays(k, -1); }
  return st;
}

// ---------- 显示：繁 / 简 ----------
const ScriptCtx = React.createContext('trad');
function useScript() { return React.useContext(ScriptCtx); }
function showChar(c, script) { return script === 'simp' ? (DICT[c]?.[0] || c) : c; }
function showText(t, script) { return script === 'simp' ? [...t].map(c => DICT[c]?.[0] || c).join('') : t; }

// ---------- 单字裁切 ----------
function CharCrop({ occ, c, size = 120, invert = false, grid = 'none', className = '', style = {}, onClick, pad = 0.14 }) {
  const o = occ || (c && CHAR_INDEX[c] && CHAR_INDEX[c][0]);
  if (!o) {
    return <div className={'crop crop-fallback ' + className} style={{ width: size, height: size, ...style }} onClick={onClick}>
      <span style={{ fontSize: size * 0.62 }}>{c}</span>{grid !== 'none' && <GridOverlay kind={grid} />}
    </div>;
  }
  const side = Math.max(o.w, o.h) * (1 + pad * 2);
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  const pct = v => `${v / side * 100}%`;
  return (
    <div className={'crop ' + (invert ? 'is-inv ' : '') + className} style={{ width: size, height: size, ...style }} onClick={onClick}>
      <img src={pageSrc(o.page)} alt={o.c} draggable="false"
        style={{ position: 'absolute', left: pct(-(cx - side / 2)), top: pct(-(cy - side / 2)), width: pct(PAGE_W), height: pct(PAGE_H), maxWidth: 'none' }} />
      {grid !== 'none' && <GridOverlay kind={grid} />}
    </div>
  );
}

function GridOverlay({ kind }) {
  return (
    <svg className="grid-ov" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="0.5" y="0.5" width="99" height="99" fill="none" strokeWidth="0.8" />
      {kind === 'mi' && <>
        <line x1="50" y1="0" x2="50" y2="100" /><line x1="0" y1="50" x2="100" y2="50" />
        <line x1="0" y1="0" x2="100" y2="100" /><line x1="100" y1="0" x2="0" y2="100" />
      </>}
      {kind === 'jiu' && <>
        <line x1="33.3" y1="0" x2="33.3" y2="100" /><line x1="66.6" y1="0" x2="66.6" y2="100" />
        <line x1="0" y1="33.3" x2="100" y2="33.3" /><line x1="0" y1="66.6" x2="100" y2="66.6" />
      </>}
    </svg>
  );
}

// ---------- 笔画示意动画 ----------
function StrokeAnim({ stroke, size = 220, playKey }) {
  const ref = useRef(null);
  const [len, setLen] = useState(400);
  useEffect(() => { if (ref.current) setLen(ref.current.getTotalLength()); }, [stroke]);
  if (!stroke) return null;
  return (
    <div className="stroke-anim" style={{ width: size }}>
      <svg viewBox="0 0 128 128" width={size} height={size} key={playKey}>
        <GridLinesSVG />
        <path d={stroke.d} className="stroke-ghost" />
        <path ref={ref} d={stroke.d} className="stroke-ink" style={{ strokeDasharray: len, strokeDashoffset: len, '--len': len }} />
      </svg>
      <ol className="stroke-phases">
        {stroke.phases.map((p, i) => <li key={i} style={{ animationDelay: `${0.3 + i * 0.75}s` }}><b>{cnNum(i + 1)}</b>{p}</li>)}
      </ol>
    </div>
  );
}
function GridLinesSVG() {
  return <g className="svg-grid">
    <rect x="1" y="1" width="126" height="126" /><line x1="64" y1="0" x2="64" y2="128" /><line x1="0" y1="64" x2="128" y2="64" />
    <line x1="0" y1="0" x2="128" y2="128" /><line x1="128" y1="0" x2="0" y2="128" />
  </g>;
}

// ---------- 小组件 ----------
function Seal({ children, size = 44, className = '' }) {
  return <span className={'seal ' + className} style={{ width: size, height: size, fontSize: size * 0.34 }}>{children}</span>;
}
function Seg({ value, options, onChange, small }) {
  return <div className={'seg' + (small ? ' seg-sm' : '')}>
    {options.map(([v, l]) => <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
  </div>;
}
function Icon({ name, size = 20 }) {
  const p = {
    today: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    browse: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M9 4v16M14 4v16" /></>,
    laws: <><path d="M5 4h10l4 4v12H5z" /><path d="M9 11h6M9 15h6" /></>,
    video: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M10 9.5v5l4.5-2.5z" /></>,
    progress: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    left: <path d="M15 5l-7 7 7 7" />, right: <path d="M9 5l7 7-7 7" />,
    play: <path d="M8 5v14l11-7z" />, check: <path d="M5 12.5l4.5 4.5L19 7" />,
    ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
    timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
  }[name];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

// 视频弹窗
function VideoModal({ video, onClose }) {
  if (!video) return null;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal video-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div><div className="eyebrow">{video.kind} · {video.who}</div><h3>{video.title}</h3></div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="video-frame">
          <iframe src={`https://player.bilibili.com/player.html?bvid=${video.bv}&autoplay=0&high_quality=1`} allowFullScreen scrolling="no" frameBorder="0" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" />
        </div>
        <a className="btn ghost" href={`https://www.bilibili.com/video/${video.bv}/`} target="_blank" rel="noopener">在哔哩哔哩打开 <Icon name="ext" size={16} /></a>
      </div>
    </div>
  );
}

Object.assign(window, {
  PAGE_W, PAGE_H, BOXES, DICT, LAWS, CHAR_INDEX, TEXT_ORDER, pageSrc, bookSrc,
  dkey, addDays, todayKey, dayDiff, cnNum, WEEK, INTERVALS, BOX_NAMES, newCountFor, stepMinutes,
  useStore, buildPlan, rateCard, streakOf, lessonLaw, seedState, STORE_KEY,
  ScriptCtx, useScript, showChar, showText, CharCrop, GridOverlay, StrokeAnim, Seal, Seg, Icon, VideoModal
});
