import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../common/types';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  role: Role;
  avatar?: string | null;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: () => void;
  token: string | null;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreateSuccess, token }) => {
  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;

    try {
      await apiFetch('/users', {
        method: 'POST',
  token: token || undefined,
        body: JSON.stringify({ name, email, password, role }),
      });
      toast.success('Usuário criado com sucesso!');
      onCreateSuccess();
    } catch (err: any) {
      toast.error(`Erro ao criar usuário: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h3 className="text-xl font-semibold mb-4">Criar Novo Usuário</h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nome</label>
            <input type="text" id="name" name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <input type="email" id="email" name="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Senha</label>
            <input type="password" id="password" name="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Função</label>
            <select id="role" name="role" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Criar Usuário</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async () => {
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
      if (statusFilter !== 'all') {
        queryParams.append('active', statusFilter === 'active' ? 'true' : 'false');
      }
      // Só envia o filtro de função se não for 'all'
      if (roleFilter !== 'all') {
        queryParams.append('role', roleFilter);
      }

  const data = await apiFetch<{ users: User[]; total: number }>(`/users/All?${queryParams.toString()}`, { token: token || undefined });
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro ao buscar usuários: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce search input

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, fetchUsers]);

  const handleCreateSuccess = () => {
    fetchUsers();
    setIsCreateModalOpen(false);
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await apiFetch(`/users/admin/${userId}`, {
        method: 'PATCH',
  token: token || undefined,
        body: JSON.stringify({ active: !currentStatus }),
      });
      toast.success('Status do usuário atualizado com sucesso!');
      fetchUsers(); // Re-fetch users to update the list
    } catch (err: any) {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    }
  };

  const handleChangeRole = async (userId: number, currentRole: Role) => {
    const newRole = currentRole === Role.USER ? Role.LEADER : Role.USER; // Simple toggle for example
    try {
      await apiFetch(`/users/admin/${userId}`, {
        method: 'PATCH',
  token: token || undefined,
        body: JSON.stringify({ role: newRole }),
      });
      toast.success('Função do usuário atualizada com sucesso!');
      fetchUsers();
    } catch (err: any) {
      toast.error(`Erro ao atualizar função: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) return;
    try {
      await apiFetch(`/users/${userId}`, {
        method: 'DELETE',
  token: token || undefined,
      });
      toast.success('Usuário deletado com sucesso!');
      fetchUsers();
    } catch (err: any) {
      toast.error(`Erro ao deletar usuário: ${err.message}`);
    }
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  if (loading) return <p>Carregando usuários...</p>;
  if (error) return <p className="text-red-500">Erro: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Gerenciamento de Usuários</h2>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Buscar usuários por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/3 p-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="p-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as 'all' | Role)}
          className="p-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">Todas Funções</option>
          {Object.values(Role).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Criar Novo Usuário
        </button>
        <button
          onClick={() => fetchUsers()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Buscar
        </button>
        <button
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setRoleFilter('all');
            setCurrentPage(1);
            fetchUsers();
          }}
          className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Limpar Filtros
        </button>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ativo</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Função</th>
              <th className="px-4 py-2 border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm leading-4 text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{user.id}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{user.name}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{user.email}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{user.active ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 text-gray-900 dark:text-white">{user.role}</td>
                <td className="px-4 py-2 whitespace-no-wrap border-b border-gray-200 dark:border-gray-700 text-sm leading-5 font-medium">
                  <button
                    onClick={() => handleToggleActive(user.id, user.active)}
                    className={`text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-600 mr-2 ${user.active ? '' : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600'}`}
                  >
                    {user.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleChangeRole(user.id, user.role)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 mr-2"
                  >
                    Alterar Função
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
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

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSuccess={handleCreateSuccess}
        token={token}
      />
    </div>
  );
};

export default UserManagement;