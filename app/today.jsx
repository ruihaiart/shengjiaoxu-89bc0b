// ============ 今日学习 ============
const STEPS = [
  { k: 'read', t: '读', d: '读帖 · 知识点' },
  { k: 'analyze', t: '析', d: '笔画拆解' },
  { k: 'copy', t: '临', d: '对格临写' },
  { k: 'review', t: '复', d: '间隔复习' },
];

function TodayPage({ s, update, openChar, openVideo, go }) {
  const script = useScript();
  const tk = todayKey();
  const plan = s.days[tk];
  const [step, setStep] = useState(() => localStorage.getItem('sjx-step') || 'read');
  useEffect(() => { localStorage.setItem('sjx-step', step); }, [step]);
  if (!plan) return <div className="page-pad">正在生成今日计划…</div>;
  const law = LAWS[plan.law];
  const mins = stepMinutes(s.settings.minutes);
  const dayNo = dayDiff(s.start, tk) + 1;
  const doneCount = STEPS.filter(x => plan.steps[x.k]).length;
  const quote = window.SJX_QUOTES[dayNo % window.SJX_QUOTES.length];
  const d = new Date();

  const markStep = k => update(n => {
    const p = n.days[tk]; p.steps[k] = true;
    p.minutes = Math.max(p.minutes, Math.round(n.settings.minutes * STEPS.filter(x => p.steps[x.k]).length / 4));
    if (STEPS.every(x => p.steps[x.k]) && !p.done) {
      p.done = true;
      p.chars.forEach(c => { if (!n.cards[c]) rateCard(n, c, 1); });
      n.lessonIdx = Math.min(n.lessonIdx + 1, LAWS.length - 1);
    }
  });
  const nextStep = k => { markStep(k); const i = STEPS.findIndex(x => x.k === k); if (i < 3) { setStep(STEPS[i + 1].k); window.scrollTo({ top: 0, behavior: 'smooth' }); } };

  return (
    <div className="today">
      <header className="today-head">
        <div className="today-date">
          <span className="date-big">{d.getMonth() + 1}<small>月</small>{d.getDate()}<small>日</small></span>
          <span className="date-sub">星期{WEEK[d.getDay()]} · 习字第{cnNum(dayNo)}日 · 连续 {streakOf(s)} 天</span>
        </div>
        <div className="today-title">
          <div className="eyebrow">第{cnNum(plan.lesson + 1)}课 · {law.type}</div>
          <h1>{law.name}</h1>
          <p className="today-sub">{law.sub} — {plan.chars.length} 个新字 · {plan.reviews.length} 个复习 · 约 {s.settings.minutes} 分钟</p>
        </div>
        <blockquote className="today-quote"><span>{quote[0]}</span><cite>{quote[1]}</cite></blockquote>
      </header>

      <nav className="step-rail">
        {STEPS.map((x, i) => (
          <button key={x.k} className={'step ' + (step === x.k ? 'cur ' : '') + (plan.steps[x.k] ? 'done' : '')} onClick={() => setStep(x.k)}>
            <span className="step-glyph">{plan.steps[x.k] ? <Icon name="check" size={18} /> : x.t}</span>
            <span className="step-txt"><b>{x.d}</b><em>{mins[x.k]} 分钟</em></span>
          </button>
        ))}
        <div className="step-bar"><i style={{ width: `${doneCount * 25}%` }} /></div>
      </nav>

      {plan.done && step === 'review' && plan.steps.review && <DoneBanner s={s} plan={plan} go={go} />}

      <section className="step-body">
        {step === 'read' && <ReadStep law={law} plan={plan} openChar={openChar} onNext={() => nextStep('read')} />}
        {step === 'analyze' && <AnalyzeStep law={law} plan={plan} openVideo={openVideo} onNext={() => nextStep('analyze')} />}
        {step === 'copy' && <CopyStep s={s} plan={plan} law={law} update={update} openChar={openChar} onNext={() => nextStep('copy')} minutes={mins.copy} />}
        {step === 'review' && <ReviewStep s={s} plan={plan} update={update} onNext={() => nextStep('review')} />}
      </section>
    </div>
  );
}

function DoneBanner({ s, plan, go }) {
  const next = LAWS[Math.min(plan.law + 1, LAWS.length - 1)];
  return <div className="done-banner">
    <Seal size={64}>日课<br />已毕</Seal>
    <div><h3>今日功课圆满</h3><p>新学 {plan.chars.length} 字，明日进入「{next.name}」。复习会按你的评分自动排期。</p></div>
    <button className="btn" onClick={() => go('progress')}>查看进度</button>
  </div>;
}

// ---------- 读 ----------
function ReadStep({ law, plan, openChar, onNext }) {
  const script = useScript();
  return (
    <div className="read-step">
      <div className="read-main">
        <p className="gist">{law.gist}</p>
        <ol className="points">
          {law.points.map((p, i) => <li key={i}><span className="pt-n">{cnNum(i + 1)}</span><span>{p}</span></li>)}
        </ol>
        <div className="faults">
          <div className="eyebrow">常见病笔</div>
          <ul>{law.faults.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
      </div>
      <aside className="read-side">
        <div className="eyebrow">今日新字 · 点击查看详情</div>
        <div className="newchars">
          {plan.chars.map(c => (
            <button key={c} className="nc" onClick={() => openChar(c)}>
              <CharCrop c={c} size={96} />
              <span className="nc-lbl">{showChar(c, script)}<em>{DICT[c]?.[1]}</em></span>
            </button>
          ))}
        </div>
        {law.n > 0 && <figure className="book-fig">
          <img src={bookSrc(LAWS_BOOK_START(law))} alt={law.name} />
          <figcaption>《书法入门十八法》 · {law.name} 首页</figcaption>
        </figure>}
        {law.n === 0 && <figure className="book-fig"><img src="assets/book/hold.jpg" alt="执笔" /><figcaption>执笔五字法示意</figcaption></figure>}
      </aside>
      <div className="step-foot"><button className="btn" onClick={onNext}>读完了，进入「析」</button></div>
    </div>
  );
}
const LAWS_BOOK_START = law => law.book[0];

// ---------- 析 ----------
function AnalyzeStep({ law, plan, openVideo, onNext }) {
  const [play, setPlay] = useState(0);
  const pages = [];
  for (let i = law.book[0]; i <= law.book[1]; i++) pages.push(i);
  const [pg, setPg] = useState(0);
  const vids = window.SJX_VIDEOS.filter(v => plan.chars.includes(v.char)).concat(window.SJX_VIDEOS.filter(v => v.kind === '单字')).slice(0, 2);
  return (
    <div className="analyze-step">
      {law.stroke ? (
        <div className="anal-anim">
          <div className="eyebrow">笔画运行示意 · {law.sub}</div>
          <StrokeAnim stroke={law.stroke} size={240} playKey={play} />
          <button className="btn ghost sm" onClick={() => setPlay(p => p + 1)}><Icon name="play" size={14} /> 重播</button>
        </div>
      ) : (
        <div className="anal-anim struct">
          <div className="eyebrow">结构观察 · 米字格定位</div>
          <div className="struct-row">
            {plan.chars.slice(0, 4).map(c => <CharCrop key={c} c={c} size={112} grid="mi" />)}
          </div>
          <p className="muted">把字放进米字格，观察：主笔在哪里？中心线是否贯通？左右/上下部件比例如何？</p>
        </div>
      )}
      <div className="anal-book">
        <div className="book-viewer">
          <img src={bookSrc(pages[pg])} alt="" />
          {pages.length > 1 && <div className="bv-nav">
            <button className="icon-btn" disabled={pg === 0} onClick={() => setPg(pg - 1)}><Icon name="left" /></button>
            <span>{pg + 1} / {pages.length}</span>
            <button className="icon-btn" disabled={pg === pages.length - 1} onClick={() => setPg(pg + 1)}><Icon name="right" /></button>
          </div>}
        </div>
        <p className="cap muted">书中分解图：注意起笔、行笔、收笔的锋向标注。</p>
      </div>
      <div className="anal-vids">
        <div className="eyebrow">相关临写视频</div>
        {vids.map(v => <VideoCard key={v.bv} v={v} onClick={() => openVideo(v)} compact />)}
      </div>
      <div className="step-foot"><button className="btn" onClick={onNext}>看明白了，开始「临」</button></div>
    </div>
  );
}

// ---------- 临 ----------
function CopyStep({ s, plan, law, update, openChar, onNext, minutes }) {
  const script = useScript();
  const [i, setI] = useState(0);
  const [inv, setInv] = useState(false);
  const [grid, setGrid] = useState(s.settings.grid || 'mi');
  const [occI, setOccI] = useState(0);
  const [timer, setTimer] = useState(null); // seconds left
  useEffect(() => { if (timer == null || timer <= 0) return; const t = setTimeout(() => setTimer(timer - 1), 1000); return () => clearTimeout(t); }, [timer]);
  useEffect(() => setOccI(0), [i]);
  const c = plan.chars[i];
  if (!c) return <div className="muted">今日没有新字。</div>;
  const occs = CHAR_INDEX[c] || [];
  const occ = occs[occI];
  const card = s.cards[c];
  const rated = plan.rated && plan.rated[c] != null ? plan.rated[c] : null;
  const rate = r => update(n => { rateCard(n, c, r); const p = n.days[todayKey()]; p.rated = p.rated || {}; p.rated[c] = r; });
  const tip = window.SJX_TIPS[c];
  const allRated = plan.chars.every(x => plan.rated && plan.rated[x] != null);
  const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

  return (
    <div className="copy-step">
      <div className="copy-tabs">
        {plan.chars.map((x, j) => (
          <button key={x} className={'ct ' + (j === i ? 'on ' : '') + (plan.rated && plan.rated[x] != null ? 'ok' : '')} onClick={() => setI(j)}>
            <CharCrop c={x} size={44} />
          </button>
        ))}
      </div>
      <div className="copy-stage">
        <div className="copy-model">
          <CharCrop occ={occ} c={c} size={360} invert={inv} grid={grid} className="model-crop" />
          {occs.length > 1 && <div className="occ-pick">
            <span className="muted">帖中 {occs.length} 处：</span>
            {occs.map((o, j) => <button key={j} className={j === occI ? 'on' : ''} onClick={() => setOccI(j)}>{j + 1}</button>)}
          </div>}
        </div>
        <div className="copy-info">
          <div className="ci-head">
            <span className="ci-char">{showChar(c, script === 'trad' ? 'simp' : 'trad')}</span>
            <div><div className="ci-py">{DICT[c]?.[1]}</div><div className="muted">{script === 'trad' ? '简' : '繁'} · {DICT[c]?.[2]}</div></div>
            <button className="btn ghost sm" onClick={() => openChar(c)}>单字详情</button>
          </div>
          <div className="ci-tip">
            <div className="eyebrow">书写要点</div>
            <p>{tip || `本课「${law.name}」：${law.points[0]}`}</p>
          </div>
          <div className="ci-tools">
            <Seg small value={grid} onChange={setGrid} options={[['mi', '米字格'], ['jiu', '九宫格'], ['none', '无格']]} />
            <Seg small value={inv ? 'w' : 'b'} onChange={v => setInv(v === 'w')} options={[['b', '原拓'], ['w', '反相']]} />
          </div>
          <div className="ci-timer">
            <Icon name="timer" size={18} />
            {timer == null ? <>
              <span>每字建议临 5–8 遍</span>
              <button className="btn ghost sm" onClick={() => setTimer(Math.round(minutes * 60 / plan.chars.length))}>开始计时 {fmt(Math.round(minutes * 60 / plan.chars.length))}</button>
            </> : <>
              <span className={'tnum ' + (timer === 0 ? 'end' : '')}>{timer === 0 ? '时间到' : fmt(timer)}</span>
              <button className="btn ghost sm" onClick={() => setTimer(null)}>重置</button>
            </>}
          </div>
          <div className="ci-rate">
            <div className="eyebrow">临完自评 · 决定复习间隔</div>
            <div className="rate-btns">
              {[[0, '生', '形不似，需重练'], [1, '熟', '形似，笔意未到'], [2, '准', '形神兼得']].map(([r, t, d]) => (
                <button key={r} className={'rate r' + r + (rated === r ? ' on' : '')} onClick={() => { rate(r); if (i < plan.chars.length - 1) setTimeout(() => setI(i + 1), 280); }}>
                  <b>{t}</b><em>{d}</em>
                </button>
              ))}
            </div>
            {card && <div className="muted small">记忆盒：{BOX_NAMES[card.box]} · 下次复习 {card.due === todayKey() ? '今天' : card.due.slice(5)}</div>}
          </div>
        </div>
      </div>
      <div className="step-foot">
        <span className="muted">{Object.keys(plan.rated || {}).filter(x => plan.chars.includes(x)).length} / {plan.chars.length} 已自评</span>
        <button className="btn" disabled={!allRated} onClick={onNext}>{allRated ? '临写完成，进入「复」' : '请为每个字自评'}</button>
      </div>
    </div>
  );
}

// ---------- 复 ----------
function ReviewStep({ s, plan, update, onNext }) {
  const script = useScript();
  const queue = plan.reviews.filter(c => !(plan.reviewed || {})[c]);
  const [flip, setFlip] = useState(false);
  const c = queue[0];
  const rate = r => { update(n => { rateCard(n, c, r); const p = n.days[todayKey()]; p.reviewed = p.reviewed || {}; p.reviewed[c] = r; }); setFlip(false); };
  if (!plan.reviews.length) return <div className="review-empty">
    <p>今天没有到期的复习字。这是学习的第一天，或者你的复习已经全部完成。</p>
    <button className="btn" onClick={onNext}>完成今日功课</button>
  </div>;
  if (!c) return <div className="review-empty">
    <Seal size={56}>温故</Seal>
    <p>{plan.reviews.length} 个旧字已复习完毕。</p>
    {!plan.steps.review && <button className="btn" onClick={onNext}>完成今日功课</button>}
  </div>;
  return (
    <div className="review-step">
      <div className="rv-count"><b>{plan.reviews.length - queue.length + 1}</b> / {plan.reviews.length}<span className="muted">　先默想这个字的写法，再翻开对照原帖</span></div>
      <div className={'rv-card ' + (flip ? 'flipped' : '')} onClick={() => setFlip(true)}>
        <div className="rv-face rv-front">
          <span className="rv-big">{showChar(c, script)}</span>
          <span className="rv-py">{DICT[c]?.[1]} · {DICT[c]?.[2]}</span>
          <span className="muted small">点击翻开原帖</span>
        </div>
        <div className="rv-face rv-back"><CharCrop c={c} size={260} grid="mi" /></div>
      </div>
      {flip && <div className="rate-btns rv-rate">
        {[[0, '忘了', '明天再见'], [1, '模糊', '稍后巩固'], [2, '记得', '拉长间隔']].map(([r, t, d]) => (
          <button key={r} className={'rate r' + r} onClick={() => rate(r)}><b>{t}</b><em>{d}</em></button>
        ))}
      </div>}
    </div>
  );
}

Object.assign(window, { TodayPage });
