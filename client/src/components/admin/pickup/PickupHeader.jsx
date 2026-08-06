import React from "react";
import { HistoryIcon, SettingsIcon, RefreshCwIcon, Maximize2Icon } from "lucide-react";
import PageHeader from "../PageHeader";

const PickupHeader = ({ onHistory, onCameraSettings, onSwitchCamera, onFullscreen }) => {
  const buttons = [
    { label: "Verification History", icon: HistoryIcon, onClick: onHistory },
    { label: "Camera Settings", icon: SettingsIcon, onClick: onCameraSettings },
    { label: "Switch Camera", icon: RefreshCwIcon, onClick: onSwitchCamera },
    { label: "Fullscreen", icon: Maximize2Icon, onClick: onFullscreen },
  ];

  return (
    <PageHeader
      title="Concession Pickup Verification"
      subtitle="Scan customer QR codes or manually verify pickup codes."
      buttons={buttons}
    />
  );
};

export default PickupHeader;
