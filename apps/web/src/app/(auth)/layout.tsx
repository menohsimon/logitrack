import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col bg-muted/30">
      <header className="p-6">
        <Link href="/" className="font-bold text-lg">
          LogiTrack
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}