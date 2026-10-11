import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { SUBSCRIPTION_TOPICS } from "../../constants/subscriptions";

export const SubscriptionPreferences = ({ subscriptions, onToggleTopic, onToggleChannel, onSubmit }) => {
  const channels = [
    { name: "notifyNoticias", label: "Noticias" },
    { name: "notifyEventos", label: "Eventos" },
    { name: "notifyDocumentos", label: "Documentos" },
  ];

  return (
    <form onSubmit={onSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Preferencias y suscripciones
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Elige qué temas te interesan. Esta información servirá para personalizar noticias, eventos y documentos.
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">
          Tipos de contenido
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {channels.map((channel) => {
            const active = Boolean(subscriptions[channel.name]);

            return (
              <button
                key={channel.name}
                type="button"
                onClick={() => onToggleChannel(channel.name)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-[#6F1D46] bg-pink-50 text-[#6F1D46] dark:bg-[#6F1D46]/20 dark:text-pink-200"
                    : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  {active ? <Bell size={18} /> : <BellOff size={18} />}
                  {channel.label}
                </div>
                <p className="text-xs">
                  {active ? "Incluido en tus recomendaciones" : "Oculto de tus recomendaciones"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">
          Temas de interés
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {SUBSCRIPTION_TOPICS.map((topic) => {
            const active = subscriptions.topics.includes(topic.value);

            return (
              <button
                key={topic.value}
                type="button"
                onClick={() => onToggleTopic(topic.value)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-[#6F1D46] bg-pink-50 dark:bg-[#6F1D46]/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                  {active && <CheckCircle2 size={18} className="text-[#6F1D46] dark:text-pink-300" />}
                  {topic.label}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {topic.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" className="rounded-lg bg-[#6F1D46] px-6 py-3 font-semibold text-white transition hover:opacity-90">
        Guardar preferencias
      </button>
    </form>
  );
};
