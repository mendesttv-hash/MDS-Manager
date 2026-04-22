import { Grid3X3, List, Plus, Search, Star } from "lucide-react";
import { useMemo } from "react";

import {
  Button,
  IconButton,
  Kbd,
  Tooltip,
  MultiSelect,
  type MultiSelectOption,
} from "@/components";

import type { PatcherStatus } from "@/lib/tauri";
import type { FilterOptions, useLibraryActions } from "@/modules/library/api";
import { useLibraryViewMode } from "@/modules/library/api";
import { useLibraryFilterStore } from "@/stores";

import { ProfileSelector } from "./ProfileSelector";

interface PatcherProps {
  status: PatcherStatus | undefined;
  isStarting: boolean;
  isStopping: boolean;
  onStart: () => void;
  onStop: () => void;
}

interface LibraryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  actions: ReturnType<typeof useLibraryActions>;
  patcher: PatcherProps;
  hasEnabledMods: boolean;
  isLoading: boolean;
  isPatcherActive: boolean;
  filterOptions: FilterOptions;
}

export function LibraryToolbar({
  searchQuery,
  onSearchChange,
  actions,
  patcher,
  hasEnabledMods,
  isLoading,
  isPatcherActive,
  filterOptions,
}: LibraryToolbarProps) {
  const { viewMode, setViewMode } = useLibraryViewMode();
  const { selectedChampions, setChampions, favoritesOnly, toggleFavoritesOnly } =
    useLibraryFilterStore();

  const championOptions = useMemo<MultiSelectOption[]>(
    () => filterOptions.champions.map((c) => ({ value: c, label: c })),
    [filterOptions.champions],
  );

  return (
    <div className="bg-[#060b1d] px-4 py-3" data-tauri-drag-region>
      <div className="flex items-center gap-4">
        <div className="shrink-0 rounded-xl border border-white/8 bg-[#060b1d] px-1 py-1">
          <ProfileSelector />
        </div>

        <div className="relative min-w-0 flex-[3.4]">
  <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-fuchsia-300/70" />
  <input
    type="text"
    placeholder="Rechercher des mods..."
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    className="h-11 w-full rounded-xl border border-white/10 bg-[#060b1d] pr-4 pl-11 text-sm text-white outline-none transition-all duration-200 placeholder:text-surface-400 focus:border-accent-400 focus:shadow-[0_0_0_2px_rgba(168,85,247,0.3)]"
  />
</div>

<div className="flex shrink-0 items-center gap-2">
  <div className="w-11">
    <MultiSelect
      label={undefined}
      options={championOptions}
      selected={selectedChampions}
      onChange={setChampions}
      placeholder=""
      className="h-11 w-11"
    />
  </div>

  <button
    type="button"
    onClick={toggleFavoritesOnly}
    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 ${
      favoritesOnly
        ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-400"
        : "border-white/10 bg-[#060b1d] text-white/40 hover:text-white"
    }`}
    aria-label={favoritesOnly ? "Afficher tous les mods" : "Afficher uniquement les favoris"}
    title={favoritesOnly ? "Afficher tous les mods" : "Afficher uniquement les favoris"}
  >
    <Star className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
  </button>
</div>

        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/8 bg-[#060b1d] p-1">
          <Tooltip content="Vue grille">
            <IconButton
              icon={<Grid3X3 className="h-4 w-4" />}
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid"
                  ? "h-9 w-9 rounded-lg border border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/80 to-violet-500/80 text-white shadow-[0_0_18px_rgba(168,85,247,0.28)]"
                  : "h-9 w-9 rounded-lg text-surface-300 hover:bg-white/10 hover:text-white"
              }
            />
          </Tooltip>

          <Tooltip content="Vue liste">
            <IconButton
              icon={<List className="h-4 w-4" />}
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "h-9 w-9 rounded-lg border border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/80 to-violet-500/80 text-white shadow-[0_0_18px_rgba(168,85,247,0.28)]"
                  : "h-9 w-9 rounded-lg text-surface-300 hover:bg-white/10 hover:text-white"
              }
            />
          </Tooltip>
        </div>

        <Tooltip
          content={
            <>
              Ajouter un mod <Kbd shortcut="Ctrl+I" />
            </>
          }
        >
          <Button
            variant="filled"
            size="sm"
            onClick={actions.handleInstallMod}
            loading={actions.installMod.isPending || actions.bulkInstallMods.isPending}
            disabled={isPatcherActive}
            left={<Plus className="h-4 w-4" />}
            className="h-11 shrink-0 rounded-xl border border-fuchsia-400/15 bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 text-white shadow-[0_8px_22px_rgba(168,85,247,0.28)] hover:shadow-[0_12px_28px_rgba(168,85,247,0.34)]"
          >
            {actions.installMod.isPending || actions.bulkInstallMods.isPending
              ? "Installation..."
              : "Ajouter un mod"}
          </Button>
        </Tooltip>

        <Tooltip
          content={
            <>
              Activer le patcher <Kbd shortcut="Ctrl+P" />
            </>
          }
        >
          {patcher.status?.running ? (
            <Button
              variant="outline"
              size="sm"
              onClick={patcher.onStop}
              loading={patcher.isStopping}
              className="h-11 shrink-0 rounded-xl border border-red-400/20 bg-red-500/10 px-5 text-red-200"
            >
              {patcher.isStopping ? "Arrêt..." : "Arrêter le patcher"}
            </Button>
          ) : (
            <Button
              variant={hasEnabledMods ? "filled" : "default"}
              size="sm"
              onClick={patcher.onStart}
              loading={patcher.isStarting}
              disabled={!hasEnabledMods || isLoading}
              className={
                hasEnabledMods
                  ? "h-11 shrink-0 rounded-xl border border-fuchsia-400/15 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-white"
                  : "h-11 shrink-0 rounded-xl border border-white/10 bg-[#060b1d] px-5 text-surface-400"
              }
            >
              {patcher.isStarting ? "Démarrage..." : "Lancer le patcher"}
            </Button>
          )}
        </Tooltip>
      </div>
    </div>
  );
}