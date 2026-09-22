import type { Component, Folder } from './library-db';
export function safeName(value: string): string;
export function componentFileName(component: Pick<Component, 'id' | 'name'>): string;
export function folderParts(folders: Folder[], id: string | null): string[];
export const localMirror: {
  supported(): boolean;
  chooseRoot(): Promise<any>;
  getRoot(ask?: boolean): Promise<any | null>;
  connectAndExport(folders: Folder[], components: Component[]): Promise<string>;
  exportAll(root: any, folders: Folder[], components: Component[]): Promise<void>;
  syncComponent(folders: Folder[], component: Component): Promise<boolean>;
  archiveComponent(id: string): Promise<boolean>;
  resync(folders: Folder[], components: Component[]): Promise<boolean>;
};
