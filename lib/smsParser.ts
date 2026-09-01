/**
 * Parses Indian bank transaction SMS into structured transactions.
 *
 * This runs ON DEVICE and deliberately imports nothing — the raw SMS body
 * never leaves the phone. Only the parsed {amount, merchant, category}
 * result is sent to the engine.
 *
 * It is bank-agnostic on purpose: every UPI app (PhonePe, GPay, Navi,
 * SuperMoney, …) ultimately debits a bank account, and the *bank* sends the
 * SMS. So parsing bank SMS captures all of them at once, including apps
 * installed later, without integrating with any of them.
 */

export type ParsedSms = {
  /** Signed: negative for money out, positive for money in. */
  amount: number;
  merchant: string;
  category: string;
  accountHint?: string;
  reference?: string;
  /** 0-1. Below ~0.5 the result is a guess and shouldn't auto-alert. */
  confidence: number;
};

/**
 * Messages that mention money but are NOT a completed transaction. Checked
 * before anything else — an OTP or a "bill due" reminder parsed as a debit
 * would fire a false alert at the user.
 */
const NOT_A_TRANSACTION = [
  /\botp\b/i,
  /one[\s-]?time\s?password/i,
  /\bdo not share\b/i,
  /\bis due\b/i,
  /\bdue date\b/i,
  /\bpayment due\b/i,
  /\bdue on\b/i,
  /\bwill be debited\b/i, // scheduled, hasn't happened yet
  /\bfailed\b/i,
  /\bdeclined\b/i,
  /\bunsuccessful\b/i,
  /\breversed\b/i,
  /\brefund(ed)? (is )?(being )?process/i,
  /\brequest(ed|ing)? (money|payment)\b/i, // collect request, not a debit
];

const DEBIT_HINTS = /\b(debited|debit|sent|paid|spent|withdrawn|purchase(d)?)\b/i;
const CREDIT_HINTS = /\b(credited|credit|received|deposited)\b/i;

/** Ordered most-specific first; the first pattern that hits wins. */
const MERCHANT_PATTERNS: RegExp[] = [
  /\btrf\s+to\s+([A-Za-z0-9@._\- ]{2,40}?)(?=\s+ref|\s*\.|,|$)/i, // SBI
  /\bto\s+VPA\s+([\w.\-]+@[\w.\-]+)/i, // HDFC
  /\bInfo:\s*UPI\/[^/]*\/[^/]*\/([^/\n.]{2,40})/i, // Axis
  /\bInfo:\s*([A-Za-z0-9 &.\-]{2,40}?)(?=\s*\.|,|$)/i,
  /;\s*([A-Za-z0-9 &.\-]{2,40}?)\s+credited/i, // ICICI
  /\bto\s+([A-Za-z0-9 &.\-]{2,40}?)\s+on\b/i,
  /\bat\s+([A-Za-z0-9 &.\-]{2,40}?)\s+on\b/i, // card swipe
  /\bfrom\s+([\w.\-]+@[\w.\-]+)/i, // incoming UPI
  /([\w.\-]{2,}@[\w.\-]{2,})/, // bare VPA anywhere
];

const CATEGORY_KEYWORDS: Array<[string, RegExp]> = [
  ['Food', /swiggy|zomato|dominos|domino|pizza|mcdonald|kfc|starbucks|cafe|restaurant|eatery|biryani|dunzo food/i],
  ['Groceries', /bigbasket|blinkit|zepto|dmart|d-mart|grofers|instamart|reliance fresh|more retail|bazaar|supermarket|kirana/i],
  ['Transport', /uber|ola|rapido|irctc|redbus|namma yatri|metro|petrol|fuel|hpcl|iocl|bpcl|indian oil/i],
  ['Shopping', /amazon|flipkart|myntra|ajio|meesho|nykaa|tatacliq|snapdeal|lifestyle|shoppers stop|decathlon/i],
  ['Subscription', /netflix|spotify|hotstar|prime video|youtube|jio ?cinema|sony ?liv|zee5|apple\.com|google ?play|adobe|canva/i],
  ['Bills', /electricity|bescom|bses|water bill|gas bill|broadband|airtel|jio|vi |vodafone|bsnl|recharge|postpaid|prepaid/i],
  ['Income', /salary|sal cr|interest|dividend|refund|cashback|reimbursement/i],
];

function toNumber(raw: string): number {
  // Indian grouping ("1,04,700.50") is safe here — commas are just stripped.
  return Number(raw.replace(/,/g, ''));
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

function cleanMerchant(raw: string): string {
  let name = raw.trim();

  // A VPA ("swiggy.payu@hdfcbank") carries the merchant in its handle.
  if (name.includes('@')) name = name.split('@')[0];

  name = name
    .replace(/[._\-]+/g, ' ')
    .replace(/\b(upi|p2m|p2a|payu|razorpay|billdesk|pay|ybl|okaxis|paytm|apl|ibl)\b/gi, ' ')
    .replace(/\d{4,}/g, ' ') // long digit runs are reference numbers, not names
    .replace(/\s+/g, ' ')
    .trim();

  return name ? titleCase(name) : '';
}

function inferCategory(merchant: string, body: string, isCredit: boolean): string {
  const haystack = `${merchant} ${body}`;
  for (const [category, pattern] of CATEGORY_KEYWORDS) {
    if (pattern.test(haystack)) return category;
  }
  return isCredit ? 'Income' : 'Uncategorized';
}

/**
 * Returns null when the message isn't a completed transaction — callers
 * should treat null as "ignore this SMS entirely", not as an error.
 */
export function parseTransactionSms(body: string): ParsedSms | null {
  if (!body || body.length > 1000) return null;

  for (const pattern of NOT_A_TRANSACTION) {
    if (pattern.test(body)) return null;
  }

  const isDebit = DEBIT_HINTS.test(body);
  const isCredit = CREDIT_HINTS.test(body);
  if (!isDebit && !isCredit) return null;

  // Amount: prefer a currency-marked figure, else the one attached to the
  // debit/credit verb ("debited by 450.0" — SBI omits the currency marker).
  const currencyMatch = body.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const verbMatch = body.match(/(?:debited|credited)\s*(?:by|for|with)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const rawAmount = currencyMatch?.[1] ?? verbMatch?.[1];
  if (!rawAmount) return null;

  const magnitude = toNumber(rawAmount);
  if (!Number.isFinite(magnitude) || magnitude <= 0) return null;

  // When both verbs appear ("debited ... beneficiary credited"), the first
  // one in the message describes what happened to *this* account.
  const debitIdx = isDebit ? body.search(DEBIT_HINTS) : Number.MAX_SAFE_INTEGER;
  const creditIdx = isCredit ? body.search(CREDIT_HINTS) : Number.MAX_SAFE_INTEGER;
  const treatAsCredit = creditIdx < debitIdx;

  let merchant = '';
  for (const pattern of MERCHANT_PATTERNS) {
    const match = body.match(pattern);
    if (match?.[1]) {
      merchant = cleanMerchant(match[1]);
      if (merchant) break;
    }
  }

  const accountHint = body.match(/(?:a\/c|acct|account|a\/c no\.?)\s*(?:no\.?)?\s*([xX*]+\d{3,6}|\d{4})/i)?.[1];
  const reference = body.match(/(?:ref(?:no|erence)?\.?|upi:?)\s*[:#]?\s*(\d{6,20})/i)?.[1];

  let confidence = 0.5;
  if (merchant) confidence += 0.25;
  if (accountHint) confidence += 0.15;
  if (reference) confidence += 0.1;

  return {
    amount: treatAsCredit ? magnitude : -magnitude,
    merchant: merchant || 'Unknown Merchant',
    category: inferCategory(merchant, body, treatAsCredit),
    accountHint,
    reference,
    confidence: Math.min(1, Number(confidence.toFixed(2))),
  };
}
