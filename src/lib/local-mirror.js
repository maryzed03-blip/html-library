const DB_NAME = 'html-library-file-access';
const STORE = 'handles';
const ROOT_KEY = 'library-root';
const MANIFEST = '.html-library.json';
const ARCHIVE = '_Archive';

export function safeName(value) {
  return String(value || 'Untitled')
    .replace(/[<>:"\\|?*]/g, '')
    .replace(/\//g, '-')
    .replace(/[. ]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Untitled';
}

export function componentFileName(component) {
  const base = safeName(component.name).replace(/\.html?$/i, '');
  return `${base}.html`;
}

export function folderParts(folders, id) {
  const parts = [];
  const seen = new Set();
  let cur = folders.find((f) => f.id === id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    parts.unshift(safeName(cur.name));
    cur = cur.parentId ? folders.find((f) => f.id === cur.parentId) : undefined;
  }
  return parts;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveHandle(handle) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, ROOT_KEY);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function loadHandle() {
  const db = await openDb();
  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(ROOT_KEY);
    req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(req.error);
  });
  db.close(); return value;
}
async function permission(handle, ask = false) {
  if (!handle) return false;
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  return ask && (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
}
async function dirAt(root, parts, create = true) {
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create });
  return dir;
}
async function writeText(dir, name, text) {
  const file = await dir.getFileHandle(name, { create: true });
  const out = await file.createWritable(); await out.write(text); await out.close();
}
async function readManifest(root) {
  try {
    const f = await root.getFileHandle(MANIFEST); const file = await f.getFile();
    return JSON.parse(await file.text());
  } catch { return { version: 1, components: {}, folders: {} }; }
}
async function writeManifest(root, data) { await writeText(root, MANIFEST, JSON.stringify(data, null, 2)); }
async function existsFile(root, parts, name) {
  try { const d = await dirAt(root, parts, false); await d.getFileHandle(name); return true; } catch { return false; }
}
async function uniqueFileName(root, parts, desired, componentId, manifest) {
  const old = manifest.components?.[componentId];
  if (old && old.file === desired && JSON.stringify(old.parts) === JSON.stringify(parts)) return desired;
  if (!(await existsFile(root, parts, desired))) return desired;
  const stem = desired.replace(/\.html$/i, ''); let n = 2;
  while (await existsFile(root, parts, `${stem} (${n}).html`)) n++;
  return `${stem} (${n}).html`;
}
async function copyEntryToArchive(root, record, label) {
  if (!record) return;
  try {
    const sourceDir = await dirAt(root, record.parts || [], false);
    const source = await sourceDir.getFileHandle(record.file);
    const file = await source.getFile();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archive = await dirAt(root, [ARCHIVE, stamp, ...(record.parts || [])], true);
    await writeText(archive, record.file || `${safeName(label)}.html`, await file.text());
    await sourceDir.removeEntry(record.file);
  } catch { /* already absent */ }
}

export const localMirror = {
  supported() { return typeof window !== 'undefined' && 'showDirectoryPicker' in window && typeof indexedDB !== 'undefined'; },
  async chooseRoot() {
    const root = await window.showDirectoryPicker({ mode: 'readwrite' });
    await saveHandle(root); return root;
  },
  async getRoot(ask = false) {
    if (!this.supported()) return null;
    const root = await loadHandle(); return root && await permission(root, ask) ? root : null;
  },
  async connectAndExport(folders, components) {
    const root = await this.chooseRoot();
    await this.exportAll(root, folders, components); return root.name;
  },
  async exportAll(root, folders, components) {
    const manifest = await readManifest(root);
    for (const folder of folders) await dirAt(root, folderParts(folders, folder.id), true);
    for (const component of components) {
      const parts = folderParts(folders, component.folderId);
      const dir = await dirAt(root, parts, true);
      const desired = componentFileName(component);
      const file = await uniqueFileName(root, parts, desired, component.id, manifest);
      await writeText(dir, file, component.html);
      manifest.components[component.id] = { parts, file, name: component.name };
    }
    manifest.folders = Object.fromEntries(folders.map((f) => [f.id, { parts: folderParts(folders, f.id), name: f.name }]));
    await writeManifest(root, manifest);
  },
  async syncComponent(folders, component) {
    const root = await this.getRoot(); if (!root) return false;
    const manifest = await readManifest(root); const old = manifest.components[component.id];
    const parts = folderParts(folders, component.folderId); const desired = componentFileName(component);
    const changedPath = old && (old.file !== desired || JSON.stringify(old.parts) !== JSON.stringify(parts));
    if (changedPath) await copyEntryToArchive(root, old, old.name || component.name);
    const dir = await dirAt(root, parts, true);
    const file = await uniqueFileName(root, parts, desired, component.id, manifest);
    await writeText(dir, file, component.html);
    manifest.components[component.id] = { parts, file, name: component.name };
    await writeManifest(root, manifest); return true;
  },
  async archiveComponent(id) {
    const root = await this.getRoot(); if (!root) return false;
    const manifest = await readManifest(root); const old = manifest.components[id];
    await copyEntryToArchive(root, old, old?.name || 'HTML'); delete manifest.components[id];
    await writeManifest(root, manifest); return true;
  },
  async resync(folders, components) {
    const root = await this.getRoot(); if (!root) return false;
    const manifest = await readManifest(root);
    for (const c of components) {
      const old = manifest.components[c.id]; const parts = folderParts(folders, c.folderId); const desired = componentFileName(c);
      if (old && (old.file !== desired || JSON.stringify(old.parts) !== JSON.stringify(parts))) await copyEntryToArchive(root, old, old.name || c.name);
    }
    await this.exportAll(root, folders, components); return true;
  },
};
