import React from "react";
import { RadioIcon, RefreshCwIcon, DownloadIcon, Maximize2Icon } from "lucide-react";
import PageHeader from "../PageHeader";

const OperationsCenterHeader = ({ autoRefresh, onToggleAutoRefresh, onRefreshNow, onExport, onFullscreen }) => {
  const buttons = [
    { label: `Auto Refresh ${autoRefresh ? "(Live)" : "(Off)"}`, icon: RadioIcon, onClick: onToggleAutoRefresh, active: autoRefresh },
    { label: "Refresh Now", icon: RefreshCwIcon, onClick: onRefreshNow },
    { label: "Export", icon: DownloadIcon, onClick: onExport },
    { label: "Fullscreen", icon: Maximize2Icon, onClick: onFullscreen },
  ];

  return (
    <PageHeader
      title="Cinema Operations Center"
      subtitle="Monitor live occupancy, bookings, revenue and screen health across all multiplexes."
      buttons={buttons}
    />
  );
};

export default OperationsCenterHeader;
