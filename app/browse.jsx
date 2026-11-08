// ============ 全帖浏览 + 单字详情 ============
function BrowsePage({ openChar, s }) {
  const script = useScript();
  const [page, setPage] = useState(() => +(localStorage.getItem('sjx-page') || 1));
  const [hover, setHover] = useState(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [inv, setInv] = useState(false);
  const [zoom, setZoom] = useState(false);
  useEffect(() => { localStorage.setItem('sjx-page', page); }, [page]);
  useEffect(() => {
    const k = e => { if (e.key === 'ArrowLeft') setPage(p => Math.min(30, p + 1)); if (e.key === 'ArrowRight') setPage(p => Math.max(1, p - 1)); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const boxes = useMemo(() => BOXES.map((b, i) => ({ i, page: b[0], col: b[1], c: b[2], x: b[3], y: b[4], w: b[5], h: b[6] })).filter(b => b.page === page), [page]);
  const annotated = boxes.length > 0;
  // 竖排释文（右→左）
  const cols = useMemo(() => { const m = {}; boxes.forEach(b => (m[b.col] = m[b.col] || []).push(b)); return Object.keys(m).sort((a, b) => a - b).map(k => m[k]); }, [boxes]);

  return (
    <div className="browse">
      <div className="browse-bar">
        <div>
          <div className="eyebrow">怀仁集王羲之书 · 大唐三藏圣教序</div>
          <h2>第 {cnNum(page)} 页 <small className="muted">/ 三十</small></h2>
        </div>
        <div className="browse-tools">
          <Seg small value={showBoxes ? 'on' : 'off'} onChange={v => setShowBoxes(v === 'on')} options={[['on', '显示字框'], ['off', '隐藏']]} />
          <Seg small value={inv ? 'w' : 'b'} onChange={v => setInv(v === 'w')} options={[['b', '原拓'], ['w', '反相']]} />
          <button className="btn ghost sm hide-m" onClick={() => setZoom(!zoom)}>{zoom ? '适应宽度' : '放大 2×'}</button>
        </div>
      </div>

      <div className="browse-main">
        <div className={'rub-wrap ' + (zoom ? 'zoom' : '')}>
          <div className={'rub ' + (inv ? 'is-inv' : '')}>
            <img src={pageSrc(page)} alt={`第${page}页`} draggable="false" />
            {showBoxes && boxes.map(b => (
              <button key={b.i} className={'hot ' + (hover === b.i ? 'hv ' : '') + (s.cards[b.c] ? 'learned' : '')}
                style={{ left: `${b.x / PAGE_W * 100}%`, top: `${b.y / PAGE_H * 100}%`, width: `${b.w / PAGE_W * 100}%`, height: `${b.h / PAGE_H * 100}%` }}
                onMouseEnter={() => setHover(b.i)} onMouseLeave={() => setHover(null)}
                onClick={() => openChar(b.c, b.i)} title={b.c} />
            ))}
          </div>
        </div>

        <aside className="shiwen">
          <div className="eyebrow">释文 · {script === 'trad' ? '繁体' : '简体'}{annotated ? '' : '（待标注）'}</div>
          {annotated ? (
            <div className="sw-cols">
              {cols.map((col, ci) => (
                <div key={ci} className="sw-col">
                  {col.map(b => <span key={b.i} className={'sw-c ' + (hover === b.i ? 'hv ' : '') + (s.cards[b.c] ? 'learned' : '')}
                    onMouseEnter={() => setHover(b.i)} onMouseLeave={() => setHover(null)} onClick={() => openChar(b.c, b.i)}>{showChar(b.c, script)}</span>)}
                </div>
              ))}
            </div>
          ) : (
            <div className="sw-pending">
              <p>本页单字坐标与释文尚未标注。原型已完成第 1–3 页共 193 字的切分，其余页面可用同一流程批量处理。</p>
              <p className="muted small">替换为刘铁云藏北宋拓本高清图后，坐标需重新校准。</p>
            </div>
          )}
          {annotated && <div className="sw-legend"><i className="lg-l" /> 已学 <i className="lg-n" /> 未学</div>}
        </aside>
      </div>

      <div className="filmstrip">
        <button className="icon-btn" onClick={() => setPage(Math.min(30, page + 1))} disabled={page === 30}><Icon name="left" /></button>
        <div className="fs-track">
          {Array.from({ length: 30 }, (_, k) => 30 - k).map(p => (
            <button key={p} className={'fs-th ' + (p === page ? 'on' : '')} onClick={() => setPage(p)} ref={el => { if (el && p === page) el.parentNode.scrollLeft = el.offsetLeft - el.parentNode.clientWidth / 2 + 40; }}>
              <img src={pageSrc(p).replace('/rubbing/', '/rubbing/thumb/')} alt="" loading="lazy" /><span>{p}</span>
            </button>
          ))}
        </div>
        <button className="icon-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}><Icon name="right" /></button>
      </div>
      <p className="muted small center">古帖自右向左阅读 · 键盘 ← 下一页 · → 上一页</p>
    </div>
  );
}

// ---------- 单字详情（抽屉） ----------
function CharDrawer({ c, boxIdx, onClose, s, openChar, openVideo, go }) {
  const script = useScript();
  const [inv, setInv] = useState(false);
  const [grid, setGrid] = useState('mi');
  const occs = CHAR_INDEX[c] || [];
  const [oi, setOi] = useState(0);
  useEffect(() => { const j = occs.findIndex(o => o.i === boxIdx); setOi(j >= 0 ? j : 0); }, [c, boxIdx]);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  if (!c) return null;
  const info = DICT[c] || [c, '', ''];
  const occ = occs[oi];
  const laws = LAWS.filter(l => (l.chars || []).includes(c));
  const card = s.cards[c];
  const vids = window.SJX_VIDEOS.filter(v => v.char === c);
  const tip = window.SJX_TIPS[c];
  // 上下文：所在行
  const ctx = occ ? BOXES.map((b, i) => ({ i, c: b[2], page: b[0], col: b[1] })).filter(b => b.page === occ.page && b.col === occ.col) : [];

  return (
    <div className="drawer-back" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()}>
        <button className="icon-btn drawer-x" onClick={onClose}><Icon name="close" /></button>
        <div className="cd-hero">
          <CharCrop occ={occ} c={c} size={300} invert={inv} grid={grid} className="cd-crop" />
          <div className="cd-meta">
            <div className="cd-chars">
              <div><span className="cd-big">{c}</span><em>繁</em></div>
              <div><span className="cd-big simp">{info[0]}</span><em>简</em></div>
            </div>
            <div className="cd-py">{info[1]}</div>
            <div className="cd-def">{info[2]}</div>
            {card ? <div className="cd-status"><Seal size={34}>{BOX_NAMES[card.box].slice(0, 2)}</Seal><span>初学于 {card.learned.slice(5)} · 下次复习 {card.due.slice(5)}</span></div>
              : <div className="cd-status muted">尚未学习</div>}
          </div>
        </div>
        <div className="cd-tools">
          <Seg small value={grid} onChange={setGrid} options={[['mi', '米字格'], ['jiu', '九宫格'], ['none', '无格']]} />
          <Seg small value={inv ? 'w' : 'b'} onChange={v => setInv(v === 'w')} options={[['b', '原拓'], ['w', '反相']]} />
        </div>

        {occs.length > 1 && <section className="cd-sec">
          <h4>帖中同字 · {occs.length} 处</h4>
          <div className="cd-occs">
            {occs.map((o, j) => <button key={j} className={j === oi ? 'on' : ''} onClick={() => setOi(j)}>
              <CharCrop occ={o} size={78} invert={inv} /><span>第{o.page}页 第{o.col + 1}行</span>
            </button>)}
          </div>
          <p className="muted small">集字本中同一字常取自不同原迹，比较其笔势差异是读帖的要点。</p>
        </section>}

        <section className="cd-sec">
          <h4>核心笔画与结构</h4>
          <p className="cd-tip">{tip || '此字要点待补充。可先对照所属「十八法」的通用要领临写。'}</p>
          {laws.length > 0 && <div className="cd-laws">
            {laws.map(l => <button key={l.n} className="chip" onClick={() => { onClose(); go('laws', l.n); }}>{l.n ? `第${cnNum(l.n)}法` : '总纲'} · {l.name}</button>)}
          </div>}
        </section>

        {ctx.length > 0 && <section className="cd-sec">
          <h4>所在行 · 第{occ.page}页 第{occ.col + 1}行</h4>
          <div className="cd-ctx">
            {ctx.map(b => <span key={b.i} className={b.c === c ? 'me' : ''} onClick={() => b.c !== c && openChar(b.c, b.i)}>{showChar(b.c, script)}</span>)}
          </div>
        </section>}

        {vids.length > 0 && <section className="cd-sec">
          <h4>临写视频</h4>
          {vids.map(v => <VideoCard key={v.bv} v={v} onClick={() => openVideo(v)} compact />)}
        </section>}
      </aside>
    </div>
  );
}

Object.assign(window, { BrowsePage, CharDrawer });
