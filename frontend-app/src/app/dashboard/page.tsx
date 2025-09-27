'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getMySchedules, downloadScheduleFile, Schedule } from '../../services/scheduleService';
import { getUsers, User } from '../../services/userService';
import PrivateRoute from '@/components/PrivateRoute';
import ScheduleFileManagement from '@/components/ScheduleFileManagement';

enum Role {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  USER = 'USER',
}

const groupSchedulesByDate = (schedules: Schedule[]) => {
  const grouped: { [date: string]: Schedule[] } = {};
  schedules.forEach(schedule => {
    const date = new Date(schedule.startTime).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(schedule);
  });
  return grouped;
};

export default function DashboardPage() {
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (user) {
      try {
        setLoading(true);
        const mySchedules = await getMySchedules();
        setSchedules(mySchedules);
        setFilteredSchedules(mySchedules);
        console.log("Fetched schedules:", mySchedules);
      } catch (error) {
        console.error("Falha ao buscar escalas", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      if (user.role !== Role.USER) {
        const targetDashboard = user.role === Role.ADMIN ? '/admin/dashboard' : '/leader/dashboard';
        router.replace(targetDashboard);
        return;
      }

      fetchData();
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    const filtered = schedules.filter(schedule =>
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSchedules(filtered);
  }, [searchTerm, schedules]);

  const handleDownload = async (scheduleId: number) => {
    try {
      await downloadScheduleFile(scheduleId);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erro ao baixar o arquivo. Tente novamente.');
    }
  };

  const handleRefresh = () => {
    fetchData();
  }

  if (!user || user.role !== Role.USER) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando ou redirecionando...</p>
      </div>
    );
  }

  const groupedSchedules = groupSchedulesByDate(filteredSchedules);

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 bg-gradient-to-br from-white to-pink-100">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Painel do Usuário</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard/messages" className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded text-center">
                Mensagens
            </Link>
            <button
              onClick={handleRefresh}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Atualizar
            </button>
            <button
              onClick={signOut}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Sair
            </button>
          </div>
        </div>
        <p className="mt-2 text-gray-700">Bem-vindo, {user.name}!</p>
        <p className="mt-2 text-gray-700">Você está logado como: {user.role}</p>

        <div className="mt-8">
          <input
            type="text"
            placeholder="Buscar escalas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {loading ? (
          <p className="mt-8">Carregando suas escalas...</p>
        ) : (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Suas Escalas</h2>
            <div className="space-y-8">
              {Object.keys(groupedSchedules).length > 0 ? (
                Object.keys(groupedSchedules).map(date => (
                  <div key={date}>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b-2 pb-2">{date}</h3>
                    <div className="space-y-4">
                      {groupedSchedules[date].map(schedule => (
                        <div key={schedule.id} className="p-6 rounded-lg shadow-lg shadow-inner bg-gradient-to-br from-white to-emerald-100">
                          <div className="flex justify-between items-start flex-wrap">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900">{schedule.name}</h3>
                              <p className="text-gray-700 mt-2">{schedule.description}</p>
                              <p className="text-sm text-gray-600 mt-4">
                                {new Date(schedule.startTime).toLocaleTimeString()} - {new Date(schedule.endTime).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 md:mt-0">
                              <button
                                onClick={() => handleDownload(schedule.id)}
                                className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                              >
                                Baixar Escala
                              </button>
                              
                            </div>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-900">Usuários nesta escala:</h4>
                            <ul className="list-disc list-inside">
                              {schedule.users.map(userOnSchedule => (
                                <li key={userOnSchedule.userId} className="text-gray-800">{userOnSchedule.user.name}</li>
                              ))}
                            </ul>
                          </div>
                          {schedule.tasks && schedule.tasks.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900">Tarefas nesta escala:</h4>
                              <ul className="list-disc list-inside">
                                {schedule.tasks.map(task => (
                                  <li key={task.id} className="text-gray-800">
                                    <strong>{task.name}:</strong> {task.description} - <span className={`font-semibold ${task.status === 'PENDENTE' ? 'text-yellow-600' : task.status === 'APROVADO' ? 'text-green-600' : 'text-red-600'}`}>{task.status}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <ScheduleFileManagement scheduleId={schedule.id} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-800">Nenhuma escala encontrada.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
