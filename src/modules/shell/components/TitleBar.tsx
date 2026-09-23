import { Link } from "@tanstack/react-router";
import { Window } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { LucideIcon } from "lucide-react";
import { FolderOpen, Library, Minus, Settings, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { IconButton, Tooltip, useToast } from "@/components";
import { api, type AppInfo, unwrap } from "@/lib/tauri";

const navItems = [{ to: "/", label: "Bibliothèque", icon: Library, exact: true }] as const;

const linkBaseClass =
  "relative flex h-full items-center gap-1.5 px-3 text-sm font-medium transition-colors";
const settingsLinkBase =
  "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors";
const activeLinkClass = "text-accent-400";
const inactiveLinkClass = "text-surface-400 hover:text-surface-200";

function ActiveIndicator() {
  return <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-accent-500" />;
}

function NavLink({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: twMerge(linkBaseClass, activeLinkClass) }}
      inactiveProps={{ className: twMerge(linkBaseClass, inactiveLinkClass) }}
    >
      {({ isActive }) => (
        <>
          <Icon className="h-4 w-4" />
          {label}
          {isActive && <ActiveIndicator />}
        </>
      )}
    </Link>
  );
}

async function handleOpenExternalUrl(
  href: string,
  toast: ReturnType<typeof useToast>,
  label: string,
) {
  try {
    await openUrl(href);
  } catch (error: unknown) {
    toast.error(
      `Impossible d’ouvrir ${label}`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

interface TitleBarProps {
  title?: string;
  appInfo?: AppInfo;
}

export function TitleBar({ title = "MDS Manager", appInfo }: TitleBarProps) {
  const version = "MDS v1.0";
  const [isMaximized, setIsMaximized] = useState(false);

  const appWindow =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window ? Window.getCurrent() : null;

  const toast = useToast();

  async function handleOpenStorageDirectory() {
    try {
      const result = await api.getStorageDirectory();
      const path = unwrap(result);
      await api.revealInExplorer(path);
    } catch (error: unknown) {
      toast.error(
        "Impossible d’ouvrir le dossier",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  useEffect(() => {
    if (!appWindow) return;

    appWindow.isMaximized().then(setIsMaximized);

    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [appWindow]);

  const handleMinimize = () => {
    api.minimizeToTray();
  };

  const handleMaximize = () => {
    if (!appWindow) return;
    appWindow.toggleMaximize();
  };

  const handleClose = () => {
    if (!appWindow) return;
    appWindow.close();
  };

  void appInfo;

  return (
    <header
      className="title-bar flex h-10 shrink-0 items-center justify-between border-b border-purple-900 bg-gradient-to-r from-[#0b0f1a] via-[#0d1222] to-[#0a0d18] select-none"
      data-tauri-drag-region
    >
      <div className="flex h-full items-center" data-tauri-drag-region>
        <div className="flex items-center gap-2 pr-4 pl-3" data-tauri-drag-region>
          <img
            src="/logo.png"
            alt="MDS"
            className="h-8 w-8 rounded-md border border-purple-500/30 shadow-lg"
            data-tauri-drag-region
          />
          <span
            className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-sm font-bold tracking-wide text-transparent"
            data-tauri-drag-region
          >
            {title}
          </span>
          <span className="ml-1 text-xs text-purple-400" data-tauri-drag-region>
            {version}
          </span>
        </div>

        <nav className="flex h-full items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>
      </div>

      <div className="flex h-full items-center gap-2 pr-2">
        <div className="flex items-center gap-2">
          <Tooltip content="Télécharger des skins (DivineSkins)">
            <button
              type="button"
              onClick={() =>
                void handleOpenExternalUrl("https://divineskins.gg/", toast, "DivineSkins")
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-300 transition-all duration-150 hover:bg-white/10 hover:text-white"
              aria-label="Ouvrir DivineSkins"
              title="Ouvrir DivineSkins"
            >
              <img
                src="/divineskins-logo.png"
                alt="DivineSkins"
                className="h-5 w-5 object-contain"
              />
            </button>
          </Tooltip>

          <Tooltip content="Télécharger des mods (RuneForge)">
            <button
              type="button"
              onClick={() =>
                void handleOpenExternalUrl("https://runeforge.dev/", toast, "RuneForge")
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-300 transition-all duration-150 hover:bg-white/10 hover:text-white"
              aria-label="Ouvrir RuneForge"
              title="Ouvrir RuneForge"
            >
              <img src="/runeforge-logo.png" alt="RuneForge" className="h-5 w-5 object-contain" />
            </button>
          </Tooltip>

          <Tooltip content="Ouvrir le dossier de stockage">
            <button
              type="button"
              onClick={handleOpenStorageDirectory}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-300 transition-all duration-150 hover:bg-white/10 hover:text-white"
              aria-label="Ouvrir le dossier de stockage"
              title="Ouvrir le dossier de stockage"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <Link
          to="/settings"
          activeProps={{
            className: twMerge(settingsLinkBase, activeLinkClass),
          }}
          inactiveProps={{
            className: twMerge(settingsLinkBase, inactiveLinkClass),
          }}
          aria-label="Paramètres"
        >
          {({ isActive }) => (
            <>
              <Settings className="h-4 w-4" />
              {isActive && <ActiveIndicator />}
            </>
          )}
        </Link>

        <div className="mx-1 h-5 w-px bg-surface-600" />

        <IconButton
          icon={<Minus className="h-3.5 w-3.5" />}
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          aria-label="Réduire"
          className="mx-0.5 h-7 w-7 rounded-md text-surface-400 transition-[transform,background-color,color] duration-100 hover:bg-amber-500 hover:text-white active:scale-90 active:opacity-80"
        />
        <IconButton
          icon={
            isMaximized ? (
              <OverlappingSquares className="h-3 w-3" />
            ) : (
              <Square className="h-3 w-3" />
            )
          }
          variant="ghost"
          size="sm"
          onClick={handleMaximize}
          aria-label={isMaximized ? "Restaurer" : "Agrandir"}
          className="mx-0.5 h-7 w-7 rounded-md text-surface-400 transition-[transform,background-color,color] duration-100 hover:bg-green-500 hover:text-white active:scale-90 active:opacity-80"
        />
        <IconButton
          icon={<X className="h-3.5 w-3.5" />}
          variant="ghost"
          size="sm"
          onClick={handleClose}
          aria-label="Fermer"
          className="mx-0.5 h-7 w-7 rounded-md text-surface-400 transition-[transform,background-color,color] duration-100 hover:bg-red-500 hover:text-white active:scale-90 active:opacity-80"
        />
      </div>
    </header>
  );
}

function OverlappingSquares({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="4" y="1" width="9" height="9" rx="1" />
      <rect x="1" y="4" width="9" height="9" rx="1" fill="currentColor" fillOpacity="0.1" />
      <rect x="1" y="4" width="9" height="9" rx="1" />
    </svg>
  );
}
