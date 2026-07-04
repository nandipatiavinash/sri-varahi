/**
 * Same-day edit/delete window for bills.
 *
 * Rule: a bill can be edited or deleted only on the calendar day it was
 * CREATED, in the business's timezone (default Asia/Kolkata) — not the
 * bill_date field, since bill_date is sometimes backdated for manual-book
 * entry. Using created_at keeps the rule tied to "did the owner actually
 * make/touch this today", which is what protects historical report accuracy.
 *
 * A business can optionally extend this via `edit_window_hours` in Settings
 * (e.g. 6 = editable until 6am the next day, to cover end-of-day billing
 * that spills past midnight). Default is 0 = strictly the same calendar day.
 *
 * This same function is used:
 *  - server-side in actions/bills.ts as the actual enforcement (source of truth)
 *  - client-side in the bill list/detail UI to show/hide Edit & Delete buttons
 * so the two never drift.
 */

export function getCalendarDayKey(date: Date, timeZone: string): string {
  // en-CA gives YYYY-MM-DD, which sorts and compares correctly.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export interface EditWindowCheck {
  editable: boolean;
  reason?: string;
}

/**
 * @param createdAt   the bill's created_at timestamp (ISO string or Date)
 * @param now          current time (defaults to `new Date()`; pass explicitly in tests)
 * @param timeZone     business timezone, e.g. "Asia/Kolkata"
 * @param editWindowHours  extra grace hours past midnight (default 0)
 */
export function checkBillEditWindow(
  createdAt: string | Date,
  now: Date = new Date(),
  timeZone: string = 'Asia/Kolkata',
  editWindowHours: number = 0
): EditWindowCheck {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;

  const deadline = new Date(created.getTime() + editWindowHours * 60 * 60 * 1000);

  const createdDayKey = getCalendarDayKey(created, timeZone);
  const nowDayKey = getCalendarDayKey(now, timeZone);
  const deadlineDayKey = getCalendarDayKey(deadline, timeZone);

  // Editable if "now" falls on the same business-timezone calendar day as
  // creation, OR within the grace window's day if edit_window_hours pushes
  // the deadline into the next day.
  const sameDay = nowDayKey === createdDayKey;
  const withinGrace = editWindowHours > 0 && nowDayKey === deadlineDayKey && now <= deadline;

  if (sameDay || withinGrace) {
    return { editable: true };
  }

  return {
    editable: false,
    reason:
      'This bill was created on a previous day and is locked. Historical bills cannot be edited or deleted — create a linked adjustment bill instead, or void it if it must be reversed.',
  };
}
