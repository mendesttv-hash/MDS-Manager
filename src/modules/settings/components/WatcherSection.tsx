import { Eye } from "lucide-react";

import { AlertBox, SectionCard, Switch } from "@/components";
import type { Settings } from "@/lib/tauri";

interface WatcherSectionProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function WatcherSection({ settings, onSave }: WatcherSectionProps) {
  return (
    <SectionCard title="Surveillance de la bibliothèque" icon={<Eye className="h-5 w-5" />}>
      <div className="space-y-3">
        <AlertBox variant="warning" title="Fonctionnalité expérimentale">
          La surveillance de la bibliothèque peut se comporter de manière imprévisible selon la
          configuration de votre système. Les notifications du système de fichiers varient selon les
          plateformes et les antivirus, ce qui peut entraîner des détections incorrectes ou des
          mises à jour manquées.
        </AlertBox>

        <label className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-medium text-surface-200">
              Surveiller les modifications externes
            </span>
            <span className="block text-sm text-surface-400">
              Détecte automatiquement lorsque des fichiers de mods sont ajoutés ou supprimés en
              dehors de l'application et met à jour la bibliothèque. Nécessite un redémarrage pour
              être pris en compte.
            </span>
          </div>
          <Switch
            checked={settings.watcherEnabled}
            onCheckedChange={(checked) => onSave({ ...settings, watcherEnabled: checked })}
          />
        </label>
      </div>
    </SectionCard>
  );
}