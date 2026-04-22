import { CircleCheck } from "lucide-react";

import type { Settings } from "@/lib/tauri";

import { ACCENT_PRESETS } from "../../api";
import { useDebouncedSlider } from "./useDebouncedSlider";

const ACCENT_PRESET_DISPLAY: { key: string; label: string; color: string }[] = [
  { key: "blue", label: "Bleu", color: "hsl(207, 100%, 50%)" },
  { key: "purple", label: "Violet", color: "hsl(271, 100%, 50%)" },
  { key: "green", label: "Vert", color: "hsl(122, 100%, 35%)" },
  { key: "orange", label: "Orange", color: "hsl(36, 100%, 50%)" },
  { key: "pink", label: "Rose", color: "hsl(340, 100%, 50%)" },
  { key: "red", label: "Rouge", color: "hsl(4, 100%, 50%)" },
  { key: "teal", label: "Turquoise", color: "hsl(174, 100%, 35%)" },
];

interface AccentColorPickerProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function AccentColorPicker({ settings, onSave }: AccentColorPickerProps) {
  const isCustomHue = settings.accentColor?.customHue != null;
  const settingsHue = isCustomHue
    ? settings.accentColor.customHue!
    : settings.accentColor?.preset
      ? (ACCENT_PRESETS[settings.accentColor.preset] ?? 207)
      : 207;

  const [localHue, handleHueChange] = useDebouncedSlider(settingsHue, (hue) => {
    onSave({
      ...settings,
      accentColor: { preset: null, customHue: hue },
    });
  });

  function handlePresetClick(preset: string) {
    onSave({
      ...settings,
      accentColor: { preset, customHue: null },
    });
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-surface-400">Couleur d’accent</span>

      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESET_DISPLAY.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => handlePresetClick(key)}
            className={`group relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
              settings.accentColor?.preset === key && !isCustomHue
                ? "ring-2 ring-surface-100 ring-offset-2 ring-offset-surface-900"
                : ""
            }`}
            style={{ backgroundColor: color }}
            title={label}
          >
            {settings.accentColor?.preset === key && !isCustomHue && (
              <span className="absolute inset-0 flex items-center justify-center">
                <CircleCheck className="h-4 w-4 text-white drop-shadow-md" />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-surface-500">Couleur personnalisée</span>
          {isCustomHue && (
            <span className="text-xs text-surface-400">Teinte : {Math.round(localHue)}°</span>
          )}
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="360"
            value={localHue}
            onChange={(e) => handleHueChange(Number(e.target.value))}
            className="h-3 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right,
                hsl(0, 100%, 50%),
                hsl(60, 100%, 50%),
                hsl(120, 100%, 50%),
                hsl(180, 100%, 50%),
                hsl(240, 100%, 50%),
                hsl(300, 100%, 50%),
                hsl(360, 100%, 50%)
              )`,
            }}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
            style={{
              left: `calc(${(localHue / 360) * 100}% - 10px)`,
              backgroundColor: `hsl(${localHue}, 100%, 50%)`,
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div
            className="h-6 w-6 rounded"
            style={{ backgroundColor: `hsl(${localHue}, 100%, 50%)` }}
          />
          <span className="text-sm text-surface-400">Aperçu</span>
        </div>
      </div>
    </div>
  );
}