import { open } from "@tauri-apps/plugin-dialog";
import { Image, X } from "lucide-react";

import { Field, IconButton, Tooltip } from "@/components";
import type { Settings } from "@/lib/tauri";

import { useDebouncedSlider } from "./useDebouncedSlider";

interface BackdropImagePickerProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function BackdropImagePicker({ settings, onSave }: BackdropImagePickerProps) {
  const [localBlur, handleBlurChange] = useDebouncedSlider(settings.backdropBlur ?? 40, (blur) => {
    onSave({ ...settings, backdropBlur: blur });
  });

  async function handleBrowse() {
    try {
      const selected = await open({
        title: "Sélectionner une image de fond",
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif"] }],
      });

      if (selected) {
        onSave({ ...settings, backdropImage: selected as string });
      }
    } catch (error) {
      console.error("Erreur lors de la sélection :", error);
    }
  }

  function handleClear() {
    onSave({ ...settings, backdropImage: null });
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-surface-400">
        Image de fond
      </span>

      <div className="flex gap-2">
        <Field.Control
          type="text"
          value={settings.backdropImage || ""}
          readOnly
          placeholder="Aucune image sélectionnée"
          className="flex-1"
        />

        <Tooltip content="Parcourir une image">
          <IconButton
            icon={<Image className="h-5 w-5" />}
            variant="outline"
            size="lg"
            onClick={handleBrowse}
          />
        </Tooltip>

        {settings.backdropImage && (
          <Tooltip content="Supprimer l’image">
            <IconButton
              icon={<X className="h-5 w-5" />}
              variant="outline"
              size="lg"
              onClick={handleClear}
            />
          </Tooltip>
        )}
      </div>

      <p className="text-sm text-surface-500">
        Définissez une image de fond pour l’application. L’interface utilisera un effet de verre
        dépoli au-dessus de l’image.
      </p>

      {settings.backdropImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500">Intensité du flou</span>
            <span className="text-xs text-surface-400">{localBlur}px</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={localBlur}
            onChange={(e) => handleBlurChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-600"
          />
        </div>
      )}
    </div>
  );
}