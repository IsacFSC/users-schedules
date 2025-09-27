'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  User,
} from '../../../services/userService';
import Modal from '../../../components/Modal';
import UserForm from '../../../components/UserForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import PrivateRoute from '@/components/PrivateRoute';

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    } else if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return '';
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar usuários. Por favor, tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [fetchUsers, isAuthenticated, user]);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data);
        setSuccessMessage('Usuário atualizado com sucesso!');
      } else {
        await createUser(data);
        setSuccessMessage('Usuário criado com sucesso!');
      }
      await fetchUsers(); // Refresh list
      handleCloseModal();
    } catch (error) {
      console.error('Falha ao salvar o usuário: ', error);
      setError('Não foi possível salvar os detalhes do usuário.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Você tem certeza de que deseja excluir este usuário?')) {
      try {
        await deleteUser(id);
        setSuccessMessage('Usuário excluído com sucesso!');
        await fetchUsers(); // Refresh list
      } catch (error) {
        console.error('Falha ao deletar o usuário:', error);
        setError('Não foi possível deletar o usuário.');
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleToggleActiveStatus = async (id: number, currentStatus: boolean) => {
    try {
      await updateUserStatus(id, currentStatus);
      setSuccessMessage('Status do usuário atualizado com sucesso!');
      await fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Falha ao atualizar status do usuário:', error);
      setError('Não foi possível atualizar o status do usuário.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-200">Gestão de Usuários</h1>
          <div className="flex space-x-4"> {/* Group buttons */}
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
              Criar Usuário
            </button>
          </div>
        </div>

        {loading && <p>Carregando usuários...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-gray-700 shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-600 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-600 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-600 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-600 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white font-bold text-lg">
                          {user.avatar ? (
                            <img
                              className="w-full h-full object-cover"
                              src={`${api.defaults.baseURL}/files/${user.avatar}`}
                              alt="User avatar"
                            />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-100 whitespace-no-wrap">{user.name}</p>
                          <p className="text-gray-200 whitespace-no-wrap">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <p className="text-gray-100 whitespace-no-wrap">{user.role}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <span
                        className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                          user.active ? 'text-green-900' : 'text-red-900'
                        }`}>
                        <span
                          aria-hidden
                          className={`absolute inset-0 ${
                            user.active ? 'bg-green-200' : 'bg-red-200'
                          } opacity-50 rounded-full`}
                        ></span>
                        <span className="relative">{user.active ? 'Ativo' : 'Inativo'}</span>
                      </span>
                      <button
                        onClick={() => handleToggleActiveStatus(user.id, !user.active)}
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          user.active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                        }`}
                      >
                        {user.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="text-sm text-white bg-indigo-600 hover:bg-indigo-900 border rounded-3xl p-1.5 mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-sm text-white bg-red-600 hover:bg-red-900 border rounded-3xl p-1.5 ml-2"
                      >
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={editingUser ? 'Editar Usuário' : 'Criar Usuário'}
          >
            <UserForm
              userToEdit={editingUser}
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
