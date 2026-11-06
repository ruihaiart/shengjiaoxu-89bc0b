// ============ 二十字精临 · 文本对读 ============
const JL = window.SJX_JINGLIN;
const DUIDU = window.SJX_DUIDU || [];
const segOf = i => DUIDU.find(s => s[1] <= i && i < s[2]);
const segByNo = n => DUIDU.find(s => s[0] === n);
// 精临字的拓本定位：取该字在对读段内的第一次出现
function jlOcc(row) {
  const seg = segByNo(row[2]); const occs = CHAR_INDEX[row[0]] || [];
  return (seg && occs.find(o => o.i >= seg[1] && o.i < seg[2])) || occs.find(o => o.i >= 29) || occs[0];
}
const jlCurrent = s => { const d = s.jl || {}; const k = JL.chars.findIndex(r => !d[r[0]]?.done); return k < 0 ? JL.chars.length - 1 : k; };

// ---------- 首页里的「二十字精临」路线 ----------
function JinglinPath({ s, openJL }) {
  const script = useScript();
  const cur = jlCurrent(s); const d = s.jl || {};
  return (
    <section className="path jl-path">
      <div className="path-head">
        <h2>二十字精临</h2>
        <span className="muted">四周一轮 · 每天二十分钟 · 已完成 {JL.chars.filter(r => d[r[0]]?.done).length} / 20</span>
      </div>
      <p className="jl-intro">{JL.intro} <button className="link" onClick={() => openJL('home')}>读总则 →</button></p>
      <div className="jl-weeks">
        {JL.weeks.map(w => (
          <div key={w.n} className="jl-week">
            <div className="jw-head"><span className="jw-n">第{cnNum(w.n)}周</span><b>{w.t}</b><em>{w.goal}</em></div>
            <div className="jw-chars">
              {JL.chars.map((r, k) => [r, k]).filter(([r]) => r[1] === w.n).map(([r, k]) => (
                <button key={r[0]} className={'jw-c ' + (d[r[0]]?.done ? 'done ' : '') + (k === cur ? 'cur' : '')} onClick={() => openJL(k)}>
                  <CharCrop occ={jlOcc(r)} c={r[0]} size={64} />
                  <span>{showChar(r[0], script)}</span>
                  {d[r[0]]?.done && <i className="jw-ok"><Icon name="check" size={11} /></i>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- 总则页 ----------
function JinglinHome({ back, openJL, s }) {
  return (
    <div className="lesson jl">
      <div className="ls-top"><button className="back" onClick={back}><Icon name="left" size={18} /> 学习路线</button></div>
      <header className="ls-head"><div className="ls-num">廿</div><div>
        <div className="eyebrow">集王圣教序 · 临写计划</div><h1>二十字精临</h1>
        <p className="ls-kou">不通临，只精临 · 四周为一轮 · 不求像，求懂</p></div></header>
      <section className="ls-sec">
        <SecHead2 t="则" title="为什么只写二十个字" />
        <p className="lead">{JL.intro}</p>
        <div className="jl-steps-grid">{JL.steps.map((x, i) => <div key={x.k} className="jsg"><b>{i + 1}</b><h4>{x.t}<em>{x.m} 分钟</em></h4><p>{x.d}</p></div>)}</div>
        <blockquote className="classic">{JL.knife}<cite>— 关于刀痕</cite></blockquote>
      </section>
      <section className="ls-sec">
        <SecHead2 t="周" title="四周分组" />
        <p className="muted">第一周解决「立得住」，第二周「让得开」，第三周「接得上」，第四周「撑得牢」——这正是集字碑最容易被拆散的四层。</p>
        <div className="jl-table">
          <div className="jt-row jt-h"><span>字</span><span>周</span><span>结构类型</span><span>主笔 / 关键</span><span>一句话</span></div>
          {JL.chars.map((r, k) => <button key={r[0]} className="jt-row" onClick={() => openJL(k)}>
            <span className="jt-c">{r[0]}</span><span>{cnNum(r[1])}</span><span>{r[3]}</span><span>{r[4]}</span><span>{r[5]}</span></button>)}
        </div>
      </section>
      <section className="ls-sec">
        <SecHead2 t="病" title="五种常见的病" />
        <div className="ills">{JL.ills.map(([t, a, b]) => <div key={t} className="ill"><span className="ill-t">{t}</span><div><p>{a}</p><p className="ill-fix">药方　{b}</p></div></div>)}</div>
      </section>
      <section className="ls-sec">
        <SecHead2 t="验" title="四周之后" />
        <ul className="todo">{JL.exam.map(([a, b]) => <li key={a} style={{ cursor: 'default' }}><span className="exam-k">{a}</span><span>{b}</span></li>)}</ul>
        <div className="path-next" style={{ marginTop: 20 }}><Seal size={40}>下一步</Seal><div><p style={{ margin: 0 }}>{JL.next}</p></div></div>
        <button className="btn" style={{ marginTop: 24 }} onClick={() => openJL(jlCurrent(s))}>开始 / 继续精临 <Icon name="right" size={16} /></button>
      </section>
    </div>
  );
}
function SecHead2({ t, title }) { return <div className="sec-head"><span className="sec-t">{t}</span><h2>{title}</h2></div>; }

// ---------- 精临单日页 ----------
function JinglinDay({ k, s, update, back, openJL, openChar, goRead }) {
  const script = useScript();
  const r = JL.chars[k]; const [c, wk, segNo, type, main, one, tip, err] = r;
  const week = JL.weeks[wk - 1];
  const occ = jlOcc(r);
  const occs = CHAR_INDEX[c] || [];
  const seg = segByNo(segNo);
  const st = (s.jl || {})[c] || {};
  const [grid, setGrid] = useState('mi');
  const [inv, setInv] = useState(false);
  const [timer, setTimer] = useState(null);
  const [note, setNote] = useState(st.note || '');
  useEffect(() => { setNote(((s.jl || {})[c] || {}).note || ''); window.scrollTo(0, 0); setTimer(null); }, [k]);
  useEffect(() => { if (!timer || timer.left <= 0) return; const t = setTimeout(() => setTimer({ ...timer, left: timer.left - 1 }), 1000); return () => clearTimeout(t); }, [timer]);
  const prev = k > 0 ? (s.jl || {})[JL.chars[k - 1][0]] : null;
  const firstOfWeek = JL.chars.findIndex(x => x[1] === wk) === k;
  const lastOfWeek = JL.chars.map(x => x[1]).lastIndexOf(wk) === k;
  const steps = st.steps || {};
  const allSteps = JL.steps.every(x => steps[x.k]);
  const touch = nn => { const t = todayKey(); nn.log[t] = nn.log[t] || { lesson: currentLesson(nn), minutes: 0, finished: false }; nn.log[t].jl = c; };
  const toggle = key => update(nn => { nn.jl = nn.jl || {}; const o = nn.jl[c] = nn.jl[c] || {}; o.steps = o.steps || {}; o.steps[key] = !o.steps[key]; touch(nn); });
  const saveNote = () => update(nn => { nn.jl = nn.jl || {}; const o = nn.jl[c] = nn.jl[c] || {}; o.note = note; });
  const finish = () => update(nn => { nn.jl = nn.jl || {}; const o = nn.jl[c] = nn.jl[c] || {}; o.note = note; o.done = todayKey(); touch(nn); nn.log[todayKey()].minutes = Math.max(nn.log[todayKey()].minutes || 0, 20); });
  const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  const sameSeg = seg ? occs.filter(o => o !== occ) : occs;
  const vids = [window.SJX_CHAR_VIDEOS[c], occ && zhuziFor(occ.i)].filter(Boolean);

  return (
    <div className="lesson jl">
      <div className="ls-top">
        <button className="back" onClick={back}><Icon name="left" size={18} /> 学习路线</button>
        <div className="jl-nav">
          <button className="icon-btn" disabled={k === 0} onClick={() => openJL(k - 1)}><Icon name="left" /></button>
          <span>第{cnNum(wk)}周 · 第{cnNum(k + 1)}字 / 二十</span>
          <button className="icon-btn" disabled={k === 19} onClick={() => openJL(k + 1)}><Icon name="right" /></button>
        </div>
      </div>

      {firstOfWeek && <div className="week-banner"><span className="wb-n">第{cnNum(wk)}周</span><div><b>{week.t}：{week.sub}</b><p>{week.d}</p></div></div>}

      <header className="jl-head">
        <div className="jl-model">
          <CharCrop occ={occ} c={c} size={300} grid={grid} invert={inv} className="model-crop" />
          <div className="ci-tools">
            <Seg value={grid} onChange={setGrid} options={[['mi', '米字格'], ['jiu', '九宫格'], ['none', '无格']]} />
            <Seg value={inv ? 'w' : 'b'} onChange={v => setInv(v === 'w')} options={[['b', '原拓'], ['w', '反相']]} />
          </div>
        </div>
        <div className="jl-meta">
          <div className="eyebrow">二十字精临 · 对读第 {String(segNo).padStart(2, '0')} 段</div>
          <div className="jl-char"><span>{c}</span><span className="simp">{DICT[c]?.[0]}</span><em>{DICT[c]?.[1]}</em></div>
          <div className="jl-tags"><span><i>结构</i>{type}</span><span><i>主笔</i>{main}</span></div>
          <p className="jl-one">「{one}」</p>
          {prev?.note && <div className="jl-prev"><span className="eyebrow">昨天记下的差距 · 先改这一处</span><p>{prev.note}</p></div>}
        </div>
      </header>

      <section className="ls-sec">
        <SecHead2 t="练" title="今天二十分钟" />
        <div className="jl-steps">
          {JL.steps.map((x, i) => (
            <div key={x.k} className={'jls ' + (steps[x.k] ? 'on' : '')}>
              <button className="jls-box" onClick={() => toggle(x.k)}>{steps[x.k] ? <Icon name="check" size={16} /> : i + 1}</button>
              <div className="jls-body">
                <h4>{x.t}<em>{x.m} 分钟</em></h4>
                <p>{x.d}</p>
                {x.k === 'read' && <p className="jls-q">中宫在哪？主笔是「{main}」吗？重心偏哪边？先念出来，再往下。</p>}
                {x.k === 'bi' && <div className="jls-note">
                  <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={saveNote} placeholder="只写一处差距最大的地方，例如：上横太长、口没偏右……" rows={2} />
                </div>}
              </div>
              <button className="btn ghost sm jls-t" onClick={() => setTimer({ k: x.k, left: x.m * 60 })}>
                {timer?.k === x.k ? (timer.left > 0 ? fmt(timer.left) : '时间到') : <><Icon name="timer" size={14} />{x.m}:00</>}
              </button>
            </div>
          ))}
        </div>
        <div className="jl-twocol">
          <div className="jl-tip"><div className="eyebrow">结构要点</div><p>{tip}</p></div>
          <div className="jl-err"><div className="eyebrow">易错</div><p>{err}</p></div>
        </div>
        <p className="muted small jl-knife">以墨证碑：碑上的方折多是刀痕。写之前，可先在《兰亭序》《丧乱帖》等墨迹里找同字或同类结构，看它原本怎么转。</p>
      </section>

      {seg && <section className="ls-sec">
        <SecHead2 t="读" title="它在文章里" />
        <div className="seg-card" onClick={() => goRead(segNo)}>
          <div className="eyebrow">{seg[5].split('·').slice(0, 2).join(' · ')} · 第 {String(seg[0]).padStart(2, '0')} 段</div>
          <p className="seg-o">{[...(script === 'simp' ? showTextS(seg[3]) : seg[3])].map((ch, j) => <span key={j} className={ch === c || ch === DICT[c]?.[0] ? 'hit' : ''}>{ch}</span>)}</p>
          <p className="seg-y">{seg[4]}</p>
          <span className="link">在「读文」中查看上下文 →</span>
        </div>
      </section>}

      {occs.length > 1 && <section className="ls-sec">
        <SecHead2 t="比" title={`帖中「${c}」共 ${occs.length} 处`} />
        <p className="muted small">集字本同字常取自不同原迹。比较它们的差异，看怀仁在同一个字上用了几种写法。</p>
        <div className="cd-occs">{occs.slice(0, 16).map((o, j) => <button key={j} className={o === occ ? 'on' : ''} onClick={() => openChar(c, o.i)}><CharCrop occ={o} size={72} /><span>第{o.page}页</span></button>)}</div>
      </section>}

      {vids.length > 0 && <section className="ls-sec">
        <SecHead2 t="视" title="讲解视频" />
        <div style={{ maxWidth: 820 }}><VideoPlayer list={vids} title="本字讲解" /></div>
      </section>}

      <section className="ls-sec">
        {lastOfWeek && <div className="week-check"><Seal size={44}>周检</Seal><div><b>本周检查</b><p>{week.check}</p><p className="muted small">周日不看帖，凭记忆默写这周五个字，写完再对。</p></div></div>}
        <div className={'finish ' + (st.done ? 'is-done' : '')}>
          {st.done ? <>
            <Seal size={56}>精臨</Seal>
            <div><b>「{c}」已完成</b><p className="muted">{st.done.replace(/-/g, '/')} · 能凭记忆说出它的起笔方向了吗？</p></div>
            {k < 19 && <button className="btn" onClick={() => openJL(k + 1)}>下一字：{JL.chars[k + 1][0]} <Icon name="right" size={16} /></button>}
          </> : <>
            <div><b>{allSteps ? '四步走完，可以打卡' : '读帖 · 双钩 · 临写 · 比对'}</b><p className="muted">已完成 {JL.steps.filter(x => steps[x.k]).length} / 4 步。</p></div>
            <button className="btn" disabled={!allSteps} onClick={finish}>打卡 · 完成今日精临</button>
          </>}
        </div>
      </section>
    </div>
  );
}
const showTextS = t => [...t].map(ch => DICT[ch]?.[0] || ch).join('');

// ---------- 读文（文本对读） ----------
function ReadPage({ s, openChar, focus, goTie }) {
  const script = useScript();
  const [mode, setMode] = useState(() => localStorage.getItem('sjx2-readmode') || 'both');
  const [onlyKey, setOnlyKey] = useState(false);
  useEffect(() => { localStorage.setItem('sjx2-readmode', mode); }, [mode]);
  useEffect(() => { if (focus) { setTimeout(() => { const el = document.getElementById('seg-' + focus); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' }); }, 80); } }, [focus]);
  const jlSet = new Set(JL.chars.map(r => r[0]));
  const vols = []; DUIDU.forEach(sg => { if (!vols.length || vols[vols.length - 1].name !== sg[5]) vols.push({ name: sg[5], segs: [] }); vols[vols.length - 1].segs.push(sg); });
  const order = [5, 0, 1, 2, 3, 4]; // 题衔放最前
  const pageOf = i => (BOXES[i] || [])[0];
  return (
    <div className="read">
      <div className="tie-bar">
        <div><div className="eyebrow">文本对读 · 原文 · 白话 · 段号</div><h2>先读懂，再下笔</h2></div>
        <div className="tie-tools">
          <Seg value={mode} onChange={setMode} options={[['both', '对照'], ['o', '只看原文'], ['y', '只看白话']]} />
          <Seg value={onlyKey ? 1 : 0} onChange={v => setOnlyKey(!!v)} options={[[0, '全部 85 段'], [1, '六处精读']]} />
        </div>
      </div>
      <div className="read-guide">
        <p><b>建议读法</b>　第一遍只读白话，半小时可通；第二遍看原文，遇到不认识的字点一下；第三遍挑六处精读——二仪有像、松风水月、万里山川、桂生高岭、百川异流、色不异空。</p>
        <p className="muted small">碑上不是一篇文章，而是四份文件加一部经：皇帝的序 → 皇帝答谢 → 太子的记 → 太子答谢 → 心经 → 题衔。<span className="hl-jl">朱底</span>为二十字精临用字。</p>
      </div>
      {order.map(vi => vols[vi]).filter(Boolean).map(v => {
        const segs = v.segs.filter(sg => !onlyKey || sg[7]);
        if (!segs.length) return null;
        const [vt, vn, vr] = v.name.split('·');
        let lastSec = null;
        return (
          <section key={v.name} className="vol">
            <div className="vol-head"><span className="vol-t">{vt}</span><div><h3>{vn}</h3><em>{vr}</em></div></div>
            {segs.map(sg => {
              const showSec = sg[6] && sg[6] !== lastSec; lastSec = sg[6];
              const txt = script === 'simp' ? showTextS(sg[3]) : sg[3];
              let ci = sg[1];
              return <React.Fragment key={sg[0]}>
                {showSec && <div className="sec-label">{sg[6]}</div>}
                <div id={'seg-' + sg[0]} className={'dseg ' + (focus === sg[0] ? 'focus ' : '') + (sg[7] ? 'key' : '')}>
                  <span className="seg-n">{String(sg[0]).padStart(2, '0')}</span>
                  <div className="seg-body">
                    {mode !== 'y' && <p className="seg-o">{[...txt].map((ch, j) => {
                      const raw = sg[3][j]; const isC = raw >= '\u4e00' && raw <= '\u9fff';
                      if (!isC) return <span key={j} className="pn">{ch}</span>;
                      const idx = ci++;
                      return <span key={j} className={'oc' + (jlSet.has(raw) ? ' jl' : '')} onClick={() => idx < sg[2] && openChar(raw, idx)}>{ch}</span>;
                    })}</p>}
                    {mode !== 'o' && <p className="seg-y">{sg[4]}</p>}
                    <div className="seg-foot">
                      {sg[7] && <span className="seg-key">精读 · {sg[7]}</span>}
                      {sg[8] && <span className="muted small">{sg[8]}</span>}
                      <button className="link" onClick={() => goTie(pageOf(sg[1]))}>拓本第 {pageOf(sg[1])} 页 →</button>
                    </div>
                  </div>
                </div>
              </React.Fragment>;
            })}
          </section>
        );
      })}
      <p className="muted small center">原文据碑刻释文校理，白话为逐段直译。段号为《文本对读》阅读行号，不是碑石行数。</p>
    </div>
  );
}

Object.assign(window, { JinglinPath, JinglinHome, JinglinDay, ReadPage, segOf, segByNo, jlCurrent, showTextS, JL });
