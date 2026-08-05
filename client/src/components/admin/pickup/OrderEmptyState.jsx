import { QrCodeIcon } from "lucide-react";
import EmptyState from "../EmptyState";

const OrderEmptyState = () => (
  <EmptyState
    icon={QrCodeIcon}
    tone="violet"
    title="No order scanned"
    description="Scan a customer's QR code or enter a pickup code to view order details."
    className="glass-panel !rounded-3xl h-full flex flex-col items-center justify-center text-center py-16 px-6"
    iconMotionProps={{ animate: { y: [0, -8, 0] }, transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
  />
);

export default OrderEmptyState;
