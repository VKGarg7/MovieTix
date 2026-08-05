import React from "react";
import { useNavigate } from "react-router-dom";
import { DownloadIcon, RefreshCwIcon, FileTextIcon, BarChart3Icon } from "lucide-react";
import PageHeader from "../PageHeader";

const BookingIntelligenceHeader = ({ onExport, onRefresh, onReport, refreshing, exporting }) => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Export CSV", icon: DownloadIcon, onClick: onExport, busy: exporting, primary: true },
    { label: "Refresh", icon: RefreshCwIcon, onClick: onRefresh, busy: refreshing },
    { label: "Download Report", icon: FileTextIcon, onClick: onReport },
    { label: "Analytics", icon: BarChart3Icon, onClick: () => navigate("/admin/dashboard") },
  ];

  return (
    <PageHeader
      emoji="🎟"
      title="Booking Intelligence"
      subtitle="Monitor every booking across all theaters in real time."
      buttons={buttons}
    />
  );
};

export default BookingIntelligenceHeader;
