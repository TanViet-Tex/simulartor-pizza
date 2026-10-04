const DATABASE = 'pizza-demo-checkpoints';
const STORE = 'checkpoints';
const TIMEOUT_MS = 8000;
const commitIds = new WeakMap<object, string>();

interface Envelope {
  schemaVersion: 1;
  revision: number;
  commitId: string;
  data: object;
}

function objectData(value: unknown): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function envelope(value: unknown): Envelope {
  if (!objectData(value)) throw new Error('Dữ liệu lưu bị hỏng. Hãy thử đọc lại hoặc xác nhận tạo chiến dịch mới.');
  const item = value as Partial<Envelope>;
  if (typeof item.schemaVersion === 'number' && item.schemaVersion > 1) {
    throw new Error('Bản lưu thuộc phiên bản game mới hơn. Không thể mở bằng phiên bản này.');
  }
  if (item.schemaVersion !== 1 || !Number.isSafeInteger(item.revision) || (item.revision ?? 0) < 1
    || typeof item.commitId !== 'string' || !item.commitId || !objectData(item.data)) {
    throw new Error('Dữ liệu lưu không hợp lệ. Tiến độ cũ được giữ nguyên; không tự phục hồi ngày đã qua.');
  }
  return item as Envelope;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Trình duyệt không hỗ trợ lưu tiến độ.'));
      return;
    }
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error('Không mở được bộ nhớ lưu. Hãy đóng tab game khác rồi thử lại.'));
    };
    const timer = setTimeout(fail, TIMEOUT_MS);
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DATABASE, 1); } catch { fail(); return; }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onerror = fail;
    request.onblocked = fail;
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true;
      clearTimeout(timer);
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}

async function transaction<T>(mode: IDBTransactionMode, operation: (
  store: IDBObjectStore, complete: (result: T) => void, fail: (error: Error) => void,
) => void): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = database.transaction(STORE, mode);
      let result: T;
      let failure: Error | undefined;
      const timer = setTimeout(() => {
        failure = new Error('Lưu tiến độ quá thời gian. Giữ trang này mở và thử lại.');
        try { tx.abort(); } catch { /* The transaction may already have completed. */ }
      }, TIMEOUT_MS);
      tx.oncomplete = () => { clearTimeout(timer); resolve(result); };
      tx.onabort = () => {
        clearTimeout(timer);
        reject(failure ?? new Error('Không ghi được tiến độ. Bản lưu cũ được giữ nguyên; hãy thử lại.'));
      };
      tx.onerror = () => { /* The abort event is the authoritative failure boundary. */ };
      const fail = (error: Error) => { failure = error; tx.abort(); };
      try { operation(tx.objectStore(STORE), (value) => { result = value; }, fail); }
      catch (error) { fail(error instanceof Error ? error : new Error('Không xử lý được bản lưu.')); }
    });
  } finally { database.close(); }
}

export async function loadCheckpoint(): Promise<{ data: unknown; revision: number } | null> {
  return transaction('readonly', (store, complete, fail) => {
    const active = store.get('active');
    const backup = store.get('backup');
    backup.onsuccess = () => {
      try {
        if (active.result === undefined && backup.result === undefined) { complete(null); return; }
        const saved = envelope(active.result);
        const copy = envelope(backup.result);
        if (saved.revision !== copy.revision || saved.commitId !== copy.commitId) {
          throw new Error('Hai bản lưu không cùng mốc tiến độ. Hãy thử đọc lại; không tự quay về ngày cũ.');
        }
        complete({ data: saved.data, revision: saved.revision });
      } catch (error) { fail(error as Error); }
    };
  });
}

async function writeCheckpoint(data: unknown, expectedRevision: number | null): Promise<number> {
  if (!objectData(data)) throw new Error('Trạng thái chiến dịch không hợp lệ để lưu.');
  if (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)) {
    throw new Error('Mốc lưu không hợp lệ. Hãy tải lại tiến độ.');
  }
  let commitId = commitIds.get(data);
  if (!commitId) { commitId = crypto.randomUUID(); commitIds.set(data, commitId); }
  const stableCommitId = commitId;
  return transaction('readwrite', (store, complete, fail) => {
    const read = store.get('active');
    const backup = store.get('backup');
    backup.onsuccess = () => {
      try {
        let current: Envelope | undefined;
        if (read.result !== undefined) {
          if (expectedRevision === null) {
            try { current = envelope(read.result); } catch { current = undefined; }
          } else current = envelope(read.result);
        }
        if (expectedRevision !== null && (current || backup.result !== undefined)) {
          const copy = envelope(backup.result);
          if (!current || copy.revision !== current.revision || copy.commitId !== current.commitId) {
            throw new Error('Hai bản lưu không cùng mốc. Không ghi đè; hãy thử đọc lại.');
          }
        }
        if (current?.commitId === stableCommitId) { complete(current.revision); return; }
        if (expectedRevision !== null && (current?.revision ?? 0) !== expectedRevision) {
          throw new Error('Tiến độ đã thay đổi ở tab khác. Hãy tải lại; không ghi đè bản lưu mới.');
        }
        const revision = (current?.revision ?? 0) + 1;
        const next: Envelope = { schemaVersion: 1, revision, commitId: stableCommitId, data };
        store.put(next, 'backup');
        store.put(next, 'active');
        complete(revision);
      } catch (error) { fail(error instanceof Error ? error : new Error('Không ghi được bản lưu.')); }
    };
  });
}

export function saveCheckpoint(data: unknown, expectedRevision: number): Promise<number> {
  return writeCheckpoint(data, expectedRevision);
}

export function resetCheckpoint(data: unknown): Promise<number> {
  return writeCheckpoint(data, null);
}
