import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, HardDrive } from "lucide-react";

import { Field, IconButton, SectionCard, Tooltip } from "@/components";
import type { Settings } from "@/lib/tauri";

interface ModStorageSectionProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function ModStorageSection({ settings, onSave }: ModStorageSectionProps) {
  async function handleBrowse() {
    try {
      const selected = await open({
        directory: true,
        title: "Sélectionner l’emplacement de stockage des mods",
      });

      if (selected) {
        onSave({ ...settings, modStoragePath: selected as string });
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du dossier :", error);
    }
  }

  return (
    <SectionCard title="Stockage des mods" icon={<HardDrive className="h-5 w-5" />}>
      <div className="space-y-3">
        <span className="block text-sm font-medium text-surface-400">Emplacement de stockage</span>

        <div className="flex gap-2">
          <Field.Control
            type="text"
            value={settings.modStoragePath || ""}
            readOnly
            placeholder="Par défaut (dossier de données de l’application)"
            className="flex-1"
          />

          <Tooltip content="Parcourir">
            <IconButton
              icon={<FolderOpen className="h-5 w-5" />}
              variant="outline"
              size="lg"
              onClick={handleBrowse}
            />
          </Tooltip>
        </div>

        <p className="text-sm text-surface-400">
          Choisissez où les mods installés seront stockés. Laissez vide pour utiliser l’emplacement
          par défaut.
        </p>
      </div>
    </SectionCard>
  );
}
