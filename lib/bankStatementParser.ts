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

export function extractMerchant(desc: string): string {
  const d = desc.toUpperCase();

  if (d.startsWith('UPI')) {
    const parts = d.split(/[/|\-@]/).map((p) => p.trim());
    const ignoreList = ['UPI', 'P2M', 'P2A', 'P2P', 'INT', 'REV', 'RETURN'];
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (!p || p.length < 3) continue;
      if (ignoreList.includes(p)) continue;
      if (/^\d+$/.test(p)) continue;
      if (p.startsWith('UTR')) continue;
      return p.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  if (d.includes('NEFT') || d.includes('IMPS') || d.includes('RTGS')) {
    const parts = d.split(/[/|\-@]/).map((p) => p.trim());
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (!p || p.length < 3) continue;
      if (/^\d+$/.test(p)) continue;
      if (p.includes('NEFT') || p.includes('IMPS') || p.includes('RTGS')) continue;
      if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(p)) continue;
      if (p === 'NETBANKING' || p === 'FT') continue;
      return p.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  if (d.includes('ACH') || d.includes('NACH') || d.includes('APY') || d.includes('AUTOPAY') || d.includes('BILLDESK')) {
    if (d.includes('APY')) return 'Atal Pension Yojana (APY)';
    if (d.includes('SIP') || d.includes('MUTUAL')) return 'Mutual Fund SIP';
    const parts = d.split(/[/|\-@_]/).map((p) => p.trim());
    return parts.length > 1 ? parts[1].replace(/\b\w/g, c => c.toUpperCase()) : 'Autopay';
  }

  const fallback = d.split(/[/|\-@]/)[0].trim();
  const cleaned = fallback.replace(/\s+\d+$/, '').replace(/^(POS|ECOM|WDL|DEP|TFR|TRF)\b\s*/, '').trim();
  return cleaned.replace(/\b\w/g, c => c.toUpperCase()) || 'Bank Entry';
}

function guessCategory(merchant: string, description: string): string {
  const d = String(description).toLowerCase();
  const m = String(merchant).toLowerCase();
  const combined = `${m} ${d}`;

  if (/salary|sal cr|payroll|stipend/.test(combined)) return 'Income';
  if (/swiggy|zomato|food|restaurant|cafe|bakery|eats|dhaba|bhoj|pizza|burger|kitchen|canteen/.test(combined)) return 'Food';
  if (/amazon|flipkart|myntra|shopping|shopee|mart|store|retail|apparel|clothing/.test(combined)) return 'Shopping';
  if (/uber|ola|petrol|fuel|irctc|rapido|metro|transport|auto|cab|bus|air/.test(combined)) return 'Transport';
  if (/netflix|spotify|subscription|prime|hotstar|youtube|autopay|nach|apy|emi|loan|insurance|gym|fitness/.test(combined)) return 'Subscription';
  if (/grocery|dmart|bigbasket|bazaar|supermarket|kirana|spencers|reliance fresh/.test(combined)) return 'Groceries';
  if (/upi|neft|imps|rtgs|transfer|trf|wdl|atm|cash/.test(combined)) return 'Transfer';
  
  return 'Uncategorized';
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
    const merchant = extractMerchant(desc);
    rows.push({
      id: `import-${i}-${ts}`,
      merchant,
      category: guessCategory(merchant, desc),
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
