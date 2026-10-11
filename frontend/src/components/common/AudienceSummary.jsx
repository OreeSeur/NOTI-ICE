import { getAudienceSummary, getItemAudience, getPriorityVariant } from "../../utils/audience";
import { StatusBadge } from "./StatusBadge";

export const AudienceSummary = ({ item, compact = false }) => {
  const audiencia = getItemAudience(item);
  const summary = getAudienceSummary(audiencia);

  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge label={summary.roles} variant="primary" className="text-xs" />
      {!compact && (
        <>
          <StatusBadge label={summary.carreras} variant="default" className="text-xs" />
          <StatusBadge label={summary.semestres} variant="default" className="text-xs" />
        </>
      )}
      <StatusBadge label={summary.categorias} variant="info" className="text-xs" />
      <StatusBadge
        label={`Prioridad: ${summary.prioridad}`}
        variant={getPriorityVariant(audiencia.prioridad)}
        className="text-xs"
      />
    </div>
  );
};
