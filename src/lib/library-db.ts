import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { firestore } from "./firebase";

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

const userCollection = (uid: string, name: "folders" | "components") =>
  collection(firestore, "users", uid, name);

function utf8Bytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

// Firestore documents have a hard size limit. Keep a safety margin instead of
// attempting a write that will fail with an unclear Firebase error.
const SAFE_COMPONENT_BYTES = 850_000;

export const db = {
  watchFolders(
    uid: string,
    onData: (items: Folder[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      userCollection(uid, "folders"),
      (snap) => onData(snap.docs.map((d) => d.data() as Folder)),
      onError,
    );
  },

  watchComponents(
    uid: string,
    onData: (items: Component[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      userCollection(uid, "components"),
      (snap) => onData(snap.docs.map((d) => d.data() as Component)),
      onError,
    );
  },

  async putFolder(uid: string, folder: Folder) {
    await setDoc(doc(firestore, "users", uid, "folders", folder.id), folder);
    return folder;
  },

  async deleteFolder(uid: string, id: string) {
    await deleteDoc(doc(firestore, "users", uid, "folders", id));
  },

  async putComponent(uid: string, component: Component): Promise<Component> {
    const bytes = utf8Bytes(component);
    if (bytes > SAFE_COMPONENT_BYTES) {
      throw new Error(
        "Το component είναι πολύ μεγάλο για αποθήκευση στο Firestore. " +
        "Μείωσε την εικόνα preview ή αφαίρεσέ την και χρησιμοποίησε το αυτόματο HTML preview."
      );
    }

    await setDoc(
      doc(firestore, "users", uid, "components", component.id),
      component,
    );
    return component;
  },

  async deleteComponent(uid: string, id: string) {
    await deleteDoc(doc(firestore, "users", uid, "components", id));
  },
};

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function seedFolders(): Folder[] {
  const now = Date.now();
  const mk = (name: string, parentId: string | null): Folder => ({
    id: uid(),
    name,
    parentId,
    createdAt: now,
  });
  const websites = mk("Websites", null);
  const heroes = mk("Heroes", websites.id);
  const sections = mk("Sections", websites.id);
  const footers = mk("Footers", websites.id);
  const newsletters = mk("Newsletters", null);
  const nlHeaders = mk("Headers", newsletters.id);
  const nlContent = mk("Content", newsletters.id);
  const nlCtas = mk("CTAs", newsletters.id);
  const archive = mk("Archive", null);
  return [
    websites,
    heroes,
    sections,
    mk("About", sections.id),
    mk("Features", sections.id),
    mk("Testimonials", sections.id),
    footers,
    newsletters,
    nlHeaders,
    nlContent,
    nlCtas,
    archive,
  ];
}
