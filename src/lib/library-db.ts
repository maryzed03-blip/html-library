export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
};

export type Component = {
  id: string;
  name: string;
  html: string;
  image: string | null;
  folderId: string | null;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
};

type Unsubscribe = () => void;
type Bucket = "folders" | "components";
const listeners = new Map<string, Set<() => void>>();

function key(uid: string, bucket: Bucket) {
  return `html-library:${uid}:${bucket}`;
}

function read<T>(uid: string, bucket: Bucket): T[] {
  try {
    const raw = localStorage.getItem(key(uid, bucket));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T extends { id: string }>(uid: string, bucket: Bucket, items: T[]) {
  localStorage.setItem(key(uid, bucket), JSON.stringify(items));
  listeners.get(key(uid, bucket))?.forEach((fn) => fn());
}

function watch<T>(uid: string, bucket: Bucket, onData: (items: T[]) => void, onError: (error: Error) => void): Unsubscribe {
  const storageKey = key(uid, bucket);
  const emit = () => {
    try { onData(read<T>(uid, bucket)); } catch (err) { onError(err instanceof Error ? err : new Error(String(err))); }
  };
  const set = listeners.get(storageKey) ?? new Set<() => void>();
  set.add(emit);
  listeners.set(storageKey, set);
  const storageListener = (event: StorageEvent) => { if (event.key === storageKey) emit(); };
  window.addEventListener("storage", storageListener);
  queueMicrotask(emit);
  return () => {
    set.delete(emit);
    window.removeEventListener("storage", storageListener);
  };
}

function put<T extends { id: string }>(uid: string, bucket: Bucket, item: T) {
  const items = read<T>(uid, bucket);
  const index = items.findIndex((x) => x.id === item.id);
  if (index >= 0) items[index] = item; else items.push(item);
  write(uid, bucket, items);
  return item;
}

function remove(uid: string, bucket: Bucket, id: string) {
  write(uid, bucket, read<{ id: string }>(uid, bucket).filter((x) => x.id !== id));
}

export const db = {
  watchFolders(uid: string, onData: (items: Folder[]) => void, onError: (error: Error) => void) {
    return watch<Folder>(uid, "folders", onData, onError);
  },
  watchComponents(uid: string, onData: (items: Component[]) => void, onError: (error: Error) => void) {
    return watch<Component>(uid, "components", onData, onError);
  },
  async putFolder(uid: string, folder: Folder) { return put(uid, "folders", folder); },
  async deleteFolder(uid: string, id: string) { remove(uid, "folders", id); },
  async putComponent(uid: string, component: Component) { return put(uid, "components", component); },
  async deleteComponent(uid: string, id: string) { remove(uid, "components", id); },
};

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function seedFolders(): Folder[] {
  const now = Date.now();
  const mk = (name: string, parentId: string | null): Folder => ({ id: uid(), name, parentId, createdAt: now });
  const websites = mk("Websites", null);
  const heroes = mk("Heroes", websites.id);
  const sections = mk("Sections", websites.id);
  const footers = mk("Footers", websites.id);
  const newsletters = mk("Newsletters", null);
  const nlHeaders = mk("Headers", newsletters.id);
  const nlContent = mk("Content", newsletters.id);
  const nlCtas = mk("CTAs", newsletters.id);
  const archive = mk("Archive", null);
  return [websites, heroes, sections, mk("About", sections.id), mk("Features", sections.id), mk("Testimonials", sections.id), footers, newsletters, nlHeaders, nlContent, nlCtas, archive];
}
