import React from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, DownloadIcon, RefreshCwIcon, BarChart3Icon } from "lucide-react";
import PageHeader from "../PageHeader";

const ShowManagementHeader = ({ onExport, onRefresh, refreshing, exporting }) => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Add Show", icon: PlusIcon, onClick: () => navigate("/admin/add-shows"), primary: true },
    { label: "Export CSV", icon: DownloadIcon, onClick: onExport, busy: exporting },
    { label: "Refresh", icon: RefreshCwIcon, onClick: onRefresh, busy: refreshing },
    { label: "Analytics", icon: BarChart3Icon, onClick: () => navigate("/admin/dashboard") },
  ];

  return (
    <PageHeader
      emoji="🎬"
      title="Show Management"
      subtitle="Manage every screening across all theaters."
      buttons={buttons}
    />
  );
};

export default ShowManagementHeader;
