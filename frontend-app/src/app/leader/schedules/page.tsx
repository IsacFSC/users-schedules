'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getMySchedules,
  updateSchedule,
  uploadScheduleFile,
  downloadAttachedFile,
  Schedule,
} from '../../../services/scheduleService';
import Modal from '../../../components/Modal';
import ScheduleForm from '../../../components/ScheduleForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { AxiosError } from 'axios';
import PrivateRoute from '@/components/PrivateRoute';
import { FaArrowLeft, FaFileUpload } from 'react-icons/fa';

export default function LeaderScheduleManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'LEADER') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const fetchMySchedules = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedSchedules = await getMySchedules();
      setSchedules(fetchedSchedules);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar suas escalas. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'LEADER') {
      fetchMySchedules();
    }
  }, [fetchMySchedules, isAuthenticated, user]);

  // Modal Handlers
  const handleOpenFormModal = (schedule: Schedule | null = null) => {
    setSelectedSchedule(schedule);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => setIsFormModalOpen(false);

  // CRUD Handlers (only update for leader)
  const handleFormSubmit = async (data: any) => {
    if (!selectedSchedule) return; // Should not happen for leader, as they only edit existing schedules
    try {
      await updateSchedule(selectedSchedule.id, data);
      setSuccessMessage('Escala atualizada com sucesso!');
      await fetchMySchedules();
      handleCloseFormModal();
    } catch (error) {
      setError('Falha ao salvar a escala.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedSchedule) return;
    try {
      setLoading(true);
      const updatedSchedule = await uploadScheduleFile(selectedSchedule.id, file);
      setSchedules(schedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s));
      setSuccessMessage('Arquivo enviado com sucesso!');
      handleCloseFormModal();
    } catch (error) {
      const axiosError = error as AxiosError;
      setError(typeof axiosError.response?.data?.message === 'string' ? axiosError.response.data.message : 'Falha ao enviar arquivo.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated || user?.role !== 'LEADER') {
    return <p>Redirecionando para a página de login...</p>;
  }

  return (
    <PrivateRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Gerenciamento de Suas Escalas</h1>
          <div className="flex space-x-4"> {/* Group buttons */}
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Voltar
            </button>
          </div>
        </div>

        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{schedule.name}</h2>
                  <p className="text-gray-700 mt-2 h-12 overflow-hidden">{schedule.description}</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-gray-600"><strong>Data Inicial:</strong> {formatDate(schedule.startTime)}</p>
                    <p className="text-gray-600"><strong>Data Final:</strong> {formatDate(schedule.endTime)}</p>
                    <p className="text-gray-600"><strong>Usuários:</strong> {schedule.users.length}</p>
                    <p className="text-gray-600"><strong>Tarefas:</strong> {schedule.tasks.length}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end flex-wrap gap-2">
                  <button onClick={() => handleOpenFormModal(schedule)} className="text-sm text-white bg-indigo-600 hover:bg-indigo-900 rounded-3xl p-1.5 flex items-center">
                    <FaFileUpload className="mr-2" /> Anexar / Editar Arquivo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isFormModalOpen && (
          <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={'Anexar Arquivo'}>
            <ScheduleForm
              scheduleToEdit={selectedSchedule}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseFormModal}
              successMessage={successMessage}
              onFileUpload={handleFileUpload}
              isLeader={user?.role === 'LEADER'}
            />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
}
