import {
  GENERATED_DEFAULT_MILESTONE_ICON,
  GENERATED_PROJECT_ICON_OPTIONS
} from "../generated/projectIcons.generated";

export const PROJECT_ICON_OPTIONS = GENERATED_PROJECT_ICON_OPTIONS;

const ICON_SET = new Set<string>(PROJECT_ICON_OPTIONS);

export const DEFAULT_MILESTONE_ICON = GENERATED_DEFAULT_MILESTONE_ICON;

const getIconsBaseUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl || apiBaseUrl === "/api") {
    return "/icons";
  }

  if (/^https?:\/\//i.test(apiBaseUrl)) {
    return `${apiBaseUrl.replace(/\/api\/?$/, "")}/icons`;
  }

  const withoutApiSuffix = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${withoutApiSuffix || ""}/icons`;
};

export const normalizeProjectIcon = (icon: string | null | undefined) => {
  if (!icon) {
    return "";
  }

  if (ICON_SET.has(icon)) {
    return icon;
  }

  if (!icon.endsWith(".svg") && ICON_SET.has(`${icon}.svg`)) {
    return `${icon}.svg`;
  }

  if (icon === "flag") {
    return DEFAULT_MILESTONE_ICON;
  }

  return "";
};

export const resolveProjectIconUrl = (icon: string | null | undefined) => {
  const normalized = normalizeProjectIcon(icon);

  if (!normalized) {
    return null;
  }

  return `${getIconsBaseUrl()}/${encodeURIComponent(normalized)}`;
};

export const getProjectIconLabel = (icon: string) => {
  return icon
    .replace(/\.svg$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};
