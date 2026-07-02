import { UserShell } from "@/components/navigation/user-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserShell variant="user">{children}</UserShell>;
}