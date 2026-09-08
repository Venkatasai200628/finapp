import type { LedgerTransaction } from './ledgerAnalytics';

export type ParsedStatementRow = LedgerTransaction & {
  dateLabel: string;
  rawDescription: string;
};

export type ParseResult = {
  rows: ParsedStatementRow[];
  skipped: number;
  errors: string[];
};

function parseIndianDate(raw: string): number | null {
  const s = raw.trim();
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return new Date(year, Number(dmy[2]) - 1, Number(dmy[1])).getTime();
  }
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])).getTime();
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNumber(raw: string): number {
  const cleaned = raw.replace(/[₹,\s"]/g, '').replace(/\((.*)\)/, '-$1');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function extractMerchantAndCategory(rawDesc: string): { merchant: string; category: string } {
  const text = String(rawDesc || '').trim();
  const upper = text.toUpperCase();

  let merchant = '';
  let upiHandle = '';

  // 1. Indian UPI formats
  const upiMatch = text.match(/UPI[/-](?:CR|DR|P2A|P2M|P2P)[/-]([A-Za-z0-9]+)[/-]([^/]+)(?:[/-]([^/]+))?(?:[/-]([^/]+))?/i);
  if (upiMatch) {
    merchant = upiMatch[2]?.trim() || '';
    upiHandle = (upiMatch[4] || upiMatch[3] || '').trim();
  } else {
    const upiSimple = text.match(/UPI[/-]([A-Za-z0-9]{8,16})[/-]([^/]+)/i);
    if (upiSimple) {
      merchant = upiSimple[2]?.trim() || '';
    } else {
      const upiIndex = upper.indexOf('UPI');
      if (upiIndex !== -1) {
        const parts = text.slice(upiIndex).split(/[/|\-@]/).map((p) => p.trim());
        const ignore = ['UPI', 'CR', 'DR', 'P2A', 'P2M', 'P2P', 'INT', 'REV', 'RETURN', 'PAID', 'PAY'];
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (p.length >= 3 && !ignore.includes(p.toUpperCase()) && !/^\d+$/.test(p) && !p.toUpperCase().startsWith('UTR')) {
            merchant = p;
            break;
          }
        }
      }
    }
  }

  // 2. NEFT / IMPS / RTGS
  if (!merchant && (upper.includes('NEFT') || upper.includes('IMPS') || upper.includes('RTGS'))) {
    const parts = text.split(/[/|\-@_]/).map((p) => p.trim());
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (
        p.length >= 3 &&
        !/^\d+$/.test(p) &&
        !/^(NEFT|IMPS|RTGS|DR|CR|NETBANKING|FT|WDL|DEP|TFR)$/i.test(p) &&
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(p)
      ) {
        merchant = p;
        break;
      }
    }
  }

  // 3. Autopay / NACH / APY / Subscriptions
  if (!merchant && (upper.includes('APY') || upper.includes('NACH') || upper.includes('ACH') || upper.includes('AUTOPAY'))) {
    if (upper.includes('APY')) {
      merchant = 'Atal Pension Yojana (APY)';
    } else if (upper.includes('SIP') || upper.includes('MUTUAL')) {
      merchant = 'Mutual Fund SIP';
    } else {
      merchant = 'Bank Autopay';
    }
  }

  // 4. Fallback cleanup
  if (!merchant) {
    let cleaned = text
      .replace(/^(DEP|WDL|TO|BY)\s+(TFR|TRANSFER)\s*/i, '')
      .replace(/^(POS|ECOM|TRF|TRANSFER)\s*/i, '')
      .split(/[/|@\-_\n]/)[0]
      .trim();
    cleaned = cleaned.replace(/\s+\d+.*$/, '').trim();
    merchant = cleaned || 'Bank Entry';
  }

  merchant = merchant.replace(/\s+/g, ' ').trim();
  if (/^Google\s*P$/i.test(merchant) || /playstore/i.test(text)) {
    merchant = 'Google Play';
  }
  if (merchant === merchant.toUpperCase() && merchant.length > 2) {
    merchant = merchant
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const combined = `${merchant} ${text} ${upiHandle}`.toLowerCase();
  let category = 'Uncategorized';

  if (/salary|sal cr|payroll|stipend|interest cr/.test(combined)) {
    category = 'Income';
  } else if (/sopanam|canteen|food|swiggy|zomato|restaurant|cafe|bakery|eats|dhaba|bhoj|pizza|burger|kitchen|mess|tiffin|tea|coffee|hotel|biryani|sweets/.test(combined)) {
    category = 'Food';
  } else if (/gym|fitness|workout|revive|cult|crossfit|yoga|netflix|spotify|prime|hotstar|youtube|subscription|autopay|nach|apy|emi|loan|insurance|lic|playstore|google play/.test(combined)) {
    category = 'Subscription';
  } else if (/grocery|dmart|bigbasket|bazaar|supermarket|kirana|spencers|reliance fresh|provision|vegetable|fruits|milk|dairy/.test(combined)) {
    category = 'Groceries';
  } else if (/amazon|flipkart|myntra|shopee|mart|store|retail|apparel|clothing|shoes|fashion|stationery|fancy|mall|electronics/.test(combined)) {
    category = 'Shopping';
  } else if (/uber|ola|petrol|fuel|irctc|rapido|metro|transport|auto|cab|bus|air|indigo|railway/.test(combined)) {
    category = 'Transport';
  } else if (/upi|neft|imps|rtgs|transfer|trf|wdl|atm|cash|ravula|prasada|balakris/.test(combined)) {
    category = 'Transfer';
  }

  return { merchant, category };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

type ColumnMap = {
  date?: number;
  description?: number;
  debit?: number;
  credit?: number;
  amount?: number;
  type?: number;
};

function detectColumns(header: string[]): ColumnMap {
  const lower = header.map((h) => h.toLowerCase());
  const find = (...keys: string[]) => lower.findIndex((h) => keys.some((k) => h.includes(k)));

  const map: ColumnMap = {
    date: find('date', 'txn date', 'transaction date', 'value date'),
    description: find('description', 'narration', 'particulars', 'remarks', 'details'),
    debit: find('debit', 'withdrawal', 'dr'),
    credit: find('credit', 'deposit', 'cr'),
    amount: find('amount', 'txn amount'),
    type: find('dr/cr', 'type', 'cr/dr'),
  };

  Object.keys(map).forEach((k) => {
    const key = k as keyof ColumnMap;
    if (map[key] === -1) map[key] = undefined;
  });
  return map;
}

/**
 * Parses CSV bank statements from HDFC, SBI, ICICI, Axis and generic exports.
 * Paste the file contents or read a .csv file as text on device.
 */
export function parseBankStatementCsv(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const errors: string[] = [];
  if (lines.length < 2) {
    return { rows: [], skipped: 0, errors: ['Need at least a header row and one data row.'] };
  }

  const header = splitCsvLine(lines[0]);
  const cols = detectColumns(header);
  if (cols.date === undefined || cols.description === undefined) {
    return {
      rows: [],
      skipped: lines.length - 1,
      errors: ['Could not find Date and Description/Narration columns. Check the CSV header.'],
    };
  }

  const rows: ParsedStatementRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    const dateRaw = parts[cols.date!] ?? '';
    const desc = parts[cols.description!] ?? '';
    if (!desc) {
      skipped++;
      continue;
    }

    let amount = 0;
    if (cols.debit !== undefined || cols.credit !== undefined) {
      const debit = cols.debit !== undefined ? toNumber(parts[cols.debit] ?? '') : 0;
      const credit = cols.credit !== undefined ? toNumber(parts[cols.credit] ?? '') : 0;
      if (Number.isFinite(debit) && debit > 0) amount = -debit;
      else if (Number.isFinite(credit) && credit > 0) amount = credit;
      else {
        skipped++;
        continue;
      }
    } else if (cols.amount !== undefined) {
      const rawAmt = toNumber(parts[cols.amount] ?? '');
      if (!Number.isFinite(rawAmt) || rawAmt === 0) {
        skipped++;
        continue;
      }
      const typeCol = cols.type !== undefined ? (parts[cols.type] ?? '').toLowerCase() : '';
      if (typeCol.startsWith('dr') || typeCol === 'debit') amount = -Math.abs(rawAmt);
      else if (typeCol.startsWith('cr') || typeCol === 'credit') amount = Math.abs(rawAmt);
      else amount = rawAmt;
    } else {
      skipped++;
      continue;
    }

    const ts = parseIndianDate(dateRaw) ?? Date.now();
    const { merchant, category } = extractMerchantAndCategory(desc);
    rows.push({
      id: `import-${i}-${ts}`,
      merchant,
      category,
      amount,
      timestamp: ts,
      source: 'bank_statement',
      dateLabel: dateRaw || new Date(ts).toLocaleDateString('en-IN'),
      rawDescription: desc,
    });
  }

  if (rows.length === 0 && skipped > 0) {
    errors.push('No valid rows parsed — check debit/credit or amount columns.');
  }

  return { rows, skipped, errors };
}
