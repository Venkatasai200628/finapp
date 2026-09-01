/**
 * Run with:  npx tsx lib/smsParser.test.ts
 *
 * Samples follow the real formats used by HDFC / SBI / ICICI / Axis / Kotak
 * and the common UPI-app confirmations. Account numbers and refs are fake.
 */
import { parseTransactionSms } from './smsParser';

type Expectation = {
  name: string;
  sms: string;
  expect: null | { amount: number; merchant?: string; category?: string };
};

const CASES: Expectation[] = [
  // ---------- debits, per bank ----------
  {
    name: 'HDFC UPI debit to VPA',
    sms: 'Rs.450.00 debited from a/c XX1234 on 02-09-25 to VPA swiggy@ybl. Ref 123456789012. Not you? Call 18002586161',
    expect: { amount: -450, merchant: 'Swiggy', category: 'Food' },
  },
  {
    name: 'SBI trf-to format (no currency marker)',
    sms: 'Dear UPI user A/C X1234 debited by 450.0 on date 02Sep25 trf to ZOMATO Refno 123456789012. If not u? call 1800111109. -SBI',
    expect: { amount: -450, merchant: 'Zomato', category: 'Food' },
  },
  {
    name: 'ICICI semicolon-credited format',
    sms: 'ICICI Bank Acct XX123 debited for Rs 1250.00 on 02-Sep-25; BIGBASKET credited. UPI:123456789012. Call 18002662 for dispute.',
    expect: { amount: -1250, merchant: 'Bigbasket', category: 'Groceries' },
  },
  {
    name: 'Axis Info:UPI/P2M format',
    sms: 'INR 320.00 debited from A/c no. XX1234 on 02-09-25 IST. Info: UPI/P2M/123456789/UBER. Avl Bal INR 12345.67',
    expect: { amount: -320, merchant: 'Uber', category: 'Transport' },
  },
  {
    name: 'Card swipe at merchant',
    sms: 'Rs 2,499.00 spent on your HDFC Bank Card xx4321 at AMAZON on 02-09-25. Not you? Call 18002586161',
    expect: { amount: -2499, merchant: 'Amazon', category: 'Shopping' },
  },
  {
    name: 'Indian lakh grouping',
    sms: 'Rs.1,04,700.00 debited from a/c XX1234 on 02-09-25 to VPA builder@okaxis. Ref 998877665544.',
    expect: { amount: -104700 },
  },
  {
    name: 'Subscription debit',
    sms: 'INR 649.00 debited from A/c no. XX5678 on 01-09-25 IST. Info: UPI/P2M/887766554/NETFLIX. Avl Bal INR 8000.00',
    expect: { amount: -649, merchant: 'Netflix', category: 'Subscription' },
  },

  // ---------- credits ----------
  {
    name: 'Salary credit',
    sms: 'Dear Customer, INR 45,000.00 credited to your A/c No XX1234 on 02/09/2025 towards SALARY. Avl Bal INR 57,345.67',
    expect: { amount: 45000, category: 'Income' },
  },
  {
    name: 'Incoming UPI credit',
    sms: 'Rs.500.00 credited to a/c XX1234 on 02-09-25 from VPA friend.name@ybl. Ref 112233445566.',
    expect: { amount: 500 },
  },

  // ---------- must be ignored ----------
  { name: 'OTP', sms: '123456 is your OTP for a transaction of Rs.450 at SWIGGY. Do not share this with anyone.', expect: null },
  { name: 'Bill due reminder', sms: 'Your credit card bill of Rs.12,500 is due on 15-09-25. Pay now to avoid charges.', expect: null },
  { name: 'Failed transaction', sms: 'Your transaction of Rs.450.00 to SWIGGY has failed. The amount will be refunded in 3-5 days.', expect: null },
  { name: 'Scheduled debit', sms: 'An amount of Rs.2,000 will be debited from your A/c XX1234 on 05-09-25 towards SIP.', expect: null },
  { name: 'Collect request', sms: 'MERCHANT has requested money Rs.450 on your UPI app. Approve only if you know the sender.', expect: null },
  { name: 'Promotional, no transaction', sms: 'Get flat 50% cashback up to Rs.200 on your next order. T&C apply.', expect: null },
  { name: 'Balance enquiry only', sms: 'Avl Bal in your A/c XX1234 as on 02-09-25 is INR 12,345.67.', expect: null },
];

let passed = 0;
const failures: string[] = [];

for (const testCase of CASES) {
  const result = parseTransactionSms(testCase.sms);

  if (testCase.expect === null) {
    if (result === null) {
      passed++;
    } else {
      failures.push(`${testCase.name}: expected to be ignored, but parsed ${JSON.stringify(result)}`);
    }
    continue;
  }

  if (result === null) {
    failures.push(`${testCase.name}: expected a transaction, got null`);
    continue;
  }

  const problems: string[] = [];
  if (result.amount !== testCase.expect.amount) {
    problems.push(`amount ${result.amount} != ${testCase.expect.amount}`);
  }
  if (testCase.expect.merchant && result.merchant !== testCase.expect.merchant) {
    problems.push(`merchant "${result.merchant}" != "${testCase.expect.merchant}"`);
  }
  if (testCase.expect.category && result.category !== testCase.expect.category) {
    problems.push(`category "${result.category}" != "${testCase.expect.category}"`);
  }

  if (problems.length) {
    failures.push(`${testCase.name}: ${problems.join(', ')}`);
  } else {
    passed++;
  }
}

console.log(`\n${passed}/${CASES.length} passed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All SMS parser cases passed.\n');
