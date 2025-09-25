import React, { useState } from 'react';
import { Schedule, User } from '../../common/types';

const skills = [
  { id: 1, name: 'VOCAL-LEAD' },
  { id: 2, name: 'BACKING-VOCAL' },
  { id: 3, name: 'GUITARRA' },
  { id: 4, name: 'VIOLÃO' },
  { id: 5, name: 'CONTRA-BAIXO' },
  { id: 6, name: 'TECLADO' },
  { id: 7, name: 'BATERIA' },
  { id: 8, name: 'SAX' },
  { id: 9, name: 'OUTROS' },
];

const AssignUserModal = ({ isOpen, onClose, schedule, users, onSave }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);

  const handleSave = () => {
    if (selectedUserId && selectedSkillId) {
      onSave(schedule.id, selectedUserId, selectedSkillId);
      onClose();
    } else {
      alert("Por favor, selecione um usuário e uma habilidade.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-md shadow-md w-1/2">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Atribuir Usuário para {schedule?.title}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Usuário</label>
            <select
              id="user"
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="" disabled>Selecione um usuário</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="skill" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Habilidade</label>
            <select
              id="skill"
              value={selectedSkillId || ''}
              onChange={(e) => setSelectedSkillId(Number(e.target.value))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={!selectedUserId}
            >
              <option value="" disabled>Selecione uma habilidade</option>
              {skills.map(skill => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="mr-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" disabled={!selectedUserId || !selectedSkillId}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignUserModal;