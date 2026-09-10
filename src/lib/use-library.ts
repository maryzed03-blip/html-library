import { useCallback, useEffect, useState } from "react";
import { db, seedFolders, uid, type Component, type Folder } from "./library-db";

export function useLibrary(userId: string | null) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFolders([]);
    setComponents([]);
    setError(null);
    setReady(false);

    if (!userId) {
      setReady(true);
      return;
    }

    let folderReady = false;
    let componentReady = false;
    let seeding = false;

    const markReady = () => {
      if (folderReady && componentReady) setReady(true);
    };

    const onError = (err: Error) => {
      setError(err.message);
      setReady(true);
    };

    const unsubFolders = db.watchFolders(
      userId,
      (items) => {
        if (items.length === 0 && !seeding) {
          seeding = true;
          const seeds = seedFolders();
          void Promise.all(seeds.map((folder) => db.putFolder(userId, folder))).catch(onError);
        } else {
          setFolders(items.sort((a, b) => a.createdAt - b.createdAt));
          folderReady = true;
          markReady();
        }
      },
      onError,
    );

    const unsubComponents = db.watchComponents(
      userId,
      (items) => {
        setComponents(items);
        componentReady = true;
        markReady();
      },
      onError,
    );

    return () => {
      unsubFolders();
      unsubComponents();
    };
  }, [userId]);

  const requireUser = useCallback(() => {
    if (!userId) throw new Error("Δεν υπάρχει συνδεδεμένος χρήστης.");
    return userId;
  }, [userId]);

  const createFolder = useCallback(
    async (name: string, parentId: string | null) => {
      const owner = requireUser();
      const folder: Folder = { id: uid(), name, parentId, createdAt: Date.now() };
      await db.putFolder(owner, folder);
      return folder;
    },
    [requireUser],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const owner = requireUser();
      const target = folders.find((folder) => folder.id === id);
      if (target) await db.putFolder(owner, { ...target, name });
    },
    [folders, requireUser],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      const owner = requireUser();
      const ids = new Set<string>();
      const collect = (fid: string) => {
        ids.add(fid);
        folders.filter((f) => f.parentId === fid).forEach((f) => collect(f.id));
      };
      collect(id);

      await Promise.all([...ids].map((folderId) => db.deleteFolder(owner, folderId)));
      await Promise.all(
        components
          .filter((component) => component.folderId && ids.has(component.folderId))
          .map((component) => db.putComponent(owner, { ...component, folderId: null })),
      );
    },
    [components, folders, requireUser],
  );

  const saveComponent = useCallback(
    async (component: Component) => {
      const owner = requireUser();
      return db.putComponent(owner, component);
    },
    [requireUser],
  );

  const deleteComponent = useCallback(
    async (id: string) => {
      const owner = requireUser();
      await db.deleteComponent(owner, id);
    },
    [requireUser],
  );

  return {
    ready,
    error,
    folders,
    components,
    createFolder,
    renameFolder,
    deleteFolder,
    saveComponent,
    deleteComponent,
  };
}

export function folderPath(folders: Folder[], id: string | null): string[] {
  const out: string[] = [];
  let cur = folders.find((f) => f.id === id);
  while (cur) {
    out.unshift(cur.name);
    const parent: string | null = cur.parentId;
    cur = parent ? folders.find((f) => f.id === parent) : undefined;
  }
  return out;
}

export function descendantIds(folders: Folder[], id: string): Set<string> {
  const ids = new Set<string>([id]);
  const walk = (fid: string) => {
    folders
      .filter((f) => f.parentId === fid)
      .forEach((f) => {
        ids.add(f.id);
        walk(f.id);
      });
  };
  walk(id);
  return ids;
}
