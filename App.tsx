
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, ShoppingCart, LayoutDashboard, Package, Search, 
  FileText, Download, Trash2, Menu as MenuIcon, Smartphone
} from 'lucide-react';
import { TabType, Customer, Product, Invoice, InvoiceType, InvoiceItem } from './types.ts';
import { formatCurrency } from './utils.ts';
import * as LocalStorage from './storage.ts';

// Sub-components
import Dashboard from './components/Dashboard.tsx';
import POS from './components/POS.tsx';
import InvoiceHistory from './components/InvoiceHistory.tsx';
import SearchLookup from './components/SearchLookup.tsx';
import CustomerManager from './components/CustomerManager.tsx';
import ProductManager from './components/ProductManager.tsx';
import InstallGuide from './components/InstallGuide.tsx';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  
  // Local Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  
  // UI State
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [transferData, setTransferData] = useState<any>(null);

  // Load dữ liệu khi mở app
  useEffect(() => {
    const data = LocalStorage.loadFromDevice();
    setCustomers(data.customers);
    setProducts(data.products);
    setInvoices(data.invoices);
    setCustomPrices(data.customPrices);
  }, []);

  // Lưu dữ liệu mỗi khi có thay đổi
  useEffect(() => {
    LocalStorage.saveToDevice({
      customers,
      products,
      invoices,
      customPrices
    });
  }, [customers, products, invoices, customPrices]);

  const showNotify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleInvoiceSubmit = async (invoiceData: any) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `INV-${Date.now()}`,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      status: 'active'
    };

    setInvoices(prev => [newInvoice, ...prev]);

    if (invoiceData.type === InvoiceType.SALE) {
      const debtAmount = invoiceData.totalAmount - invoiceData.paidAmount;
      if (debtAmount !== 0) {
        setCustomers(prev => prev.map(c => 
          c.id === invoiceData.customerId ? { ...c, totalDebt: (c.totalDebt || 0) + debtAmount } : c
        ));
      }
      const newCustomPrices = { ...customPrices };
      setProducts(prev => prev.map(p => {
        const item = invoiceData.items.find((i: InvoiceItem) => i.productId === p.id);
        if (item) {
          newCustomPrices[`${invoiceData.customerId}_${p.id}`] = item.price;
          return { ...p, stock: p.stock - item.qty };
        }
        return p;
      }));
      setCustomPrices(newCustomPrices);
    }
    
    if (invoiceData.type === InvoiceType.RETURN) {
      const refundDebt = invoiceData.totalAmount - invoiceData.paidAmount;
      setCustomers(prev => prev.map(c => 
        c.id === invoiceData.customerId ? { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - refundDebt) } : c
      ));
      setProducts(prev => prev.map(p => {
        const item = invoiceData.items.find((i: InvoiceItem) => i.productId === p.id);
        return item ? { ...p, stock: p.stock + item.qty } : p;
      }));
    }

    if (invoiceData.type === InvoiceType.PAYMENT) {
      setCustomers(prev => prev.map(c => 
        c.id === invoiceData.customerId ? { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - invoiceData.paidAmount) } : c
      ));
    }

    showNotify("Đã lưu thành công!", "success");
    setActiveTab(TabType.INVOICES);
  };

  const handleClearData = () => {
    if (window.confirm("Xóa sạch dữ liệu trên máy? Hãy chắc chắn bạn đã sao lưu.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transition-transform transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex md:flex-col
      `}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-blue-400">CRM Pro Mobile</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Dữ liệu nội bộ</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button onClick={() => {setActiveTab(TabType.DASHBOARD); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === TabType.DASHBOARD ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard size={20} /> Tổng quan
          </button>
          <button onClick={() => {setActiveTab(TabType.POS); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === TabType.POS ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}>
            <ShoppingCart size={20} /> Bán hàng
          </button>
          <button onClick={() => {setActiveTab(TabType.SEARCH); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === TabType.SEARCH ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Search size={20} /> Sổ nợ & Tra cứu
          </button>
          <button onClick={() => {setActiveTab(TabType.INVOICES); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === TabType.INVOICES ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}>
            <FileText size={20} /> Lịch sử đơn
          </button>
          <div className="h-px bg-slate-800 my-4"></div>
          <button onClick={() => {setActiveTab(TabType.CUSTOMERS); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === TabType.CUSTOMERS ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Users size={20} /> Khách hàng
          </button>
          <button onClick={() => {setActiveTab(TabType.PRODUCTS); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === TabType.PRODUCTS ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Package size={20} /> Sản phẩm
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={() => setShowInstallGuide(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mb-2 shadow-lg shadow-blue-600/10">
            <Smartphone size={16} /> Cài đặt App
          </button>
          <button onClick={() => LocalStorage.exportDataFile()} className="w-full py-2 bg-slate-800 rounded-xl text-[10px] text-slate-300 hover:bg-slate-700 flex items-center justify-center gap-2">
            <Download size={14} /> Xuất dữ liệu lưu trữ
          </button>
          <button onClick={handleClearData} className="w-full py-2 text-red-500 text-[10px] hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-1">
            <Trash2 size={12} /> Xóa sạch dữ liệu
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-30 no-print shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600"><MenuIcon size={24} /></button>
            <h2 className="text-lg font-bold text-slate-700 capitalize">
              {activeTab === TabType.SEARCH ? 'Tra cứu' : activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-100 uppercase">
               Offline
             </div>
             {notification && <div className={`text-xs font-bold px-3 py-1 rounded-full animate-bounce ${notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{notification.msg}</div>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar">
           {activeTab === TabType.DASHBOARD && <Dashboard customers={customers} invoices={invoices} />}
           {activeTab === TabType.POS && <POS customers={customers} products={products} customPrices={customPrices} onSubmit={handleInvoiceSubmit} onNotify={showNotify} transferData={transferData} />}
           {activeTab === TabType.INVOICES && <InvoiceHistory invoices={invoices} customers={customers} onNotify={showNotify} onUpdate={setInvoices} onTransfer={(inv, target) => { setTransferData({...inv, targetType: target}); setActiveTab(TabType.POS); }} />}
           {activeTab === TabType.SEARCH && <SearchLookup customers={customers} products={products} invoices={invoices} />}
           {activeTab === TabType.CUSTOMERS && <CustomerManager customers={customers} onUpdate={setCustomers} onNotify={showNotify} onAddPayment={handleInvoiceSubmit} />}
           {activeTab === TabType.PRODUCTS && <ProductManager products={products} onUpdate={setProducts} onNotify={showNotify} />}
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-40 no-print shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-padding">
          <TabButton icon={LayoutDashboard} active={activeTab === TabType.DASHBOARD} onClick={() => setActiveTab(TabType.DASHBOARD)} />
          <TabButton icon={ShoppingCart} active={activeTab === TabType.POS} onClick={() => setActiveTab(TabType.POS)} />
          <TabButton icon={Search} active={activeTab === TabType.SEARCH} onClick={() => setActiveTab(TabType.SEARCH)} />
          <TabButton icon={FileText} active={activeTab === TabType.INVOICES} onClick={() => setActiveTab(TabType.INVOICES)} />
          <TabButton icon={Users} active={activeTab === TabType.CUSTOMERS} onClick={() => setActiveTab(TabType.CUSTOMERS)} />
        </nav>
      </main>

      {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
    </div>
  );
};

const TabButton = ({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>
    <Icon size={24}/>
  </button>
);

export default App;
