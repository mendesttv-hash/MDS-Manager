import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Calendar, FolderOpen, ImagePlus, Layers, Map, Pencil, Sword, Tag, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Dialog } from "@/components";
import type { InstalledMod } from "@/lib/tauri";
import { useSetModLayers } from "@/modules/library/api";
import { useModThumbnail } from "@/modules/library/api/useModThumbnail";
import {
  clearCustomModImage,
  getCustomModMeta,
  setCustomModMeta,
} from "@/modules/library/utils/customModMeta";
import { getMapLabel, getTagLabel } from "@/modules/library/utils/labels";

import { LayerToggleList } from "./LayerToggleList";

interface ModDetailsDialogProps {
  open: boolean;
  mod: InstalledMod | null;
  onClose: () => void;
}

export function ModDetailsDialog({ open, mod, onClose }: ModDetailsDialogProps) {
  if (!mod) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Overlay size="md">
          <Dialog.Header>
            <Dialog.Title>Modifier le mod</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>

          <Dialog.Body className="space-y-5">
            <ModDetailsContent mod={mod} />
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button
              variant="filled"
              left={<FolderOpen className="h-4 w-4" />}
              onClick={async () => {
                try {
                  await invoke("reveal_in_explorer", { path: mod.modDir });
                } catch (error) {
                  console.error("Failed to open location:", error);
                }
              }}
            >
              Ouvrir l’emplacement
            </Button>
          </Dialog.Footer>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ModDetailsContent({ mod }: { mod: InstalledMod }) {
  const { data: thumbnailUrl } = useModThumbnail(mod.id);
  const customMeta = getCustomModMeta(mod.id);

  const [customTitle, setCustomTitle] = useState(customMeta.customTitle ?? "");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const nextMeta = getCustomModMeta(mod.id);
    setCustomTitle(nextMeta.customTitle ?? "");
  }, [mod.id]);

  const displayTitle = customTitle.trim() || mod.displayName;
  const displayImage = customMeta.customImage ? convertFileSrc(customMeta.customImage) : thumbnailUrl;

  const installedDate = new Date(mod.installedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleChooseImage() {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "webp"],
        },
      ],
    });

    if (!selected || Array.isArray(selected)) return;

    setCustomModMeta(mod.id, { customImage: selected });
    setRefreshKey((v) => v + 1);
  }

  function handleSaveTitle() {
    setCustomModMeta(mod.id, { customTitle: customTitle.trim() });
    setRefreshKey((v) => v + 1);
  }

  function handleResetImage() {
    clearCustomModImage(mod.id);
    setRefreshKey((v) => v + 1);
  }

  return (
    <div key={refreshKey} className="space-y-5">
      <div className="flex gap-4">
        <div className="relative h-24 w-[10rem] shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-surface-700 to-surface-800">
          {displayImage ? (
            <img
              src={displayImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl font-bold text-surface-500">
                {displayTitle.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide text-surface-500 uppercase">
              <Pencil className="h-3.5 w-3.5" />
              Titre personnalisé
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={mod.displayName}
                className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-surface-100 outline-none focus:border-accent-500"
              />
              <Button variant="filled" onClick={handleSaveTitle}>
                Sauver
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" left={<ImagePlus className="h-4 w-4" />} onClick={handleChooseImage}>
              Choisir une image
            </Button>

            <Button variant="ghost" onClick={handleResetImage}>
              Retirer l’image
            </Button>
          </div>

          <p className="text-sm text-surface-400">v{mod.version}</p>

          <div className="flex items-center gap-1.5 text-sm text-surface-400">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{mod.authors.join(", ") || "Unknown author"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-surface-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Installed {installedDate}</span>
          </div>
        </div>
      </div>

      {mod.description && (
        <div>
          <h4 className="mb-1 text-xs font-medium tracking-wide text-surface-500 uppercase">
            Description
          </h4>
          <p className="text-sm leading-relaxed text-surface-300">{mod.description}</p>
        </div>
      )}

      {mod.tags.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-surface-500 uppercase">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {mod.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-500/15 px-2.5 py-0.5 text-xs text-accent-300"
              >
                {getTagLabel(tag)}
              </span>
            ))}
          </div>
        </div>
      )}

      {mod.champions.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-surface-500 uppercase">
            <Sword className="h-3.5 w-3.5" />
            Champions
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {mod.champions.map((champ) => (
              <span
                key={champ}
                className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300"
              >
                {champ}
              </span>
            ))}
          </div>
        </div>
      )}

      {mod.maps.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-surface-500 uppercase">
            <Map className="h-3.5 w-3.5" />
            Maps
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {mod.maps.map((map) => (
              <span
                key={map}
                className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs text-sky-300"
              >
                {getMapLabel(map)}
              </span>
            ))}
          </div>
        </div>
      )}

      {mod.layers.length > 1 && <ModDetailsLayers mod={mod} />}

      <div>
        <h4 className="mb-1 text-xs font-medium tracking-wide text-surface-500 uppercase">
          Location
        </h4>
        <p className="text-xs break-all text-surface-400">{mod.modDir}</p>
      </div>
    </div>
  );
}

function ModDetailsLayers({ mod }: { mod: InstalledMod }) {
  const setModLayers = useSetModLayers();

  function handleToggle(layerName: string, enabled: boolean) {
    const layerStates: Record<string, boolean> = {};
    for (const layer of mod.layers) {
      layerStates[layer.name] = layer.name === layerName ? enabled : layer.enabled;
    }
    setModLayers.mutate({ modId: mod.id, layerStates });
  }

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-surface-500 uppercase">
        <Layers className="h-3.5 w-3.5" />
        Layers ({mod.layers.filter((l) => l.enabled).length}/{mod.layers.length})
      </h4>
      <LayerToggleList layers={mod.layers} onToggle={handleToggle} />
    </div>
  );
}