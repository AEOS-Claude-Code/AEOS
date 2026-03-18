"use client";

interface DashCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

export default function DashCard({
  title,
  subtitle,
  badge,
  children,
  delay = 0,
}: DashCardProps) {
  return (
    <div
      className="card-animate rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-100/50 transition-all hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-2xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {/* Content */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
