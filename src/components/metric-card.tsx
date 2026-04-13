import type { DashboardMetric } from "@/types/dashboard";

type MetricCardProps = {
  metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <article className="metric-card">
      <p className="metric-card__label">{metric.label}</p>
      <h3 className="metric-card__value">{metric.value}</h3>
      <span className="metric-card__delta">{metric.delta}</span>
      <p className="metric-card__description">{metric.description}</p>
    </article>
  );
}
