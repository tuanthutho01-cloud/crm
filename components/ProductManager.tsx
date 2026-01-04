
import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, FileSpreadsheet } from 'lucide-react';
import { Product } from '../types.ts';
import { formatCurrency } from '../utils.ts';
import ExcelImportModal from './ExcelImportModal.tsx';

interface Props {
  products: Product[];
  onUpdate: React.Dispatch<React.SetStateAction<Product[]>>;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

const ProductManager: React.FC<Props> = ({ products, onUpdate, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', unit: '', defaultPrice: '', stock: '' });

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.name || !formData.defaultPrice) return;
    
    const cleanData = {
      name: formData.name,
      unit: formData.unit || 'Cái',
      defaultPrice: Number(formData.defaultPrice),
      stock: Number(formData.stock) || 0
    };

    if (editingProduct) {
      onUpdate(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...p, ...cleanData } : p
      ));
      onNotify("Cập nhật thành công", "success");
    } else {
      const newProd: Product = {
        id: `PROD-${Date.now()}`,
        ...cleanData
      };
      onUpdate(prev => [...prev, newProd]);
      onNotify("Đã thêm sản phẩm", "success");
    }
    
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', unit: '', defaultPrice: '', stock: '' });
  };

  const handleImportExcel = (data: Product[]) => {
    onUpdate(prev => [...prev, ...data]);
    onNotify(`Đã nhập thành công ${data.length} sản phẩm`, "success");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    onUpdate(prev => prev.filter(p => p.id !== id));
    onNotify("Đã xóa sản phẩm", "success");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Tìm sản phẩm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsImportOpen(true)} className="flex-1 md:flex-none bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-green-100"><FileSpreadsheet size={18} /> Nhập Excel</button>
          <button onClick={() => { setEditingProduct(null); setFormData({ name: '', unit: 'Cái', defaultPrice: '', stock: '0' }); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"><Plus size={18} /> Thêm mới</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 font-bold sticky top-0 uppercase text-[10px] tracking-widest border-b text-slate-500">
            <tr>
              <th className="px-6 py-4">Sản phẩm</th>
              <th className="px-6 py-4 text-right">Giá bán</th>
              <th className="px-6 py-4 text-center">Kho</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Chưa có sản phẩm nào</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 group transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">ĐVT: {p.unit}</p>
                </td>
                <td className="px-6 py-4 text-right font-black text-blue-600">
                  {formatCurrency(p.defaultPrice)}
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                    {p.stock}
                   </span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingProduct(p); setFormData({ name: p.name, unit: p.unit, defaultPrice: p.defaultPrice.toString(), stock: p.stock.toString() }); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
            <div className="space-y-3">
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="Tên sản phẩm *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="Đơn vị (Cái, Kg...)" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" type="number" placeholder="Tồn kho" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" type="number" placeholder="Giá bán mặc định *" value={formData.defaultPrice} onChange={e => setFormData({...formData, defaultPrice: e.target.value})} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold transition-all active:scale-95">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {isImportOpen && (
        <ExcelImportModal 
          type="product" 
          onClose={() => setIsImportOpen(false)} 
          onImport={handleImportExcel} 
        />
      )}
    </div>
  );
};

export default ProductManager;
