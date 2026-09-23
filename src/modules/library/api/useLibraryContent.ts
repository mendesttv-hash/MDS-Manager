```tsx
import type { InstalledMod, LibraryFolder } from "@/lib/tauri";
import { sortFolders, sortModsByFolder } from "@/modules/library/utils";
import {
  CUSTOM_MOD_META_EVENT,
  getCustomModMeta,
  isFavorite,
} from "@/modules/library/utils/customModMeta";
import { usePatcherStatus } from "@/modules/patcher";
import { useHasActiveFilters, useLibraryFilterStore } from "@/stores";
import { useLibraryViewStore } from "@/stores/libraryView";
import { useEffect, useMemo, useState } from "react";

import { useFolderOrder, useFolders } from "./queries";
import { useFilteredMods } from "./useFilteredMods";
import { useLibraryViewMode } from "./useLibraryViewMode";

const ROOT_FOLDER_ID = "root";

export type ContentView =
  | { type: "loading" }
  | { type: "error" }
  | { type: "empty"; hasSearch: boolean; hasFilters: boolean }
  | { type: "flat"; mods: InstalledMod[] }
  | { type: "folder-drilldown"; folder: LibraryFolder; mods: InstalledMod[] }
  | {
      type: "unified";
      folders: LibraryFolder[];
      rootMods: InstalledMod[];
      modsByFolder: Map<string, InstalledMod[]>;
    };

interface UseLibraryContentArgs {
  mods: InstalledMod[];
  searchQuery: string;
  isLoading: boolean;
  hasError: boolean;
  folderId?: string;
}

function getDisplaySortName(mod: InstalledMod) {
  const meta = getCustomModMeta(mod.id);
  return (
    meta.customTitle?.trim() ||
    mod.displayName ||
    mod.name ||
    ""
  ).toLowerCase();
}

function sortFavoritesThenAlpha(mods: InstalledMod[]) {
  return [...mods].sort((a, b) => {
    const aFav = isFavorite(a.id);
    const bFav = isFavorite(b.id);

    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;

    if (a.enabled && !b.enabled) return -1;
    if (!a.enabled && b.enabled) return 1;

    return getDisplaySortName(a).localeCompare(getDisplaySortName(b), "fr");
  });
}

export function useLibraryContent({
  mods,
  searchQuery,
  isLoading,
  hasError,
  folderId,
}: UseLibraryContentArgs) {
  const { viewMode } = useLibraryViewMode();
  const { data: patcherStatus } = usePatcherStatus();
  const isPatcherActive = patcherStatus?.running ?? false;
  const [detailsMod, setDetailsMod] = useState<InstalledMod | null>(null);
  const [metaVersion, setMetaVersion] = useState(0);

  const filteredMods = useFilteredMods(mods, searchQuery);
  const hasActiveFilters = useHasActiveFilters();
  const { sort } = useLibraryFilterStore();
  const { data: folders } = useFolders();
  const { data: folderOrder } = useFolderOrder();
  const cleanupStaleFolders = useLibraryViewStore(
    (s) => s.cleanupStaleFolders,
  );

  useEffect(() => {
    const handleMetaChange = () => setMetaVersion((v) => v + 1);
    window.addEventListener(CUSTOM_MOD_META_EVENT, handleMetaChange);

    return () => {
      window.removeEventListener(CUSTOM_MOD_META_EVENT, handleMetaChange);
    };
  }, []);

  useEffect(() => {
    if (!folders) return;
    const validIds = new Set(folders.map((f) => f.id));
    cleanupStaleFolders(validIds);
  }, [folders, cleanupStaleFolders]);

  const isSearching = searchQuery.length > 0;
  const isPrioritySort = sort.field === "priority";
  const dndDisabled =
    isSearching ||
    isPatcherActive ||
    !isPrioritySort ||
    hasActiveFilters;
  const isFlatMode = isSearching || hasActiveFilters;

  const folderMap = useMemo(() => {
    const map = new Map<string, LibraryFolder>();
    for (const f of folders ?? []) map.set(f.id, f);
    return map;
  }, [folders]);

  const orderedUserFolders = useMemo(() => {
    if (!folderOrder || !folders) return [];
    const manualOrder = folderOrder
      .filter((id) => id !== ROOT_FOLDER_ID)
      .map((id) => folderMap.get(id))
      .filter(Boolean) as LibraryFolder[];
    return sortFolders(manualOrder, sort);
  }, [folderOrder, folders, folderMap, sort]);

  const modsByFolder = useMemo(() => {
    const map = new Map<string, InstalledMod[]>();
    for (const mod of mods) {
      const fid = mod.folderId ?? ROOT_FOLDER_ID;
      const list = map.get(fid) ?? [];
      list.push(mod);
      map.set(fid, list);
    }
    return map;
  }, [mods]);

  const sortedModsByFolder = useMemo(() => {
    const base = sortModsByFolder(modsByFolder, sort);
    const result = new Map<string, InstalledMod[]>();

    for (const [folderKey, folderMods] of base.entries()) {
      result.set(folderKey, sortFavoritesThenAlpha(folderMods));
    }

    return result;
  }, [modsByFolder, sort, metaVersion]);

  const sortedFilteredMods = useMemo(() => {
    return sortFavoritesThenAlpha(filteredMods);
  }, [filteredMods, metaVersion]);

  const contentView = useMemo((): ContentView => {
    if (isLoading) return { type: "loading" };
    if (hasError) return { type: "error" };

    if (sortedFilteredMods.length === 0 && orderedUserFolders.length === 0) {
      return {
        type: "empty",
        hasSearch: isSearching,
        hasFilters: hasActiveFilters,
      };
    }

    if (isFlatMode) {
      return { type: "flat", mods: sortedFilteredMods };
    }

    if (folderId && folderId !== ROOT_FOLDER_ID) {
      const folder = folderMap.get(folderId);
      if (!folder) {
        return {
          type: "empty",
          hasSearch: false,
          hasFilters: false,
        };
      }

      return {
        type: "folder-drilldown",
        folder,
        mods: sortedModsByFolder.get(folderId) ?? [],
      };
    }

    return {
      type: "unified",
      folders: orderedUserFolders,
      rootMods: sortedModsByFolder.get(ROOT_FOLDER_ID) ?? [],
      modsByFolder: sortedModsByFolder,
    };
  }, [
    isLoading,
    hasError,
    sortedFilteredMods,
    orderedUserFolders,
    isFlatMode,
    isSearching,
    hasActiveFilters,
    folderId,
    folderMap,
    sortedModsByFolder,
  ]);

  return {
    viewMode,
    dndDisabled,
    contentView,
    detailsMod,
    setDetailsMod,
  };
}
