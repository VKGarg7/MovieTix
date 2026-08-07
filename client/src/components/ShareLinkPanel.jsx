import React from "react";
import { toast } from "react-hot-toast";
import { Copy } from "lucide-react";

const ShareLinkPanel = ({ shareUrl, label = "Share this link with your friends:" }) => {
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="w-full max-w-md bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <p className="text-sm text-gray-300 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 bg-black/20 border border-primary/30 rounded px-3 py-2 text-xs outline-none"
        />
        <button onClick={copyLink} className="p-2 bg-primary rounded cursor-pointer">
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ShareLinkPanel;
