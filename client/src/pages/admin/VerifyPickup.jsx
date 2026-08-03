import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/useAppContext';
import { ADMIN_INPUT_CLASS, ADMIN_SUBMIT_BTN_CLASS } from '../../lib/adminStyles';
import toast from 'react-hot-toast';

const SCANNER_ELEMENT_ID = 'pickup-qr-reader';

const VerifyPickup = () => {

  const {axios , getToken} = useAppContext();

  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const verifyToken = async (token) => {
    if (!token.trim()) return toast.error('Enter or scan a pickup code');
    setVerifying(true);
    setResult(null);
    try {
      const { data } = await axios.post('/api/booking/verify-pickup',
        { token: token.trim() },
        { headers: { Authorization: `Bearer ${await getToken()}` } });

      if (data.success) {
        setResult({ ok: true, message: data.message, snacks: data.snacks });
        toast.success('Pickup confirmed');
        setTokenInput('');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to verify pickup code';
      setResult({ ok: false, message });
      toast.error(message);
    }
    setVerifying(false);
  }

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verifyToken(tokenInput);
  }

  const startScanning = async () => {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
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
  }

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
  }

  useEffect(() => {
    return () => { stopScanning(); }
  }, []);

  return (
    <>
      <Title text1="Verify" text2="Pickup"/>
      <p className='text-sm text-gray-400 mt-2 max-w-lg'>
        Scan the customer's concession pickup QR code, or paste the code manually if the camera isn't available.
      </p>

      <div className='mt-6 max-w-md'>
        {!scanning ? (
          <button
            onClick={startScanning}
            className={ADMIN_SUBMIT_BTN_CLASS}
          >
            Start Camera Scan
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className='px-4 py-2 text-sm border border-primary/40 rounded cursor-pointer'
          >
            Stop Camera
          </button>
        )}

        <div id={SCANNER_ELEMENT_ID} className={`mt-4 rounded overflow-hidden ${scanning ? '' : 'hidden'}`} />

        <form onSubmit={handleManualSubmit} className='mt-6 flex gap-2'>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste pickup code"
            className={`flex-1 ${ADMIN_INPUT_CLASS}`}
          />
          <button
            type="submit"
            disabled={verifying}
            className={ADMIN_SUBMIT_BTN_CLASS}
          >
            {verifying ? 'Checking...' : 'Verify'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${result.ok ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
            <p className={`font-medium ${result.ok ? 'text-green-400' : 'text-red-400'}`}>{result.message}</p>
            {result.ok && result.snacks?.length > 0 && (
              <ul className='mt-2 text-sm text-gray-300 list-disc list-inside'>
                {result.snacks.map((s, i) => (
                  <li key={i}>{s.quantity} &times; {s.name}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default VerifyPickup
