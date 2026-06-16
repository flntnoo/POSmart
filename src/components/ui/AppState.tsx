import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, SearchX, ShieldAlert } from "lucide-react";

type StateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

function StateFrame({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: StateProps & { icon: React.ReactNode }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[20px] bg-white p-8 text-center shadow-sm">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00]">
          {icon}
        </div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>}
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="mt-5 inline-flex rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export function LoadingState({ title = "Memuat data...", description }: Partial<StateProps>) {
  return <StateFrame icon={<Loader2 size={24} className="animate-spin" />} title={title} description={description} />;
}

export function EmptyState(props: StateProps) {
  return <StateFrame icon={<SearchX size={24} />} {...props} />;
}

export function ErrorState(props: StateProps) {
  return <StateFrame icon={<AlertTriangle size={24} />} {...props} />;
}

export function ForbiddenState(props?: Partial<StateProps>) {
  return (
    <StateFrame
      icon={<ShieldAlert size={24} />}
      title={props?.title ?? "Akses ditolak"}
      description={props?.description ?? "Role Anda belum memiliki akses ke halaman ini."}
      actionHref={props?.actionHref}
      actionLabel={props?.actionLabel}
    />
  );
}

export function SuccessFeedback(props: StateProps) {
  return <StateFrame icon={<CheckCircle2 size={24} />} {...props} />;
}
