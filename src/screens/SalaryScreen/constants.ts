// Mock payroll data for the fleet-driver salary tab. Every figure the screen
// shows is derived from these raw numbers so the summary card, the breakdown
// and the history table can never disagree with each other.

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PAY_STATUS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
};

// Only the months the driver has actually been paid for exist here — the
// dropdown lists these, not all twelve.
const PAYROLL = {
  January: {loadPay: 3000, fuelSurcharge: 400, accessorial: 300, bonus: 600, deductions: 300, status: PAY_STATUS.PAID},
  February: {loadPay: 5200, fuelSurcharge: 900, accessorial: 400, bonus: 800, deductions: 300, status: PAY_STATUS.PAID},
  March: {loadPay: 5200, fuelSurcharge: 900, accessorial: 400, bonus: 800, deductions: 300, status: PAY_STATUS.PAID},
  April: {loadPay: 5100, fuelSurcharge: 950, accessorial: 450, bonus: 800, deductions: 300, status: PAY_STATUS.PAID},
  May: {loadPay: 5200, fuelSurcharge: 900, accessorial: 400, bonus: 800, deductions: 300, status: PAY_STATUS.PAID},
  June: {loadPay: 3000, fuelSurcharge: 400, accessorial: 300, bonus: 850, deductions: 250, status: PAY_STATUS.PAID},
  July: {loadPay: 3400, fuelSurcharge: 450, accessorial: 300, bonus: 700, deductions: 250, status: PAY_STATUS.PROCESSING},
};

// `-$250.00` rather than `$-250.00`, and grouped without leaning on Intl —
// Hermes ships it, but the manual grouping keeps every platform identical.
export const money = (value: number): string => {
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${value < 0 ? '-' : ''}$${grouped}.${dec}`;
};

// Compact form for the chips under the headline amount ($3,200 not $3,200.00).
export const moneyShort = (value: number): string =>
  money(value).replace(/\.00$/, '');

/** One month's raw payroll figures, as PAYROLL holds them. */
interface RawPayroll {
  loadPay: number;
  fuelSurcharge: number;
  accessorial: number;
  bonus: number;
  deductions: number;
  status: string;
}

const derive = (month: string, raw: RawPayroll) => {
  const base = raw.loadPay + raw.fuelSurcharge + raw.accessorial;
  const totalEarnings = base + raw.bonus;

  return {
    month,
    status: raw.status,
    base,
    bonus: raw.bonus,
    deductions: raw.deductions,
    totalEarnings,
    netPay: totalEarnings - raw.deductions,
    breakdown: [
      {key: 'load', label: 'Load Pay', value: raw.loadPay},
      {key: 'fuel', label: 'Fuel Surcharge', value: raw.fuelSurcharge},
      {key: 'accessorial', label: 'Accessorial pay', value: raw.accessorial},
      {key: 'bonus', label: 'Performance bonus', value: raw.bonus},
    ],
  };
};

export const SALARY_BY_MONTH = Object.keys(PAYROLL).reduce<
  Record<string, ReturnType<typeof derive>>
>((acc, month) => {
  acc[month] = derive(month, PAYROLL[month as keyof typeof PAYROLL]);
  return acc;
}, {});

// Dropdown + history share one order: calendar order, newest paid month last.
export const PAID_MONTHS = MONTHS.filter(m => SALARY_BY_MONTH[m]);

export const SALARY_HISTORY = PAID_MONTHS.map(m => SALARY_BY_MONTH[m]);

export const DEFAULT_MONTH = PAID_MONTHS[PAID_MONTHS.length - 1];
