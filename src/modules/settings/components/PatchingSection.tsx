import { AlertTriangle, Plus, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

import { Button, Field, IconButton, SectionCard, Switch } from "@/components";
import type { Settings } from "@/lib/tauri";

interface PatchingSectionProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function PatchingSection({ settings, onSave }: PatchingSectionProps) {
  const [newWad, setNewWad] = useState("");

  const blocklist = settings.wadBlocklist ?? [];

  function addWad() {
    const trimmed = newWad.trim();
    if (!trimmed) return;

    const alreadyExists = blocklist.some((w) => w.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) return;

    onSave({ ...settings, wadBlocklist: [...blocklist, trimmed] });
    setNewWad("");
  }

  function removeWad(wad: string) {
    onSave({ ...settings, wadBlocklist: blocklist.filter((w) => w !== wad) });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addWad();
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Modes de jeu" icon={<ShieldAlert className="h-5 w-5" />}>
        <label className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-medium text-surface-200">
              Patcher les fichiers TFT
            </span>
            <span className="block text-sm text-surface-400">
              Applique les mods aux fichiers de jeu de Teamfight Tactics (Map22.wad.client).
              Désactivez cette option si vous jouez uniquement sur la Faille de l&apos;invocateur.
            </span>
          </div>
          <Switch
            checked={settings.patchTft}
            onCheckedChange={(checked) => onSave({ ...settings, patchTft: checked })}
          />
        </label>
      </SectionCard>

      <SectionCard title="Mods scripts" icon={<ShieldAlert className="h-5 w-5" />}>
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-medium text-surface-200">
                Bloquer Scripts.wad.client
              </span>
              <span className="block text-sm text-surface-400">
                Empêche les mods de modifier les scripts du jeu. Désactiver cette option autorise
                les mods à exécuter des scripts de jeu arbitraires.
              </span>
            </div>
            <Switch
              checked={settings.blockScriptsWad}
              onCheckedChange={(checked) => onSave({ ...settings, blockScriptsWad: checked })}
            />
          </label>

          {!settings.blockScriptsWad && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-300">
                Le modding par scripts est activé. Installez uniquement des mods provenant de
                sources fiables.
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="WAD bloqués" icon={<ShieldAlert className="h-5 w-5" />}>
        <div className="space-y-3">
          <p className="text-sm text-surface-400">
            Fichiers WAD supplémentaires à exclure de la création de l&apos;overlay. Les mods ne
            pourront pas modifier ces fichiers.
          </p>

          <div className="space-y-1.5">
            {blocklist.map((wad) => (
              <div
                key={wad}
                className="flex items-center justify-between rounded-md bg-surface-800 px-3 py-2"
              >
                <span className="text-sm text-surface-200">{wad}</span>
                <IconButton
                  icon={<X className="h-3.5 w-3.5" />}
                  variant="ghost"
                  size="xs"
                  compact
                  onClick={() => removeWad(wad)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Field.Control
              type="text"
              value={newWad}
              onChange={(e) => setNewWad(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex : Aatrox.wad.client"
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={addWad} disabled={!newWad.trim()}>
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
