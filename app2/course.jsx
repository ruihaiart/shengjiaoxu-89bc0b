// ============ 课程：首页路线 + 单课页 ============
function CourseHome({ s, openLesson, openJL }) {
  const cur = currentLesson(s);
  const L = LESSONS[cur];
  const sch = schedule(s.settings.minutes);
  const d = new Date();
  const doneN = Object.keys(s.done).length;
  const todayLog = s.log[todayKey()];
  const groups = [['入门', LESSONS.filter(l => l.type === '入门')], ['笔法 · 写好每一笔', LESSONS.filter(l => l.type === '笔法')], ['结构 · 搭好每个字', LESSONS.filter(l => l.type === '结构')]];

  return (
    <div className="home">
      <section className="how">
        <div className="how-step"><b>1</b><span>主课 · 十八法</span><em>每天一课：学 · 看 · 写 · 测，约 {s.settings.minutes} 分钟</em></div>
        <div className="how-arrow" />
        <div className="how-step"><b>2</b><span>加练 · 一字精临</span><em>读帖 · 双钩 · 临写 · 比对，20 分钟</em></div>
        <div className="how-arrow" />
        <div className="how-step"><b>3</b><span>读文 · 随时</span><em>碰到的字，在原文里看它在说什么</em></div>
      </section>

      <section className="today-card" onClick={() => openLesson(cur)}>
        <div className="tc-left">
          <div className="eyebrow">{d.getMonth() + 1}月{d.getDate()}日 · 星期{WEEK[d.getDay()]} · {todayLog ? '今天已开始' : '今日功课'}</div>
          <div className="tc-no">第{cnNum(cur)}课</div>
          <h1>{L.name}</h1>
          <p className="tc-kou">「{L.kou}」</p>
          <div className="tc-sch">
            {sch.map(x => <span key={x.k}><b>{x.t}</b>{x.m}分</span>)}
          </div>
          <button className="btn big">{todayLog ? '继续学习' : '开始今天的课'} <Icon name="right" size={18} /></button>
        </div>
        <div className="tc-right">
          {lessonChars(L).slice(0, 4).map(c => <CharCrop key={c} c={c} size={92} />)}
        </div>
      </section>

      {(() => { const k = jlCurrent(s); const r = JL.chars[k]; const done = (s.jl || {})[r[0]]?.done === todayKey(); return (
        <button className="jl-today" onClick={() => openJL(k)}>
          <CharCrop c={r[0]} occ={CHAR_INDEX[r[0]] && (CHAR_INDEX[r[0]].find(o => o.i >= 29) || CHAR_INDEX[r[0]][0])} size={64} />
          <div><div className="eyebrow">加练 · 二十字精临 · 第{cnNum(r[1])}周</div><b>{done ? `今天已精临「${r[0]}」` : `今日一字：「${r[0]}」`}</b><em>{r[5]} · 20 分钟</em></div>
          <Icon name="right" size={18} />
        </button>); })()}

      <JinglinPath s={s} openJL={openJL} />

      <section className="path">
        <div className="path-head">
          <h2>十八法路线</h2>
          <span className="muted">已完成 {doneN} / {LESSONS.length} 课 · 连续 {streakOf(s)} 天</span>
        </div>
        {groups.map(([g, ls]) => (
          <div key={g} className="path-group">
            <div className="eyebrow">{g}</div>
            <div className="path-list">
              {ls.map(l => {
                const st = s.done[l.n] ? 'done' : l.n === cur ? 'cur' : l.n < cur ? 'done' : 'lock';
                return (
                  <button key={l.n} className={'pl ' + st} onClick={() => openLesson(l.n)}>
                    <span className="pl-n">{st === 'done' ? <Icon name="check" size={16} /> : l.n === 0 ? '纲' : cnNum(l.n)}</span>
                    <span className="pl-txt"><b>{l.name}</b><em>{l.sub}</em></span>
                    <span className="pl-st">{st === 'done' ? (s.done[l.n] || '').slice(5).replace('-', '/') : st === 'cur' ? '今天' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="path-next">
          <Seal size={40}>通临</Seal>
          <div><b>之后 · 按结构归类临</b><p className="muted">十八法与二十字都完成后，不急着通临：把碑中所有「氵」旁、「口」部、带戈钩的字各挑十个横向比较；再在「字帖」中整页临写，体会行气。</p></div>
        </div>
      </section>
    </div>
  );
}

// ---------- 单课页 ----------
function LessonPage({ n, s, update, back, openChar, openLesson }) {
  const script = useScript();
  const L = LESSONS[n];
  const sch = schedule(s.settings.minutes);
  const [play, setPlay] = useState(0);
  const [bp, setBp] = useState(0);
  const [active, setActive] = useState('learn');
  const refs = { learn: useRef(null), see: useRef(null), write: useRef(null), test: useRef(null) };
  const ck = s.checks[n] || { drills: L.drills.map(() => false), check: L.check.map(() => false) };
  const allDone = ck.check.every(Boolean) && ck.drills.every(Boolean);
  const isDone = !!s.done[n];
  const pages = []; if (L.book[0]) for (let i = L.book[0]; i <= L.book[1]; i++) pages.push(i);
  const nextL = LESSONS[n + 1];

  useEffect(() => { window.scrollTo(0, 0); setBp(0); }, [n]);
  useEffect(() => {
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) setActive(e.target.dataset.k); }); }, { rootMargin: '-40% 0px -55% 0px' });
    Object.values(refs).forEach(r => r.current && io.observe(r.current));
    return () => io.disconnect();
  }, [n]);
  const jump = k => { const el = refs[k].current; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' }); };

  const touch = nn => { const t = todayKey(); nn.log[t] = nn.log[t] || { lesson: n, minutes: 0, finished: false }; };
  const toggle = (kind, i) => update(nn => {
    const c = nn.checks[n] || { drills: L.drills.map(() => false), check: L.check.map(() => false) };
    c[kind][i] = !c[kind][i]; nn.checks[n] = c; touch(nn);
  });
  const finish = () => update(nn => {
    nn.done[n] = todayKey(); touch(nn);
    const lg = nn.log[todayKey()]; lg.finished = true; lg.lesson = n; lg.minutes = nn.settings.minutes;
  });

  return (
    <div className="lesson">
      <div className="ls-top">
        <button className="back" onClick={back}><Icon name="left" size={18} /> 学习路线</button>
        <nav className="ls-steps">
          {sch.map(x => <button key={x.k} className={active === x.k ? 'on' : ''} onClick={() => jump(x.k)}><b>{x.t}</b><span>{x.d}</span><em>{x.m}分</em></button>)}
        </nav>
      </div>

      <header className="ls-head">
        <div className="ls-num">{n === 0 ? '纲' : cnNum(n)}</div>
        <div>
          <div className="eyebrow">{n === 0 ? '入门' : `第${cnNum(n)}法`} · {L.type} · {L.sub}</div>
          <h1>{L.name}</h1>
          <p className="ls-kou">口诀　{L.kou}</p>
        </div>
      </header>

      {/* 学 */}
      <section className="ls-sec" ref={refs.learn} data-k="learn">
        <SecHead t="学" title="读懂这一法" m={sch[0].m} />
        <div className="learn-grid">
          <div>
            {L.intro.map((p, i) => <p key={i} className={i === 0 ? 'lead' : ''}>{p}</p>)}
            <blockquote className="classic">{L.classic[0]}<cite>— {L.classic[1]}</cite></blockquote>
          </div>
          <div className="learn-side">
            {L.stroke ? <>
              <div className="eyebrow">运笔示意 <button className="link" onClick={() => setPlay(p => p + 1)}><Icon name="play" size={12} /> 重播</button></div>
              <StrokeAnim stroke={L.stroke} size={200} playKey={play} />
            </> : n === 0 ? <figure className="bookfig"><img src="assets/book/hold.jpg" alt="执笔五字法" /><figcaption>执笔五字法 · 原书插图</figcaption></figure> : null}
            <div className="steps-list">
              <div className="eyebrow">{L.type === '结构' ? '观察方法' : '书写步骤'}</div>
              <ol>{L.steps.map((st, i) => <li key={i}><b>{st.t}</b><span>{st.d}</span></li>)}</ol>
            </div>
          </div>
        </div>
        <div className="ls-video">
          <VideoPlayer list={window.SJX_LESSON_VIDEOS[n]} title={`本课视频 · ${L.sub}`} />
        </div>
      </section>

      {/* 看 */}
      <section className="ls-sec" ref={refs.see} data-k="see">
        <SecHead t="看" title={L.type === '结构' ? '认识结构类型' : '认识笔画形态'} m={sch[1].m} />
        <div className="variants">
          {L.variants.map((v, i) => (
            <div key={i} className="variant">
              <div className="v-txt"><h4><span>{cnNum(i + 1)}</span>{v.name}</h4><p>{v.desc}</p></div>
              {v.chars.length > 0 && <div className="v-chars">
                {v.chars.map(c => <button key={c} className="vc" onClick={() => openChar(c)}><CharCrop c={c} size={76} /><span>{showChar(c, script)}</span></button>)}
              </div>}
            </div>
          ))}
        </div>
        {pages.length > 0 && <div className="book-row">
          <div className="book-viewer">
            <img src={bookSrc(pages[bp])} alt="" />
            <div className="bv-nav">
              <button className="icon-btn" disabled={bp === 0} onClick={() => setBp(bp - 1)}><Icon name="left" /></button>
              <span>原书图版 {bp + 1} / {pages.length}</span>
              <button className="icon-btn" disabled={bp === pages.length - 1} onClick={() => setBp(bp + 1)}><Icon name="right" /></button>
            </div>
          </div>
          <div className="book-note">
            <div className="eyebrow">怎么看原书图版</div>
            <p>《书法入门十八法》每一法配有笔画分解图和 12–18 个范字。分解图上的箭头标注了「逆锋起笔、顿笔、回锋」等运笔位置。</p>
            <p>建议对着分解图，用手指在空中描一遍，再看范字。</p>
            {(() => { const cv = lessonChars(L).map(c => window.SJX_CHAR_VIDEOS[c]).filter(Boolean); return cv.length ? <>
              <div className="eyebrow" style={{ marginTop: 20 }}>本课范字 · 单字示范</div>
              <VideoPlayer list={cv} title="单字示范" />
            </> : null; })()}
          </div>
        </div>}
      </section>

      {/* 写 */}
      <section className="ls-sec" ref={refs.write} data-k="write">
        <SecHead t="写" title="今日练习单" m={sch[2].m} />
        <div className="write-grid">
          <div>
            <ul className="todo">
              {L.drills.map((d, i) => <li key={i} className={ck.drills[i] ? 'on' : ''} onClick={() => toggle('drills', i)}>
                <span className="box">{ck.drills[i] && <Icon name="check" size={14} />}</span><span>{d}</span>
              </li>)}
            </ul>
            <div className="faults">
              <div className="eyebrow">写完对照 · 常见病笔</div>
              {L.faults.map((f, i) => <div key={i} className="fault"><span className="f-bad">✕ {f.bad}</span><span className="f-fix">→ {f.fix}</span></div>)}
            </div>
          </div>
          <div className="model-strip">
            <div className="eyebrow">临写范字 · 点击放大到米字格</div>
            <div className="ms-grid">
              {lessonChars(L).slice(0, 8).map(c => <button key={c} onClick={() => openChar(c)}><CharCrop c={c} size={104} grid="mi" /></button>)}
            </div>
            <p className="muted small">带朱砂底的字来自拓本原图；浅色字表示该字切图待补。</p>
          </div>
        </div>
      </section>

      {/* 测 */}
      <section className="ls-sec" ref={refs.test} data-k="test">
        <SecHead t="测" title="自测过关" m={sch[3].m} />
        <ul className="todo check">
          {L.check.map((d, i) => <li key={i} className={ck.check[i] ? 'on' : ''} onClick={() => toggle('check', i)}>
            <span className="box">{ck.check[i] && <Icon name="check" size={14} />}</span><span>{d}</span>
          </li>)}
        </ul>
        <div className={'finish ' + (isDone ? 'is-done' : '')}>
          {isDone ? <>
            <Seal size={56}>過關</Seal>
            <div><b>本课已完成</b><p className="muted">{s.done[n].replace(/-/g, '/')} 过关。随时可以回来复习。</p></div>
            {nextL && <button className="btn" onClick={() => openLesson(n + 1)}>下一课：{nextL.name} <Icon name="right" size={16} /></button>}
          </> : <>
            <div><b>{allDone ? '全部完成，可以打卡了' : '完成练习单与自测后打卡'}</b><p className="muted">已勾选 {ck.drills.filter(Boolean).length + ck.check.filter(Boolean).length} / {L.drills.length + L.check.length}。没把握的项可以明天再练一次，不必勉强。</p></div>
            <button className="btn" disabled={!allDone} onClick={finish}>打卡 · 完成本课</button>
          </>}
        </div>
      </section>
    </div>
  );
}

function SecHead({ t, title, m }) {
  return <div className="sec-head"><span className="sec-t">{t}</span><h2>{title}</h2><span className="muted">约 {m} 分钟</span></div>;
}

Object.assign(window, { CourseHome, LessonPage });
