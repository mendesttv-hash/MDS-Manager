export interface CustomModMeta {
  customTitle?: string;
  customImage?: string;
  favorite?: boolean;
}

type CustomModMetaMap = Record<string, CustomModMeta>;

const STORAGE_KEY = "mds-custom-mod-meta";
export const CUSTOM_MOD_META_EVENT = "mds-custom-mod-meta-changed";

function readAll(): CustomModMetaMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CustomModMetaMap;
  } catch {
    return {};
  }
}

function writeAll(data: CustomModMetaMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(CUSTOM_MOD_META_EVENT));
}

export function getCustomModMeta(modId: string): CustomModMeta {
  const all = readAll();
  return all[modId] ?? {};
}

export function setCustomModMeta(modId: string, meta: CustomModMeta) {
  const all = readAll();
  all[modId] = {
    ...(all[modId] ?? {}),
    ...meta,
  };
  writeAll(all);
}

export function clearCustomModImage(modId: string) {
  const all = readAll();
  if (!all[modId]) return;
  delete all[modId].customImage;
  writeAll(all);
}

export function clearCustomModTitle(modId: string) {
  const all = readAll();
  if (!all[modId]) return;
  delete all[modId].customTitle;
  writeAll(all);
}

export function setFavoriteStatus(modId: string, favorite: boolean) {
  const all = readAll();
  all[modId] = {
    ...(all[modId] ?? {}),
    favorite,
  };
  writeAll(all);
}

export function toggleFavorite(modId: string) {
  const all = readAll();
  const current = all[modId]?.favorite ?? false;

  all[modId] = {
    ...(all[modId] ?? {}),
    favorite: !current,
  };

  writeAll(all);
}

export function isFavorite(modId: string): boolean {
  const all = readAll();
  return all[modId]?.favorite ?? false;
}
