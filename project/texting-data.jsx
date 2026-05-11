// Texting Application — field definitions, sample data, helpers.
// Shared across all layout variations.

const STAGES = [
  { num: 1, eyebrow: 'Step 01', title: 'Business & Contact',  sub: 'The business that wants to text, and who runs the account.' },
  { num: 2, eyebrow: 'Step 02', title: 'Business Address',    sub: 'Desired area code, the business address on your IRS EIN letter, and your text plan.' },
];

const USE_CASES = [
  { v: 'receipts',      l: 'Payment receipts & confirmations' },
  { v: 'reminders',     l: 'Appointment reminders' },
  { v: 'support',       l: 'Customer support replies' },
  { v: 'alerts',        l: 'Account alerts & notifications' },
  { v: 'marketing',     l: 'Promotions & marketing' },
  { v: 'two_way',       l: 'Two-way conversations' },
];

const OPT_IN_METHODS = [
  { v: 'web',     l: 'Web form on our site' },
  { v: 'paper',   l: 'Paper form at point of sale' },
  { v: 'verbal',  l: 'Verbal consent (in person / phone)' },
  { v: 'keyword', l: 'Customer texts a keyword to opt in' },
];

const VOLUMES = ['Under 1k / mo', '1k – 10k / mo', '10k – 50k / mo', '50k – 250k / mo', '250k+ / mo'];
const INDUSTRIES = ['Restaurant / Food service', 'Retail', 'Health & beauty', 'Professional services', 'Auto / Repair', 'Home services', 'Other'];
const BUSINESS_TYPES = [
  { v: 'llc',  l: 'LLC' },
  { v: 'corp', l: 'Corporation' },
  { v: 'sole', l: 'Sole proprietor' },
  { v: 'np',   l: 'Non-profit' },
];

function emptyData() {
  return {
    businessName: '', website: '', ein: '', irsLetter: '',
    firstName: '', lastName: '', phone: '', accountEmail: '',
    areaCode: '', address: '', businessAddress: '', city: '', state: '', country: '', postal: '',
    plan: '',
    consent: false,
  };
}

function sampleData() {
  return {
    businessName: 'OnlyCans Dumpster Rental, LLC',
    website: 'onlycans.com',
    ein: '12-3456789',
    irsLetter: 'IRS-CP575-OnlyCans.pdf',
    firstName: 'Mariana',
    lastName: 'Reyes',
    phone: '(404) 555-0182',
    accountEmail: 'mariana@onlycans.com',
    areaCode: '404',
    address: '1200 Peachtree St NE, Atlanta, GA',
    businessAddress: '1200 Peachtree St NE, Suite 220',
    city: 'Atlanta',
    state: 'GA',
    country: 'United States',
    postal: '30309',
    plan: 'plus',
    consent: true,
  };
}

// Fraction of fields completed for a given stage (used by progress UI).
function stageProgress(data, stage) {
  if (stage === 1) {
    const f = ['businessName','website','ein','firstName','lastName','phone','accountEmail'];
    return f.filter(k => !!data[k]).length / f.length;
  }
  if (stage === 2) {
    const f = ['areaCode','address','city','state','country','postal','plan'];
    return f.filter(k => !!data[k]).length / f.length;
  }
  return 0;
}

function overallProgress(data) {
  const stages = [1,2].map(s => stageProgress(data, s));
  return stages.reduce((a,b) => a+b, 0) / stages.length;
}

Object.assign(window, { STAGES, USE_CASES, OPT_IN_METHODS, VOLUMES, INDUSTRIES, BUSINESS_TYPES, emptyData, sampleData, stageProgress, overallProgress });
