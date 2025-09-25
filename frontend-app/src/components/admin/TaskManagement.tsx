import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus } from '../../common/types';
import toast from 'react-hot-toast';

// Modal for creating a new task
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: () => void;
  token: string | null;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreateSuccess, token }) => {
  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      await apiFetch('/tasks', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, description }),
      });
      toast.success('Tarefa criada com sucesso!');
      onCreateSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Erro ao criar tarefa: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h3 className="text-xl font-semibold mb-4">Criar Nova Tarefa</h3>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nome da Tarefa</label>
            <input type="text" id="name" name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Descrição</label>
            <textarea id="description" name="description" required rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Criar Tarefa</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const TaskManagement = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  const [totalTasks, setTotalTasks] = useState(0);

  const renderDescription = (description: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = description.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>;
      }
      return part;
    });
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.APROVADO:
        return 'text-green-500';
      case TaskStatus.NAO_APROVADO:
        return 'text-red-500';
      case TaskStatus.PENDING:
        return 'text-yellow-500';
      default:
        return '';
    }
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const queryParams = new URLSearchParams();
      queryParams.append('limit', itemsPerPage.toString());
      queryParams.append('offset', offset.toString());
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const data = await apiFetch<{ tasks: Task[]; total: number }>(`/tasks/All?${queryParams.toString()}`, { token });
      setTasks(data.tasks);
      setTotalTasks(data.total);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro ao buscar tarefas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTasks();
    }, 500); // Debounce search input

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, fetchTasks]);

  const handleCreateSuccess = () => {
    fetchTasks(); // Re-fetch tasks after successful creation
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTask) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as TaskStatus;

    try {
      await apiFetch(`/tasks/${currentTask.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ name, description, status }),
      });
      toast.success('Tarefa atualizada com sucesso!');
      fetchTasks();
      setIsEditModalOpen(false);
      setCurrentTask(null);
    } catch (err: any) {
      toast.error(`Erro ao atualizar tarefa: ${err.message}`);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Tem certeza que deseja deletar esta tarefa?')) return;
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'DELETE',
        token,
      });
      toast.success('Tarefa deletada com sucesso!');
      fetchTasks();
    } catch (err: any) {
      toast.error(`Erro ao deletar tarefa: ${err.message}`);
    }
  };

  const totalPages = Math.ceil(totalTasks / itemsPerPage);

  if (loading) return <p>Carregando tarefas...</p>;
  if (error) return <p className="text-red-500">Erro: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Gerenciamento de Tarefas</h2>

      {/* Search and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Buscar tarefas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/3 p-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Criar Nova Tarefa
        </button>
      </div>

      {/* Task List */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Criado Em</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{task.id}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{task.name}</td>
                <td className="px-4 py-2 whitespace-pre-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{renderDescription(task.description)}</td>
                <td className={`px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 ${getStatusColor(task.status)}`}>{task.status}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{new Date(task.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 font-medium">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-600 mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600"
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Anterior
        </button>
        <span className="text-gray-700 dark:text-gray-200">Página {currentPage} de {totalPages}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Próximo
        </button>
      </div>


      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSuccess={handleCreateSuccess}
        token={token}
      />

      {/* Edit Task Modal */}
      {isEditModalOpen && currentTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4">Editar Tarefa</h3>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nome da Tarefa</label>
                <input type="text" id="edit-name" name="name" defaultValue={currentTask.name} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Descrição</label>
                <textarea id="edit-description" name="description" defaultValue={currentTask.description} required rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
              </div>
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
                <select id="edit-status" name="status" defaultValue={currentTask.status} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {Object.values(TaskStatus).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
