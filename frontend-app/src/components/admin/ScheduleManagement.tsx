import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Schedule, User, Task, Skill } from '../../common/types';
import { useAuth } from '../../context/AuthContext';
import { MoreVertical, Edit, Trash2, ClipboardList, UserPlus } from 'lucide-react';
import AssignTaskModal from './AssignTaskModal';
import AssignUserModal from './AssignUserModal';


const ScheduleManagement = () => {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [scheduleToAssign, setScheduleToAssign] = useState<Schedule | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchSchedules();
    fetchUsers();
    fetchTasks();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await apiFetch('/schedules', { token });
      setSchedules(response);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiFetch('/users/All', { token });
      setUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await apiFetch('/tasks/All', { token });
      setTasks(response.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      setCurrentSchedule(schedule);
      setForm({
        title: schedule.title,
        startDate: schedule.startDate.split('T')[0],
        endDate: schedule.endDate.split('T')[0],
        startTime: schedule.startTime.substring(11, 16),
        endTime: schedule.endTime.substring(11, 16),
      });
    } else {
      setCurrentSchedule(null);
      setForm({
        title: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSchedule(null);
    setForm({
      title: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
    });
  };

  const openAssignTaskModal = (schedule: Schedule) => {
    setScheduleToAssign(schedule);
    setIsAssignTaskModalOpen(true);
  };

  const closeAssignTaskModal = () => {
    setScheduleToAssign(null);
    setIsAssignTaskModalOpen(false);
  };

  const openAssignUserModal = (schedule: Schedule) => {
    setScheduleToAssign(schedule);
    setIsAssignUserModalOpen(true);
  };

  const closeAssignUserModal = () => {
    setScheduleToAssign(null);
    setIsAssignUserModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        startDate: new Date(`${form.startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${form.endDate}T00:00:00`).toISOString(),
        startTime: new Date(`1970-01-01T${form.startTime}:00`).toISOString(),
        endTime: new Date(`1970-01-01T${form.endTime}:00`).toISOString(),
      };

      if (currentSchedule) {
        await apiFetch(`/schedules/${currentSchedule.id}`, { method: 'PATCH', body: JSON.stringify(payload), token });
      } else {
        await apiFetch('/schedules', { method: 'POST', body: JSON.stringify(payload), token });
      }
      fetchSchedules();
      closeModal();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/schedules/${id}`, { method: 'DELETE', token });
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleAssignTasks = async (scheduleId: number, taskIds: number[]) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const currentTaskIds = schedule.scheduleTasks.map(st => st.taskId);
    const tasksToAdd = taskIds.filter(id => !currentTaskIds.includes(id));
    const tasksToRemove = currentTaskIds.filter(id => !taskIds.includes(id));

    try {
      for (const taskId of tasksToAdd) {
        await apiFetch(`/schedules/${scheduleId}/tasks/${taskId}`, { method: 'POST', token });
      }
      for (const taskId of tasksToRemove) {
        await apiFetch(`/schedules/${scheduleId}/tasks/${taskId}`, { method: 'DELETE', token });
      }
      fetchSchedules();
    } catch (error) {
      console.error('Error assigning tasks:', error);
    }
  };

  const handleAssignUser = async (scheduleId: number, userId: number, skillId: number) => {
    try {
      await apiFetch(`/schedules/${scheduleId}/users/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ skillId }),
        token,
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error assigning user:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Gerenciamento de Escalas</h2>
      <button
        onClick={() => openModal()}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Criar Nova Escala
      </button>

      {/* Schedule List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
        <h3 className="text-xl font-semibold mb-2 dark:text-white">Escalas Existentes</h3>
        {schedules.length === 0 ? (
          <p className="dark:text-gray-300">Nenhuma escala encontrada.</p>
        ) : (
          <ul>
            {schedules.map((schedule) => (
              <li key={schedule.id} className="mb-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="dark:text-gray-300">
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{schedule.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">De: {new Date(schedule.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} {schedule.startTime.substring(11, 16)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Até: {new Date(schedule.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} {schedule.endTime.substring(11, 16)}</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Ensaio as quintas feiras as 20:00h podendo ser alterado o dia e horario com antecedência. Executem as músicas com excelência. As terças-feiras as 19:30h Culto Sobrenatural.</p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === schedule.id ? null : schedule.id)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === schedule.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => { openModal(schedule); setOpenMenuId(null); }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit size={16} className="mr-2 text-yellow-500" />
                          Editar
                        </button>
                        <button
                          onClick={() => { handleDelete(schedule.id); setOpenMenuId(null); }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 size={16} className="mr-2 text-red-500" />
                          Deletar
                        </button>
                        <button
                          onClick={() => { openAssignTaskModal(schedule); setOpenMenuId(null); }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <ClipboardList size={16} className="mr-2 text-blue-500" />
                          Atribuir Tarefa
                        </button>
                        <button
                          onClick={() => { openAssignUserModal(schedule); setOpenMenuId(null); }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <UserPlus size={16} className="mr-2 text-green-500" />
                          Atribuir Usuário
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-md shadow-md w-1/2">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">{currentSchedule ? 'Editar Escala' : 'Criar Nova Escala'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 dark:text-gray-200">Título</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="startDate" className="block text-gray-700 dark:text-gray-200">Data Inicial</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="endDate" className="block text-gray-700 dark:text-gray-200">Data Final</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="startTime" className="block text-gray-700 dark:text-gray-200">Hora Inicial (Domingo manhã)</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="endTime" className="block text-gray-700 dark:text-gray-200">Hora Final (Domingo noite)</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="mr-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AssignTaskModal
        isOpen={isAssignTaskModalOpen}
        onClose={closeAssignTaskModal}
        schedule={scheduleToAssign}
        tasks={tasks}
        onSave={handleAssignTasks}
      />

      <AssignUserModal
        isOpen={isAssignUserModalOpen}
        onClose={closeAssignUserModal}
        schedule={scheduleToAssign}
        users={users}
        onSave={handleAssignUser}
      />
    </div>
  );
};

export default ScheduleManagement;
