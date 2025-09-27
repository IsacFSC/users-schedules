"use client";



import { Calendar, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import UserSchedulePanel from "./UserSchedulePanel";
import UserAvatarDropdown from "../../components/UserAvatarDropdown";
import MessageIconWithCounter from "../../components/messages/MessageIconWithCounter";
import { useAuth } from "../../context/AuthContext";
import withAuth from "../../lib/withAuth";
import { Role } from "../../common/types";

const UserDashboardPage = () => {
  const [activeSection, setActiveSection] = useState<'schedules' | 'messages'>('schedules');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { token } = useAuth();
  let userName = "Usuário";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userName = payload.name || payload.email;
    } catch {}
  }
  const unreadCount = 2; // Exemplo: número de mensagens não lidas
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className={`bg-white p-4 shadow-md dark:bg-gray-800 transition-all duration-300 flex flex-col items-center ${isSidebarOpen ? 'w-48' : 'w-24'}`}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mb-4 w-full flex justify-center">
          {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        {isSidebarOpen && (
          <div className="mb-6 text-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bem-vindo, {userName}!</span>
          </div>
        )}
        <nav className="w-full">
          <ul>
            <li className="mb-2">
              <button
                onClick={() => setActiveSection('schedules')}
                className={`w-full flex items-center px-4 py-2 rounded-md ${activeSection === 'schedules' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
              >
                <Calendar className="mr-2" />
                {isSidebarOpen && 'Escalas'}
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setActiveSection('messages')}
                className={`w-full flex items-center px-4 py-2 rounded-md ${activeSection === 'messages' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
              >
                <MessageCircle className="mr-2" />
                {isSidebarOpen && 'Mensagens'}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Top bar com avatar e ícone de mensagem */}
      <div className="absolute top-6 mb-4 right-18 flex items-center">
        <MessageIconWithCounter count={unreadCount} onClick={() => setModalOpen(true)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 mt-8">
        {activeSection === 'schedules' && <UserSchedulePanel />}
        {activeSection === 'messages' && (
          <div className="flex items-center justify-center h-full">
            <h2 className="text-2xl font-bold">Mensagens</h2>
            {/* Aqui pode ser integrado o painel de mensagens do usuário */}
          </div>
        )}
      </main>
      {/* Modal de mensagem global */}
      {/* <MessageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSend={...} canSendFile={false} /> */}
    </div>
  );
};

export default withAuth(UserDashboardPage, { allowedRoles: [Role.USER] });
