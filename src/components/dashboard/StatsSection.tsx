// Legacy demo-only component. The active /dashboard page does not import this module.
import { statsData } from "@/data/dashboard";
import StatsCard from "./StatsCard";

export default function StatsSection() {
  return (
    <div className="mt-8 grid grid-cols-4 gap-5">
      {statsData.map((stat) => (
        <StatsCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          trend={stat.trend}
          icon={stat.icon}
          highlight={stat.highlight}
        />
      ))}
    </div>
  );
}
