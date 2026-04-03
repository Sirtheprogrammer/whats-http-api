import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrCode({ value, size = 280, sessionId, onScan }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }, [value, size]);

  if (!value) {
    return (
      <div className="flex items-center justify-center w-64 h-64 bg-gray-800 rounded-xl">
        <span className="text-gray-500 text-sm">No QR code available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="rounded-xl shadow-lg" />
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400">Scan with WhatsApp</p>
        <p className="text-xs text-gray-500 mt-1">Session: <span className="text-white">{sessionId}</span></p>
      </div>
    </div>
  );
}
