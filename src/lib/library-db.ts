import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadString } from "firebase/storage";
import { firestore, storage } from "./firebase";

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

async function cloudImage(uid: string, component: Component): Promise<string | null> {
  if (!component.image?.startsWith("data:")) return component.image;
  const objectRef = ref(storage, `users/${uid}/previews/${component.id}`);
  await uploadString(objectRef, component.image, "data_url");
  return getDownloadURL(objectRef);
}

export const db = {
  watchFolders(uid: string, onData: (items: Folder[]) => void, onError: (error: Error) => void): Unsubscribe {
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
    const image = await cloudImage(uid, component);
    const next = { ...component, image };
    await setDoc(doc(firestore, "users", uid, "components", component.id), next);
    return next;
  },

  async deleteComponent(uid: string, id: string) {
    await deleteDoc(doc(firestore, "users", uid, "components", id));
    try {
      await deleteObject(ref(storage, `users/${uid}/previews/${id}`));
    } catch {
      // No preview image is also a valid state.
    }
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
