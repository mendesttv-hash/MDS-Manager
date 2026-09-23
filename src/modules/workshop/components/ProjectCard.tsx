import { invoke } from "@tauri-apps/api/core";
import { EllipsisVertical, FolderOpen, Package, Pencil, Play, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { Button, Checkbox, IconButton, Menu } from "@/components";
import type { WorkshopProject } from "@/lib/tauri";
import { getTagLabel } from "@/modules/library";
import { usePatcherStatus } from "@/modules/patcher";
import {
  usePatcherSessionStore,
  useWorkshopDialogsStore,
  useWorkshopSelectionStore,
} from "@/stores";

import { useProjectThumbnail } from "../api/useProjectThumbnail";
import { useTestProjects } from "../api/useTestProject";
import type { ViewMode } from "./WorkshopToolbar";

interface ProjectCardProps {
  project: WorkshopProject;
  viewMode: ViewMode;
  onEdit: (project: WorkshopProject) => void;
}

export function ProjectCard({ project, viewMode, onEdit }: ProjectCardProps) {
  const { data: thumbnailUrl } = useProjectThumbnail(project.path, project.thumbnailPath);

  const selected = useWorkshopSelectionStore((s) => s.selectedPaths.has(project.path));
  const toggle = useWorkshopSelectionStore((s) => s.toggle);

  const { data: patcherStatus } = usePatcherStatus();
  const isPatcherActive = patcherStatus?.running ?? false;

  const testingProjects = usePatcherSessionStore((s) => s.testingProjects);
  const isTesting = useMemo(
    () => testingProjects.some((p) => p.path === project.path),
    [testingProjects, project.path],
  );

  const openPackDialog = useWorkshopDialogsStore((s) => s.openPackDialog);
  const openDeleteDialog = useWorkshopDialogsStore((s) => s.openDeleteDialog);

  const testProjects = useTestProjects();
  const isTestDisabled = isPatcherActive || testProjects.isPending;

  function handleTest() {
    testProjects.mutate(
      { projects: [{ path: project.path, displayName: project.displayName }] },
      { onError: (err) => console.error("Failed to test project:", err.message) },
    );
  }

  async function handleOpenLocation() {
    try {
      await invoke("reveal_in_explorer", { path: project.path });
    } catch (error) {
      console.error("Failed to open location:", error);
    }
  }

  const listBorderClass = isTesting
    ? "border-green-500/40"
    : selected
      ? "border-accent-500/40"
      : "border-surface-700";

  if (viewMode === "list") {
    return (
      <div
        className={twMerge(
          "group flex cursor-pointer items-center gap-4 rounded-lg border bg-surface-900 p-4 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out hover:-translate-y-px hover:border-surface-600 hover:shadow-md",
          listBorderClass,
          isPatcherActive && !isTesting && "opacity-50",
        )}
        onClick={() => onEdit(project)}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            size="md"
            checked={isPatcherActive ? isTesting : selected}
            onCheckedChange={() => toggle(project.path)}
            disabled={isPatcherActive}
          />
        </div>

        <div className="relative h-12 w-21 shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-surface-700 to-surface-800">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-lg font-bold text-surface-500">
                {project.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-surface-100">
            <span className="truncate">{project.displayName}</span>
          </h3>
          <p className="truncate text-sm text-surface-500">
            v{project.version} • {project.authors.map((a) => a.name).join(", ") || "Unknown author"}
          </p>
          <ProjectPills project={project} max={3} />
        </div>

        {isTesting && (
          <span className="shrink-0 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
            Testing
          </span>
        )}

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            left={<Play className="h-4 w-4" />}
            onClick={handleTest}
            disabled={isTestDisabled}
          >
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            left={<Package className="h-4 w-4" />}
            onClick={() => openPackDialog(project)}
          >
            Pack
          </Button>
          <Menu.Root>
            <Menu.Trigger
              render={
                <IconButton
                  icon={<EllipsisVertical className="h-4 w-4" />}
                  variant="ghost"
                  size="sm"
                />
              }
            />
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(project)}>
                    Edit Project
                  </Menu.Item>
                  <Menu.Item
                    icon={<Play className="h-4 w-4" />}
                    onClick={handleTest}
                    disabled={isTestDisabled}
                  >
                    Test
                  </Menu.Item>
                  <Menu.Item
                    icon={<Package className="h-4 w-4" />}
                    onClick={() => openPackDialog(project)}
                  >
                    Pack
                  </Menu.Item>
                  <Menu.Item icon={<FolderOpen className="h-4 w-4" />} onClick={handleOpenLocation}>
                    Open Location
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="danger"
                    onClick={() => openDeleteDialog(project)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    );
  }

  const gridBorderClass = isTesting
    ? "border-green-500/40"
    : selected
      ? "border-fuchsia-500/50"
      : "border-purple-500/20";

  return (
    <div
      className={twMerge(
        "group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-b from-[#151521] via-[#12131c] to-[#0d0f16] shadow-[0_0_0_1px_rgba(168,85,247,0.05)] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-fuchsia-400/50 hover:shadow-[0_10px_30px_rgba(168,85,247,0.18)]",
        gridBorderClass,
        isPatcherActive && !isTesting && "opacity-50",
      )}
      onClick={() => onEdit(project)}
    >
      <div
        className={twMerge(
          "absolute top-0 left-0 z-20 p-2",
          isPatcherActive ? "cursor-not-allowed" : "cursor-pointer",
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isPatcherActive && e.target === e.currentTarget) toggle(project.path);
        }}
      >
        <Checkbox
          size="md"
          checked={isPatcherActive ? isTesting : selected}
          onCheckedChange={() => toggle(project.path)}
          disabled={isPatcherActive}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)] opacity-80" />

      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/5 bg-gradient-to-br from-[#25153a] via-[#1a2342] to-[#0f1220]">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b12]/80 via-transparent to-transparent" />
          </>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_35%)]" />
            <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px] opacity-20" />
            <span className="relative text-5xl font-black tracking-wide text-white/80 drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]">
              {project.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="absolute right-3 bottom-3 rounded-full border border-fuchsia-400/30 bg-black/35 px-2 py-1 text-[10px] font-semibold tracking-wide text-fuchsia-200 backdrop-blur-sm">
          MOD
        </div>
      </div>

      <div className="relative z-10 flex items-start gap-2 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-[15px] font-semibold text-white">
            <span className="line-clamp-1">{project.displayName}</span>
          </h3>

          <ProjectPills project={project} max={3} className="mb-2" />

          <div className="flex items-center gap-1.5 text-xs text-white/45">
            <span className="text-fuchsia-300/85">v{project.version}</span>
            <span>•</span>
            <span className="flex-1 truncate">
              {project.authors.length > 0 ? project.authors[0].name : "Unknown"}
            </span>
            {isTesting && (
              <span className="shrink-0 rounded-full border border-green-400/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-300">
                Testing
              </span>
            )}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Menu.Root>
            <Menu.Trigger
              render={
                <IconButton
                  icon={<EllipsisVertical />}
                  variant="ghost"
                  size="md"
                  compact
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                />
              }
            />
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(project)}>
                    Edit Project
                  </Menu.Item>
                  <Menu.Item
                    icon={<Play className="h-4 w-4" />}
                    onClick={handleTest}
                    disabled={isPatcherActive}
                  >
                    Test
                  </Menu.Item>
                  <Menu.Item
                    icon={<Package className="h-4 w-4" />}
                    onClick={() => openPackDialog(project)}
                  >
                    Pack
                  </Menu.Item>
                  <Menu.Item icon={<FolderOpen className="h-4 w-4" />} onClick={handleOpenLocation}>
                    Open Location
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="danger"
                    onClick={() => openDeleteDialog(project)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </div>
  );
}

function ProjectPills({
  project,
  max,
  className,
}: {
  project: WorkshopProject;
  max: number;
  className?: string;
}) {
  const pills = [
    ...project.tags.map((t) => ({ label: getTagLabel(t), color: "brand" as const })),
    ...project.champions.map((c) => ({ label: c, color: "emerald" as const })),
  ];
  if (pills.length === 0) return null;

  const visible = pills.slice(0, max);
  const overflow = pills.length - max;

  const colorClasses = {
    brand: "border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
    emerald: "border border-sky-400/20 bg-sky-500/10 text-sky-200",
  } as const;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      {visible.map((pill) => (
        <span
          key={`${pill.color}:${pill.label}`}
          className={`rounded-md px-2 py-0.5 text-[10px] leading-tight backdrop-blur-sm ${colorClasses[pill.color]}`}
        >
          {pill.label}
        </span>
      ))}
      {overflow > 0 && <span className="text-[10px] text-surface-500">+{overflow}</span>}
    </div>
  );
}
