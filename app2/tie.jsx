// ============ 字帖（全帖浏览）+ 单字详情 + 我的 ============
function TiePage({ openChar }) {
  const script = useScript();
  const [page, setPage] = useState(() => +(localStorage.getItem('sjx2-page') || 1));
  const [hover, setHover] = useState(null);
  const [inv, setInv] = useState(false);
  const [boxesOn, setBoxesOn] = useState(true);
  const trackRef = useRef(null);
  useEffect(() => { localStorage.setItem('sjx2-page', page); }, [page]);
  useEffect(() => {
    const t = trackRef.current; if (!t) return; const el = t.querySelector('.on');
    if (el) t.scrollTo({ left: el.getBoundingClientRect().left - t.getBoundingClientRect().left + t.scrollLeft - t.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [page]);
  useEffect(() => {
    const k = e => { if (e.key === 'ArrowLeft') setPage(p => Math.min(30, p + 1)); if (e.key === 'ArrowRight') setPage(p => Math.max(1, p - 1)); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const boxes = useMemo(() => BOXES.map((b, i) => ({ i, page: b[0], col: b[1], c: b[2], x: b[3], y: b[4], w: b[5], h: b[6] })).filter(b => b.page === page), [page]);
  const cols = useMemo(() => { const m = {}; boxes.forEach(b => (m[b.col] = m[b.col] || []).push(b)); return Object.keys(m).sort((a, b) => a - b).map(k => m[k]); }, [boxes]);

  return (
    <div className="tie">
      <div className="tie-bar">
        <div><div className="eyebrow">怀仁集王羲之书 · 大唐三藏圣教序</div><h2>第{cnNum(page)}页 <small className="muted">/ 共三十页</small></h2></div>
        <div className="tie-tools">
          <Seg value={inv ? 'w' : 'b'} onChange={v => setInv(v === 'w')} options={[['b', '原拓'], ['w', '黑白反相']]} />
          {boxes.length > 0 && <Seg value={boxesOn ? 1 : 0} onChange={v => setBoxesOn(!!v)} options={[[1, '可点字'], [0, '纯净']]} />}
        </div>
      </div>
      <div className="tie-main">
        <div className="rub-wrap">
          <div className={'rub ' + (inv ? 'is-inv' : '')}>
            <img src={pageSrc(page)} alt="" draggable="false" />
            {boxesOn && boxes.map(b => <button key={b.i} className={'hot ' + (hover === b.i ? 'hv' : '')}
              style={{ left: `${b.x / PAGE_W * 100}%`, top: `${b.y / PAGE_H * 100}%`, width: `${b.w / PAGE_W * 100}%`, height: `${b.h / PAGE_H * 100}%` }}
              onMouseEnter={() => setHover(b.i)} onMouseLeave={() => setHover(null)} onClick={() => openChar(b.c, b.i)} />)}
          </div>
        </div>
        <aside className="shiwen">
          <div className="eyebrow">释文 · {script === 'trad' ? '繁体' : '简体'}</div>
          {boxes.length ? <div className="sw-cols">
            {cols.map((col, ci) => <div key={ci} className="sw-col">{col.map(b => <span key={b.i} className={'sw-c ' + (hover === b.i ? 'hv' : '')} onMouseEnter={() => setHover(b.i)} onMouseLeave={() => setHover(null)} onClick={() => openChar(b.c, b.i)}>{showChar(b.c, script)}</span>)}</div>)}
          </div> : <div className="sw-pending">本页暂无标注。</div>}
          {page >= AUTO_FROM && <p className="muted small sw-note">本页字框已逐行校对。如发现个别切图与字不符，请告诉我页码与行号。</p>}
        </aside>
      </div>
      <div className="filmstrip">
        <button className="icon-btn" onClick={() => setPage(Math.min(30, page + 1))} disabled={page === 30}><Icon name="left" /></button>
        <div className="fs-track" ref={trackRef}>
          {Array.from({ length: 30 }, (_, k) => 30 - k).map(p => <button key={p} className={'fs-th ' + (p === page ? 'on' : '')} onClick={() => setPage(p)}><img src={pageSrc(p)} alt="" loading="lazy" /><span>{p}</span></button>)}
        </div>
        <button className="icon-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}><Icon name="right" /></button>
      </div>
      <p className="muted small center">古帖自右向左读 · 键盘 ← 下一页</p>
      <section className="tie-video">
        <div className="sec-head"><span className="sec-t">视</span><h2>第{cnNum(page)}页 · 逐字讲解</h2><span className="muted">本页文字在以下 {zhuziForPage(page).length} 讲中</span></div>
        <VideoPlayer list={[...zhuziForPage(page), ...(window.SJX_PAGE_VIDEOS[page] || []).filter(v => !v.title.startsWith('逐字精讲')), window.SJX_TONGLIN]} title="本页讲解" />
      </section>
    </div>
  );
}

function CharDrawer({ c, boxIdx, onClose, openChar, openLesson, openJL, goRead }) {
  const script = useScript();
  const [inv, setInv] = useState(false);
  const [grid, setGrid] = useState('mi');
  const occs = CHAR_INDEX[c] || [];
  const [oi, setOi] = useState(0);
  useEffect(() => { const j = occs.findIndex(o => o.i === boxIdx); setOi(j >= 0 ? j : 0); }, [c, boxIdx]);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const info = DICT[c] || [c, '', ''];
  const occ = occs[oi];
  const lessons = LESSONS.filter(L => lessonChars(L).includes(c));
  const tip = window.SJX_TIPS[c];
  const ctx = occ ? BOXES.map((b, i) => ({ i, c: b[2], page: b[0], col: b[1] })).filter(b => b.page === occ.page && b.col === occ.col) : [];
  const q = encodeURIComponent(`圣教序 单字 ${info[0]}`);

  return (
    <div className="drawer-back" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()}>
        <button className="icon-btn drawer-x" onClick={onClose}><Icon name="close" /></button>
        <div className="cd-hero">
          <CharCrop occ={occ} c={c} size={280} invert={inv} grid={grid} className="cd-crop" />
          <div className="cd-meta">
            <div className="cd-chars"><div><span className="cd-big">{c}</span><em>繁</em></div><div><span className="cd-big simp">{info[0]}</span><em>简</em></div></div>
            <div className="cd-py">{info[1]}</div>
            <div className="cd-def">{info[2]}</div>
          </div>
        </div>
        <div className="cd-tools">
          <Seg value={grid} onChange={setGrid} options={[['mi', '米字格'], ['jiu', '九宫格'], ['none', '无格']]} />
          {occ && <Seg value={inv ? 'w' : 'b'} onChange={v => setInv(v === 'w')} options={[['b', '原拓'], ['w', '反相']]} />}
        </div>
        {!occ && <p className="muted small">此字不在《圣教序》帖中，仅作结构参照。</p>}
        {occ && occ.page >= AUTO_FROM && <p className="muted small">第{occ.page}页第{occ.col + 1}行 · 若切图与字不符，请反馈页码与行号。</p>}

        <section className="cd-sec">
          <h4>书写要点</h4>
          <p className="cd-tip">{tip || (lessons[0] ? `参照「${lessons[0].name}」：${lessons[0].kou}` : '要点待补充。')}</p>
          {lessons.length > 0 && <div className="cd-laws">{lessons.map(L => <button key={L.n} className="chip" onClick={() => { onClose(); openLesson(L.n); }}>{L.n ? `第${cnNum(L.n)}法` : '总纲'} · {L.name}</button>)}</div>}
        </section>

        {occs.length > 1 && <section className="cd-sec">
          <h4>帖中同字 · {occs.length} 处写法</h4>
          <div className="cd-occs">{occs.map((o, j) => <button key={j} className={j === oi ? 'on' : ''} onClick={() => setOi(j)}><CharCrop occ={o} size={72} invert={inv} /><span>第{o.page}页</span></button>)}</div>
        </section>}

        {(() => { const k = JL.chars.findIndex(r => r[0] === c); return k >= 0 ? <section className="cd-sec">
          <h4>二十字精临 · 第{cnNum(JL.chars[k][1])}周</h4>
          <p className="cd-tip">「{JL.chars[k][5]}」——{JL.chars[k][3]}，主笔在{JL.chars[k][4]}。</p>
          <button className="chip" onClick={() => { onClose(); openJL(k); }}>去精临这个字 →</button>
        </section> : null; })()}

        {occ && segOf(occ.i) && (() => { const sg = segOf(occ.i); return <section className="cd-sec">
          <h4>它在文章里 · 对读第 {String(sg[0]).padStart(2, '0')} 段</h4>
          <p className="seg-o sm">{(() => { let ci = sg[1]; return [...sg[3]].map((ch, j) => { const isC = ch >= '\u4e00' && ch <= '\u9fff'; const idx = isC ? ci++ : -1; return <span key={j} className={idx === occ.i ? 'hit' : ''}>{script === 'simp' ? (DICT[ch]?.[0] || ch) : ch}</span>; }); })()}</p>
          <p className="seg-y">{sg[4]}</p>
          <button className="chip" onClick={() => { onClose(); goRead(sg[0]); }}>在「读文」中看上下文 →</button>
        </section>; })()}

        {ctx.length > 0 && <section className="cd-sec">
          <h4>所在行 · 第{occ.page}页第{occ.col + 1}行</h4>
          <div className="cd-ctx">{ctx.map(b => <span key={b.i} className={b.c === c ? 'me' : ''} onClick={() => b.c !== c && openChar(b.c, b.i)}>{showChar(b.c, script)}</span>)}</div>
        </section>}

        <section className="cd-sec">
          <h4>临写视频</h4>
          {(() => {
            const list = [];
            if (window.SJX_CHAR_VIDEOS[c]) list.push(window.SJX_CHAR_VIDEOS[c]);
            if (occ) { const z = zhuziFor(occ.i); if (z) list.push({ ...z, title: z.title + '（含本字）' }); }
            if (lessons[0] && window.SJX_LESSON_VIDEOS[lessons[0].n]) list.push(window.SJX_LESSON_VIDEOS[lessons[0].n][0]);
            return list.length ? <VideoPlayer list={list} title={window.SJX_CHAR_VIDEOS[c] ? '本字示范' : '相关讲解'} /> : <p className="muted small">此字的示范视频待补。</p>;
          })()}
        </section>
      </aside>
    </div>
  );
}

function MePage({ s, update, openLesson }) {
  const tk = todayKey();
  const cur = currentLesson(s);
  const start = addDays(tk, -((new Date().getDay() + 6) % 7) - 21);
  const cells = Array.from({ length: 35 }, (_, i) => addDays(start, i));
  const totalMin = Object.values(s.log).reduce((a, l) => a + (l.minutes || 0), 0);
  return (
    <div className="me">
      <div className="me-stats">
        <div className="stat big"><b>{streakOf(s)}</b><span>连续天数</span></div>
        <div className="stat"><b>{Object.keys(s.done).length}<small>/19</small></b><span>已过关课程</span></div>
        <div className="stat"><b>{Object.keys(s.log).length}</b><span>习字天数</span></div>
        <div className="stat"><b>{Math.round(totalMin / 6) / 10}<small>小时</small></b><span>累计练习</span></div>
      </div>
      <div className="me-grid">
        <section className="card">
          <h4>打卡日历</h4>
          <div className="cal-head">{['一', '二', '三', '四', '五', '六', '日'].map(w => <span key={w}>{w}</span>)}</div>
          <div className="cal-grid">{cells.map(k => {
            const l = s.log[k];
            return <div key={k} className={'cell ' + (l ? (l.finished ? 'fin' : 'part') : '') + (k === tk ? ' today' : '') + (k > tk ? ' fut' : '')} onClick={() => l && openLesson(l.lesson)}>
              <span className="cd">{+k.slice(8)}</span>{l && <span className="cl">{LESSONS[l.lesson].name.slice(0, 2)}</span>}
            </div>;
          })}</div>
          <div className="cal-legend"><span><i className="fin" />过关</span><span><i className="part" />练习未过关</span></div>
        </section>
        <section className="card">
          <h4>课程进度</h4>
          <div className="law-track">{LESSONS.map(L => <button key={L.n} className={'lt ' + (s.done[L.n] ? 'done' : L.n === cur ? 'cur' : '')} title={L.name} onClick={() => openLesson(L.n)}>{L.n === 0 ? '纲' : cnNum(L.n)}</button>)}</div>
          <p className="muted small">当前：第{cnNum(cur)}课「{LESSONS[cur].name}」。还剩 {LESSONS.length - Object.keys(s.done).length} 课，之后进入整页通临。</p>
          <h4 style={{ marginTop: 28 }}>设置</h4>
          <div className="set-row"><span>每日时长</span>
            <input type="range" min="20" max="90" step="5" value={s.settings.minutes} onChange={e => update(n => { n.settings.minutes = +e.target.value; })} />
            <b>{s.settings.minutes} 分钟</b></div>
          <p className="muted small">时长只影响每段的建议时间分配，不改变课程内容。</p>
          <div className="set-row">
            <button className="btn ghost sm" onClick={() => { if (confirm('清空进度，从第〇课开始？')) update(n => { const b = blankState(); b.settings = n.settings; Object.keys(n).forEach(k => delete n[k]); Object.assign(n, b); }); }}>从零开始</button>
            <button className="btn ghost sm" onClick={() => update(n => { const d = demoState(); d.settings = n.settings; Object.keys(n).forEach(k => delete n[k]); Object.assign(n, d); })}>载入示例进度</button>
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { TiePage, CharDrawer, MePage });
