import { Layers3 } from "lucide-react";

import {
  getProjectIconLabel,
  PROJECT_ICON_OPTIONS
} from "../../utils/projectIcons";
import { ProjectIcon } from "./ProjectIcon";

type SvgIconPickerProps = {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
  size?: "default" | "compact";
};

export const SvgIconPicker = ({
  selectedIcon,
  onSelectIcon,
  allowNone = false,
  noneLabel = "No icon",
  size = "default"
}: SvgIconPickerProps) => {
  const isCompact = size === "compact";
  const tileSize = isCompact ? 36 : 44;

  return (
    <div className="space-y-2">
      {allowNone ? (
        <button
          type="button"
          onClick={() => onSelectIcon("")}
          className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
            !selectedIcon
              ? "border-sky-300/55 bg-sky-500/12 text-sky-100"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          <Layers3 className="h-4 w-4" />
          {noneLabel}
        </button>
      ) : null}

      <div
        className={`grid overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] ${
          isCompact ? "max-h-52 gap-1.5 p-1.5" : "max-h-56 gap-1.5 p-1.5"
        }`}
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))` }}
      >
        {PROJECT_ICON_OPTIONS.map((icon) => {
          const isSelected = icon === selectedIcon;

          return (
            <button
              key={icon}
              type="button"
              onClick={() => onSelectIcon(icon)}
              title={getProjectIconLabel(icon)}
              aria-label={getProjectIconLabel(icon)}
              className={`flex aspect-square items-center justify-center rounded-lg border transition ${
                isSelected
                  ? "border-sky-300/55 bg-sky-500/15 ring-2 ring-sky-300/35"
                  : "border-white/10 bg-slate-950/55 hover:border-white/20 hover:bg-white/[0.08]"
              } p-0.5`}
            >
              <ProjectIcon
                icon={icon}
                alt={getProjectIconLabel(icon)}
                className={isCompact ? "h-[1.5rem] w-[1.5rem]" : "h-[1.65rem] w-[1.65rem]"}
                tone={isSelected ? "picker-selected" : "picker"}
                fallbackClassName={
                  isCompact ? "h-[1.5rem] w-[1.5rem] text-slate-300" : "h-[1.65rem] w-[1.65rem] text-slate-300"
                }
              />
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">Selected: {selectedIcon || noneLabel}</p>
    </div>
  );
};
