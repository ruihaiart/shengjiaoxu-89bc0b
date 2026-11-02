// ============ 十八法 · 视频 · 进度 ============
function LawsPage({ s, lawSel, setLawSel, openChar }) {
  const script = useScript();
  const law = LAWS[lawSel] || LAWS[0];
  const cur = s.lessonIdx;
  const [pg, setPg] = useState(0);
  const [play, setPlay] = useState(0);
  useEffect(() => { setPg(0); setPlay(p => p + 1); }, [lawSel]);
  const pages = []; for (let i = law.book[0]; i <= law.book[1]; i++) pages.push(i);
  return (
    <div className="laws">
      <nav className="law-list">
        {['总纲', '笔法', '结构'].map(g => (
          <div key={g} className="ll-group">
            <div className="eyebrow">{g === '总纲' ? '入门' : g + ' · ' + (g === '笔法' ? '一至八' : '九至十八')}</div>
            {LAWS.filter(l => l.type === g).map(l => (
              <button key={l.n} className={'ll-item ' + (l.n === law.n ? 'on ' : '') + (l.n < cur ? 'done ' : '') + (l.n === cur ? 'cur' : '')} onClick={() => setLawSel(l.n)}>
                <span className="ll-n">{l.n === 0 ? '纲' : cnNum(l.n)}</span>
                <span className="ll-name">{l.name}</span>
                <span className="ll-tag">{l.n < cur ? '已学' : l.n === cur ? '今日' : l.sub}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <article className="law-detail">
        <header className="ld-head">
          <div className="ld-num">{law.n === 0 ? '纲' : cnNum(law.n)}</div>
          <div>
            <div className="eyebrow">{law.n === 0 ? '总纲' : `第${cnNum(law.n)}法 · ${law.type} · ${law.sub}`}</div>
            <h2>{law.name}</h2>
          </div>
        </header>
        <p className="gist">{law.gist}</p>
        <div className="ld-grid">
          <div>
            <h4>书写要领</h4>
            <ol className="points">{law.points.map((p, i) => <li key={i}><span className="pt-n">{cnNum(i + 1)}</span><span>{p}</span></li>)}</ol>
            <h4>常见病笔</h4>
            <ul className="fault-list">{law.faults.map((f, i) => <li key={i}>{f}</li>)}</ul>
            {law.stroke && <>
              <h4>运笔示意 <button className="btn ghost sm" onClick={() => setPlay(p => p + 1)}><Icon name="play" size={12} /> 重播</button></h4>
              <StrokeAnim stroke={law.stroke} size={200} playKey={play} />
            </>}
          </div>
          <div>
            <h4>原书图版</h4>
            <div className="book-viewer">
              <img src={law.n === 0 ? 'assets/book/hold.jpg' : bookSrc(pages[pg])} alt="" />
              {law.n > 0 && pages.length > 1 && <div className="bv-nav">
                <button className="icon-btn" disabled={pg === 0} onClick={() => setPg(pg - 1)}><Icon name="left" /></button>
                <span>{pg + 1} / {pages.length}</span>
                <button className="icon-btn" disabled={pg === pages.length - 1} onClick={() => setPg(pg + 1)}><Icon name="right" /></button>
              </div>}
            </div>
          </div>
        </div>
        <h4>帖中范字</h4>
        <div className="ld-chars">
          {law.chars.map(c => (
            <button key={c} className="nc" onClick={() => openChar(c)}>
              <CharCrop c={c} size={92} />
              <span className="nc-lbl">{showChar(c, script)}<em>{DICT[c]?.[1]}</em></span>
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}

function VideoCard({ v, onClick, compact }) {
  const script = useScript();
  return (
    <button className={'vcard ' + (compact ? 'compact' : '')} onClick={onClick}>
      <div className="vthumb">
        <CharCrop c={v.char} size={compact ? 64 : 120} />
        <span className="vplay"><Icon name="play" size={compact ? 14 : 20} /></span>
      </div>
      <div className="vinfo">
        <span className="vkind">{v.kind}</span>
        <b>{v.title}</b>
        <em>{v.who}</em>
      </div>
    </button>
  );
}

function VideosPage({ openVideo }) {
  const [k, setK] = useState('全部');
  const kinds = ['全部', '单字', '临写', '精讲', '读帖'];
  const list = window.SJX_VIDEOS.filter(v => k === '全部' || v.kind === k);
  return (
    <div className="videos">
      <div className="browse-bar">
        <div><div className="eyebrow">精选 · 来自哔哩哔哩</div><h2>视频课</h2></div>
        <Seg small value={k} onChange={setK} options={kinds.map(x => [x, x])} />
      </div>
      <div className="vgrid">{list.map(v => <VideoCard key={v.bv} v={v} onClick={() => openVideo(v)} />)}</div>
      <p className="muted small">视频版权归原作者所有，本站仅做索引与嵌入播放。后续可按单字逐步补齐“一字一视频”。</p>
    </div>
  );
}

// ---------- 进度 ----------
function ProgressPage({ s, update, openChar }) {
  const script = useScript();
  const tk = todayKey();
  const learned = Object.keys(s.cards);
  const total = TEXT_ORDER.length;
  const boxes = [0, 1, 2, 3, 4].map(b => learned.filter(c => s.cards[c].box === b).length);
  const doneDays = Object.values(s.days).filter(d => d.done);
  const totalMin = doneDays.reduce((a, d) => a + (d.minutes || 0), 0);
  // 日历：最近 5 周 + 未来 2 周
  const start = addDays(tk, -((new Date().getDay() + 6) % 7) - 28);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const dueSoon = {}; Object.values(s.cards).forEach(v => { if (v.due > tk) dueSoon[v.due] = (dueSoon[v.due] || 0) + 1; });
  const lawPct = Math.round(s.lessonIdx / (LAWS.length - 1) * 100);
  const daysLeft = LAWS.length - 1 - s.lessonIdx;

  return (
    <div className="progress">
      <div className="pg-stats">
        <div className="stat big"><b>{streakOf(s)}</b><span>连续习字（天）</span></div>
        <div className="stat"><b>{learned.length}<small>/{total}</small></b><span>已学单字（已标注）</span></div>
        <div className="stat"><b>{doneDays.length}</b><span>完成日课</span></div>
        <div className="stat"><b>{Math.floor(totalMin / 60)}<small>时</small>{totalMin % 60}<small>分</small></b><span>累计临池</span></div>
      </div>

      <div className="pg-grid">
        <section className="pg-card cal">
          <h4>习字日历</h4>
          <div className="cal-head">{['一', '二', '三', '四', '五', '六', '日'].map(w => <span key={w}>{w}</span>)}</div>
          <div className="cal-grid">
            {cells.map(k => {
              const d = s.days[k]; const isT = k === tk; const fut = k > tk;
              const lv = d?.done ? (d.minutes >= 45 ? 3 : d.minutes >= 30 ? 2 : 1) : (d && Object.keys(d.steps || {}).length ? 0.5 : 0);
              return <div key={k} className={`cell lv${String(lv).replace('.', '')} ${isT ? 'today' : ''} ${fut ? 'fut' : ''} ${k < s.start ? 'pre' : ''}`} title={k}>
                <span className="cd">{+k.slice(8)}</span>
                {d?.done && <span className="cl">{LAWS[d.law].name.slice(0, 2)}</span>}
                {fut && dueSoon[k] && <span className="cdue">复{dueSoon[k]}</span>}
              </div>;
            })}
          </div>
          <div className="cal-legend"><span><i className="lv1" />少</span><span><i className="lv2" /></span><span><i className="lv3" />足</span><span className="muted">· 未来格显示到期复习数</span></div>
        </section>

        <section className="pg-card">
          <h4>十八法进度</h4>
          <div className="law-track">
            {LAWS.map(l => <div key={l.n} className={'lt ' + (l.n < s.lessonIdx ? 'done' : l.n === s.lessonIdx ? 'cur' : '')} title={l.name}>
              <span>{l.n === 0 ? '纲' : cnNum(l.n)}</span>
            </div>)}
          </div>
          <p className="muted small">已完成 {lawPct}% · 按当前节奏约 {daysLeft} 天学完十八法，之后进入全帖通临阶段。</p>
          <h4 style={{ marginTop: 24 }}>记忆盒</h4>
          <div className="mem-boxes">
            {boxes.map((n, b) => <div key={b} className="mb">
              <div className="mb-bar"><i style={{ height: `${Math.max(4, n / Math.max(1, ...boxes) * 100)}%` }} /></div>
              <b>{n}</b><span>{BOX_NAMES[b]}</span><em>{INTERVALS[b]}天</em>
            </div>)}
          </div>
        </section>

        <section className="pg-card wide">
          <h4>字库 <span className="muted small">— 帖中顺序 · 颜色深浅＝熟练度</span></h4>
          <div className="char-wall">
            {TEXT_ORDER.map(c => { const cd = s.cards[c]; return (
              <button key={c} className={'cw b' + (cd ? cd.box + 1 : 0)} onClick={() => openChar(c)}>{showChar(c, script)}</button>
            ); })}
          </div>
        </section>

        <section className="pg-card wide settings">
          <h4>学习设置</h4>
          <div className="set-row">
            <span>每日时长</span>
            <input type="range" min="15" max="120" step="15" value={s.settings.minutes} onChange={e => update(n => { n.settings.minutes = +e.target.value; delete n.days[tk]; })} />
            <b>{s.settings.minutes} 分钟</b>
            <span className="muted small">≈ 每日 {newCountFor(s.settings.minutes)} 个新字，系统会根据你的自评自动增减</span>
          </div>
          <div className="set-row">
            <span>重置</span>
            <button className="btn ghost sm" onClick={() => { if (confirm('清空全部进度，从第一天开始？')) update(n => { const f = seedState(); Object.keys(n).forEach(k => delete n[k]); Object.assign(n, { start: tk, lessonIdx: 0, days: {}, cards: {}, settings: f.settings }); }); }}>从零开始</button>
            <button className="btn ghost sm" onClick={() => update(n => { const f = seedState(); Object.keys(n).forEach(k => delete n[k]); Object.assign(n, f); })}>载入示例进度</button>
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { LawsPage, VideosPage, VideoCard, ProgressPage });
