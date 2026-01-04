
import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, FileSpreadsheet, CreditCard, XCircle, DollarSign } from 'lucide-react';
import { Customer, InvoiceType } from '../types.ts';
import { formatCurrency } from '../utils.ts';
import ExcelImportModal from './ExcelImportModal.tsx';

interface Props {
  customers: Customer[];
  onUpdate: React.Dispatch<React.SetStateAction<Customer[]>>;
  onNotify: (msg: string, type: 'success' | 'error') => void;
  onAddPayment: (data: any) => Promise<void>;
}

const CustomerManager: React.FC<Props> = ({ customers, onUpdate, onNotify, onAddPayment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedForPayment, setSelectedForPayment] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleSave = () => {
    if (!formData.name) return;
    if (editingCustomer) {
      onUpdate(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c));
      onNotify("Cập nhật thành công", "success");
    } else {
      onUpdate(prev => [...prev, { id: `CUST-${Date.now()}`, ...formData, totalDebt: 0 }]);
      onNotify("Đã thêm khách mới", "success");
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '' });
  };

  const handleCreatePayment = async () => {
    if (!selectedForPayment || !paymentAmount) return;
    const amount = Number(paymentAmount);
    if (amount <= 0) {
      onNotify("Số tiền thu phải lớn hơn 0", "error");
      return;
    }
    
    await onAddPayment({
      type: InvoiceType.PAYMENT,
      customerId: selectedForPayment.id,
      customerName: selectedForPayment.name,
      items: [],
      totalAmount: 0,
      paidAmount: amount,
      note: paymentNote || 'Thu nợ mặt/chuyển khoản'
    });
    
    setIsPaymentOpen(false);
    setSelectedForPayment(null);
    setPaymentAmount('');
    setPaymentNote('');
    onNotify(`Đã thu nợ ${formatCurrency(amount)} từ ${selectedForPayment.name}`, "success");
  };

  const handleImportExcel = (data: Customer[]) => {
    onUpdate(prev => [...prev, ...data]);
    onNotify(`Đã nhập thành công ${data.length} khách hàng`, "success");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Xóa khách hàng này?")) return;
    onUpdate(prev => prev.filter(c => c.id !== id));
    onNotify("Đã xóa", "success");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Tìm tên, SĐT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsImportOpen(true)} className="flex-1 md:flex-none bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-green-100"><FileSpreadsheet size={18} /> Nhập Excel</button>
          <button onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', address: '' }); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"><Plus size={18} /> Thêm mới</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 font-bold sticky top-0 uppercase text-[10px] tracking-widest border-b text-slate-500">
            <tr>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4 text-right">Dư nợ</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 group transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                </td>
                <td className={`px-6 py-4 text-right font-black ${c.totalDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(c.totalDebt)}
                </td>
                <td className="px-6 py-4 flex justify-center gap-1">
                  {c.totalDebt > 0 && (
                    <button onClick={() => { setSelectedForPayment(c); setIsPaymentOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Thu nợ"><DollarSign size={18} /></button>
                  )}
                  <button onClick={() => { setEditingCustomer(c); setFormData({ name: c.name, phone: c.phone, address: c.address }); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Modal Thu nợ */}
      {isPaymentOpen && selectedForPayment && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><CreditCard className="text-green-600" /> Phiếu thu nợ</h3>
               <button onClick={() => setIsPaymentOpen(false)}><XCircle className="text-slate-300 hover:text-red-500" /></button>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
               <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">Khách hàng</p>
               <p className="text-lg font-bold text-slate-800">{selectedForPayment.name}</p>
               <p className="text-sm font-bold text-red-500 mt-2">Nợ hiện tại: {formatCurrency(selectedForPayment.totalDebt)}</p>
            </div>
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền thu *</label>
                  <input autoFocus className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-green-500 text-2xl font-black text-green-600 text-right" type="number" placeholder="0" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú phiếu thu</label>
                  <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm" placeholder="VD: Khách trả tiền mặt..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
               </div>
            </div>
            <button onClick={handleCreatePayment} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-green-600/20">Xác nhận thu tiền</button>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa khách */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800">{editingCustomer ? 'Sửa thông tin' : 'Thêm khách hàng'}</h3>
            <div className="space-y-3">
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="Tên khách hàng *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="Số điện thoại" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24 resize-none" placeholder="Địa chỉ" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold transition-all active:scale-95">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {isImportOpen && <ExcelImportModal type="customer" onClose={() => setIsImportOpen(false)} onImport={handleImportExcel} />}
    </div>
  );
};

export default CustomerManager;
