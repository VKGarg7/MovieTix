import React from "react";
import { PlusIcon, UploadIcon, DownloadIcon } from "lucide-react";
import PageHeader from "../PageHeader";

const InfrastructureHeader = ({ onNewTheater, onImport, onExport }) => {
  const buttons = [
    { label: "New Theater", icon: PlusIcon, onClick: onNewTheater, primary: true },
    { label: "Import", icon: UploadIcon, onClick: onImport },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
  ];

  return (
    <PageHeader
      title="Cinema Infrastructure"
      subtitle="Manage multiplexes, screens, seating layouts and theater information."
      buttons={buttons}
      wrap={false}
    />
  );
};

export default InfrastructureHeader;
