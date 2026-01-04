
import React from 'react';
import { Smartphone, Monitor, X, Share, CheckCircle, Download, ExternalLink, Package } from 'lucide-react';

const InstallGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
               <Smartphone size={24} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold">Cài đặt & APK</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Section 1: PWA (Recommended) */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-2">
            <h4 className="text-blue-800 font-bold text-sm flex items-center gap-2">
              <CheckCircle size={18} /> Cách 1: Cài đặt trực tiếp (PWA)
            </h4>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Đây là cách tốt nhất. Ứng dụng sẽ chạy toàn màn hình, không tốn dung lượng máy và tự động cập nhật.
            </p>
            <div className="pt-2 space-y-2">
              <div className="flex items-start gap-2 text-[11px] text-slate-600">
                <span className="font-bold">Android:</span> Menu trình duyệt (3 chấm) ➜ Cài đặt ứng dụng.
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-600">
                <span className="font-bold">iPhone:</span> Nút Chia sẻ ➜ Thêm vào MH chính.
              </div>
            </div>
          </div>

          {/* Section 2: APK Conversion */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-slate-800 font-bold border-b pb-2">
              <Package size={20} className="text-orange-500" />
              <h4>Cách 2: Chuyển thành file APK</h4>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 italic">Nếu bạn muốn có file .apk để cài đặt như ứng dụng thông thường, hãy làm theo các bước sau:</p>
              
              <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Bước 1: Lưu/Host ứng dụng</p>
                  <p className="text-[11px] text-slate-500">Đưa link ứng dụng này lên mạng (sử dụng Vercel hoặc GitHub Pages).</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Bước 2: Sử dụng PWABuilder</p>
                  <p className="text-[11px] text-slate-500">Truy cập <span className="text-blue-600 font-bold">pwabuilder.com</span>, dán link vào và chọn "Android".</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Bước 3: Tải APK</p>
                  <p className="text-[11px] text-slate-500">Hệ thống sẽ tạo file cài đặt APK cho bạn trong vòng 2 phút.</p>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-2">
                <ExternalLink size={14} className="text-orange-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-700">Ngoài ra, bạn có thể dùng <b>webintoapp.com</b> để tạo APK cực nhanh mà không cần tài khoản.</p>
              </div>
            </div>
          </section>

          <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
            ĐÃ HIỂU
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallGuide;
