
import React, { useState, useMemo } from 'react';
import { Search, FileText, ShoppingCart, XCircle, Printer, ArrowRightCircle, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { Invoice, Customer, InvoiceType } from '../types.ts';
import { formatCurrency, formatDate } from '../utils.ts';
import ExcelImportModal from './ExcelImportModal.tsx';

interface Props {
  invoices: Invoice[];
  customers: Customer[];
  onTransfer: (data: Invoice, target: InvoiceType) => void;
  onNotify: (msg: string, type: 'success' | 'error') => void;
  onUpdate?: (newInvoices: Invoice[]) => void;
}

const InvoiceHistory: React.FC<Props> = ({ invoices, customers, onTransfer, onNotify, onUpdate }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchType = filterType === 'all' || inv.type === filterType;
      const matchSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [invoices, filterType, searchTerm]);

  const handleImportExcel = (data: Invoice[]) => {
    if (onUpdate) {
      onUpdate([...data, ...invoices]);
      onNotify(`Đã nhập thành công ${data.length} hóa đơn`, "success");
    }
  };

  const renderBadge = (type: InvoiceType) => {
    const styles = {
      [InvoiceType.QUOTE]: 'bg-purple-100 text-purple-700',
      [InvoiceType.ORDER]: 'bg-orange-100 text-orange-700',
      [InvoiceType.SALE]: 'bg-blue-100 text-blue-700',
      [InvoiceType.RETURN]: 'bg-red-100 text-red-700',
      [InvoiceType.PAYMENT]: 'bg-green-100 text-green-700'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[type]}`}>{type}</span>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
        <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Mã đơn, tên khách..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setIsImportOpen(true)} className="flex items-center justify-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm font-bold border border-green-100"><FileSpreadsheet size={18} /> Nhập Excel</button>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold gap-1 w-full md:w-auto overflow-x-auto">
          {['all', InvoiceType.SALE, InvoiceType.ORDER, InvoiceType.QUOTE, InvoiceType.RETURN].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${filterType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              {t === 'all' ? 'Tất cả' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b">
            <tr>
              <th className="px-6 py-4">Ngày</th>
              <th className="px-6 py-4">Mã</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4 text-right">Giá trị</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.map(inv => (
              <tr key={inv.id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${inv.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`} onClick={() => setSelectedInvoice(inv)}>
                <td className="px-6 py-4 text-xs text-slate-400">{formatDate(inv.createdAt)}</td>
                <td className="px-6 py-4 font-mono text-[10px]">{inv.id.slice(0, 8)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{inv.customerName || 'Khách lẻ'}</span>
                    <div className="mt-1">{renderBadge(inv.type)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === 'cancelled' ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600'}`}>{inv.status === 'cancelled' ? 'Đã hủy' : 'Thành công'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Chi tiết đơn</h3>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><XCircle size={24} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="flex justify-between items-start">
                <div><p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Mã đơn</p><p className="font-mono text-slate-800">#{selectedInvoice.id.slice(0, 12).toUpperCase()}</p></div>
                <div className="text-right"><p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Ngày lập</p><p className="text-slate-800">{formatDate(selectedInvoice.createdAt)}</p></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Khách hàng</p>
                <p className="text-lg font-bold text-blue-600">{selectedInvoice.customerName}</p>
              </div>
              <table className="w-full text-sm border rounded-2xl overflow-hidden">
                <thead className="bg-slate-50 border-b font-bold text-slate-500">
                  <tr><th className="p-3 text-left">Sản phẩm</th><th className="p-3 text-center">SL</th><th className="p-3 text-right">Đơn giá</th></tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3 text-center">{item.qty}</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng tiền:</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                {selectedInvoice.paidAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Khách đã trả:</span>
                    <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-between gap-3">
              <div className="flex gap-2">
                {selectedInvoice.type === InvoiceType.QUOTE && <button onClick={() => { onTransfer(selectedInvoice, InvoiceType.ORDER); setSelectedInvoice(null); }} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-xs font-bold hover:bg-orange-200 flex items-center gap-1"><ArrowRightCircle size={14}/> Lên Đơn</button>}
                {selectedInvoice.type === InvoiceType.ORDER && <button onClick={() => { onTransfer(selectedInvoice, InvoiceType.SALE); setSelectedInvoice(null); }} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-200 flex items-center gap-1"><ShoppingCart size={14}/> Bán hàng</button>}
              </div>
              <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2">In đơn</button>
            </div>
          </div>
        </div>
      )}

      {isImportOpen && (
        <ExcelImportModal 
          type="invoice" 
          onClose={() => setIsImportOpen(false)} 
          onImport={handleImportExcel} 
        />
      )}
    </div>
  );
};

export default InvoiceHistory;
