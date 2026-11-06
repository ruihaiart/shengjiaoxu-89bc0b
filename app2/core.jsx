// ============ v2 core：数据索引 · 状态 · 通用组件 ============
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const PAGE_W = 1125, PAGE_H = 768;
const BOXES = window.SJX_BOXES || [];
const DICT = (() => { const d = {}; const d2 = window.SJX_DICT2 || {}; Object.keys(d2).forEach(k => d[k] = [d2[k][0], d2[k][1], '']); Object.assign(d, window.SJX_DICT || {}); return d; })();
const AUTO_FROM = window.SJX_AUTO_FROM_PAGE || 99;
// 逐字精讲：按字序找到对应的那一讲
const ZZ = window.SJX_ZHUZI || [];
const zzVideo = z => ({ bv: z[1], p: 1, title: `逐字精讲 第${z[0]}讲：${z[2]}`, dur: `${Math.floor(z[3] / 60)}分钟`, who: '千寻文化 · 1903字逐字精讲' });
function zhuziFor(i) { let r = null; for (const z of ZZ) { if (z[4] <= i) r = z; else break; } return r ? zzVideo(r) : null; }
function zhuziForPage(p) {
  const idx = []; (window.SJX_BOXES || []).forEach((b, i) => { if (b[0] === p) idx.push(i); });
  if (!idx.length) return [];
  const a = idx[0], b = idx[idx.length - 1];
  return ZZ.filter((z, k) => { const end = k + 1 < ZZ.length ? ZZ[k + 1][4] - 1 : 99999; return z[4] <= b && end >= a; }).map(zzVideo);
}
Object.assign(window, { zhuziFor, zhuziForPage, AUTO_FROM });
const LESSONS = window.SJX_LESSONS;

const CHAR_INDEX = (() => {
  const m = {};
  BOXES.forEach((b, i) => { const [page, col, c, x, y, w, h] = b; (m[c] = m[c] || []).push({ i, page, col, c, x, y, w, h }); });
  return m;
})();
const pageSrc = p => `assets/rubbing/p${String(p).padStart(2, '0')}.jpg`;
const bookSrc = n => `assets/book/f${String(n).padStart(3, '0')}.jpg`;
const lessonChars = L => { const s = []; L.variants.forEach(v => v.chars.forEach(c => { if (!s.includes(c)) s.push(c); })); return s; };

// ---------- 日期 ----------
const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dkey(new Date(y, m - 1, d + n)); };
const todayKey = () => dkey(new Date());
const CN = '〇一二三四五六七八九十';
const cnNum = n => n <= 10 ? CN[n] : n < 20 ? '十' + (n % 10 ? CN[n % 10] : '') : CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : '');
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

// ---------- 时间安排 ----------
function schedule(total) {
  const a = Math.max(5, Math.round(total * 0.15)), b = Math.max(5, Math.round(total * 0.2)), d = Math.max(3, Math.round(total * 0.1));
  return [
    { k: 'learn', t: '学', d: '读讲解、看运笔', m: a },
    { k: 'see', t: '看', d: '认形态、读范字', m: b },
    { k: 'write', t: '写', d: '按练习单临写', m: total - a - b - d },
    { k: 'test', t: '测', d: '自测、打卡', m: d },
  ];
}

// ---------- 状态 ----------
const STORE2 = 'sjx-v2';
function blankState() {
  return { start: todayKey(), done: {}, log: {}, checks: {}, settings: { minutes: 45, script: 'trad', theme: 'day' } };
}
function demoState() {
  const t = todayKey(), s = blankState();
  s.start = addDays(t, -7); s.demo = true;
  const plan = [[-7, 0, 1], [-6, 1, 1], [-5, 2, 0], [-4, 2, 1], [-3, 3, 1], [-1, 4, 1]];
  plan.forEach(([off, n, fin]) => {
    const k = addDays(t, off);
    s.log[k] = { lesson: n, minutes: 35 + ((off * -7) % 15), finished: !!fin };
    if (fin) s.done[n] = k;
    const L = LESSONS[n];
    s.checks[n] = { drills: L.drills.map((_, i) => fin || i < 2), check: L.check.map(() => !!fin) };
  });
  return s;
}
const currentLesson = s => { for (const L of LESSONS) if (!s.done[L.n]) return L.n; return LESSONS.length - 1; };
const streakOf = s => { let k = todayKey(), n = 0; if (!s.log[k]) k = addDays(k, -1); while (s.log[k]) { n++; k = addDays(k, -1); } return n; };

function useStore2() {
  const [s, setS] = useState(() => { try { const r = localStorage.getItem(STORE2); if (r) return JSON.parse(r); } catch (e) {} return demoState(); });
  useEffect(() => { localStorage.setItem(STORE2, JSON.stringify(s)); }, [s]);
  const update = useCallback(fn => setS(p => { const n = JSON.parse(JSON.stringify(p)); fn(n); return n; }), []);
  return [s, update];
}

// ---------- 繁简 ----------
const ScriptCtx = React.createContext('trad');
const useScript = () => React.useContext(ScriptCtx);
const showChar = (c, sc) => sc === 'simp' ? (DICT[c]?.[0] || c) : c;

// ---------- 单字裁切（无切图时显示字形占位） ----------
function CharCrop({ occ, c, size = 120, invert = false, grid = 'none', className = '', pad = 0.14 }) {
  const o = occ || (c && CHAR_INDEX[c] && CHAR_INDEX[c][0]);
  if (!o) return (
    <div className={'crop crop-fb ' + className} style={{ width: size, height: size }} title="此字拓本切图待补">
      <span style={{ fontSize: size * 0.56 }}>{c}</span>{grid !== 'none' && <GridOverlay kind={grid} />}
    </div>
  );
  const side = Math.max(o.w, o.h) * (1 + pad * 2), cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  const pct = v => `${v / side * 100}%`;
  return (
    <div className={'crop ' + (invert ? 'is-inv ' : '') + className} style={{ width: size, height: size }}>
      <img src={pageSrc(o.page)} alt={o.c} draggable="false" style={{ position: 'absolute', left: pct(-(cx - side / 2)), top: pct(-(cy - side / 2)), width: pct(PAGE_W), height: pct(PAGE_H), maxWidth: 'none' }} />
      {grid !== 'none' && <GridOverlay kind={grid} />}
    </div>
  );
}
function GridOverlay({ kind }) {
  return <svg className="grid-ov" viewBox="0 0 100 100" preserveAspectRatio="none">
    <rect x="0.5" y="0.5" width="99" height="99" />
    {kind === 'mi' && <><line x1="50" y1="0" x2="50" y2="100" /><line x1="0" y1="50" x2="100" y2="50" /><line x1="0" y1="0" x2="100" y2="100" /><line x1="100" y1="0" x2="0" y2="100" /></>}
    {kind === 'jiu' && <><line x1="33.3" y1="0" x2="33.3" y2="100" /><line x1="66.6" y1="0" x2="66.6" y2="100" /><line x1="0" y1="33.3" x2="100" y2="33.3" /><line x1="0" y1="66.6" x2="100" y2="66.6" /></>}
  </svg>;
}

function StrokeAnim({ stroke, size = 200, playKey }) {
  const ref = useRef(null); const [len, setLen] = useState(400);
  useEffect(() => { if (ref.current) setLen(ref.current.getTotalLength()); }, [stroke]);
  if (!stroke) return null;
  return <div className="stroke-anim">
    <svg viewBox="0 0 128 128" width={size} height={size} key={playKey}>
      <g className="svg-grid"><rect x="1" y="1" width="126" height="126" /><line x1="64" y1="0" x2="64" y2="128" /><line x1="0" y1="64" x2="128" y2="64" /><line x1="0" y1="0" x2="128" y2="128" /><line x1="128" y1="0" x2="0" y2="128" /></g>
      <path d={stroke.d} className="stroke-ghost" />
      <path ref={ref} d={stroke.d} className="stroke-ink" style={{ strokeDasharray: len, strokeDashoffset: len }} />
    </svg>
    <ol className="stroke-phases" key={'p' + playKey}>{stroke.phases.map((p, i) => <li key={i} style={{ animationDelay: `${0.3 + i * 0.75}s` }}><b>{cnNum(i + 1)}</b>{p}</li>)}</ol>
  </div>;
}

function Seal({ children, size = 44 }) { return <span className="seal" style={{ width: size, height: size, fontSize: size * 0.34 }}>{children}</span>; }
function Seg({ value, options, onChange }) {
  return <div className="seg">{options.map(([v, l]) => <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;
}
function Icon({ name, size = 20 }) {
  const p = {
    course: <><path d="M4 5h7v14H4zM13 5h7v14h-7z" /></>,
    tie: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M9 4v16M14 4v16" /></>,
    read: <><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" /><path d="M12 6v13.5" /></>,
    timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
    me: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
    close: <path d="M6 6l12 12M18 6L6 18" />, left: <path d="M15 5l-7 7 7 7" />, right: <path d="M9 5l7 7-7 7" />,
    play: <path d="M8 5v14l11-7z" />, check: <path d="M5 12.5l4.5 4.5L19 7" />, lock: <><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>, search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
    expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  }[name];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

// ---------- 站内视频播放器（哔哩哔哩嵌入，点击后加载） ----------
const biliSrc = v => `https://player.bilibili.com/player.html?bvid=${v.bv}&p=${v.p || 1}&autoplay=1&danmaku=0`;
const biliPage = v => `https://www.bilibili.com/video/${v.bv}/${v.p > 1 ? '?p=' + v.p : ''}`;
function VideoPlayer({ list, title = '视频讲解' }) {
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  useEffect(() => { setI(0); setOn(false); }, [list]);
  if (!list || !list.length) return null;
  const v = list[i];
  return (
    <div className="vp">
      <div className="vp-screen">
        {on ? <iframe key={v.bv + v.p} src={biliSrc(v)} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" scrolling="no" frameBorder="0" />
          : <button className="vp-poster" onClick={() => setOn(true)}>
              <span className="vp-play"><Icon name="play" size={26} /></span>
              <span className="vp-ptitle">{v.title}</span>
              <span className="vp-pmeta">{v.who} · {v.dur}</span>
            </button>}
      </div>
      <div className="vp-meta">
        <div className="vp-now"><span className="eyebrow">{title}</span><b>{v.title}</b><em>{v.who} · {v.dur}</em></div>
        <a className="vp-src" href={biliPage(v)} target="_blank" rel="noopener" title="若无法播放，可在哔哩哔哩打开">来源：哔哩哔哩 <Icon name="ext" size={12} /></a>
      </div>
      {list.length > 1 && <div className="vp-list">
        {list.map((x, j) => <button key={j} className={j === i ? 'on' : ''} onClick={() => { setI(j); setOn(true); }}>
          <span className="vp-li-n">{j === i && on ? <Icon name="play" size={12} /> : j + 1}</span><span className="vp-li-t">{x.title}</span><em>{x.dur}</em>
        </button>)}
      </div>}
    </div>
  );
}

Object.assign(window, { VideoPlayer, biliSrc, biliPage });
Object.assign(window, { PAGE_W, PAGE_H, BOXES, DICT, LESSONS, CHAR_INDEX, pageSrc, bookSrc, lessonChars, dkey, addDays, todayKey, cnNum, WEEK, schedule, STORE2, blankState, demoState, currentLesson, streakOf, useStore2, ScriptCtx, useScript, showChar, CharCrop, GridOverlay, StrokeAnim, Seal, Seg, Icon });
