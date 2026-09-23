import { createRootRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Window } from "@tauri-apps/api/window";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { useAutoStartPatcher, usePageTransition, useReducedMotion } from "@/hooks";
import { ProtocolInstallDialog, useDeepLinkListener } from "@/modules/deep-link";
import { useLibraryWatcher } from "@/modules/library";
import { StatusBar } from "@/modules/patcher";
import { useAppInfo, useCheckSetupRequired, useSettings } from "@/modules/settings";
import { DevConsole, TitleBar, useDevLogStream } from "@/modules/shell";
import { useUpdateCheck } from "@/modules/updater";
import { useDisplayStore, useUpdaterUpdate } from "@/stores";

function RootLayout() {
  const { data: appInfo } = useAppInfo();
  useUpdateCheck({ checkOnMount: true, delayMs: 3000 });

  const navigate = useNavigate();
  const location = useLocation();

  const { data: setupRequired, isLoading: isCheckingSetup } = useCheckSetupRequired();

  const zoomLevel = useDisplayStore((s) => s.zoomLevel);
  const isReducedMotion = useReducedMotion();
  const pageTransition = usePageTransition();

  useDevLogStream();
  useDeepLinkListener();
  useLibraryWatcher();
  useAutoStartPatcher();

  const update = useUpdaterUpdate();
  const { data: settings } = useSettings();

  useEffect(() => {
    const currentWindow =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window ? Window.getCurrent() : null;

    if (update && settings?.startInTrayUnlessUpdate && currentWindow) {
      void currentWindow.show();
    }
  }, [update, settings?.startInTrayUnlessUpdate]);

  useEffect(() => {
    document.documentElement.style.setProperty("--zoom-scale", String(zoomLevel / 100));
  }, [zoomLevel]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(isReducedMotion);
  }, [isReducedMotion]);

  useHotkeys("ctrl+1", () => navigate({ to: "/" }), { preventDefault: true });
  useHotkeys("ctrl+2", () => navigate({ to: "/workshop" }), { preventDefault: true });
  useHotkeys("ctrl+,", () => navigate({ to: "/settings" }), { preventDefault: true });
  useHotkeys(
    "ctrl+f",
    () => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
      input?.focus();
    },
    { preventDefault: true, enableOnFormTags: true },
  );

  useEffect(() => {
    if (setupRequired && location.pathname !== "/settings") {
      navigate({ to: "/settings", search: { firstRun: true } });
    }
  }, [setupRequired, navigate, location.pathname]);

  if (isCheckingSetup) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-surface-900 via-surface-800 to-surface-900">
        <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
      </div>
    );
  }

  return (
    <div className="root flex h-screen flex-col bg-gradient-to-br from-[#0b0f1a] via-[#0d1222] to-[#070910]">
      <TitleBar appInfo={appInfo} />
      <main className="relative flex-1 overflow-hidden">
        <div
          className={`h-full ${pageTransition.className ?? ""}`}
          onAnimationEnd={pageTransition.onAnimationEnd}
        >
          <Outlet />
        </div>
      </main>
      <StatusBar />
      <ProtocolInstallDialog />
      {import.meta.env.DEV && <DevConsole />}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
