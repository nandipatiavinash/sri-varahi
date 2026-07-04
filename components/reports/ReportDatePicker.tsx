'use client';

export function ReportDatePicker({ basePath, date }: { basePath: string; date: string }) {
  return (
    <input
      type="date"
      defaultValue={date}
      className="input"
      onChange={(e) => {
        window.location.href = `${basePath}?date=${e.target.value}`;
      }}
    />
  );
}
