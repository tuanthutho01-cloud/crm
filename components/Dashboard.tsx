
import React, { useMemo } from 'react';
import { TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';
import { Customer, Invoice, InvoiceType } from '../types.ts';
import { formatCurrency } from '../utils.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  customers: Customer[];
  invoices: Invoice[];
}

const Dashboard: React.FC<Props> = ({ customers, invoices }) => {
  const stats = useMemo(() => {
    const totalDebt = customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
    const validSales = invoices.filter(i => i.type === InvoiceType.SALE && i.status !== 'cancelled');
    const totalRevenue = validSales.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const pendingOrders = invoices.filter(i => i.type === InvoiceType.ORDER && i.status === 'pending').length;
    
    return { totalDebt, totalRevenue, pendingOrders };
  }, [customers, invoices]);

  const chartData = useMemo(() => {
    const days = 7;
    const result = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);
      
      const daySales = invoices.filter(inv => {
        if (inv.type !== InvoiceType.SALE || inv.status === 'cancelled') return false;
        const createdAt = new Date(inv.createdAt.seconds * 1000);
        return createdAt >= d && createdAt < nextD;
      }).reduce((sum, inv) => sum + inv.totalAmount, 0);
      
      result.push({
        name: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
        value: daySales
      });
    }
    return result;
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Doanh thu" value={formatCurrency(stats.totalRevenue)} color="blue" />
        <StatCard icon={AlertCircle} label="Tổng nợ" value={formatCurrency(stats.totalDebt)} color="red" />
        <StatCard icon={ShoppingBag} label="Đơn chờ" value={stats.pendingOrders.toString()} color="orange" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={20}/>
          Doanh số 7 ngày gần nhất
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => [formatCurrency(val), 'Doanh thu']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563eb' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: 'blue' | 'red' | 'orange' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
