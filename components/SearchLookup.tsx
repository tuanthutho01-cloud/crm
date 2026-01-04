
import React, { useState, useMemo } from 'react';
import { BookOpen, Database, Search, CalendarRange, X, User, ChevronRight, Hash } from 'lucide-react';
import { Customer, Product, Invoice, InvoiceType } from '../types.ts';
import { formatCurrency, formatDate } from '../utils.ts';

interface Props {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
}

const SearchLookup: React.FC<Props> = ({ customers, products, invoices }) => {
  const [mode, setMode] = useState<'debt' | 'product' | 'general'>('debt');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [debtCustId, setDebtCustId] = useState('');
  const [debtCustSearch, setDebtCustSearch] = useState('');
  const [showDebtDropdown, setShowDebtDropdown] = useState(false);

  const [prodSearchTerm, setProdSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showProdDropdown, setShowProdDropdown] = useState(false);

  const [generalSearch, setGeneralSearch] = useState('');

  const isInDateRange = (timestamp: any) => {
    if (!startDate && !endDate) return true;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    date.setHours(0, 0, 0, 0);
    if (startDate && date < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }
    return true;
  };

  // Chi tiết sổ nợ của một khách hàng
  const debtHistory = useMemo(() => {
    if (mode !== 'debt' || !debtCustId) return [];
    return invoices
      .filter(inv => inv.customerId === debtCustId && inv.status !== 'cancelled' && isInDateRange(inv.createdAt))
      .map(inv => {
        let increase = 0, decrease = 0, label = '';
        if (inv.type === InvoiceType.SALE) { 
          label = 'Mua hàng (Đơn mới)'; 
          increase = inv.totalAmount - inv.paidAmount; 
        }
        else if (inv.type === InvoiceType.PAYMENT) { 
          label = 'Thanh toán nợ'; 
          decrease = inv.paidAmount; 
        }
        else if (inv.type === InvoiceType.RETURN) { 
          label = 'Trả hàng'; 
          decrease = inv.totalAmount - inv.paidAmount; 
        }
        return { date: inv.createdAt, id: inv.id, label, increase, decrease, type: inv.type };
      })
      .sort((a, b) => b.date.seconds - a.date.seconds);
  }, [debtCustId, invoices, mode, startDate, endDate]);

  // Lịch sử giá bán của một sản phẩm
  const productPriceHistory = useMemo(() => {
    if (mode !== 'product' || !selectedProductId) return [];
    const results: any[] = [];
    invoices.forEach(inv => {
      if (inv.status === 'cancelled' || !isInDateRange(inv.createdAt)) return;
      inv.items.forEach(item => {
        if (item.productId === selectedProductId) {
          results.push({ 
            date: inv.createdAt, 
            customer: inv.customerName || 'Khách lẻ', 
            qty: item.qty, 
            price: item.price, 
            type: inv.type,
            invId: inv.id
          });
        }
      });
    });
    return results.sort((a, b) => b.date.seconds - a.date.seconds);
  }, [selectedProductId, invoices, mode, startDate, endDate]);

  const generalInvoices = useMemo(() => {
    if (mode !== 'general') return [];
    return invoices
      .filter(inv => {
        const matchesDate = isInDateRange(inv.createdAt);
        const matchesSearch = inv.id.toLowerCase().includes(generalSearch.toLowerCase()) || 
                              (inv.customerName || '').toLowerCase().includes(generalSearch.toLowerCase());
        return matchesDate && matchesSearch;
      })
      .slice(0, 50);
  }, [invoices, mode, generalSearch, startDate, endDate]);

  const currentCustomer = customers.find(c => c.id === debtCustId);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Menu Chế độ Tra cứu */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-1 overflow-x-auto no-print">
        <button onClick={() => setMode('debt')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${mode === 'debt' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}><BookOpen size={16} /> Sổ nợ khách</button>
        <button onClick={() => setMode('product')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${mode === 'product' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}><Database size={16} /> Giá bán SP</button>
        <button onClick={() => setMode('general')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${mode === 'general' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}><Search size={16} /> Tìm đơn hàng</button>
      </div>

      {/* Bộ lọc Chung */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</label>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <CalendarRange size={16} className="text-slate-400 ml-1" />
              <input type="date" className="bg-transparent text-xs outline-none flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-slate-300">-</span>
              <input type="date" className="bg-transparent text-xs outline-none flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
              {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('');}} className="text-slate-400"><X size={14}/></button>}
            </div>
          </div>

          <div className="flex-2 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đối tượng tra cứu</label>
            <div className="relative">
              {mode === 'debt' ? (
                <>
                  <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" placeholder="Chọn khách hàng..." value={debtCustSearch} onChange={e => { setDebtCustSearch(e.target.value); setShowDebtDropdown(true); }} onFocus={() => setShowDebtDropdown(true)} />
                  {showDebtDropdown && debtCustSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl z-[100] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {customers.filter(c => c.name.toLowerCase().includes(debtCustSearch.toLowerCase()) || c.phone.includes(debtCustSearch)).slice(0, 10).map(c => (
                        <div key={c.id} className="p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setDebtCustId(c.id); setDebtCustSearch(c.name); setShowDebtDropdown(false); }}>
                          <span className="font-bold text-sm">{c.name}</span>
                          <span className="text-[10px] text-slate-400">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : mode === 'product' ? (
                <>
                  <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" placeholder="Tìm tên sản phẩm..." value={prodSearchTerm} onChange={e => {setProdSearchTerm(e.target.value); setShowProdDropdown(true);}} onFocus={() => setShowProdDropdown(true)} />
                  {showProdDropdown && prodSearchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl z-[100] rounded-2xl overflow-hidden">
                      {products.filter(p => p.name.toLowerCase().includes(prodSearchTerm.toLowerCase())).slice(0, 10).map(p => (
                        <div key={p.id} className="p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setSelectedProductId(p.id); setProdSearchTerm(p.name); setShowProdDropdown(false); }}>
                          <span className="font-bold text-sm">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{formatCurrency(p.defaultPrice)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" placeholder="Mã đơn hoặc tên khách..." value={generalSearch} onChange={e => setGeneralSearch(e.target.value)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kết quả Tra cứu */}
      <div className="flex-1 overflow-auto bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        {mode === 'debt' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h3 className="text-xl font-black text-slate-800">{currentCustomer ? currentCustomer.name : 'Chưa chọn khách'}</h3>
                  <p className="text-xs text-slate-500">{currentCustomer ? `SĐT: ${currentCustomer.phone}` : 'Vui lòng chọn khách hàng để xem sổ nợ'}</p>
               </div>
               {currentCustomer && (
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dư nợ hiện tại</p>
                    <p className="text-2xl font-black text-red-600">{formatCurrency(currentCustomer.totalDebt)}</p>
                 </div>
               )}
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left">Ngày tháng</th>
                    <th className="px-6 py-4 text-left">Nội dung</th>
                    <th className="px-6 py-4 text-right text-red-600">Nợ phát sinh (+)</th>
                    <th className="px-6 py-4 text-right text-green-600">Đã trả / Giảm (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debtHistory.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic">Không có dữ liệu trong khoảng thời gian này</td></tr>
                  ) : debtHistory.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(h.date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${h.increase > 0 ? 'bg-red-400' : 'bg-green-400'}`}></span>
                          <span className="font-bold text-slate-700">{h.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Mã: #{h.id.slice(0,8)}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-black">{h.increase > 0 ? formatCurrency(h.increase) : '-'}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-black">{h.decrease > 0 ? formatCurrency(h.decrease) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mode === 'product' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Lịch sử giá bán sản phẩm</h3>
              {selectedProductId && <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold">Mã SP: #{selectedProductId.slice(0,6)}</span>}
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left">Ngày bán</th>
                    <th className="px-6 py-4 text-left">Khách hàng</th>
                    <th className="px-6 py-4 text-center">SL</th>
                    <th className="px-6 py-4 text-right">Giá đã bán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productPriceHistory.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic">Chưa có lịch sử bán sản phẩm này</td></tr>
                  ) : productPriceHistory.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(h.date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-300" />
                          <span className="font-bold text-slate-700">{h.customer}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Đơn: #{h.invId.slice(0,8)}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-500">{h.qty}</td>
                      <td className="px-6 py-4 text-right font-black text-blue-600">{formatCurrency(h.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mode === 'general' && (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b">
                <tr>
                  <th className="px-6 py-4 text-left">Ngày</th>
                  <th className="px-6 py-4 text-left">Đơn hàng</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generalInvoices.map((inv, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(inv.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-slate-300" />
                        <span className="font-bold text-slate-700">{inv.id.slice(0,8)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{inv.customerName}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-800">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === 'cancelled' ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600'}`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchLookup;
