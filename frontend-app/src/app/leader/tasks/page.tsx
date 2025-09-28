'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  approveTask,
  rejectTask,
  Task,
  TaskStatus,
} from '../../../services/taskService';
import Modal from '../../../components/Modal';
import TaskForm from '../../../components/TaskForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import PrivateRoute from '@/components/PrivateRoute';

export default function TaskManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'LEADER')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedTasks = await getTasks({});
      setTasks(fetchedTasks.data);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar tarefas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'LEADER')) {
      fetchTasks();
    }
  }, [fetchTasks, isAuthenticated, user]);

  const handleOpenModal = (task: Task | null = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (data: { name: string; description: string }) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
        setSuccessMessage('Tarefa atualizada com sucesso!');
      } else {
        await createTask(data);
        setSuccessMessage('Tarefa criada com sucesso!');
      }
      await fetchTasks();
      handleCloseModal();
    } catch (error) {
      console.error('Falha ao salvar tarefa: ', error);
      setError('Não foi possível salvar os detalhes da tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Você tem certeza de que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(id);
        setSuccessMessage('Tarefa excluída com sucesso!');
        await fetchTasks();
      } catch (error) {
        console.error('Falha ao deletar a tarefa: ', error);
        setError('Não foi possível deletar a tarefa.');
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveTask(id);
      setSuccessMessage('Tarefa aprovada com sucesso!');
      await fetchTasks();
    } catch (error) {
      console.error('Falha ao aprovar a tarefa: ', error);
      setError('Não foi possível aprovar a tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectTask(id);
      setSuccessMessage('Tarefa rejeitada com sucesso!');
      await fetchTasks();
    } catch (error) {
      console.error('Falha ao rejeitar a tarefa: ', error);
      setError('Não foi possível rejeitar a tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const getStatusClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.APPROVED:
        return 'bg-green-200 text-green-900';
      case TaskStatus.REJECTED:
        return 'bg-red-200 text-red-900';
      case TaskStatus.PENDING:
      default:
        return 'bg-yellow-200 text-yellow-900';
    }
  };
  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'LEADER')) {
    return <p>Redirecionando para a página de login...</p>;
  }

  return (
    <PrivateRoute>
      <div className="p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-200">Gerenciamento de Tarefas</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 md:py-2 md:px-4 rounded"
            >
              Voltar
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 md:py-2 md:px-4 rounded"
            >
              Criar Tarefa
            </button>
          </div>
        </div>

        {loading && <p>Carregando tarefas...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        {!loading && !error && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-50 uppercase tracking-wider">Tarefa</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-50 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-50 uppercase tracking-wider">Atribuído a</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-50 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap font-semibold">{task.name}</p>
                        <p className="text-gray-600 whitespace-no-wrap">{task.description}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${getStatusClass(task.status)}`}>
                          <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                          <span className="relative">{task.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">{task.user?.name || 'Não atribuído'}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        {user?.role === 'ADMIN' && (
                          <>
                            <button onClick={() => handleOpenModal(task)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                            <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-900 ml-4">Deletar</button>
                            {task.status === TaskStatus.PENDING && (
                              <>
                                <button onClick={() => handleApprove(task.id)} className="text-green-600 hover:text-green-900 ml-4">Aprovar</button>
                                <button onClick={() => handleReject(task.id)} className="text-red-600 hover:text-red-900 ml-4">Rejeitar</button>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Editar tarefa' : 'Criar tarefa'}>
            <TaskForm
              taskToEdit={editingTask}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              successMessage={successMessage}
            />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
}