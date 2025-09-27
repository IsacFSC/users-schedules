
'use client';

import { useMemo } from 'react';
import { Schedule } from '../services/scheduleService';
import { User } from '../services/userService';
import { api } from '../services/api';

interface ScheduleUserManagementProps {
  schedule: Schedule;
  allUsers: User[];
  onAddUser: (userId: number) => void;
  onRemoveUser: (userId: number) => void;
}

export default function ScheduleUserManagement({ schedule, allUsers, onAddUser, onRemoveUser }: ScheduleUserManagementProps) {

  const { assignedUsers, availableUsers } = useMemo(() => {
    const assignedUserIds = new Set(schedule.users.map(u => u.userId));
    const assigned = allUsers.filter(u => assignedUserIds.has(u.id));
    const available = allUsers.filter(u => !assignedUserIds.has(u.id));
    return { assignedUsers: assigned, availableUsers: available };
  }, [schedule, allUsers]);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Assigned Users */}
      <div>
        <h4 className="font-semibold text-lg mb-2">Usuários Atribuídos</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {assignedUsers.length > 0 ? assignedUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-sm font-bold mr-2">
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
                <span>{user.name}</span>
              </div>
              <button
                onClick={() => onRemoveUser(user.id)}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remover
              </button>
            </div>
          )) : <p className="text-sm text-gray-500">Nenhum usuário atribuído.</p>}
        </div>
      </div>

      {/* Available Users */}
      <div>
        <h4 className="font-semibold text-lg mb-2">Usuários Disponíveis</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {availableUsers.length > 0 ? availableUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-sm font-bold mr-2">
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
                <span>{user.name}</span>
              </div>
              <button
                onClick={() => onAddUser(user.id)}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Adicionar
              </button>
            </div>
          )) : <p className="text-sm text-gray-500">Nenhum usuário disponível para adicionar.</p>}
        </div>
      </div>
    </div>
  );
}

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else if (parts.length > 1) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return '';
};
