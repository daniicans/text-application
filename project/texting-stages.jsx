// Stage form bodies — same content, reused across all layout variations.
// Each stage receives `data`, `setData(patch)`.

const Field = ({ label, required, children, full }) => (
  <div className={'tg-field' + (full ? ' tg-field-full' : '')}>
    <label className="tg-lbl">{label}{required && <span className="req">*</span>}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, type='text' }) => (
  <input className="tg-inp" type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
);
const Select = ({ value, onChange, children }) => (
  <select className="tg-sel" value={value || ''} onChange={e => onChange(e.target.value)}>{children}</select>
);
const Textarea = ({ value, onChange, placeholder, rows=3 }) => (
  <textarea className="tg-txt" rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
);
const FileDrop = ({ value, onChange }) => (
  <div className="tg-filedrop" onClick={() => onChange(value ? '' : 'IRS-CP575-OnlyCans.pdf')}>
    {value ? (
      <div className="tg-filedrop-on">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/></svg>
        <span>{value}</span>
        <span className="tg-filedrop-x">Remove</span>
      </div>
    ) : (
      <div className="tg-filedrop-empty">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <span>PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF</span>
      </div>
    )}
  </div>
);

// ---------- Multi-pick chip cards ----------
const ChipPick = ({ options, values, onChange }) => (
  <div className="tg-radio-grid">
    {options.map(o => {
      const on = values.includes(o.v);
      return (
        <label key={o.v} className="tg-rad" style={on ? {background:'var(--brand-50)', borderColor:'var(--brand)', color:'var(--brand-deep)'} : null}>
          <input type="checkbox" checked={on} onChange={() => onChange(on ? values.filter(v=>v!==o.v) : [...values, o.v])}/>
          <span className="tg-rad-dot" style={on ? {borderColor:'var(--brand)', background:'var(--brand)', boxShadow:'inset 0 0 0 3px white'} : null}/>
          <span>{o.l}</span>
        </label>
      );
    })}
  </div>
);

const RadioPick = ({ options, value, onChange }) => (
  <div className="tg-radio-grid">
    {options.map(o => (
      <label key={o.v} className="tg-rad">
        <input type="radio" checked={value === o.v} onChange={() => onChange(o.v)}/>
        <span className="tg-rad-dot"/>
        <span>{o.l}</span>
      </label>
    ))}
  </div>
);

const YesNo = ({ value, onChange }) => (
  <RadioPick options={[{v:'yes',l:'Yes'},{v:'no',l:'No'}]} value={value} onChange={onChange}/>
);

// ---------- Stage 1 — Business & contact ----------
const Stage1 = ({ data, setData }) => (
  <div className="tg-fields">
    <Field label="Business Name" required full>
      <Input value={data.businessName} onChange={v=>setData({businessName:v})} placeholder="Your Business Name"/>
    </Field>
    <Field label="Website" required>
      <Input value={data.website} onChange={v=>setData({website:v})} placeholder="Web URL goes here"/>
    </Field>
    <Field label="EIN Number" required>
      <Input value={data.ein} onChange={v=>setData({ein:v})} placeholder="EIN Number"/>
    </Field>
    <Field label="IRS Verification Letter Upload" full>
      <FileDrop value={data.irsLetter} onChange={v=>setData({irsLetter:v})}/>
    </Field>
    <div className="tg-fields-divider" />
    <Field label="First Name">
      <Input value={data.firstName} onChange={v=>setData({firstName:v})} placeholder="First Name"/>
    </Field>
    <Field label="Last Name">
      <Input value={data.lastName} onChange={v=>setData({lastName:v})} placeholder="Last Name"/>
    </Field>
    <Field label="Phone">
      <Input value={data.phone} onChange={v=>setData({phone:v})} placeholder="Phone"/>
    </Field>
    <Field label="Account Email" required>
      <Input value={data.accountEmail} onChange={v=>setData({accountEmail:v})} placeholder="Account Email"/>
    </Field>
  </div>
);

// ---------- Stage 2 — Business Address (with plan picker) ----------
const Stage3 = ({ data, setData }) => (
  <div className="tg-fields">
    <Field label="Desired Area Code for your texting phone number" required full>
      <Input value={data.areaCode} onChange={v=>setData({areaCode:v})} placeholder="e.g. 404 — area code your texts will send from"/>
    </Field>
    <Field label="Business Address (as listed on your IRS EIN letter)" required full>
      <Input value={data.address} onChange={v=>setData({address:v})} placeholder="Street address from your IRS CP-575 / EIN letter"/>
    </Field>
    <Field label="City">
      <Input value={data.city} onChange={v=>setData({city:v})} placeholder="City"/>
    </Field>
    <Field label="State">
      <Input value={data.state} onChange={v=>setData({state:v})} placeholder="State"/>
    </Field>
    <Field label="Country">
      <Select value={data.country} onChange={v=>setData({country:v})}>
        <option value="">Country</option>
        <option>United States</option>
        <option>Canada</option>
      </Select>
    </Field>
    <Field label="Postal Code">
      <Input value={data.postal} onChange={v=>setData({postal:v})} placeholder="Postal Code"/>
    </Field>
    <div className="tg-fields-divider" />
    <Field label="Text Subscription" required full>
      <div className="tg-radio-grid tg-plan-grid">
        {[
          { v: 'growth', l: 'Growth', price: '$159/month', sub: '1,000 Messages' },
          { v: 'plus',   l: 'Plus',   price: '$199/month', sub: '2,000 Messages' },
        ].map(o => {
          const on = data.plan === o.v;
          return (
            <label key={o.v} className="tg-rad tg-plan" style={on ? {background:'var(--brand-50)', borderColor:'var(--brand)'} : null}>
              <input type="radio" checked={on} onChange={() => setData({plan: o.v})}/>
              <span className="tg-rad-dot" style={on ? {borderColor:'var(--brand)', background:'var(--brand)', boxShadow:'inset 0 0 0 3px white'} : null}/>
              <div className="tg-plan-body">
                <div className="tg-plan-name">{o.l} — {o.price}</div>
                <div className="tg-plan-sub">{o.sub}</div>
              </div>
            </label>
          );
        })}
      </div>
    </Field>
  </div>
);

const STAGE_COMPONENTS = [null, Stage1, Stage3];

Object.assign(window, { Field, Input, Select, Textarea, ChipPick, RadioPick, YesNo, Stage1, Stage3, STAGE_COMPONENTS });
