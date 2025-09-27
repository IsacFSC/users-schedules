import React, { useState } from "react";
import MessageIconWithCounter from "./MessageIconWithCounter";
import MessageModal from "./MessageModal";

// Simulação de dados vindos da API
const unreadCount = 3; // Exemplo: número de mensagens não lidas
const userRole = "LEADER"; // Pode ser "ADMIN", "LEADER" ou "USER"

const MessagePanelExample: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  // Função para enviar mensagem (deve ser conectada à API)
  const handleSendMessage = (content: string, file?: File) => {
    // Aqui você faz a chamada para o backend
    console.log("Mensagem enviada:", content, file);
  };

  // Permite envio de arquivo apenas para leader e admin
  const canSendFile = userRole === "LEADER" || userRole === "ADMIN";

  return (
    <div className="flex items-center justify-end p-4 bg-gray-100">
      <MessageIconWithCounter count={unreadCount} onClick={() => setModalOpen(true)} />
      <MessageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSend={handleSendMessage}
        canSendFile={canSendFile}
      />
    </div>
  );
};

export default MessagePanelExample;
