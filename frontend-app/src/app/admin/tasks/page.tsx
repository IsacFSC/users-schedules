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
import { getUsers, User } from '../../../services/userService';
import Modal from '../../../components/Modal';
import TaskForm from '../../../components/TaskForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import PrivateRoute from '@/components/PrivateRoute';

const ITEMS_PER_PAGE = 10;

// Helper function to find and create links
const linkify = (text: string) => {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function TaskManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [usersForFilter, setUsersForFilter] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    userId: '',
    status: '',
    startDate: '',
    endDate: '',
    name: '',
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      const activeFilters: { [key: string]: any } = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          activeFilters[key] = value;
        }
      });

      const response = await getTasks({
        limit: ITEMS_PER_PAGE,
        offset,
        ...activeFilters,
      });
      setTasks(response.data);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
      setError(null);
    } catch (err) {
      setError('Falha ao buscar tarefas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const fetchUsersForFilter = useCallback(async () => {
    if (user?.role === 'ADMIN') {
      try {
        const fetchedUsers = await getUsers();
        setUsersForFilter(fetchedUsers);
      } catch (err) {
        console.error('Failed to fetch users for filter:', err);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'LEADER')) {
      fetchTasks();
      fetchUsersForFilter();
    }
  }, [fetchTasks, fetchUsersForFilter, isAuthenticated, user]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchTasks();
  };

  const handleClearFilters = () => {
    setFilters({ userId: '', status: '', startDate: '', endDate: '', name: '' });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Gerenciamento de Tarefas</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Voltar
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Criar Tarefa
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">Nome da Tarefa</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Buscar por nome..."
                value={filters.name}
                onChange={handleFilterChange}
                className="p-2 border rounded w-full mt-1"
              />
            </div>
            {user?.role === 'ADMIN' && (
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-white">Usuário</label>
                <select id="userId" name="userId" value={filters.userId} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1">
                  <option value="">Todos</option>
                  {usersForFilter.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-white">Status</label>
              <select id="status" name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1">
                <option value="">Todos</option>
                {Object.values(TaskStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-white">Criação (Início)</label>
              <input id="startDate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-white">Criação (Fim)</label>
              <input id="endDate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1" />
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button onClick={handleApplyFilters} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">Aplicar Filtros</button>
            <button onClick={handleClearFilters} className="bg-gray-200 hover:bg-gray-400 px-4 py-2 rounded text-gray-700 hover:text-gray-600">Limpar Filtros</button>
          </div>
        </div>

        {loading && <p>Carregando tarefas...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        {!loading && !error && (
          <>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-050 uppercase tracking-wider">Tarefa</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-050 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-050 uppercase tracking-wider">Atribuído a</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-600 text-left text-xs font-semibold text-gray-050 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap font-semibold">{task.name}</p>
                        <p className="text-gray-600 whitespace-no-wrap">{linkify(task.description)}</p>
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
                        <button onClick={() => handleOpenModal(task)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                        <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-900 ml-4">Deletar</button>
                        {task.status === TaskStatus.PENDING && (
                          <>
                            <button onClick={() => handleApprove(task.id)} className="text-green-600 hover:text-green-900 ml-4">Aprovar</button>
                            <button onClick={() => handleReject(task.id)} className="text-red-600 hover:text-red-900 ml-4">Rejeitar</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="py-4 flex justify-between items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-400 rounded disabled:opacity-50"
              >
                <p className='text-white'>Anterior</p>
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                <p className='text-black'>Próximo</p>
              </button>
            </div>
          </>
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
