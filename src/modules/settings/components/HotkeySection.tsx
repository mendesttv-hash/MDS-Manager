import { Keyboard, X } from "lucide-react";
import { useState } from "react";

import { Button, ButtonGroup, IconButton, SectionCard, Switch, useToast } from "@/components";
import { api, isErr, type Settings } from "@/lib/tauri";

interface HotkeySectionProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function HotkeySection({ settings, onSave }: HotkeySectionProps) {
  return (
    <SectionCard title="Raccourcis" icon={<Keyboard className="h-5 w-5" />}>
      <div className="space-y-4">
        <p className="text-sm text-surface-400">
          Raccourcis clavier globaux qui fonctionnent même lorsque l'application n'est pas au
          premier plan. Pratique pour recharger rapidement les mods pendant vos tests en jeu.
        </p>

        <HotkeyInput
          label="Recharger les mods"
          description="Arrête le patcher, ferme League, reconstruit l’overlay, puis redémarre le patcher avec les fichiers de mods mis à jour."
          value={settings.reloadModsHotkey ?? null}
          onSet={async (accelerator) => {
            const result = await api.setHotkey("reloadMods", accelerator);
            if (isErr(result)) throw new Error(result.error.message);
            onSave({ ...settings, reloadModsHotkey: accelerator });
          }}
        />

        <HotkeyInput
          label="Fermer League"
          description="Force la fermeture du processus League of Legends."
          value={settings.killLeagueHotkey ?? null}
          onSet={async (accelerator) => {
            const result = await api.setHotkey("killLeague", accelerator);
            if (isErr(result)) throw new Error(result.error.message);
            onSave({ ...settings, killLeagueHotkey: accelerator });
          }}
        />

        <label className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-medium text-surface-200">
              Fermer League arrête le patcher
            </span>
            <span className="block text-sm text-surface-400">
              Lorsque le raccourci Fermer League est utilisé, le patcher est également arrêté.
            </span>
          </div>
          <Switch
            checked={settings.killLeagueStopsPatcher}
            onCheckedChange={(checked) => onSave({ ...settings, killLeagueStopsPatcher: checked })}
          />
        </label>
      </div>
    </SectionCard>
  );
}

interface HotkeyInputProps {
  label: string;
  description: string;
  value: string | null;
  onSet: (accelerator: string | null) => Promise<void>;
}

function HotkeyInput({ label, description, value, onSet }: HotkeyInputProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const toast = useToast();

  async function startCapture() {
    await api.pauseHotkeys();
    setIsCapturing(true);
  }

  async function stopCapture() {
    setIsCapturing(false);
    await api.resumeHotkeys();
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (!isCapturing) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      await stopCapture();
      return;
    }

    const keys: string[] = [];
    if (e.ctrlKey) keys.push("Ctrl");
    if (e.altKey) keys.push("Alt");
    if (e.shiftKey) keys.push("Shift");
    if (e.metaKey) keys.push("Super");

    const mainKey = e.key;
    if (["Control", "Alt", "Shift", "Meta"].includes(mainKey)) return;

    if (keys.length === 0) {
      toast.warning(
        "Le raccourci doit inclure une touche modificatrice",
        "Utilisez Ctrl, Alt, Shift ou Super avec une autre touche."
      );
      return;
    }

    const keyName = mainKey.length === 1 ? mainKey.toUpperCase() : mainKey;
    keys.push(keyName);

    const accelerator = keys.join("+");
    setIsCapturing(false);
    setIsPending(true);

    try {
      await onSet(accelerator);
      toast.success("Raccourci défini", `Raccourci défini sur ${accelerator}`);
    } catch (err) {
      toast.error(
        "Échec de la définition du raccourci",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      await api.resumeHotkeys();
      setIsPending(false);
    }
  }

  async function handleClear() {
    setIsPending(true);
    try {
      await onSet(null);
      toast.success("Raccourci supprimé");
    } catch (err) {
      toast.error(
        "Échec de la suppression du raccourci",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-surface-200">{label}</span>
        <span className="block text-sm text-surface-400">{description}</span>
      </div>

      <ButtonGroup className="shrink-0">
        {isCapturing ? (
          <div
            className="flex h-8 min-w-[140px] animate-pulse items-center justify-center rounded-md border-2 border-accent-500 bg-accent-500/10 px-3 text-sm font-medium text-accent-300 outline-none"
            tabIndex={0}
            ref={(el: HTMLDivElement | null) => el?.focus()}
            onKeyDown={handleKeyDown}
            onBlur={() => stopCapture()}
          >
            Appuyez sur une combinaison...
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            left={<Keyboard className="h-3.5 w-3.5" />}
            onClick={() => startCapture()}
            loading={isPending}
          >
            {value ?? "Non défini"}
          </Button>
        )}

        {value && !isCapturing && (
          <IconButton
            variant="outline"
            size="sm"
            icon={<X className="h-3.5 w-3.5" />}
            onClick={handleClear}
            loading={isPending}
          />
        )}
      </ButtonGroup>
    </div>
  );
}