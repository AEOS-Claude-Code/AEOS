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
      className="card-animate rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {/* Content */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
