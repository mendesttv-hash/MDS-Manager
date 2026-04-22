import type { Settings } from "@/lib/tauri";

import { LeaguePathSection } from "./LeaguePathSection";
import { MinimizeToTraySection } from "./MinimizeToTraySection";
import { ModStorageSection } from "./ModStorageSection";
import { TrustedDomainsSection } from "./TrustedDomainsSection";
import { WatcherSection } from "./WatcherSection";

interface GeneralSectionProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function GeneralSection({ settings, onSave }: GeneralSectionProps) 
{
  return (
    <div className="space-y-4">
      <LeaguePathSection settings={settings} onSave={onSave} />
      <MinimizeToTraySection settings={settings} onSave={onSave} />
      <TrustedDomainsSection settings={settings} onSave={onSave} />
      <WatcherSection settings={settings} onSave={onSave} />
      <ModStorageSection settings={settings} onSave={onSave} />
    </div>
  );
}