import { PublicHeader } from "@/components/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}