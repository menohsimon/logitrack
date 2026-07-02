import { UserShell } from "@/components/navigation/user-shell";

export default function DriverLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <UserShell variant="driver">{children}</UserShell>;
}
