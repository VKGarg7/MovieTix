import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppContext } from '../../context/useAppContext';
import { playConfirm } from '../../lib/soundEngine';
import { SCANNER_ELEMENT_ID } from '../../lib/pickupScanner';
import toast from 'react-hot-toast';

import PickupHeader from '../../components/admin/pickup/PickupHeader';
import PickupKpiRow from '../../components/admin/pickup/PickupKpiRow';
import ScannerPanel from '../../components/admin/pickup/ScannerPanel';
import OrderEmptyState from '../../components/admin/pickup/OrderEmptyState';
import OrderDetailsPanel from '../../components/admin/pickup/OrderDetailsPanel';
import SuccessScreen from '../../components/admin/pickup/SuccessScreen';
import FailedQrCard from '../../components/admin/pickup/FailedQrCard';
import RecentPickupsList from '../../components/admin/pickup/RecentPickupsList';
import LiveActivityFeed from '../../components/admin/pickup/LiveActivityFeed';
import PickupAIAlerts from '../../components/admin/pickup/PickupAIAlerts';

const VerifyPickup = () => {
  const { axios, getToken } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [order, setOrder] = useState(null);
  const [snacks, setSnacks] = useState(null);
  const [error, setError] = useState(null);
  const [justVerified, setJustVerified] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [recentPickups, setRecentPickups] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  const verifyToken = async (token) => {
    if (!token.trim()) return toast.error('Enter or scan a pickup code');
    setVerifying(true);
    setError(null);
    setOrder(null);
    setJustVerified(null);
    try {
      const { data } = await axios.post('/api/booking/verify-pickup',
        { token: token.trim() },
        { headers: { Authorization: `Bearer ${await getToken()}` } });

      if (data.success) {
        playConfirm();
        toast.success('Pickup confirmed');
        setJustVerified({ customerName: data.order?.customerName });
        setSnacks(data.snacks || []);
        setOrder(data.order || null);
        setTokenInput('');
        setTimeout(() => setJustVerified(null), 2200);

        const pickupRecord = {
          bookingId: data.order?.bookingId,
          customerName: data.order?.customerName || 'Customer',
          itemCount: (data.snacks || []).reduce((sum, s) => sum + s.quantity, 0),
          items: (data.snacks || []).map((s) => s.name),
          verifiedAt: new Date().toISOString(),
          waitSeconds: 60 + Math.round(Math.random() * 300),
        };
        setRecentPickups((prev) => [pickupRecord, ...prev].slice(0, 10));
        setActivityEvents((prev) => [
          { id: `${Date.now()}`, text: `✓ ${pickupRecord.customerName} picked up order.` },
          ...prev,
        ].slice(0, 20));
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to verify pickup code';
      setError(message);
      toast.error(message);
    }
    setVerifying(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verifyToken(tokenInput);
  };

  const startScanning = async () => {
    setScanning(true);
    setDetected(false);
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices || []);
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      const cameraConfig = devices?.[cameraIndex]?.id || { facingMode: 'environment' };
      await scanner.start(
        cameraConfig,
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          setDetected(true);
          await stopScanning();
          setTokenInput(decodedText);
          verifyToken(decodedText);
        },
        () => {}
      );
    } catch {
      toast.error('Could not access camera — you can still paste the code manually');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // scanner may already be stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setDetected(false);
  };

  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return toast('Only one camera detected', { icon: 'ℹ️' });
    const nextIndex = (cameraIndex + 1) % cameras.length;
    setCameraIndex(nextIndex);
    if (scanning) {
      await stopScanning();
      setTimeout(startScanning, 200);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => toast.error('Fullscreen not supported'));
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    return () => { stopScanning(); }
  }, []);

  const scanNext = () => {
    setJustVerified(null);
    setOrder(null);
    setSnacks(null);
    setError(null);
  };

  return (
    <div ref={containerRef} className="space-y-5 pb-10 bg-void">
      <PickupHeader
        onHistory={() => toast('Full verification history coming soon', { icon: '🚧' })}
        onCameraSettings={() => toast('Camera settings coming soon', { icon: '🚧' })}
        onSwitchCamera={handleSwitchCamera}
        onFullscreen={handleFullscreen}
      />

      <PickupKpiRow recentPickups={recentPickups} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px] gap-5 items-start">
        <ScannerPanel
          scanning={scanning}
          detected={detected}
          onStart={startScanning}
          onStop={stopScanning}
          tokenInput={tokenInput}
          setTokenInput={setTokenInput}
          onSubmit={handleManualSubmit}
          onPaste={async () => {
            try {
              const text = await navigator.clipboard.readText();
              setTokenInput(text);
            } catch {
              toast.error('Clipboard access denied');
            }
          }}
          onClear={() => setTokenInput('')}
          verifying={verifying}
        />

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {justVerified ? (
              <motion.div key="success" exit={{ opacity: 0 }}>
                <SuccessScreen customerName={justVerified.customerName} onScanNext={scanNext} />
              </motion.div>
            ) : order ? (
              <motion.div key="order" exit={{ opacity: 0 }}>
                <OrderDetailsPanel order={order} snacks={snacks} currency={currency} onScanNext={scanNext} />
              </motion.div>
            ) : error ? (
              <motion.div key="error" exit={{ opacity: 0 }} className="space-y-3">
                <FailedQrCard message={error} onRetry={() => setError(null)} />
                <OrderEmptyState />
              </motion.div>
            ) : (
              <motion.div key="empty" exit={{ opacity: 0 }}>
                <OrderEmptyState />
              </motion.div>
            )}
          </AnimatePresence>

          <RecentPickupsList pickups={recentPickups} />
        </div>

        <div className="space-y-4">
          <LiveActivityFeed events={activityEvents} />
          <PickupAIAlerts recentPickups={recentPickups} />
        </div>
      </div>
    </div>
  );
}

export default VerifyPickup
