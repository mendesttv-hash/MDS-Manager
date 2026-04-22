import { MonitorDown } from "lucide-react";

import { SectionCard, Switch } from "@/components";
import type { Settings } from "@/lib/tauri";

interface MinimizeToTraySectionProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function MinimizeToTraySection({ settings, onSave }: MinimizeToTraySectionProps) {
  return (
    <SectionCard title="Zone de notification & Démarrage" icon={<MonitorDown className="h-5 w-5" />}>
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-medium text-surface-200">
              Réduire dans la zone de notification
            </span>
            <span className="block text-sm text-surface-400">
              Lorsque cette option est activée, cliquer sur le bouton réduire masque l'application
              dans la zone de notification au lieu de la barre des tâches. Cliquez sur l’icône pour
              la restaurer.
            </span>
          </div>
          <Switch
            checked={settings.minimizeToTray}
            onCheckedChange={(checked) => onSave({ ...settings, minimizeToTray: checked })}
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-medium text-surface-200">
              Démarrer réduit dans la zone de notification
            </span>
            <span className="block text-sm text-surface-400">
              Lorsque cette option est activée, l'application démarre directement en arrière-plan
              dans la zone de notification. Cliquez sur l’icône pour l’ouvrir.
            </span>
          </div>
          <Switch
            checked={settings.startInTray}
            onCheckedChange={(checked) => onSave({ ...settings, startInTray: checked })}
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-medium text-surface-200">
              Lancement automatique
            </span>
            <span className="block text-sm text-surface-400">
              Lance automatiquement LTK Manager au démarrage de votre ordinateur.
            </span>
          </div>
          <Switch
            checked={settings.autoRun}
            onCheckedChange={(checked) => onSave({ ...settings, autoRun: checked })}
          />
        </label>

        {settings.autoRun && (
          <label className="flex items-center justify-between gap-4 border-l-2 border-surface-700 pl-4">
            <div>
              <span className="block text-sm font-medium text-surface-200">
                Démarrer en arrière-plan sauf si une mise à jour est disponible
              </span>
              <span className="block text-sm text-surface-400">
                Reste masquée dans la zone de notification au démarrage — sauf si une mise à jour est
                disponible, auquel cas la fenêtre s’ouvre automatiquement.
              </span>
            </div>
            <Switch
              checked={settings.startInTrayUnlessUpdate}
              onCheckedChange={(checked) =>
                onSave({ ...settings, startInTrayUnlessUpdate: checked })
              }
            />
          </label>
        )}

        <label className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-medium text-surface-200">
              Lancer automatiquement le patcher
            </span>
            <span className="block text-sm text-surface-400">
              Lance automatiquement le patch des mods à chaque démarrage de l'application, en
              utilisant le dernier profil actif.
            </span>
          </div>
          <Switch
            checked={settings.alwaysStartPatcher}
            onCheckedChange={(checked) => onSave({ ...settings, alwaysStartPatcher: checked })}
          />
        </label>
      </div>
    </SectionCard>
  );
}