
import React, { useState, useEffect } from 'react';
import { Upload, X, Info, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
// Fix: Added formatCurrency to the imports from utils.ts
import { loadXLSX, parseExcelDate, formatCurrency } from '../utils.ts';

interface Props {
  type: 'customer' | 'product' | 'invoice';
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const ExcelImportModal: React.FC<Props> = ({ type, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInstructions = () => {
    switch (type) {
      case 'customer':
        return [
          { col: 'A', name: 'Tên khách hàng (Bắt buộc)' },
          { col: 'B', name: 'Số điện thoại' },
          { col: 'C', name: 'Địa chỉ' }
        ];
      case 'product':
        return [
          { col: 'A', name: 'Tên sản phẩm (Bắt buộc)' },
          { col: 'B', name: 'Đơn vị tính (mặc định: Cái)' },
          { col: 'C', name: 'Giá bán mặc định' },
          { col: 'D', name: 'Tồn kho ban đầu' }
        ];
      case 'invoice':
        return [
          { col: 'A', name: 'Mã đơn (Dùng để gộp các món vào 1 đơn)' },
          { col: 'B', name: 'Ngày (Định dạng ngày tháng)' },
          { col: 'C', name: 'Tên khách hàng' },
          { col: 'D', name: 'Tên mặt hàng' },
          { col: 'E', name: 'Số lượng' },
          { col: 'F', name: 'Đơn giá' },
          { col: 'G', name: 'Khách đã trả (VNĐ)' }
        ];
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setError(null);

    try {
      const XLSX = await loadXLSX();
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Bỏ qua dòng tiêu đề đầu tiên
        const rows = data.slice(1).filter(r => r.length > 0 && r[0]);

        if (type === 'customer') {
          setPreview(rows.map(r => ({
            id: `CUST-${Date.now()}-${Math.random()}`,
            name: String(r[0] || '').trim(),
            phone: String(r[1] || '').trim(),
            address: String(r[2] || '').trim(),
            totalDebt: 0
          })));
        } else if (type === 'product') {
          setPreview(rows.map(r => ({
            id: `PROD-${Date.now()}-${Math.random()}`,
            name: String(r[0] || '').trim(),
            unit: String(r[1] || 'Cái').trim(),
            defaultPrice: Number(r[2] || 0),
            stock: Number(r[3] || 0)
          })));
        } else if (type === 'invoice') {
          // Logic gộp đơn hàng theo mã (Cột A)
          const invoiceGroups: Record<string, any> = {};
          rows.forEach(r => {
            const code = String(r[0] || 'DRAFT');
            if (!invoiceGroups[code]) {
              invoiceGroups[code] = {
                id: `INV-${Date.now()}-${code}`,
                type: 'sale',
                customerId: 'WALK-IN', // Khách lẻ mặc định nếu không khớp ID
                customerName: String(r[2] || 'Khách lẻ'),
                items: [],
                totalAmount: 0,
                paidAmount: Number(r[6] || 0),
                status: 'active',
                createdAt: { seconds: Math.floor(parseExcelDate(r[1]).getTime() / 1000), nanoseconds: 0 }
              };
            }
            const qty = Number(r[4] || 1);
            const price = Number(r[5] || 0);
            invoiceGroups[code].items.push({
              productId: 'IMPORTED',
              name: String(r[3] || 'Sản phẩm'),
              qty: qty,
              price: price
            });
            invoiceGroups[code].totalAmount += (qty * price);
          });
          setPreview(Object.values(invoiceGroups));
        }
        setLoading(false);
      };
      reader.readAsBinaryString(selectedFile);
    } catch (err) {
      setError("Lỗi khi đọc file. Vui lòng kiểm tra định dạng .xlsx");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Nhập dữ liệu Excel</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Loại: {type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <section className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <h4 className="text-blue-800 font-bold text-sm flex items-center gap-2 mb-3">
              <Info size={16} /> Hướng dẫn sắp xếp cột
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getInstructions().map((inst, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-blue-700">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-md font-bold">{inst.col}</span>
                  <span>{inst.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-blue-500 italic">* Lưu ý: File Excel nên bắt đầu dữ liệu từ dòng số 2 (Dòng 1 là tiêu đề).</p>
          </section>

          {!file ? (
            <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
              <Upload size={48} className="text-slate-300 mb-4" />
              <p className="font-bold text-slate-700">Chọn file Excel (.xlsx)</p>
              <p className="text-xs text-slate-400 mt-1">Hoặc kéo thả file vào đây</p>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-green-600 font-bold">
                  <CheckCircle2 size={20} />
                  <span>Đã tải: {file.name}</span>
                </div>
                <button onClick={() => {setFile(null); setPreview([]);}} className="text-xs text-red-500 font-bold hover:underline">Chọn file khác</button>
              </div>

              {loading ? (
                <div className="py-10 text-center text-slate-400">Đang phân tích dữ liệu...</div>
              ) : preview.length > 0 ? (
                <div className="border rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b text-[10px] font-bold text-slate-500 uppercase">Xem trước 5 dòng đầu</div>
                  <table className="w-full text-[11px]">
                    <tbody className="divide-y">
                      {preview.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-bold">{row.name || row.customerName}</td>
                          <td className="px-4 py-2 text-slate-500">{row.phone || (row.items?.length + ' món')}</td>
                          <td className="px-4 py-2 text-right font-bold text-blue-600">{row.defaultPrice ? formatCurrency(row.defaultPrice) : formatCurrency(row.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 5 && <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-50">... và {preview.length - 5} dòng khác</div>}
                </div>
              ) : null}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 active:scale-95 transition-all">Đóng</button>
          <button 
            disabled={preview.length === 0} 
            onClick={() => {onImport(preview); onClose();}}
            className="flex-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            Nhập {preview.length} dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;
