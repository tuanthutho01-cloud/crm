
const CACHE_NAME = 'crm-pro-v2-offline';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json'
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Cài đặt SW và lưu trữ các file quan trọng
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Đang lưu trữ tài nguyên offline...');
      // Thử cache từng tài nguyên để tránh lỗi 1 file hỏng làm hỏng cả quá trình
      const cachePromises = [...ASSETS_TO_CACHE, ...EXTERNAL_ASSETS].map(url => {
        return cache.add(url).catch(err => console.warn(`Không thể cache: ${url}`, err));
      });
      return Promise.all(cachePromises);
    })
  );
  self.skipWaiting();
});

// Xử lý yêu cầu thông minh: Ưu tiên mạng -> Nếu lỗi thì lấy Cache
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Nếu lấy được từ mạng, lưu bản sao vào cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Nếu mất mạng, tìm trong cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Nếu là yêu cầu trang (HTML), trả về trang chủ đã cache
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('index.html');
          }
          return null;
        });
      })
  );
});

// Xóa cache cũ khi có phiên bản mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});
