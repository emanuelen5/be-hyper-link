import React, { useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: string;
  trigger: number;
}

export function Toast({ message, trigger }: ToastProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (trigger === 0) return;
    setMounted(true);
    clearTimeout(hideTimer.current);
    clearTimeout(fadeTimer.current);
    requestAnimationFrame(() => setVisible(true));
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      fadeTimer.current = setTimeout(() => setMounted(false), 300);
    }, 1000);
  }, [trigger]);

  if (!mounted) return null;

  return (
    <div
      style={{
        ...toastStyle,
        opacity: visible ? 1 : 0,
      }}
    >
      {message}
    </div>
  );
}

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: '12px',
  right: '12px',
  background: '#2e7d32',
  color: '#fff',
  padding: '6px 16px',
  borderRadius: '4px',
  fontSize: '13px',
  whiteSpace: 'nowrap',
  transition: 'opacity 0.3s ease',
};
