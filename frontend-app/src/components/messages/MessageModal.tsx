import React, { useState } from "react";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (content: string, file?: File) => void;
  canSendFile?: boolean;
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, onSend, canSendFile }) => {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);

  if (!isOpen) return null;

  const handleSend = () => {
    onSend(content, file);
    setContent("");
    setFile(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Enviar Mensagem</h2>
        <textarea
          className="w-full border rounded p-2 mb-2"
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        {canSendFile && (
          <input
            type="file"
            className="mb-2"
            onChange={e => setFile(e.target.files?.[0])}
          />
        )}
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSend}>Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
