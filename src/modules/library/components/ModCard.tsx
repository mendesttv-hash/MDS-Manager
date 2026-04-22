import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import {
  EllipsisVertical,
  FolderOpen,
  FolderX,
  Info,
  Layers,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Dialog, IconButton, Menu, Switch, Tooltip } from "@/components";
import type { InstalledMod, ModLayer } from "@/lib/tauri";
import {
  useEnableModWithLayers,
  useMoveModToFolder,
  useSkinhackFlag,
  useToggleMod,
  useUninstallMod,
} from "@/modules/library/api";
import { useModThumbnail } from "@/modules/library/api/useModThumbnail";
import {
  CUSTOM_MOD_META_EVENT,
  getCustomModMeta,
  setFavoriteStatus,
} from "@/modules/library/utils/customModMeta";
import { detectChampionIconUrl } from "@/modules/library/utils/championIcon";
import { getTagLabel } from "@/modules/library/utils/labels";
import { usePatcherStatus } from "@/modules/patcher";

import { LayerPickerPopover } from "./LayerPickerPopover";

const ROOT_FOLDER_ID = "root";

interface ModCardProps {
  mod: InstalledMod;
  viewMode: "grid" | "list";
  onViewDetails?: (mod: InstalledMod) => void;
}

export function ModCard({ mod, viewMode, onViewDetails }: ModCardProps) {
  const { data: thumbnailUrl } = useModThumbnail(mod.id);
  const [customMeta, setCustomMetaState] = useState(() => getCustomModMeta(mod.id));
  const [championIconUrl, setChampionIconUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const refreshMeta = () => {
  setCustomMetaState(getCustomModMeta(mod.id));
};

    refreshMeta();
    window.addEventListener(CUSTOM_MOD_META_EVENT, refreshMeta);

    return () => {
      window.removeEventListener(CUSTOM_MOD_META_EVENT, refreshMeta);
    };
  }, [mod.id]);

  const displayTitle = customMeta.customTitle?.trim() || mod.displayName;
  const displayImage = customMeta.customImage ? convertFileSrc(customMeta.customImage) : thumbnailUrl;
  const favorite = !!customMeta.favorite;

  function handleToggleFavorite(e: React.MouseEvent<HTMLButtonElement>) {
  e.stopPropagation();
  setFavoriteStatus(mod.id, !favorite);
}

  useEffect(() => {
    let cancelled = false;

    async function resolveChampionIcon() {
      try {
        const icon = await detectChampionIconUrl({
          champions: mod.champions,
          displayTitle,
          fallbackTitle: mod.displayName,
        });

        if (!cancelled) {
          setChampionIconUrl(icon);
        }
      } catch (error) {
        console.error("Failed to detect champion icon:", error);
        if (!cancelled) {
          setChampionIconUrl(null);
        }
      }
    }

    void resolveChampionIcon();

    return () => {
      cancelled = true;
    };
  }, [mod.champions, mod.displayName, displayTitle]);

  const toggleMod = useToggleMod();
  const uninstallMod = useUninstallMod();
  const enableWithLayers = useEnableModWithLayers();
  const moveModToFolder = useMoveModToFolder();
  const { data: patcherStatus } = usePatcherStatus();

  const {
    isFlagged,
    reason: skinhackReason,
    infoOpen: skinhackInfoOpen,
    setInfoOpen: setSkinhackInfoOpen,
  } = useSkinhackFlag(mod);

  const patcherRunning = patcherStatus?.running ?? false;
  const disabled = isFlagged || patcherRunning;
  const isInUserFolder = mod.folderId != null && mod.folderId !== ROOT_FOLDER_ID;
  const isMultiLayer = mod.layers.length > 1;

  function handleToggle(modId: string, enabled: boolean) {
    if (enabled && !mod.enabled && isMultiLayer) {
      setPickerOpen(true);
      return;
    }

    toggleMod.mutate(
      { modId, enabled },
      { onError: (error) => console.error("Failed to toggle mod:", error.message) },
    );
  }

  function handlePickerConfirm(layerStates: Record<string, boolean>) {
    enableWithLayers.mutate(
      { modId: mod.id, layerStates },
      { onError: (error) => console.error("Failed to enable mod with layers:", error.message) },
    );
  }

  function handlePickerCancel() {
    setPickerOpen(false);
  }

  function handleUninstall() {
    uninstallMod.mutate(mod.id, {
      onError: (error) => console.error("Failed to uninstall mod:", error.message),
    });
  }

  async function handleOpenLocation() {
    try {
      await invoke("reveal_in_explorer", { path: mod.modDir });
    } catch (error) {
      console.error("Failed to open location:", error);
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    if (disabled) return;
    if ((e.target as HTMLElement).closest("[data-no-toggle]")) {
      return;
    }
    handleToggle(mod.id, !mod.enabled);
  }

  if (viewMode === "list") {
    return (
      <div
        onClick={handleCardClick}
        className={`flex items-center gap-4 rounded-lg border p-4 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out ${
          isFlagged ? "cursor-default opacity-50" : disabled ? "cursor-default" : "cursor-pointer"
        } ${
          mod.enabled && !isFlagged
            ? "border-fuchsia-500/40 bg-gradient-to-b from-[#171424] via-[#12131d] to-[#0b0d15] shadow-[0_0_26px_-8px_rgba(168,85,247,0.42)] hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(168,85,247,0.24)] hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]"
            : "border-purple-500/20 bg-gradient-to-b from-[#131420] via-[#10111a] to-[#0a0c13] hover:-translate-y-1 hover:border-fuchsia-400/35 hover:shadow-[0_14px_30px_rgba(168,85,247,0.14)] hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
        }`}
      >
        <div className="relative h-12 w-[5.25rem] shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-surface-700 to-surface-800">
          {displayImage ? (
            <img
              src={displayImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-lg font-bold text-surface-500">
                {displayTitle.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-medium text-surface-100">{displayTitle}</h3>
            {favorite && <Star className="h-4 w-4 fill-current text-yellow-400" />}
            {isFlagged && (
              <Tooltip content={skinhackReason}>
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm text-surface-500">
              v{mod.version} • {mod.authors.join(", ") || "Auteur inconnu"}
            </p>
            <ModPills mod={mod} max={2} />
            {isMultiLayer && <LayerBadge layers={mod.layers} />}
          </div>
        </div>

        <div data-no-toggle onClick={(e) => e.stopPropagation()}>
  <button
    type="button"
    onClick={handleToggleFavorite}
    className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
      favorite
        ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-400"
        : "border-white/10 bg-white/5 text-white/40 hover:text-white"
    }`}
    aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
  >
    <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
  </button>
</div>

        <div data-no-toggle onClick={(e) => e.stopPropagation()}>
          {isMultiLayer && !mod.enabled ? (
            <LayerPickerPopover
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              modName={displayTitle}
              layers={mod.layers}
              switchChecked={mod.enabled}
              onConfirm={handlePickerConfirm}
              onCancel={handlePickerCancel}
              disabled={disabled}
            />
          ) : (
            <Switch
              disabled={disabled}
              checked={mod.enabled}
              onCheckedChange={(checked) => handleToggle(mod.id, checked)}
            />
          )}
        </div>

        <div data-no-toggle onClick={(e) => e.stopPropagation()}>
          <Menu.Root>
            <Menu.Trigger
              disabled={patcherRunning}
              render={
                <IconButton
                  icon={<EllipsisVertical className="h-4 w-4" />}
                  variant="ghost"
                  size="md"
                  disabled={patcherRunning}
                />
              }
            />
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  {isFlagged && (
                    <Menu.Item
                      icon={<ShieldAlert className="h-4 w-4" />}
                      onClick={() => setSkinhackInfoOpen(true)}
                    >
                      Qu’est-ce qu’un skinhack ?
                    </Menu.Item>
                  )}
                  {!isFlagged && (
                    <Menu.Item
                      icon={<Info className="h-4 w-4" />}
                      onClick={() => onViewDetails?.(mod)}
                    >
                      Voir les détails
                    </Menu.Item>
                  )}
                  <Menu.Item icon={<FolderOpen className="h-4 w-4" />} onClick={handleOpenLocation}>
                    Ouvrir l’emplacement
                  </Menu.Item>
                  {isInUserFolder && (
                    <Menu.Item
                      icon={<FolderX className="h-4 w-4" />}
                      onClick={() =>
                        moveModToFolder.mutate({ modId: mod.id, folderId: ROOT_FOLDER_ID })
                      }
                    >
                      Retirer du dossier
                    </Menu.Item>
                  )}
                  <Menu.Separator />
                  <Menu.Item
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="danger"
                    disabled={patcherRunning}
                    onClick={handleUninstall}
                  >
                    Désinstaller
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>

        <SkinhackInfoDialog open={skinhackInfoOpen} onOpenChange={setSkinhackInfoOpen} />
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex h-full min-h-[185px] flex-col overflow-hidden rounded-2xl border transition-all duration-200 ease-out ${
        isFlagged ? "cursor-default opacity-50" : disabled ? "cursor-default" : "cursor-pointer"
      } ${
        mod.enabled && !isFlagged
          ? "border-fuchsia-500/40 bg-gradient-to-b from-[#171424] via-[#12131d] to-[#0b0d15] shadow-[0_0_26px_-8px_rgba(168,85,247,0.42)] hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(168,85,247,0.24)]"
          : "border-purple-500/20 bg-gradient-to-b from-[#131420] via-[#10111a] to-[#0a0c13] hover:-translate-y-1 hover:border-fuchsia-400/35 hover:shadow-[0_14px_30px_rgba(168,85,247,0.14)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_28%)] opacity-70" />

      <div
        className="absolute top-2 right-2 z-10"
        data-no-toggle
        onClick={(e) => e.stopPropagation()}
      >
        {isMultiLayer && !mod.enabled ? (
          <LayerPickerPopover
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            modName={displayTitle}
            layers={mod.layers}
            switchSize="sm"
            switchClassName="shadow-lg data-[unchecked]:bg-black/40 data-[unchecked]:backdrop-blur-sm"
            switchChecked={mod.enabled}
            onConfirm={handlePickerConfirm}
            onCancel={handlePickerCancel}
            disabled={disabled}
          />
        ) : (
          <Switch
            size="sm"
            disabled={disabled}
            checked={mod.enabled}
            onCheckedChange={(checked) => handleToggle(mod.id, checked)}
            className="shadow-lg data-[unchecked]:border data-[unchecked]:border-white/10 data-[unchecked]:bg-black/25 data-[unchecked]:backdrop-blur-md"
          />
        )}
      </div>

      {championIconUrl && (
        <div className="absolute top-2 left-2 z-10 h-7 w-7 overflow-hidden rounded-lg border border-white/12 bg-black/35 shadow-lg backdrop-blur-md">
          <img
            src={championIconUrl}
            alt="Champion"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {isFlagged && (
        <Tooltip content={skinhackReason}>
          <div className="absolute top-11 left-2 z-10 rounded-md border border-red-400/20 bg-red-500/90 p-1 shadow-lg">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
        </Tooltip>
      )}

      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/5 bg-gradient-to-br from-[#241338] via-[#171f3c] to-[#0d1020]">
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b12]/65 via-transparent to-transparent" />
          </>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_35%)]" />
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
            <span className="relative text-4xl font-black tracking-wide text-white/80 drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]">
              {displayTitle.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="absolute right-2.5 bottom-2.5 rounded-full border border-fuchsia-400/30 bg-black/35 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-fuchsia-200 backdrop-blur-sm">
          MOD
        </div>
      </div>

      <div className="relative z-10 flex min-h-[46px] items-center justify-between border-t border-white/5 px-1.5 py-0.5">
  <div className="flex min-w-0 items-center gap-2 pr-2">
    <button
  type="button"
  data-no-toggle
  onClick={handleToggleFavorite}
  className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
    favorite
      ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-400"
      : "border-white/10 bg-white/5 text-white/40 hover:text-white"
  }`}
  aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
  title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
>
  <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
</button>

    <div className="min-w-0">
      <h3 className="line-clamp-1 text-[14px] font-semibold text-white">{displayTitle}</h3>
    </div>
  </div>

  <div className="shrink-0" data-no-toggle onClick={(e) => e.stopPropagation()}>
          <Menu.Root>
            <Menu.Trigger
              disabled={patcherRunning}
              render={
                <IconButton
                  icon={<EllipsisVertical className="h-4 w-4" />}
                  variant="ghost"
                  size="md"
                  disabled={patcherRunning}
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                />
              }
            />
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  {isFlagged && (
                    <Menu.Item
                      icon={<ShieldAlert className="h-4 w-4" />}
                      onClick={() => setSkinhackInfoOpen(true)}
                    >
                      Qu’est-ce qu’un skinhack ?
                    </Menu.Item>
                  )}
                  {!isFlagged && (
                    <Menu.Item
                      icon={<Info className="h-4 w-4" />}
                      onClick={() => onViewDetails?.(mod)}
                    >
                      Voir les détails
                    </Menu.Item>
                  )}
                  <Menu.Item icon={<FolderOpen className="h-4 w-4" />} onClick={handleOpenLocation}>
                    Ouvrir l’emplacement
                  </Menu.Item>
                  {isInUserFolder && (
                    <Menu.Item
                      icon={<FolderX className="h-4 w-4" />}
                      onClick={() =>
                        moveModToFolder.mutate({ modId: mod.id, folderId: ROOT_FOLDER_ID })
                      }
                    >
                      Retirer du dossier
                    </Menu.Item>
                  )}
                  <Menu.Separator />
                  <Menu.Item
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="danger"
                    disabled={patcherRunning}
                    onClick={handleUninstall}
                  >
                    Désinstaller
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>

      <SkinhackInfoDialog open={skinhackInfoOpen} onOpenChange={setSkinhackInfoOpen} />
    </div>
  );
}

function SkinhackInfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Overlay size="sm">
          <Dialog.Header>
            <Dialog.Title>Qu’est-ce qu’un skinhack ?</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>
            <p className="text-sm leading-relaxed text-surface-300">
              Un skinhack est un mod qui donne accès à des skins payants de League of Legends.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-surface-300">
              L’utilisation de skinhacks ne respecte pas la politique de distribution et peut mettre
              votre compte en danger. LTK Manager bloque ces mods pour protéger les utilisateurs
              ainsi que la communauté du modding.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-surface-400">
              Si vous pensez que ce mod a été signalé par erreur, ouvrez une issue sur la page du
              dépôt GitHub avec les informations nécessaires afin que nous puissions vérifier.
            </p>
          </Dialog.Body>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ModPills({ mod, max }: { mod: InstalledMod; max: number }) {
  const pills = [
    ...mod.tags.map((t) => ({ label: getTagLabel(t), color: "brand" as const })),
    ...mod.champions.map((c) => ({ label: c, color: "emerald" as const })),
  ];
  if (pills.length === 0) return null;

  const visible = pills.slice(0, max);

  const colorClasses = {
    brand: "border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
    emerald: "border border-sky-400/20 bg-sky-500/10 text-sky-200",
  } as const;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((pill) => (
        <span
          key={`${pill.color}:${pill.label}`}
          className={`rounded-md px-2 py-0.5 text-[10px] leading-tight backdrop-blur-sm ${colorClasses[pill.color]}`}
        >
          {pill.label}
        </span>
      ))}
    </div>
  );
}

function LayerBadge({ layers }: { layers: ModLayer[] }) {
  const enabledCount = layers.filter((l) => l.enabled).length;
  const allEnabled = enabledCount === layers.length;

  return (
    <span className="inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] leading-tight text-white/70 backdrop-blur-sm">
      <Layers className="h-2.5 w-2.5" />
      {allEnabled ? layers.length : `${enabledCount}/${layers.length}`}
    </span>
  );
}