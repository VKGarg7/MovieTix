import React from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, UploadIcon, DownloadIcon, PackageIcon, BarChart3Icon } from "lucide-react";
import PageHeader from "../PageHeader";

const ConcessionsHeader = ({ onAdd, onImport, onExport }) => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Add Item", icon: PlusIcon, onClick: onAdd, primary: true },
    { label: "Import Menu", icon: UploadIcon, onClick: onImport },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
    { label: "Inventory", icon: PackageIcon, onClick: onAdd },
    { label: "Analytics", icon: BarChart3Icon, onClick: () => navigate("/admin/dashboard") },
  ];

  return (
    <PageHeader
      title="Concessions Management"
      subtitle="Manage food, beverages and combo offers across all theaters."
      buttons={buttons}
    />
  );
};

export default ConcessionsHeader;
