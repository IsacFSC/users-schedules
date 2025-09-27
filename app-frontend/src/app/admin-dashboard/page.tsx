'use client';

import React, { useState } from 'react';
import withAuth from '../../lib/withAuth';
import { Role } from '../../common/types';
import UserManagement from '../../components/admin/UserManagement';
import TaskManagement from '../../components/admin/TaskManagement';
import ScheduleManagement from '../../components/admin/ScheduleManagement';
import { useAuth } from '../../context/AuthContext';
import { Users, ClipboardList, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

type AdminSection = 'users' | 'tasks' | 'schedules';

const AdminDashboardPage = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'tasks':
        return <TaskManagement />;
      case 'schedules':
        return <ScheduleManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside
        className={`bg-white p-4 shadow-md dark:bg-gray-800 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-48 opacity-100' : 'w-24 opacity-80'} flex flex-col`}
        style={{ transitionProperty: 'width, opacity' }}
      >
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mb-4 w-full flex justify-center transition-transform duration-300">
          {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        <div className={`transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-gray-300">
            Olá, {user?.name || 'Admin'}
          </h2>
        </div>
        <nav>
          <ul>
            <li className="mb-2">
              <button
                onClick={() => setActiveSection('users')}
                className={`w-full flex items-center px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'users' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
              >
                <Users className="mr-2" />
                {isSidebarOpen && 'Usuários'}
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setActiveSection('tasks')}
                className={`w-full flex items-center px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'tasks' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
              >
                <ClipboardList className="mr-2" />
                {isSidebarOpen && 'Tarefas'}
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setActiveSection('schedules')}
                className={`w-full flex items-center px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'schedules' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
              >
                <Calendar className="mr-2" />
                {isSidebarOpen && 'Escalas'}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content com fade/slide */}
      <main className="flex-1 p-6 relative">
        <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white">Painel do Administrador</h1>
        <div className="transition-all duration-500 ease-in-out">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default withAuth(AdminDashboardPage, { allowedRoles: [Role.ADMIN] });