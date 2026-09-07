/**
 * Account Aggregator providers — alternatives to Setu.
 *
 * PAN is NOT required for end-users to link banks (they use mobile + OTP).
 * Business registration (often with PAN) is only needed if YOU register as
 * an official FIU with Sahamati for production. For personal apps / prototypes,
 * use Path A (SMS + CSV) or Path B (sandbox with mobile signup).
 */

export type BankLinkPath = {
  id: string;
  title: string;
  needsPan: false;
  needsBusinessReg: boolean;
  description: string;
  steps: string[];
  action?: { label: string; route?: string; url?: string };
};

export type AaProvider = {
  id: string;
  name: string;
  signupUrl: string;
  docsUrl: string;
  note: string;
  /** Sandbox typically needs only mobile/email, not company PAN */
  sandboxSignup: string;
};

/** Recommended for users without PAN or company registration */
export const NO_PAN_PATHS: BankLinkPath[] = [
  {
    id: 'sms',
    title: 'Bank SMS (recommended)',
    needsPan: false,
    needsBusinessReg: false,
    description:
      'Every PhonePe, GPay, Paytm payment debits your bank — the bank sends an SMS. We read it on your phone only. No PAN, no third-party API.',
    steps: [
      'Grant SMS read permission on Android',
      'Pay via any UPI app as usual',
      'Transactions appear automatically in the app',
    ],
    action: { label: 'Set up SMS', route: '/sms-test' },
  },
  {
    id: 'csv',
    title: 'Bank statement CSV import',
    needsPan: false,
    needsBusinessReg: false,
    description:
      'Download a statement from net banking, paste the CSV — full history for books, GST, and predictions.',
    steps: [
      'Log in to net banking → Account statement',
      'Export as CSV for your date range',
      'Paste into Import Statement in the app',
    ],
    action: { label: 'Import CSV', route: '/import-statement' },
  },
  {
    id: 'local-predict',
    title: 'Real predictions from your data',
    needsPan: false,
    needsBusinessReg: false,
    description:
      'Cash flow forecast and income/expense stats are computed from YOUR SMS + imported transactions — no mock data once you have history.',
    steps: [
      'Connect via SMS or import at least 1 week of CSV',
      'Open Finance tab — forecast uses your actual spending rate',
    ],
    action: { label: 'Open Finance', route: '/(tabs)/finance' },
  },
];

/** Setu alternatives — same RBI AA framework, different providers */
export const AA_ALTERNATIVES: AaProvider[] = [
  {
    id: 'finvu',
    name: 'Finvu',
    signupUrl: 'https://finvu.github.io/sandbox/get_started.html',
    docsUrl: 'https://finvu.github.io/sandbox/',
    note: 'Free FIU sandbox, mobile signup. AA-agnostic — works like Setu but often easier for indie devs.',
    sandboxSignup: 'Email / mobile — no PAN for sandbox testing',
  },
  {
    id: 'onemoney',
    name: 'OneMoney',
    signupUrl: 'https://developer.onemoney.in',
    docsUrl: 'https://docs.onemoney.in/',
    note: 'India\'s first licensed AA. Data API + SDK for PFM apps. Sign up with mobile on developer portal.',
    sandboxSignup: 'Mobile number on developer portal',
  },
  {
    id: 'saafe',
    name: 'Saafe',
    signupUrl: 'https://sandbox.saafe.in/',
    docsUrl: 'https://sahamati.org.in/fip-fiu-connecting-with-account-aggregators/',
    note: 'RBI-licensed AA sandbox listed on Sahamati.',
    sandboxSignup: 'Contact techsupport@saafe.in for sandbox access',
  },
  {
    id: 'anumati',
    name: 'Anumati (Perfios AA)',
    signupUrl: 'https://www.anumati.co.in/',
    docsUrl: 'https://sahamati.org.in/fip-fiu-connecting-with-account-aggregators/',
    note: 'Another Sahamati-listed AA sandbox.',
    sandboxSignup: 'support@perfios-aa.com',
  },
  {
    id: 'setu',
    name: 'Setu (Bridge)',
    signupUrl: 'https://setu.co/data/account-aggregator',
    docsUrl: 'https://docs.setu.co/data/account-aggregator/api-integration',
    note: 'Same AA framework — optional if you prefer Bridge dashboard.',
    sandboxSignup: 'Bridge account — sandbox without production FIU license',
  },
];

export function getRecommendedPath(hasSms: boolean, hasImported: boolean): BankLinkPath {
  if (hasSms) return NO_PAN_PATHS[2];
  if (hasImported) return NO_PAN_PATHS[2];
  return NO_PAN_PATHS[0];
}
