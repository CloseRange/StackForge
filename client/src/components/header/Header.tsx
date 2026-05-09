import { DashboardHeader } from "./DashboardHeader";
import { ProjectHeader } from "./ProjectHeader";
import { PublicHeader } from "./PublicHeader";

type HeaderProps =
  | { variant: "public" }
  | { variant: "dashboard"; onNewProject?: () => void }
  | {
      variant: "project";
      projectName: string;
      xp?: number;
      xpMax?: number;
      activeTab?: "board" | "decks" | "members" | "timeline" | "activity" | "settings";
      onTabChange?: (tab: "board" | "decks" | "members" | "timeline" | "activity" | "settings") => void;
      onSettings?: () => void;
    };

export const Header = (props: HeaderProps) => {
  if (props.variant === "public") {
    return <PublicHeader />;
  }

  if (props.variant === "dashboard") {
    return <DashboardHeader onNewProject={props.onNewProject} />;
  }

  return (
    <ProjectHeader
      projectName={props.projectName}
      xp={props.xp}
      xpMax={props.xpMax}
      activeTab={props.activeTab}
      onTabChange={props.onTabChange}
      onSettings={props.onSettings}
    />
  );
};
