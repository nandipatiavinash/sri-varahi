import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { EmployeeProfileClient } from './EmployeeProfileClient';

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: employeeId } = await params;
  const supabase = await createClient();

  // 1. Fetch employee details
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (!employee) notFound();

  // 2. Fetch employee bills with items
  const { data: bills } = await supabase
    .from('bills')
    .select(`
      id,
      bill_number,
      bill_date,
      customer_name,
      customer_mobile,
      grand_total,
      gross_profit,
      status,
      bill_items (
        product_name_snapshot,
        quantity,
        selling_price
      )
    `)
    .eq('employee_id', employeeId)
    .order('bill_date', { ascending: false });

  const activeBills = (bills ?? []).filter((b) => b.status !== 'voided');

  // Stats calculation
  const totalSales = activeBills.reduce((s, b) => s + Number(b.grand_total), 0);
  const billsCount = activeBills.length;
  const avgBill = billsCount > 0 ? totalSales / billsCount : 0;

  // Unique clients
  const uniqueClients = new Set(activeBills.map((b) => b.customer_name));
  const clientsCount = uniqueClients.size;

  // Active days (attendance estimation)
  const uniqueDays = new Set(activeBills.map((b) => b.bill_date));
  const daysActive = uniqueDays.size;
  const estimatedHours = daysActive * 8;

  // 3. Top products sold by this employee
  const productsMap = new Map<string, number>();
  activeBills.forEach((b) => {
    b.bill_items?.forEach((item: any) => {
      const name = item.product_name_snapshot;
      const qty = Number(item.quantity || 0);
      productsMap.set(name, (productsMap.get(name) || 0) + qty);
    });
  });

  const topProducts = Array.from(productsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Monthly trend
  const trendMap = new Map<string, number>();
  activeBills.forEach((b) => {
    const month = b.bill_date.slice(0, 7); // yyyy-mm
    trendMap.set(month, (trendMap.get(month) || 0) + Number(b.grand_total));
  });

  const monthlyTrend = Array.from(trendMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <EmployeeProfileClient
      employee={employee as any}
      stats={{
        totalSales,
        billsCount,
        clientsCount,
        avgBill,
        daysActive,
        estimatedHours,
      }}
      topProducts={topProducts}
      monthlyTrend={monthlyTrend}
      bills={bills ?? []}
    />
  );
}
