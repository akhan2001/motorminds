import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface ChatNotificationProps {
  message: string;
}

export default function ChatNotification({ message }: ChatNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setVisible(false);
    }, 300); // Match transition duration
  };

  if (!visible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-xs transition-all duration-300 ${isClosing ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'}`}>
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 text-[#f52f2f]">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm">{message}</p>
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
} 