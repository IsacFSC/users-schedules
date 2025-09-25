import React, { useState, useEffect } from 'react';
import { Schedule, Task } from '../../common/types';

const AssignTaskModal = ({ isOpen, onClose, schedule, tasks, onSave }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  useEffect(() => {
    if (schedule) {
      setSelectedTaskIds(schedule.scheduleTasks.map(st => st.taskId));
    }
  }, [schedule]);

  const handleTaskToggle = (taskId: number) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSave = () => {
    onSave(schedule.id, selectedTaskIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-md shadow-md w-1/2">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Atribuir Tarefas para {schedule?.title}</h2>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center">
              <input
                type="checkbox"
                id={`task-${task.id}`}
                checked={selectedTaskIds.includes(task.id)}
                onChange={() => handleTaskToggle(task.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`task-${task.id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                {task.name}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="mr-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal;