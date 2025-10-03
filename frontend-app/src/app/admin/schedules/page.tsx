'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addUserToSchedule,
  removeUserFromSchedule,
  Schedule,
} from '../../../services/scheduleService';
import { getUsers, User } from '../../../services/userService';
import { getTasks, assignTaskToSchedule, unassignTaskFromSchedule, Task } from '../../../services/taskService';
import Modal from '../../../components/Modal';
import ScheduleForm from '../../../components/ScheduleForm';
import ScheduleUserManagement from '../../../components/ScheduleUserManagement';
import ScheduleTaskManagement from '../../../components/ScheduleTaskManagement';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { AxiosError } from 'axios';
import PrivateRoute from '@/components/PrivateRoute';
import { downloadScheduleFile } from '../../../services/scheduleFileService';
import { FaPlus, FaArrowLeft, FaTasks, FaUsers, FaDownload, FaEdit, FaTrash } from 'react-icons/fa';

export default function ScheduleManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedSchedules, fetchedUsers, fetchedTasksResponse] = await Promise.all([
        getSchedules(),
        getUsers(),
        getTasks({}),
      ]);
      setSchedules(fetchedSchedules);
      setAllUsers(fetchedUsers);
      setAllTasks(fetchedTasksResponse.data);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar dados. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchAllData();
    }
  }, [fetchAllData, isAuthenticated, user]);

  const handleFileUpload = async (file: File, scheduleId: number) => {
    console.log('File upload handler called', file, scheduleId);
    // Placeholder for file upload logic
  };

  const handleDownloadClick = async (fileId: number) => {
    try {
      const response = await downloadScheduleFile(fileId);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download.dat';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Download do arquivo iniciado com sucesso!');
    } catch (error) {
      setError('Falha ao baixar o arquivo.');
    }
  };

  // Modal Handlers
  const handleOpenFormModal = (schedule: Schedule | null = null) => {
    setSelectedSchedule(schedule);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => setIsFormModalOpen(false);

  const handleOpenUserModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsUserModalOpen(true);
  };
  const handleCloseUserModal = () => setIsUserModalOpen(false);

  const handleOpenTaskModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsTaskModalOpen(true);
  };
  const handleCloseTaskModal = () => setIsTaskModalOpen(false);

  // CRUD Handlers
  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedSchedule && isFormModalOpen) {
        console.log('[UPDATE ESCALA] Payload:', data);
        const response = await updateSchedule(selectedSchedule.id, data);
        console.log('[UPDATE ESCALA] Response:', response);
        setSuccessMessage('Escala atualizada com sucesso!');
      } else {
      console.log('[CRIAR ESCALA] Payload:', data);
      // console.log('[CRIAR ESCALA] Authorization:', api.defaults.headers['Authorization']);
      try {
        const response = await scheduleService.create(data);
        console.log('[CRIAR ESCALA] Response:', response);
          setSuccessMessage('Escala criada com sucesso!');
        } catch (error: any) {
          if (error.response) {
            console.error('[CRIAR ESCALA] Response Error:', error.response.status, error.response.data);
          } else {
            console.error('[CRIAR ESCALA] Error:', error);
          }
          throw error;
        }
      }
      await fetchAllData();
      handleCloseFormModal();
    } catch (error: any) {
      console.error('[ESCALA ERROR]', error);
      setError('Falha ao salvar a escala.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Você tem certeza?')) {
      try {
        await deleteSchedule(id);
        setSuccessMessage('Escala deletada com sucesso!');
        await fetchAllData();
      } catch (error) {
        setError('Falha ao deletar a escala.');
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleAddUser = async (userId: number, skill: string) => {
    if (!selectedSchedule) return;
    try {
      await addUserToSchedule(selectedSchedule.id, userId, skill);
      setSuccessMessage('Usuário adicionado com sucesso!');
      setError(null);
      // Optimistically update the selected schedule's users array
      const userToAdd = allUsers.find(u => u.id === userId);
      if (userToAdd) {
        setSelectedSchedule(prev => {
          if (!prev) return null;
          return {
            ...prev,
            users: [...prev.users, { userId: userToAdd.id, user: userToAdd, scheduleId: prev.id, assignedAt: new Date().toISOString(), skill }]
          };
        });
      }
      await fetchAllData(); // Refresh all data in the background
    } catch (error) {
      const axiosError = error as AxiosError;
  const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as any).message : undefined;
  setError(typeof errorMessage === 'string' ? errorMessage : 'Falha ao adicionar usuário.');
      setSuccessMessage(null);
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!selectedSchedule) return;
    try {
      await removeUserFromSchedule(selectedSchedule.id, userId);
      setSuccessMessage('Usuário removido com sucesso!');
      setError(null);
      // Optimistically update the selected schedule's users array
      setSelectedSchedule(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.filter(u => u.userId !== userId)
        };
      });
      await fetchAllData(); // Refresh all data in the background
    } catch (error) {
      const axiosError = error as AxiosError;
  const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as any).message : undefined;
  setError(typeof errorMessage === 'string' ? errorMessage : 'Falha ao remover usuário.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleAssignTask = async (taskId: number) => {
    if (!selectedSchedule) return;
    try {
      await assignTaskToSchedule(taskId, selectedSchedule.id);
      setSuccessMessage('Tarefa atribuída com sucesso!');
      await fetchAllData();
    } catch (error) {
      const axiosError = error as AxiosError;
  const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as any).message : undefined;
  setError(typeof errorMessage === 'string' ? errorMessage : 'Falha ao atribuir tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleUnassignTask = async (taskId: number) => {
    if (!selectedSchedule) return;
    try {
      await unassignTaskFromSchedule(taskId);
      setSuccessMessage('Tarefa desatribuída com sucesso!');
      await fetchAllData();
    } catch (error) {
      const axiosError = error as AxiosError;
  const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as any).message : undefined;
  setError(typeof errorMessage === 'string' ? errorMessage : 'Falha ao desatribuir tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <p>Redirecionando para a página de login...</p>;
  }

  return (
    <PrivateRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Gerenciamento de Escalas</h1>
          <div className="flex space-x-4"> {/* Group buttons */}
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Voltar
            </button>
            <button onClick={() => handleOpenFormModal()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center">
              <FaPlus className="mr-2" /> Criar Escala
            </button>
          </div>
        </div>

        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{schedule.name}</h2>
                  <p className="text-gray-700 mt-2 h-12 overflow-hidden">{schedule.description}</p>
                  <div className="mt-4 space-y-1 text-gray-800">
                    <p><strong>Data Inicial:</strong> {formatDate(schedule.startTime)}</p>
                    <p><strong>Data Final:</strong> {formatDate(schedule.endTime)}</p>
                    <p><strong>Usuários:</strong> {(Array.isArray(schedule.users) ? schedule.users.length : 0)}</p>
                    <p><strong>Tarefas:</strong> {allTasks.filter(t => t.scheduleId === schedule.id).length}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end flex-wrap gap-2">
                  <button onClick={() => handleOpenTaskModal(schedule)} className="text-sm text-white bg-emerald-700 hover:bg-emerald-500 border rounded-3xl p-1 flex items-center" title="Gerenciar tarefas">
                    <FaTasks />
                  </button>
                  <button onClick={() => handleOpenUserModal(schedule)} className="text-sm text-white bg-blue-700 hover:bg-blue-500 border rounded-3xl p-1 flex items-center" title="Gerenciar usuários">
                    <FaUsers />
                  </button>
                  {schedule.file && (
                    <button
                      onClick={() => handleDownloadClick(schedule.id)}
                      className="text-sm text-white bg-blue-500 hover:bg-blue-700 border rounded-3xl p-1 flex items-center" title="Baixar Anexo"
                    >
                      <FaDownload />
                    </button>
                  )}
                  <button onClick={() => handleOpenFormModal(schedule)} className="text-sm text-white bg-indigo-600 hover:bg-indigo-900 border rounded-3xl p-1 flex items-center" title="Editar">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} className="text-sm text-white bg-red-600 hover:bg-red-900 border rounded-3xl p-1 flex items-center" title="Deletar">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isFormModalOpen && (
          <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={selectedSchedule && isFormModalOpen ? 'Editar escala' : 'Criar escala'}>
            <ScheduleForm
              scheduleToEdit={selectedSchedule}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseFormModal}
              successMessage={successMessage || undefined}
              onFileUpload={(file) => handleFileUpload(file, selectedSchedule?.id ?? 0)}
            />
          </Modal>
        )}

        {isUserModalOpen && selectedSchedule && (
          <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={`Gerenciar usuários para ${selectedSchedule.name}`}>
            <ScheduleUserManagement schedule={selectedSchedule} allUsers={allUsers} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} />
          </Modal>
        )}

        {isTaskModalOpen && selectedSchedule && (
          <Modal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} title={`Gerenciar tarefas para ${selectedSchedule.name}`}>
            <ScheduleTaskManagement schedule={selectedSchedule} allTasks={allTasks} onAssignTask={handleAssignTask} onUnassignTask={handleUnassignTask} onFileUpload={(file) => handleFileUpload(file, selectedSchedule?.id ?? 0)} />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
}