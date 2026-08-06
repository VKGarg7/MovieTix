import React from "react";
import { DownloadIcon, RefreshCwIcon, RadioIcon } from "lucide-react";
import PageHeader from "../PageHeader";

const ActivityCenterHeader = ({ onExport, onRefresh, autoRefresh, onToggleAutoRefresh, refreshing }) => {
  const buttons = [
    { label: `Auto Refresh ${autoRefresh ? "On" : "Off"}`, icon: RadioIcon, onClick: onToggleAutoRefresh, active: autoRefresh },
    { label: "Refresh", icon: RefreshCwIcon, onClick: onRefresh, busy: refreshing },
    { label: "Export CSV", icon: DownloadIcon, onClick: onExport },
  ];

  return (
    <PageHeader
      title="Activity Center"
      subtitle="Monitor every action performed across your cinema management platform."
      buttons={buttons}
      wrap={false}
    />
  );
};

export default ActivityCenterHeader;
