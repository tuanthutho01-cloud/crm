
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Trash2, Save, FileText, ClipboardList, RotateCcw, Package, ShoppingCart, X } from 'lucide-react';
import { Customer, Product, InvoiceType, InvoiceItem } from '../types.ts';
import { formatCurrency } from '../utils.ts';

interface Props {
  customers: Customer[];
  products: Product[];
  customPrices: Record<string, number>;
  onSubmit: (data: any) => Promise<void>;
  transferData?: any;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

const POS: React.FC<Props> = ({ customers, products, customPrices, onSubmit, transferData, onNotify }) => {
  const [transType, setTransType] = useState<InvoiceType>(InvoiceType.SALE);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  useEffect(() => {
    if (transferData) {
      setTransType(transferData.targetType || InvoiceType.SALE);
      setSelectedCustomerId(transferData.customerId);
      const cust = customers.find(c => c.id === transferData.customerId);
      if (cust) setCustSearch(cust.name);
      setCart(transferData.items.map((i: any) => ({ ...i })));
      setPaidAmount('');
    }
  }, [transferData, customers]);

  const filteredProducts = useMemo(() => {
    if (!prodSearch) return [];
    return products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())).slice(0, 20);
  }, [products, prodSearch]);

  const filteredCustomers = useMemo(() => {
    const term = custSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term)).slice(0, 10);
  }, [customers, custSearch]);

  const addToCart = (product: Product) => {
    if (!selectedCustomerId) {
      onNotify("Vui lòng chọn khách hàng trước!", "error");
      return;
    }
    const priceKey = `${selectedCustomerId}_${product.id}`;
    const historicalPrice = customPrices[priceKey];
    const finalPrice = historicalPrice !== undefined ? historicalPrice : product.defaultPrice;

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].qty += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        qty: 1,
        price: finalPrice
      }]);
    }
  };

  const updateCart = (productId: string, field: 'qty' | 'price', value: number) => {
    setCart(cart.map(item => item.productId === productId ? { ...item, [field]: value } : item));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const balance = Math.max(0, totalAmount - (Number(paidAmount) || 0));

  const handleSubmit = async () => {
    if (!selectedCustomerId || cart.length === 0) return;
    const customer = customers.find(c => c.id === selectedCustomerId);
    
    await onSubmit({
      type: transType,
      customerId: selectedCustomerId,
      customerName: customer?.name || 'Khách lẻ',
      items: cart,
      totalAmount,
      paidAmount: Number(paidAmount) || 0,
      note
    });

    setCart([]);
    setPaidAmount('');
    setNote('');
    setProdSearch('');
    onNotify("Đã hoàn tất giao dịch", "success");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Chọn Sản Phẩm</h3>
            <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold gap-1">
              {[InvoiceType.SALE, InvoiceType.ORDER, InvoiceType.QUOTE, InvoiceType.RETURN].map(t => (
                <button 
                  key={t}
                  onClick={() => setTransType(t)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${transType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t === InvoiceType.SALE ? 'Bán' : t === InvoiceType.ORDER ? 'Đặt' : t === InvoiceType.QUOTE ? 'Báo giá' : 'Trả'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Gõ tên sản phẩm..."
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
          {prodSearch ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between">
                  <p className="font-bold text-slate-800 text-sm mb-2 line-clamp-2">{p.name}</p>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Kho: {p.stock}</span>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(p.defaultPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Package size={48} strokeWidth={1} />
              <p className="mt-2 text-sm font-medium">Nhập tên sản phẩm để bắt đầu</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className={`p-4 text-white ${
          transType === InvoiceType.SALE ? 'bg-blue-600' : 
          transType === InvoiceType.ORDER ? 'bg-orange-600' : 
          transType === InvoiceType.QUOTE ? 'bg-purple-600' : 'bg-red-600'
        }`}>
          <h3 className="font-bold flex items-center gap-2 mb-3">
            {transType === InvoiceType.SALE && <ShoppingCart size={20}/>}
            {transType === InvoiceType.ORDER && <ClipboardList size={20}/>}
            {transType === InvoiceType.QUOTE && <FileText size={20}/>}
            {transType === InvoiceType.RETURN && <RotateCcw size={20}/>}
            {transType.toUpperCase()}
          </h3>
          <div className="relative">
            <input 
              className="w-full p-2 text-slate-800 rounded-lg text-sm outline-none shadow-inner"
              placeholder="Tìm khách hàng..."
              value={custSearch}
              onChange={(e) => { setCustSearch(e.target.value); setSelectedCustomerId(''); setShowCustDropdown(true); }}
              onFocus={() => setShowCustDropdown(true)}
            />
            {showCustDropdown && custSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-xl rounded-xl z-50 text-slate-800 overflow-hidden border">
                {filteredCustomers.map(c => (
                  <div key={c.id} className="p-3 hover:bg-slate-50 cursor-pointer border-b flex justify-between items-center" onClick={() => { setSelectedCustomerId(c.id); setCustSearch(c.name); setShowCustDropdown(false); }}>
                    <div>
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </div>
                    {c.totalDebt > 0 && <span className="text-[10px] font-bold text-red-500">Nợ: {formatCurrency(c.totalDebt)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 && <div className="h-full flex items-center justify-center text-slate-300 text-sm">Giỏ hàng trống</div>}
          {cart.map(item => (
            <div key={item.productId} className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
              <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="absolute top-1 right-1 text-slate-300 hover:text-red-500"><X size={14} /></button>
              <p className="font-bold text-slate-700 text-sm mb-2 pr-4">{item.name}</p>
              <div className="flex items-center gap-2">
                <input type="number" className="w-16 p-1 border rounded text-sm text-center font-bold" value={item.qty} onChange={(e) => updateCart(item.productId, 'qty', Number(e.target.value))} />
                <span className="text-slate-400">x</span>
                <input type="number" className="flex-1 p-1 border rounded text-sm text-right font-bold" value={item.price} onChange={(e) => updateCart(item.productId, 'price', Number(e.target.value))} />
              </div>
              <p className="text-right mt-1 font-bold text-blue-600 text-sm">{formatCurrency(item.qty * item.price)}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-slate-500 font-medium">Tổng tiền:</span>
            <span className="text-2xl font-bold text-slate-800">{formatCurrency(totalAmount)}</span>
          </div>
          {(transType === InvoiceType.SALE || transType === InvoiceType.RETURN) && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 w-24">Khách trả:</span>
                <input type="number" className="flex-1 p-2 border rounded-xl text-right font-bold focus:ring-2 focus:ring-blue-500/20" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Còn nợ:</span>
                <span className={balance > 0 ? 'text-red-500' : 'text-green-500'}>{formatCurrency(balance)}</span>
              </div>
            </>
          )}
          <button onClick={handleSubmit} disabled={!selectedCustomerId || cart.length === 0} className={`w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${
              transType === InvoiceType.SALE ? 'bg-blue-600' : 
              transType === InvoiceType.ORDER ? 'bg-orange-600' : 
              transType === InvoiceType.QUOTE ? 'bg-purple-600' : 'bg-red-600'
            }`}>
            <Save size={18} /> Hoàn tất {transType === InvoiceType.SALE ? 'Bán hàng' : 'Chứng từ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
