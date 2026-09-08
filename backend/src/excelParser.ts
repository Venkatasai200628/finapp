import * as XLSX from 'xlsx';

export type ParsedStatementRow = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  source: string;
  dateLabel: string;
  rawDescription: string;
};

export type ParseResult = {
  rows: ParsedStatementRow[];
  skipped: number;
  errors: string[];
};

function parseIndianDate(raw: string): number | null {
  const s = String(raw ?? '').trim();

  const serial = Number(s);
  if (!Number.isNaN(serial) && serial > 1000) {
    const d = XLSX.SSF.parse_date_code(serial);
    if (d) return new Date(d.y, d.m - 1, d.d).getTime();
  }

  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return new Date(year, Number(dmy[2]) - 1, Number(dmy[1])).getTime();
  }
  const ymd = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])).getTime();
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNumber(raw: unknown): number {
  const cleaned = String(raw ?? '').replace(/[₹,\s"]/g, '').replace(/\((.*)\)/, '-$1');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function extractMerchant(desc: string): string {
  const d = desc.toUpperCase();

  // 1. UPI Transfers
  // Format: UPI/P2A/1234567890/SURAJ KUMAR/Paytm OR UPI/12345/Name
  if (d.startsWith('UPI')) {
    const parts = d.split(/[/|\-@]/).map((p) => p.trim());
    // Often, the 3rd or 4th part is the name. Let's look for the first part that isn't numeric/generic
    const ignoreList = ['UPI', 'P2M', 'P2A', 'P2P', 'INT', 'REV', 'RETURN'];
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (!p || p.length < 3) continue;
      if (ignoreList.includes(p)) continue;
      if (/^\d+$/.test(p)) continue; // ignore pure numbers (txn IDs)
      if (p.startsWith('UTR')) continue;
      // Likely the name!
      // Return title cased
      return p.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // 2. NEFT / IMPS / RTGS
  // Format: NEFT DR-PUNB0123456-RAHUL KUMAR-NETBANKING
  if (d.includes('NEFT') || d.includes('IMPS') || d.includes('RTGS')) {
    const parts = d.split(/[/|\-@]/).map((p) => p.trim());
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (!p || p.length < 3) continue;
      if (/^\d+$/.test(p)) continue;
      if (p.includes('NEFT') || p.includes('IMPS') || p.includes('RTGS')) continue;
      if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(p)) continue; // ignore IFSC
      if (p === 'NETBANKING' || p === 'FT') continue;
      return p.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // 3. Autopay / NACH / Subscriptions
  if (d.includes('ACH') || d.includes('NACH') || d.includes('APY') || d.includes('AUTOPAY') || d.includes('BILLDESK')) {
    if (d.includes('APY')) return 'Atal Pension Yojana (APY)';
    if (d.includes('SIP') || d.includes('MUTUAL')) return 'Mutual Fund SIP';
    const parts = d.split(/[/|\-@_]/).map((p) => p.trim());
    return parts.length > 1 ? parts[1].replace(/\b\w/g, c => c.toUpperCase()) : 'Autopay';
  }

  // 4. Fallback: split and clean
  const fallback = d.split(/[/|\-@]/)[0].trim();
  // Strip trailing numbers/generics
  const cleaned = fallback.replace(/\s+\d+$/, '').replace(/^(POS|ECOM|WDL|DEP|TFR|TRF)\b\s*/, '').trim();
  return cleaned.replace(/\b\w/g, c => c.toUpperCase()) || 'Bank Entry';
}

function guessCategory(merchant: string, description: string): string {
  const d = String(description).toLowerCase();
  const m = String(merchant).toLowerCase();
  const combined = `${m} ${d}`;

  if (/salary|sal cr|payroll|stipend/.test(combined)) return 'Income';
  if (/swiggy|zomato|food|restaurant|cafe|bakery|eats|dhaba|bhoj|pizza|burger|kitchen/.test(combined)) return 'Food';
  if (/amazon|flipkart|myntra|shopping|shopee|mart|store|retail|apparel|clothing/.test(combined)) return 'Shopping';
  if (/uber|ola|petrol|fuel|irctc|rapido|metro|transport|auto|cab|bus|air/.test(combined)) return 'Transport';
  if (/netflix|spotify|subscription|prime|hotstar|youtube|autopay|nach|apy|emi|loan|insurance/.test(combined)) return 'Subscription';
  if (/grocery|dmart|bigbasket|bazaar|supermarket|kirana|spencers|reliance fresh/.test(combined)) return 'Groceries';
  if (/upi|neft|imps|rtgs|transfer|trf|wdl|atm|cash/.test(combined)) return 'Transfer';
  
  return 'Uncategorized';
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
  const lower = header.map((h) => String(h ?? '').toLowerCase().trim());
  const find = (...keys: string[]) => lower.findIndex((h) => keys.some((k) => h.includes(k)));

  const map: ColumnMap = {
    date: find('date', 'txn date', 'transaction date', 'value date', 'posted date'),
    description: find('description', 'narration', 'particulars', 'remarks', 'details', 'transaction remarks'),
    debit: find('debit', 'withdrawal', 'dr amount', 'debit amount'),
    credit: find('credit', 'deposit', 'cr amount', 'credit amount'),
    amount: find('amount', 'txn amount', 'transaction amount'),
    type: find('dr/cr', 'type', 'cr/dr', 'transaction type'),
  };

  Object.keys(map).forEach((k) => {
    const key = k as keyof ColumnMap;
    if ((map[key] as number) === -1) map[key] = undefined;
  });
  return map;
}

function bestSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  let best: XLSX.WorkSheet | null = null;
  let bestRows = 0;
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const ref = ws['!ref'];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    const rows = range.e.r - range.s.r + 1;
    if (rows > bestRows) {
      bestRows = rows;
      best = ws;
    }
  }
  return best;
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map((c) => String(c ?? '').toLowerCase().trim());
    const hasDate = cells.some((c) => c.includes('date'));
    const hasDesc = cells.some((c) =>
      ['description', 'narration', 'particulars', 'remarks', 'details'].some((k) => c.includes(k))
    );
    if (hasDate && hasDesc) return i;
  }
  return 0;
}

/**
 * Parse an Excel bank statement from a Buffer.
 * Expects the buffer to be ALREADY DECRYPTED if it had a password.
 */
export function parseExcelStatementNode(data: Buffer): ParseResult {
  let wb: XLSX.WorkBook;

  try {
    wb = XLSX.read(data, {
      type: 'buffer',
      cellDates: false,
      cellText: false,
      raw: true,
    });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    const isPassword =
      msg.toLowerCase().includes('password') ||
      msg.toLowerCase().includes('encrypt') ||
      msg.toLowerCase().includes('protected');

    return {
      rows: [],
      skipped: 0,
      errors: [isPassword ? 'WRONG_PASSWORD' : `Could not open the file: ${msg}`],
    };
  }

  const ws = bestSheet(wb);
  if (!ws) return { rows: [], skipped: 0, errors: ['No usable sheet found in the workbook.'] };

  const allRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (allRows.length < 2) {
    return { rows: [], skipped: 0, errors: ['Sheet appears empty — check the file.'] };
  }

  const headerIdx = findHeaderRow(allRows);
  const header = (allRows[headerIdx] as unknown[]).map((c) => String(c ?? ''));
  const cols = detectColumns(header);

  if (cols.date === undefined || cols.description === undefined) {
    return {
      rows: [],
      skipped: allRows.length - headerIdx - 1,
      errors: [
        'Could not find Date and Description/Narration columns. ' +
          'Columns found: ' + header.filter(Boolean).join(', '),
      ],
    };
  }

  const rows: ParsedStatementRow[] = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < allRows.length; i++) {
    const parts = allRows[i] as unknown[];
    const dateRaw = String(parts[cols.date!] ?? '').trim();
    const desc = String(parts[cols.description!] ?? '').trim();
    if (!desc) { skipped++; continue; }

    let amount = 0;
    if (cols.debit !== undefined || cols.credit !== undefined) {
      const debit = cols.debit !== undefined ? toNumber(parts[cols.debit]) : 0;
      const credit = cols.credit !== undefined ? toNumber(parts[cols.credit]) : 0;
      if (Number.isFinite(debit) && debit > 0) amount = -debit;
      else if (Number.isFinite(credit) && credit > 0) amount = credit;
      else { skipped++; continue; }
    } else if (cols.amount !== undefined) {
      const rawAmt = toNumber(parts[cols.amount]);
      if (!Number.isFinite(rawAmt) || rawAmt === 0) { skipped++; continue; }
      const typeCol = cols.type !== undefined ? String(parts[cols.type] ?? '').toLowerCase() : '';
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
      id: `xl-${i}-${ts}`,
      merchant,
      category: guessCategory(merchant, desc),
      amount,
      timestamp: ts,
      source: 'bank_statement',
      dateLabel: dateRaw || new Date(ts).toLocaleDateString('en-IN'),
      rawDescription: desc,
    });
  }

  const errors: string[] = [];
  if (rows.length === 0 && skipped > 0) {
    errors.push('No valid rows parsed — make sure Debit/Credit or Amount columns exist.');
  }
  return { rows, skipped, errors };
}
