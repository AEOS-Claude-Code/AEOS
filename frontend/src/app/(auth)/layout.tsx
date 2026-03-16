import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-500 to-aeos-700">
          <Zap size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          AEOS
        </span>
      </Link>
      {children}
    </div>
  );
}
