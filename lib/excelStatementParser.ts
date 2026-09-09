/**
 * Excel bank statement parser using SheetJS.
 * Supports .xlsx, .xls, and password-protected workbooks.
 * Re-uses the same ParseResult type and column-detection logic as the CSV parser.
 */
import * as XLSX from 'xlsx';
import { extractMerchantAndCategory, type ParseResult, type ParsedStatementRow } from './bankStatementParser';

// ---------- helpers (mirrors bankStatementParser.ts) ----------

function parseIndianDate(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;

  // 1. If it's already a Date instance
  if (raw instanceof Date) {
    const t = raw.getTime();
    return Number.isFinite(t) ? t : null;
  }

  const s = String(raw).trim();
  if (!s) return null;

  // 2. SheetJS numeric serial dates (Excel date numbers e.g. 45532)
  const serial = Number(s);
  if (!Number.isNaN(serial) && serial > 1000 && serial < 100000) {
    try {
      const d = XLSX.SSF.parse_date_code(serial);
      if (d) return new Date(d.y, d.m - 1, d.d).getTime();
    } catch {}
  }

  // 3. Indian DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }

  // 4. DD-MMM-YYYY (e.g. 15-Aug-2024 or 15-AUG-24)
  const dMmmY = s.match(/^(\d{1,2})[/\-.]([A-Za-z]{3,9})[/\-.](\d{2,4})/);
  if (dMmmY) {
    const parsed = Date.parse(`${dMmmY[1]} ${dMmmY[2]} ${dMmmY[3]}`);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // 5. YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }

  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDateLabel(ts: number, raw?: string): string {
  if (Number.isFinite(ts) && ts > 0) {
    const d = new Date(ts);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()] || 'Jan';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }
  const s = String(raw || '').trim();
  if (/^\d{4,6}$/.test(s)) return 'Recent';
  return s || 'Recent';
}

function isSummaryOrBalanceRow(desc: string): boolean {
  const upper = desc.toUpperCase().trim();
  return (
    /^(TOTAL|GRAND\s*TOTAL|SUBTOTAL|SUMMARY|CLOSING\s*BAL|OPENING\s*BAL|BALANCE\s*B\/F|BALANCE\s*C\/F|B\/F|C\/F|BROUGHT\s*FORWARD|CARRIED\s*FORWARD)/i.test(upper) ||
    /^(TOTAL\s*DEBIT|TOTAL\s*CREDIT|TOTAL\s*WITHDRAWAL|TOTAL\s*DEPOSIT)/i.test(upper) ||
    /^CLOSING\s*BALANCE/i.test(upper) ||
    /^OPENING\s*BALANCE/i.test(upper)
  );
}

function toNumber(raw: unknown): number {
  const cleaned = String(raw ?? '').replace(/[₹,\s"]/g, '').replace(/\((.*)\)/, '-$1');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

type ColumnMap = {
  date?: number;
  description?: number;
  debit?: number;
  credit?: number;
  amount?: number;
  type?: number;
  balance?: number;
};

function detectColumns(header: string[]): ColumnMap {
  const clean = header.map((h) => String(h ?? '').trim());
  const lower = clean.map((h) => h.toLowerCase());

  // Never match balance/closing columns as debit, credit, or amount!
  const isBalance = (h: string) => /balance|closing|avail|bal\b/i.test(h);

  // 1. Date column
  const dateIdx = lower.findIndex((h) =>
    !isBalance(h) && (
      /(txn|trans|value|posting|entry)?\s*date/i.test(h) ||
      h === 'date'
    )
  );

  // 2. Description / Narration column
  const descIdx = lower.findIndex((h) =>
    !isBalance(h) &&
    /(narration|description|particulars|remarks|details|summary)/i.test(h)
  );

  // 3. Debit / Withdrawal column
  const debitIdx = lower.findIndex((h) =>
    !isBalance(h) &&
    (
      /(^|\b|_)(debit|withdrawal|withdraw|dr|dr\.)(\b|_|\s|\(|$)/i.test(h) ||
      /(withdrawal|debit)\s*(amt|amount)?/i.test(h)
    )
  );

  // 4. Credit / Deposit column
  const creditIdx = lower.findIndex((h) =>
    !isBalance(h) &&
    h !== 'description' &&
    (
      /(^|\b|_)(credit|deposit|deposited|cr|cr\.)(\b|_|\s|\(|$)/i.test(h) ||
      /(deposit|credit)\s*(amt|amount)?/i.test(h)
    )
  );

  // 5. Amount column (only if separate debit/credit don't exist)
  let amountIdx = -1;
  if (debitIdx === -1 && creditIdx === -1) {
    amountIdx = lower.findIndex((h) =>
      !isBalance(h) &&
      /(^|\b|_)(amount|amt|txn\s*amount|transaction\s*amount|net\s*amount)(\b|_|\s|\(|$)/i.test(h)
    );
  }

  // 6. Type column (DR/CR)
  const typeIdx = lower.findIndex((h) =>
    !isBalance(h) &&
    /(dr\/cr|cr\/dr|txn\s*type|type)/i.test(h)
  );

  const balanceIdx = lower.findIndex((h) => isBalance(h));

  return {
    date: dateIdx !== -1 ? dateIdx : undefined,
    description: descIdx !== -1 ? descIdx : undefined,
    debit: debitIdx !== -1 ? debitIdx : undefined,
    credit: creditIdx !== -1 ? creditIdx : undefined,
    amount: amountIdx !== -1 ? amountIdx : undefined,
    type: typeIdx !== -1 ? typeIdx : undefined,
    balance: balanceIdx !== -1 ? balanceIdx : undefined,
  };
}

/** Find the worksheet with the most rows — usually the statement sheet */
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

/** Skip leading junk rows (bank logos, account info etc.) until we find a date-like header */
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

// ---------- main export ----------

/**
 * Parse an Excel bank statement from a Uint8Array (file bytes).
 * @param data  Raw file bytes
 * @param password  Optional workbook password (for encrypted files)
 */
export function parseExcelStatement(data: Uint8Array, password?: string): ParseResult {
  let wb: XLSX.WorkBook;

  try {
    wb = XLSX.read(data, {
      type: 'array',
      password: password || undefined,
      cellDates: false,      // keep raw so we handle date serials ourselves
      cellText: false,
      raw: true,
    });
  } catch (e: unknown) {
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
    if (isSummaryOrBalanceRow(desc)) { skipped++; continue; }

    let amount = 0;
    if (cols.debit !== undefined || cols.credit !== undefined) {
      const debit = cols.debit !== undefined ? toNumber(parts[cols.debit]) : 0;
      const credit = cols.credit !== undefined ? toNumber(parts[cols.credit]) : 0;
      if (Number.isFinite(debit) && debit > 0) amount = -debit;
      else if (Number.isFinite(credit) && credit > 0) amount = credit;
      else if (Number.isFinite(debit) && debit < 0) amount = debit;
      else if (Number.isFinite(credit) && credit < 0) amount = credit;
      else { skipped++; continue; }
    } else if (cols.amount !== undefined) {
      const rawAmt = toNumber(parts[cols.amount]);
      if (!Number.isFinite(rawAmt) || rawAmt === 0) { skipped++; continue; }
      const typeCol = cols.type !== undefined ? String(parts[cols.type] ?? '').toLowerCase() : '';

      const isNarrationCredit = /UPI[/-]CR|DEP\s+TFR|CREDIT|DEPOSIT/i.test(desc);
      const isNarrationDebit = /UPI[/-]DR|WDL\s+TFR|DEBIT|WITHDRAWAL/i.test(desc);

      if (typeCol.startsWith('dr') || typeCol === 'debit' || (!typeCol && isNarrationDebit)) {
        amount = -Math.abs(rawAmt);
      } else if (typeCol.startsWith('cr') || typeCol === 'credit' || (!typeCol && isNarrationCredit)) {
        amount = Math.abs(rawAmt);
      } else {
        amount = rawAmt;
      }
    } else {
      skipped++;
      continue;
    }

    const ts = parseIndianDate(dateRaw) ?? Date.now();
    const { merchant, category } = extractMerchantAndCategory(desc);
    const rowBal = cols.balance !== undefined ? toNumber(parts[cols.balance]) : undefined;
    const finalBal = Number.isFinite(rowBal) ? rowBal : undefined;

    rows.push({
      id: `xl-${i}-${ts}`,
      merchant: merchant || 'Bank Entry',
      category: category || 'Unknown',
      amount,
      balance: finalBal,
      timestamp: ts,
      source: 'bank_statement',
      dateLabel: formatDateLabel(ts, dateRaw),
      rawDescription: desc,
    });
  }

  const errors: string[] = [];
  if (rows.length === 0 && skipped > 0) {
    errors.push('No valid rows parsed — make sure Debit/Credit or Amount columns exist.');
  }
  return { rows, skipped, errors };
}
