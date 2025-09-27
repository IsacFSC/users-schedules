import React, { useState } from "react";
import MessageIconWithCounter from "../../components/messages/MessageIconWithCounter";
import MessageModal from "../../components/messages/MessageModal";

// Simulação de dados vindos da API
const userSchedules = [
  {
    id: 1,
    date: "2025-09-25",
    task: "Limpeza",
    time: "08:00 - 12:00",
    users: ["João", "Maria", "Carlos"], // nomes dos usuários na mesma escala
  },
  // ... outras escalas
];
const unreadCount = 2; // Exemplo: número de mensagens não lidas

const UserSchedulePanel: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);

  const handleSendMessage = (content: string) => {
    // Aqui você faz a chamada para o backend
    console.log("Mensagem enviada:", content, selectedSchedule);
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        {userSchedules.map((schedule) => (
          <div key={schedule.id} className="border rounded p-4 bg-white dark:bg-gray-800 shadow">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Data: {schedule.date}</div>
            <div className="text-gray-800 dark:text-gray-200">Tarefa: {schedule.task}</div>
            <div className="text-gray-800 dark:text-gray-200">Horário: {schedule.time}</div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Com você na escala:</div>
            <ul className="list-disc ml-6 text-sm text-gray-700 dark:text-gray-300">
              {schedule.users.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <button
              className="mt-3 px-3 py-1 bg-blue-600 text-white rounded"
              onClick={() => {
                setSelectedSchedule(schedule.id);
                setModalOpen(true);
              }}
            >
              Enviar/Receber Mensagem
            </button>
          </div>
        ))}
      </div>
      <MessageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSend={handleSendMessage}
        canSendFile={false}
      />
    </div>
  );
};

export default UserSchedulePanel;
