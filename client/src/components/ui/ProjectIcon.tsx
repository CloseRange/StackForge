import { type ComponentType, useMemo, useState } from "react";
import { Layers3 } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { normalizeProjectIcon, resolveProjectIconUrl } from "../../utils/projectIcons";

type ProjectIconProps = {
  icon: string | null | undefined;
  className?: string;
  alt?: string;
  fallbackClassName?: string;
  tone?:
    | "neutral"
    | "picker"
    | "picker-selected"
    | "deck-card"
    | "timeline"
    | "tooltip"
    | "public"
    | "inherit";
};

const toPascalCase = (value: string) => {
  return value
    .replace(/\.svg$/i, "")
    .replace(/\(\d+\)/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
};

type SimpleIconComponent = ComponentType<{ className?: string }>;

const toneClassMap: Record<NonNullable<ProjectIconProps["tone"]>, string> = {
  neutral: "text-white",
  picker: "text-white",
  "picker-selected": "text-white",
  "deck-card": "text-white drop-shadow-[0_2px_8px_rgba(2,6,23,0.72)]",
  timeline: "text-white",
  tooltip: "text-white",
  public: "text-white",
  inherit: ""
};

const joinClasses = (...values: Array<string | null | undefined>) => {
  return values.filter(Boolean).join(" ");
};

const getLucideIcon = (icon: string | null | undefined): SimpleIconComponent => {
  const normalized = normalizeProjectIcon(icon);

  if (!normalized) {
    return Layers3;
  }

  const key = toPascalCase(normalized);
  const candidate = (LucideIcons as unknown as Record<string, ComponentType<any>>)[key] as
    | SimpleIconComponent
    | undefined;

  return candidate ?? Layers3;
};

export const ProjectIcon = ({
  icon,
  className = "h-5 w-5",
  alt = "icon",
  fallbackClassName,
  tone = "neutral"
}: ProjectIconProps) => {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const iconUrl = useMemo(() => resolveProjectIconUrl(icon), [icon]);
  const FallbackIcon = useMemo(() => getLucideIcon(icon), [icon]);
  const normalizedIcon = normalizeProjectIcon(icon);

  if (!iconUrl || failedToLoad) {
    return <FallbackIcon className={joinClasses(fallbackClassName ?? className, toneClassMap[tone])} />;
  }

  // Render all known project icons through the same masked SVG path so their tint
  // stays consistent across pickers, cards, timelines, and headers.
  return (
    <span
      role="img"
      aria-label={alt}
      className={joinClasses("inline-block", className, toneClassMap[tone])}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${iconUrl})`,
        maskImage: `url(${iconUrl})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain"
      }}
      onError={() => setFailedToLoad(true)}
    />
  );
};
