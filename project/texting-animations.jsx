// Phone conversation mock — cycles through a 4-message script.
// Used in Welcome screens for B and C.

const PHONE_SCRIPT = [
  { kind: 'time',   text: '11:04 AM' },
  { kind: 'them',   text: 'Hi! Your 20 Yard Dumpster is on the way! Please make sure the area is ready for delivery. Estimated time of Arrival is 23 minutes.' },
  { kind: 'typing' },
  { kind: 'us',     text: 'Perfect timing! Moving my car now, Thank you!' },
  { kind: 'time',   text: '11:33 AM' },
  { kind: 'them',   text: 'Your 20 Yard Dumpster has been delivered. Thank you for choosing OnlyCans!' },
];

const PHONE_DELAYS = [600, 2400, 1100, 1900, 1100, 2600]; // ms each step holds before advancing
const PHONE_RESET_DELAY = 2200;

const PhoneConversation = () => {
  const [step, setStep] = React.useState(0);
  const [tick, setTick] = React.useState(0); // bumps to force re-mount of bubbles on loop reset

  React.useEffect(() => {
    if (step >= PHONE_SCRIPT.length) {
      // hold full convo, then loop
      const t = setTimeout(() => { setStep(0); setTick(k => k+1); }, PHONE_RESET_DELAY);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(s => s + 1), PHONE_DELAYS[step]);
    return () => clearTimeout(t);
  }, [step]);

  const rawVisible = PHONE_SCRIPT.slice(0, step);
  // Once the actual message lands, drop the preceding typing bubble.
  const visible = rawVisible.filter((m, i) => {
    if (m.kind !== 'typing') return true;
    const next = rawVisible[i + 1];
    return !next || next.kind === 'typing';
  });

  return (
    <div className="phone-mock">
      <div className="phone-screen">
        <div className="phone-notch"/>
        <div className="phone-status">
          <span>9:41</span>
          <span className="icons">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2" height="4" rx="0.5"/><rect x="4" y="4" width="2" height="6" rx="0.5"/><rect x="8" y="2" width="2" height="8" rx="0.5"/><rect x="12" y="0" width="2" height="10" rx="0.5"/></svg>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 4 a6 6 0 0 1 12 0" strokeLinecap="round"/><path d="M3.5 6 a3.5 3.5 0 0 1 7 0" strokeLinecap="round"/><circle cx="7" cy="8" r="0.8" fill="currentColor"/></svg>
            <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="0.8"><rect x="0.5" y="0.5" width="18" height="9" rx="2"/><rect x="2" y="2" width="14" height="6" rx="0.5" fill="currentColor"/><rect x="20" y="3" width="1.5" height="4" rx="0.5" fill="currentColor"/></svg>
          </span>
        </div>
        <div className="phone-conv-header">
          <div className="phone-avatar"><span className="oc-o">O</span><span className="oc-c">C</span></div>
          <div className="phone-conv-name">OnlyCans</div>
        </div>
        <div className="phone-msgs" key={tick}>
          {visible.map((m, i) => {
            if (m.kind === 'typing') return <div key={i} className="phone-bubble is-typing"><span/><span/><span/></div>;
            if (m.kind === 'time') return <div key={i} className="phone-time-divider">{m.text}</div>;
            return <div key={i} className={'phone-bubble ' + (m.kind === 'us' ? 'from-us' : 'from-them')}>{m.text}</div>;
          })}
        </div>
        <div className="phone-input">
          <div className="phone-input-field">iMessage</div>
          <div className="phone-input-send">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuroraBg = ({ variant = 'b' }) => (
  <div className={variant === 'b' ? 'vb-welcome-aurora' : 'vc-welcome-aurora'} aria-hidden="true">
    <div className="blob blob-1"/>
    <div className="blob blob-2"/>
    <div className="blob blob-3"/>
  </div>
);

Object.assign(window, { PhoneConversation, AuroraBg });
