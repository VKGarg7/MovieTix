import React from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, DownloadIcon, BarChart3Icon, RefreshCwIcon } from "lucide-react";
import PageHeader from "../PageHeader";

const PromotionCenterHeader = ({ onCreate, onExport, onRefresh, refreshing }) => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Create Coupon", icon: PlusIcon, onClick: onCreate, primary: true },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
    { label: "Analytics", icon: BarChart3Icon, onClick: () => navigate("/admin/dashboard") },
    { label: "Refresh", icon: RefreshCwIcon, onClick: onRefresh, busy: refreshing },
  ];

  return (
    <PageHeader
      emoji="🎟"
      title="Promotion Center"
      subtitle="Create, monitor and optimize discount campaigns across every theater."
      buttons={buttons}
    />
  );
};

export default PromotionCenterHeader;
