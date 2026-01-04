
import { Customer, Product, Invoice } from './types.ts';

const STORAGE_KEY = 'CRM_LITE_LOCAL_DATA_V1';

interface LocalData {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  customPrices: Record<string, number>;
}

const initialData: LocalData = {
  customers: [],
  products: [],
  invoices: [],
  customPrices: {}
};

export const saveToDevice = (data: LocalData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadFromDevice = (): LocalData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;
  try {
    const parsed = JSON.parse(saved);
    // Chuyển đổi chuỗi ngày tháng cũ thành đối tượng Date hoặc Timestamp giả lập
    return {
      ...parsed,
      invoices: (parsed.invoices || []).map((inv: any) => ({
        ...inv,
        createdAt: inv.createdAt?.seconds ? inv.createdAt : { seconds: new Date(inv.createdAt).getTime() / 1000, nanoseconds: 0 }
      }))
    };
  } catch (e) {
    console.error("Lỗi đọc dữ liệu từ thiết bị", e);
    return initialData;
  }
};

export const exportDataFile = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CRM_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
};

export const importDataFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        JSON.parse(content); // Kiểm tra tính hợp lệ
        localStorage.setItem(STORAGE_KEY, content);
        resolve(true);
      } catch (err) {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};
