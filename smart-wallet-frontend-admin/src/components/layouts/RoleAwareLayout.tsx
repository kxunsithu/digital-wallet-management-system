import type { ReactNode } from "react";
import { getCookie } from "@/lib/cookies";
import MainLayout from "./MainLayout";
import AgentManagerLayout from "./AgentManagerLayout";

type Props = {
  children: ReactNode;
  title?: string;
};

/**
 * Picks Admin (sidebar) or Agent Manager (top nav) layout based on role cookie.
 */
const RoleAwareLayout = ({ children, title }: Props) => {
  const role = getCookie("user_role") ?? "";

  if (role === "agent_manager") {
    return <AgentManagerLayout title={title}>{children}</AgentManagerLayout>;
  }

  return <MainLayout title={title}>{children}</MainLayout>;
};

export default RoleAwareLayout;
