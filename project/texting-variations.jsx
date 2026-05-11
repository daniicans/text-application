// Four layout variations of the Texting Application form.
// All share STAGE_COMPONENTS (texting-stages.jsx). Each fits 1280×820 with no scroll.

const useTextingForm = (initialStage = 0, initialData = null) => {
  const [stage, setStage] = React.useState(initialStage);
  const [data, setDataRaw] = React.useState(() => initialData || emptyData());
  const setData = patch => setDataRaw(d => ({ ...d, ...patch }));
  const next = () => setStage(s => Math.min(s+1, 6));
  const prev = () => setStage(s => Math.max(s-1, 0));
  return { stage, setStage, data, setData, next, prev };
};

const TigerLogo = () => (
  <div className="tg-logo">
    <div className="tg-logo-mark">i</div>
    <div className="tg-brand-name">icans</div>
    <span className="tg-divider"/>
    <span className="tg-product">Texting Application</span>
  </div>
);

const HelpBtn = () => (
  <button className="tg-hdr-help">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
    Help
  </button>
);

const Foot = ({ stage, onPrev, onNext, onSubmit, hint, canNext = true }) => {
  const isLast = stage === 3;
  return (
    <>
      {stage > 1 ? (
        <button className="tg-btn tg-btn-ghost" onClick={onPrev}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
      ) : <span/>}
      <span className="va-foot-mid">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        {hint || 'Saved automatically · 256-bit encrypted'}
      </span>
      <button className="tg-btn tg-btn-primary" onClick={isLast ? onSubmit : onNext} disabled={!canNext}>
        {isLast ? 'Submit application' : 'Continue'}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </>
  );
};

// ============================================================
// Variation A — Top stepper + form card with side info rail
// ============================================================
const VariationA = ({ initialStage = 0, initialData = null }) => {
  const { stage, setStage, data, setData, next, prev } = useTextingForm(initialStage, initialData);

  if (stage === 0) return <WelcomeA onStart={() => setStage(1)}/>;
  if (stage === 3) return <SuccessScreen data={data}/>;

  const StageBody = STAGE_COMPONENTS[stage];
  const meta = STAGES[stage-1];

  return (
    <div className="tg-art" data-screen-label={`A — ${meta.title}`}>
      <header className="tg-hdr">
        <TigerLogo/>
        <div className="tg-hdr-spacer"/>
        <HelpBtn/>
      </header>

      <main className="va-main">
        <div className="va-stepper">
          {STAGES.map((s, i) => {
            const idx = i + 1;
            const cls = idx === stage ? 'va-step va-step-active' : idx < stage ? 'va-step va-step-done' : 'va-step';
            return (
              <button key={s.num} className={cls} onClick={() => setStage(idx)}>
                <div className="va-step-num">{idx < stage ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg> : idx}</div>
                <div className="va-step-body">
                  <span className="va-step-eyebrow">{s.eyebrow}</span>
                  <span className="va-step-title">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="va-stage">
          <div className="va-card">
            <div className="va-stage-head">
              <div>
                <div className="va-stage-eyebrow">Step {stage} of 5 · {meta.eyebrow.replace('Step ','')}</div>
                <h2 className="va-stage-title">{meta.title}</h2>
                <p className="va-stage-sub">{meta.sub}</p>
              </div>
              <span className="va-stage-progress">{Math.round(stageProgress(data, stage)*100)}% complete</span>
            </div>
            <div className="va-stage-body">
              <StageBody data={data} setData={setData} goTo={setStage}/>
            </div>
            <div className="va-foot">
              <Foot stage={stage} onPrev={prev} onNext={next} onSubmit={() => setStage(3)}/>
            </div>
          </div>

          <aside className="va-rail">
            <div className="va-rail-card">
              <p className="va-rail-eyebrow">What happens next</p>
              <h3 className="va-rail-title">After you submit</h3>
              <ul className="va-rail-list">
                <li><span className="va-tick"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></span><div>Compliance review — typically 2–3 business days.</div></li>
                <li><span className="va-tick"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></span><div>Carrier registration with mobile networks.</div></li>
                <li><span className="va-tick"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></span><div>Texting goes live in your dashboard.</div></li>
              </ul>
            </div>
            <div className="va-rail-card dark">
              <p className="va-rail-eyebrow">Need a hand?</p>
              <h3 className="va-rail-title">Talk to compliance</h3>
              <p style={{fontSize:'12.5px', lineHeight:1.5, color:'rgba(255,255,255,0.78)', margin:0}}>
                Sample messages got rejected before? Our team will pre-review yours. Reply within the hour, M–F.
              </p>
              <button className="tg-btn tg-btn-ghost" style={{marginTop:'12px', background:'rgba(255,255,255,0.12)', borderColor:'rgba(255,255,255,0.32)', color:'white'}}>
                Schedule a 15-min call
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

// ============================================================
// Variation B — Side rail stepper + centered card
// ============================================================
const VariationB = ({ initialStage = 0, initialData = null }) => {
  const { stage, setStage, data, setData, next, prev } = useTextingForm(initialStage, initialData);

  if (stage === 0) return <WelcomeB onStart={() => setStage(1)}/>;
  if (stage === 3) return <SuccessScreen data={data}/>;

  const StageBody = STAGE_COMPONENTS[stage];
  const meta = STAGES[stage-1];
  const pct = Math.round(overallProgress(data) * 100);

  return (
    <div className="tg-art" data-screen-label={`B — ${meta.title}`}>
      <header className="tg-hdr">
        <TigerLogo/>
        <div className="tg-hdr-spacer"/>
        <HelpBtn/>
      </header>

      <main className="vb-main">
        <aside className="vb-side">
          <div>
            <div className="vb-side-eyebrow">Application</div>
            <h2 className="vb-side-title">Enable Texting<br/>on your Account</h2>
          </div>
          <div className="vb-side-progress">
            <div className="vb-side-progress-row">
              <span className="vb-side-progress-pct">{pct}%</span>
              <span className="vb-side-progress-meta">complete</span>
            </div>
            <div className="vb-side-progress-bar"><div style={{width: pct + '%'}}/></div>
          </div>
          <div className="vb-vsteps">
            {STAGES.map((s, i) => {
              const idx = i + 1;
              const cls = idx === stage ? 'vb-vstep vb-vstep-active' : idx < stage ? 'vb-vstep vb-vstep-done' : 'vb-vstep';
              return (
                <button key={s.num} className={cls} onClick={() => setStage(idx)}>
                  <div className="vb-vstep-num">{idx < stage ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg> : idx}</div>
                  <div className="vb-vstep-body">
                    <span className="vb-vstep-eyebrow">{s.eyebrow}</span>
                    <span className="vb-vstep-title">{s.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="vb-stage-wrap">
          <div className="vb-card">
            <div className="vb-card-meta">
              <span className="vb-card-meta-stage">{meta.eyebrow}</span>
              <span className="vb-card-meta-step">{stage} / 4</span>
            </div>
            <h2 className="vb-card-title">{meta.title}</h2>
            <p className="vb-card-sub">{meta.sub}</p>
            <div className="vb-card-body">
              <StageBody data={data} setData={setData} goTo={setStage}/>
            </div>
            <div className="vb-card-foot">
              <Foot stage={stage} onPrev={prev} onNext={next} onSubmit={() => setStage(3)}/>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================
// Variation C — Conversational, single focused stage, big type
// ============================================================
const VariationC = ({ initialStage = 0, initialData = null }) => {
  const { stage, setStage, data, setData, next, prev } = useTextingForm(initialStage, initialData);

  if (stage === 0) return <WelcomeC onStart={() => setStage(1)}/>;
  if (stage === 3) return <SuccessScreen data={data}/>;

  const StageBody = STAGE_COMPONENTS[stage];
  const meta = STAGES[stage-1];
  const pct = Math.round(overallProgress(data) * 100);

  return (
    <div className="tg-art" data-screen-label={`C — ${meta.title}`}>
      <header className="tg-hdr">
        <TigerLogo/>
        <div className="tg-hdr-spacer"/>
        <HelpBtn/>
      </header>

      <main className="vb-main">
        <aside className="vb-side">
          <div>
            <div className="vb-side-eyebrow">Application</div>
            <h2 className="vb-side-title">Enable Texting<br/>on your Account</h2>
          </div>
          <div className="vb-vsteps">
            {STAGES.map((s, i) => {
              const idx = i + 1;
              const cls = idx === stage ? 'vb-vstep vb-vstep-active' : idx < stage ? 'vb-vstep vb-vstep-done' : 'vb-vstep';
              return (
                <button key={s.num} className={cls} onClick={() => setStage(idx)}>
                  <div className="vb-vstep-num">{idx < stage ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg> : idx}</div>
                  <div className="vb-vstep-body">
                    <span className="vb-vstep-eyebrow">{s.eyebrow}</span>
                    <span className="vb-vstep-title">{s.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="vc-stage">
          <svg className="vc-bg" viewBox="0 0 800 600" preserveAspectRatio="none">
            <circle cx="200" cy="180" r="160" fill="rgba(63,185,76,0.18)"/>
            <circle cx="650" cy="450" r="220" fill="rgba(73,74,125,0.10)"/>
            <circle cx="500" cy="120" r="80" fill="rgba(244,122,31,0.10)"/>
          </svg>
          <div className="vc-card">
            <div className="vc-meta">
              <span className="stage">{meta.eyebrow}</span>
            </div>
            <h1 className="vc-q-title">{meta.title}</h1>
            <p className="vc-q-sub">{meta.sub}</p>
            <div className="vc-q-input">
              <StageBody data={data} setData={setData} goTo={setStage}/>
            </div>
            <div className="vc-q-foot">
              <span className="vc-q-hint"></span>
              <div style={{display:'flex', gap:'10px'}}>
                {stage > 1 && <button className="tg-btn tg-btn-ghost" onClick={prev}>Back</button>}
                <button className="tg-btn tg-btn-primary" onClick={stage === 2 ? () => setStage(3) : next}>
                  {stage === 2 ? 'Submit application' : 'Continue'} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================
// Variation D — Two-pane: green hero left + form card right
// ============================================================
const VariationD = ({ initialStage = 0, initialData = null }) => {
  const { stage, setStage, data, setData, next, prev } = useTextingForm(initialStage, initialData);

  if (stage === 0) return <WelcomeD onStart={() => setStage(1)}/>;
  if (stage === 3) return <SuccessScreen data={data}/>;

  const StageBody = STAGE_COMPONENTS[stage];
  const meta = STAGES[stage-1];
  const pct = Math.round(overallProgress(data) * 100);

  const stepIcons = [
    null,
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h2M9 13h2M9 17h2M13 9h2M13 13h2M13 17h2"/></svg>,
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>,
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.92V19a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.13 3.18 2 2 0 014.11 1H7a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8 9a16 16 0 006 6l1.36-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>,
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 15l2 2 4-4"/></svg>,
  ];

  const stepTips = {
    1: { title: 'Tip — match exactly', body: 'Your legal name must match your IRS records, including LLC / Corp suffix. We verify against the EIN.' },
    2: { title: 'Tip — be specific', body: 'Carriers reject vague use cases. "Order receipts to checkout customers" beats "transactional".' },
    3: { title: 'Tip — clear consent', body: 'Disclosure should list message frequency, data rates, STOP/HELP keywords, and a privacy link.' },
    4: { title: 'Tip — owner email', body: 'Use a domain-matched email (you@yourbusiness.com). Free emails slow review.' },
    5: { title: 'Tip — sign promptly', body: 'Once submitted, your application enters the carrier queue within 30 minutes.' },
  };
  const tip = stepTips[stage];

  return (
    <div className="tg-art" data-screen-label={`D — ${meta.title}`}>
      <header className="tg-hdr">
        <TigerLogo/>
        <div className="tg-hdr-spacer"/>
        <HelpBtn/>
      </header>

      <main className="vd-main">
        <div className="vd-pinned-progress">
          <div className="vd-pin-track">
            {STAGES.map((s, i) => (
              <div key={s.num} className="vd-pin-segment">
                <div className="vd-pin-segment-fill" style={{transform: `scaleX(${i+1 < stage ? 1 : i+1 === stage ? 0.5 : 0})`}}/>
              </div>
            ))}
          </div>
          <div className="vd-pin-meta">
            <span className="vd-pin-step-num">Step {stage}</span>
            <span>of 5 · {meta.title}</span>
          </div>
        </div>

        <div className="vd-stage">
          <div className="vd-illus-card">
            <div className="vd-illus-eyebrow">{meta.eyebrow}</div>
            <div className="vd-illus-icon">{stepIcons[stage]}</div>
            <h2 className="vd-illus-title">{meta.title}</h2>
            <p className="vd-illus-sub">{meta.sub}</p>
            <div className="vd-illus-tip">
              <div className="vd-illus-tip-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9 9l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
              </div>
              <div className="vd-illus-tip-body"><strong>{tip.title}</strong>{tip.body}</div>
            </div>
          </div>

          <div className="vd-form-card">
            <div className="vd-form-tabs">
              {STAGES.map((s, i) => {
                const idx = i + 1;
                const cls = idx === stage ? 'vd-form-tab active' : idx < stage ? 'vd-form-tab done' : 'vd-form-tab';
                return (
                  <button key={s.num} className={cls} onClick={() => setStage(idx)}>
                    <span className="vd-form-tab-num">{idx < stage ? '✓' : idx}</span>
                    <span>{s.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
            <div className="vd-form-body">
              <StageBody data={data} setData={setData} goTo={setStage}/>
            </div>
            <div className="vd-form-foot">
              <Foot stage={stage} onPrev={prev} onNext={next} onSubmit={() => setStage(3)}/>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================
// WELCOME SCREENS — one per variation
// ============================================================
const WELCOME_VPROPS = [
  { v: '6 min', l: 'Average time to complete' },
  { v: '< 4 days', l: 'Carrier review window' },
  { v: '93%', l: 'First-pass approval rate' },
  { v: '$0', l: 'Setup fees, ever' },
];

const WELCOME_CHECKLIST = [
  { t: 'EIN & business details', d: 'Same as on your last tax return.' },
  { t: 'Two sample messages', d: 'Real templates you plan to send.' },
  { t: 'Opt-in disclosure URL', d: 'Where customers see your SMS terms.' },
  { t: 'Phone number to enable', d: 'Local or toll-free, on your account.' },
];

const WelcomeA = ({ onStart }) => (
  <div className="tg-art" data-screen-label="A — Welcome">
    <header className="tg-hdr">
      <TigerLogo/><div className="tg-hdr-spacer"/><HelpBtn/>
    </header>
    <main className="va-main">
      <div className="va-welcome">
        <div className="va-welcome-left">
          <span className="va-welcome-eyebrow"><span className="dot"/>Texting · Account add-on</span>
          <h1 className="va-welcome-title">Get texting <span className="va-welcome-accent">live on your account</span> in days, not weeks.</h1>
          <p className="va-welcome-sub">Tell us about your business and how you'll use SMS, and we'll handle carrier registration, compliance review, and setup — all from one place.</p>
          <div className="va-vchips">
            <div className="va-vchip"><span className="va-vchip-tick"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></span>One application — covers <strong>all carriers</strong></div>
            <div className="va-vchip"><span className="va-vchip-tick"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></span>Pre-review by our compliance team — <strong>before submission</strong></div>
            <div className="va-vchip"><span className="va-vchip-tick"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></span>Save and resume — <strong>auto-saved as you go</strong></div>
          </div>
          <div className="va-welcome-cta-row">
            <button className="tg-btn tg-btn-primary tg-btn-large" onClick={onStart}>Start application →</button>
            <span className="va-welcome-note">Takes about 6 minutes</span>
          </div>
        </div>
        <div className="va-welcome-right">
          <span className="va-welcome-rate">What you'll need</span>
          <p className="va-welcome-rate-line">Have these ready before you start so you don't have to dig mid-application.</p>
          <div className="va-welcome-checklist">
            <ul>
              {WELCOME_CHECKLIST.map((c, i) => (
                <li key={i}>
                  <span className="num">{i+1}</span>
                  <div><strong>{c.t}</strong>{c.d}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="va-welcome-time">
            <div><div className="num">6 min</div><div className="lbl">to complete</div></div>
            <div><div className="num">2–3 days</div><div className="lbl">carrier review</div></div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const WelcomeB = ({ onStart }) => (
  <div className="tg-art" data-screen-label="B — Welcome">
    <header className="tg-hdr">
      <TigerLogo/><div className="tg-hdr-spacer"/><HelpBtn/>
    </header>
    <main className="vb-main">
      <div className="vb-welcome">
        <AuroraBg variant="b"/>
        <div className="vb-welcome-content">
          <div className="vb-welcome-left">
            <span className="vb-welcome-eyebrow welcome-rise d1"><span className="dot"/>Apply for texting</span>
            <h1 className="vb-welcome-h1 welcome-rise d2">Send texts your customers <em>actually open.</em></h1>
            <p className="vb-welcome-lede welcome-rise d3">A 5-step application to enable A2P SMS on your icans account. Pre-reviewed by our compliance team. Carrier-registered for you.</p>
            <div className="vb-welcome-stats welcome-rise d4">
              {WELCOME_VPROPS.map((p, i) => (
                <div key={i}><div className={'v' + (i === 2 ? ' brand' : '')}>{p.v}</div><div className="l">{p.l}</div></div>
              ))}
            </div>
            <div className="vb-welcome-cta-row welcome-rise d5">
              <button className="tg-btn tg-btn-primary tg-btn-large" onClick={onStart}>Start application →</button>
            </div>
          </div>
          <div className="phone-frame-b welcome-rise d3">
            <PhoneConversation/>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const WelcomeC = ({ onStart }) => (
  <div className="tg-art" data-screen-label="C — Welcome">
    <header className="tg-hdr">
      <TigerLogo/><div className="tg-hdr-spacer"/><HelpBtn/>
    </header>
    <main className="vc-main">
      <div className="vc-welcome">
        <AuroraBg variant="c"/>
        <div className="vc-welcome-card vc-welcome-card-twocol" style={{position: 'relative', zIndex: 1}}>
          <div>
            <div className="vc-welcome-logo welcome-rise d1">i</div>
            <span className="vc-welcome-eyebrow welcome-rise d1">Texting · Account add-on</span>
            <h1 className="vc-welcome-title welcome-rise d2">Apply for Texting <em>in Just Two Quick Steps</em></h1>
            <p className="vc-welcome-sub welcome-rise d3">One question at a time. We'll handle carrier registration so you can focus on what to say, not who to send it through.</p>
            <div className="vc-welcome-vchips welcome-rise d4">
              {WELCOME_VPROPS.map((p, i) => (
                <div key={i} className="vc-welcome-vchip">
                  <div className="v">{p.v}</div>
                  <div className="l">{p.l}</div>
                </div>
              ))}
            </div>
            <div className="vc-welcome-cta-row welcome-rise d5">
              <button className="tg-btn tg-btn-primary tg-btn-large" onClick={onStart}>Begin Application →</button>
            </div>
          </div>
          <div className="phone-frame-c welcome-rise d2">
            <PhoneConversation/>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const _OldWelcomeC = () => (
  <div className="tg-art" data-screen-label="C — Welcome">
    <header className="tg-hdr">
      <TigerLogo/><div className="tg-hdr-spacer"/><HelpBtn/>
    </header>
    <main className="vc-main">
      <div className="vc-welcome">
        <svg className="vc-bg" viewBox="0 0 800 600" preserveAspectRatio="none">
          <circle cx="180" cy="160" r="180" fill="rgba(63,185,76,0.18)"/>
          <circle cx="650" cy="500" r="200" fill="rgba(73,74,125,0.12)"/>
        </svg>
        <div className="vc-welcome-card">
          <div className="vc-welcome-logo">i</div>
          <span className="vc-welcome-eyebrow">Texting · Account add-on</span>
          <h1 className="vc-welcome-title">Apply for Texting <em>in Just Two Quick Steps</em></h1>
          <p className="vc-welcome-sub">One question at a time. We'll handle carrier registration so you can focus on what to say, not who to send it through.</p>
          <div className="vc-welcome-vchips">
            {WELCOME_VPROPS.map((p, i) => (
              <div key={i} className="vc-welcome-vchip">
                <div className="v">{p.v}</div>
                <div className="l">{p.l}</div>
              </div>
            ))}
          </div>
          <div className="vc-welcome-cta-row">
            <button className="tg-btn tg-btn-primary tg-btn-large" onClick={onStart}>Begin Application →</button>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const WelcomeD = ({ onStart }) => (
  <div className="tg-art" data-screen-label="D — Welcome">
    <header className="tg-hdr">
      <TigerLogo/><div className="tg-hdr-spacer"/><HelpBtn/>
    </header>
    <main className="vd-main">
      <div className="vd-welcome">
        <div className="vd-welcome-left">
          <span className="vd-welcome-eyebrow"><span className="dot"/>Texting · Account add-on</span>
          <h1 className="vd-welcome-h1">Texting that <em>your customers</em> will actually answer.</h1>
          <p className="vd-welcome-lede">Apply once. We handle carrier registration, compliance, and setup. You focus on what to send.</p>
          <div className="vd-welcome-stats-row">
            <div className="vd-welcome-stat"><div className="v">6<small>min</small></div><div className="l">Average time to apply</div></div>
            <div className="vd-welcome-stat"><div className="v">93<small>%</small></div><div className="l">First-pass approval</div></div>
            <div className="vd-welcome-stat"><div className="v">2–3<small>days</small></div><div className="l">Carrier review</div></div>
            <div className="vd-welcome-stat"><div className="v">$0</div><div className="l">Setup fees</div></div>
          </div>
          <div className="vd-welcome-cta-row">
            <button className="tg-btn tg-btn-primary tg-btn-large" onClick={onStart}>Start application →</button>
          </div>
        </div>
        <div className="vd-welcome-right">
          <h3>The road ahead</h3>
          <h2>Five short stages</h2>
          <div className="vd-welcome-roadmap">
            {STAGES.map((s, i) => (
              <div key={s.num} className="vd-rd-step">
                <div className="vd-rd-icon">
                  <span style={{fontWeight:700, fontSize:'14px'}}>{s.num}</span>
                </div>
                <div className="vd-rd-body">
                  <strong>{s.title}</strong>
                  <span>{s.sub}</span>
                  <span className="vd-rd-time">~ {[1.5, 2, 1, 1, 0.5][i]} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);

// ============================================================
// SUCCESS SCREEN (shared)
// ============================================================
const SuccessScreen = ({ data }) => {
  const [confetti] = React.useState(() => {
    const colors = ['#3FB94C', '#494A7D', '#F47A1F', '#FFD16C', '#66D873'];
    return Array.from({length: 60}).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      duration: 2.4 + Math.random() * 1.4,
    }));
  });
  return (
    <div className="tg-art" data-screen-label="Success">
      <header className="tg-hdr">
        <TigerLogo/><div className="tg-hdr-spacer"/><HelpBtn/>
      </header>
      <main className="tg-success">
        <div className="tg-confetti">
          {confetti.map((c, i) => (
            <span key={i} style={{left: c.left + '%', background: c.color, animationDelay: c.delay + 's', animationDuration: c.duration + 's', transform: `rotate(${c.rotate}deg)`}}/>
          ))}
        </div>
        <div className="tg-success-mark">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
        </div>
        <h1>Your Application is in.</h1>
        <p>We've sent a confirmation to <strong>{data.primaryEmail || 'your email'}</strong>. Carrier review starts now — most applications clear within 3–4 days.</p>
        <div className="tg-success-next">
          <div className="tg-success-step">
            <div className="tg-success-step-num">Right now</div>
            <h3 className="tg-success-step-title">Compliance Pre-Check</h3>
            <p className="tg-success-step-desc">Our team reviews your sample messages and opt-in flow. We'll flag anything carriers might reject.</p>
          </div>
          <div className="tg-success-step">
            <div className="tg-success-step-num">In 3–4 days</div>
            <h3 className="tg-success-step-title">Carrier Registration</h3>
            <p className="tg-success-step-desc">Your phone number is registered with all major US carriers under your business profile.</p>
          </div>
          <div className="tg-success-step">
            <div className="tg-success-step-num">When approved</div>
            <h3 className="tg-success-step-title">Texting Goes Live</h3>
            <p className="tg-success-step-desc">A "Send a text" button appears in your icans dashboard. Send your first message right away.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

Object.assign(window, { VariationA, VariationB, VariationC, VariationD, SuccessScreen });
