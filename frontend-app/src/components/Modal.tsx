
'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-800 font-bold hover:text-gray-600 text-2xl px-2"
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
