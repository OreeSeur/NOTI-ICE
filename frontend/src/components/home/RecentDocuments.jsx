import { DashboardCard } from "../cards/DashboardCard";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { getDocumentTitle } from "../../utils/documentTypes";

export const RecentDocuments = () => {
  const { documentos } = useDocumentos();

  const items = documentos.slice(0, 3).map((documento) => ({
    title: getDocumentTitle(documento),
    subtitle: documento.tipo || "Documento",
    path: `/documentos/${documento.id}`,
  }));

  return <DashboardCard title="Documentos Recientes" items={items} />;
};
