'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export function SalesTrendChart({
  data,
}: {
  data: { day: string; total_sales: number; total_profit: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
          <XAxis
            dataKey="day"
            tickFormatter={(d) => formatDate(d, { day: '2-digit', month: 'short', year: undefined })}
            fontSize={12}
            stroke="#8691a4"
          />
          <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={12} stroke="#8691a4" width={80} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(d) => formatDate(d as string)}
          />
          <Line type="monotone" dataKey="total_sales" name="Sales" stroke="#e2661a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="total_profit" name="Profit" stroke="#525c70" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
