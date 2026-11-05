const IMAGE_DB_NAME = 'TechnoStore_ImageDB';
const IMAGE_STORE_NAME = 'images';
let imageDatabasePromise;
const imageObjectUrls = new Map();
const imageChannel = 'BroadcastChannel' in window
  ? new BroadcastChannel('TechnoStore_ImageDB')
  : null;

function announceImageChange(id) {
  if (imageChannel) imageChannel.postMessage({ id: String(id || '') });
}

function invalidateImageObjectUrl(id) {
  const imageId = String(id || '');
  const previousUrl = imageObjectUrls.get(imageId);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  imageObjectUrls.delete(imageId);
}

if (imageChannel) {
  imageChannel.addEventListener('message', event => {
    if (event.data && event.data.id) {
      invalidateImageObjectUrl(event.data.id);
      if (typeof window.refreshProductImagesById === 'function') {
        window.refreshProductImagesById(event.data.id);
      }
    }
  });
}

function openImageDatabase() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
  }
  if (imageDatabasePromise) return imageDatabasePromise;

  imageDatabasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        imageDatabasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => reject(request.error || new Error('Không thể mở cơ sở dữ liệu ảnh.'));
    request.onblocked = () => reject(new Error('Cơ sở dữ liệu ảnh đang bị chặn bởi một tab khác.'));
  });

  imageDatabasePromise.catch(() => {
    imageDatabasePromise = null;
  });
  return imageDatabasePromise;
}

async function saveImageToIndexedDB(id, fileOrBase64) {
  const imageId = String(id || '').trim();
  if (!imageId) throw new Error('Mã ảnh không hợp lệ.');

  let blob = fileOrBase64;
  if (typeof blob === 'string') {
    const response = await fetch(blob);
    if (!response.ok) throw new Error('Không thể đọc dữ liệu ảnh.');
    blob = await response.blob();
  }
  if (!(blob instanceof Blob) || !blob.type.startsWith('image/')) {
    throw new Error('Dữ liệu tải lên không phải file hình ảnh hợp lệ.');
  }

  const database = await openImageDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite');
    transaction.objectStore(IMAGE_STORE_NAME).put({
      id: imageId,
      blob,
      type: blob.type,
      updatedAt: Date.now()
    });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Không thể lưu ảnh.'));
    transaction.onabort = () => reject(transaction.error || new Error('Đã hủy lưu ảnh.'));
  });

  const previousUrl = imageObjectUrls.get(imageId);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  imageObjectUrls.delete(imageId);
  announceImageChange(imageId);
  return imageId;
}

async function getImageFromIndexedDB(id, fallbackPath = null) {
  const imageId = String(id || '').trim();
  if (!imageId) return fallbackPath;

  const database = await openImageDatabase();
  const image = await new Promise((resolve, reject) => {
    const request = database.transaction(IMAGE_STORE_NAME, 'readonly')
      .objectStore(IMAGE_STORE_NAME)
      .get(imageId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Không thể đọc ảnh.'));
  });
  if (!image) return fallbackPath;

  if (!imageObjectUrls.has(imageId)) {
    imageObjectUrls.set(imageId, URL.createObjectURL(image.blob));
  }
  return imageObjectUrls.get(imageId);
}

async function deleteImageFromIndexedDB(id) {
  const imageId = String(id || '').trim();
  if (!imageId) return;

  const database = await openImageDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite');
    transaction.objectStore(IMAGE_STORE_NAME).delete(imageId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Không thể xóa ảnh.'));
    transaction.onabort = () => reject(transaction.error || new Error('Đã hủy xóa ảnh.'));
  });

  const previousUrl = imageObjectUrls.get(imageId);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  imageObjectUrls.delete(imageId);
  announceImageChange(imageId);
}

async function moveImageInIndexedDB(oldId, newId) {
  const sourceId = String(oldId || '').trim();
  const targetId = String(newId || '').trim();
  if (!sourceId || !targetId || sourceId === targetId) return;

  const database = await openImageDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const getRequest = store.get(sourceId);
    getRequest.onsuccess = () => {
      if (!getRequest.result) return;
      store.put({ ...getRequest.result, id: targetId, updatedAt: Date.now() });
      store.delete(sourceId);
    };
    getRequest.onerror = () => transaction.abort();
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Không thể cập nhật mã ảnh.'));
    transaction.onabort = () => reject(transaction.error || getRequest.error || new Error('Đã hủy cập nhật mã ảnh.'));
  });

  const previousUrl = imageObjectUrls.get(sourceId);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  imageObjectUrls.delete(sourceId);
  imageObjectUrls.delete(targetId);
  announceImageChange(sourceId);
  announceImageChange(targetId);
}

async function copyImageInIndexedDB(sourceId, targetId) {
  const imageId = String(sourceId || '').trim();
  const newImageId = String(targetId || '').trim();
  if (!imageId || !newImageId || imageId === newImageId) return;

  const database = await openImageDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.get(imageId);
    request.onsuccess = () => {
      if (request.result) {
        store.put({ ...request.result, id: newImageId, updatedAt: Date.now() });
      }
    };
    request.onerror = () => transaction.abort();
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Không thể sao chép ảnh.'));
    transaction.onabort = () => reject(transaction.error || request.error || new Error('Đã hủy sao chép ảnh.'));
  });

  const previousUrl = imageObjectUrls.get(newImageId);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  imageObjectUrls.delete(newImageId);
  announceImageChange(newImageId);
}

async function hasImageInIndexedDB(id) {
  const imageId = String(id || '').trim();
  if (!imageId) return false;

  const database = await openImageDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(IMAGE_STORE_NAME, 'readonly')
      .objectStore(IMAGE_STORE_NAME)
      .count(imageId);
    request.onsuccess = () => resolve(request.result > 0);
    request.onerror = () => reject(request.error || new Error('Không thể kiểm tra ảnh.'));
  });
}

window.saveImageToIndexedDB = saveImageToIndexedDB;
window.getImageFromIndexedDB = getImageFromIndexedDB;
window.deleteImageFromIndexedDB = deleteImageFromIndexedDB;
window.moveImageInIndexedDB = moveImageInIndexedDB;
window.copyImageInIndexedDB = copyImageInIndexedDB;
window.hasImageInIndexedDB = hasImageInIndexedDB;
