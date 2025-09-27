'use client';

import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import PrivateRoute from '@/components/PrivateRoute';

export default function LeaderDashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Painel do Líder</h1>
          <button
            onClick={signOut}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sair
          </button>
        </div>
        <p className="mt-2 text-gray-700">Olá, {user?.name}!</p>
        <p className="mt-2 text-gray-700">Você está logado como: {user?.role}</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/leader/schedules" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Suas Escalas</h2>
            <p className="mt-2 text-gray-700">Visualize e gerencie suas escalas, incluindo o upload de arquivos.</p>
          </Link>
          <Link href="/leader/tasks" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Tarefas</h2>
            <p className="mt-2 text-gray-700">Criar, atualizar e atribuir tarefas.</p>
          </Link>
          <Link href="/leader/messaging" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900">Mensagens</h2>
            <p className="mt-2 text-gray-700">Enviar e receber mensagens.</p>
          </Link>
        </div>
      </div>
    </PrivateRoute>
  );
}