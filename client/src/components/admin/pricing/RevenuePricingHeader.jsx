import React from "react";
import { PlusIcon, UploadIcon, DownloadIcon, FlaskConicalIcon, HistoryIcon } from "lucide-react";
import PageHeader from "../PageHeader";

const RevenuePricingHeader = ({ onCreate, onImport, onExport, onSimulate, onHistory }) => {
  const buttons = [
    { label: "Create Rule", icon: PlusIcon, onClick: onCreate, primary: true },
    { label: "Import Rules", icon: UploadIcon, onClick: onImport },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
    { label: "Simulation", icon: FlaskConicalIcon, onClick: onSimulate },
    { label: "History", icon: HistoryIcon, onClick: onHistory },
  ];

  return (
    <PageHeader
      title="Revenue Pricing Engine"
      subtitle="Optimize ticket pricing dynamically across theaters, screens and showtimes."
      buttons={buttons}
    />
  );
};

export default RevenuePricingHeader;
