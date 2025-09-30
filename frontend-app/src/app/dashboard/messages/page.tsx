'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConversations, Conversation, createConversation } from '../../../services/messagingService';
import { getUsers, User } from '../../../services/userService';
import { useAuth } from '../../../hooks/useAuth';
import PrivateRoute from '@/components/PrivateRoute';
import NewConversationModal from '@/components/NewConversationModal';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const convos = await getConversations();
      setConversations(convos);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const userList = await getUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUsers();
    }
  }, [user]);

  const handleSend = async (recipientId: number, subject: string, message: string) => {
    try {
      await createConversation(subject, message, recipientId);
      fetchConversations();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create conversation", error);
    }
  };

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Minhas Mensagens</h1>
          <div>
            <button onClick={() => setIsModalOpen(true)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2">
              Nova Conversa
            </button>
            <Link href="/dashboard" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Voltar ao Painel
            </Link>
          </div>
        </div>

        {loading ? (
          <p>Carregando conversas...</p>
        ) : (
          <div className="space-y-4">
            {conversations.length > 0 ? (
              conversations.map(convo => (
                <Link key={convo.id} href={`/dashboard/messages/${convo.id}`}>
                  <div className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-colors cursor-pointer">
                    <h2 className="text-xl text-gray-800 font-semibold">{convo.subject}</h2>
                    <p className="text-gray-600">Participantes: {convo.participants.map(p => p.name).join(', ')}</p>
                    {convo.messages.length > 0 && (
                      <p className="text-gray-800 mt-2">Última mensagem: {convo.messages[0].content}</p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <p className='text-gray-600 text-center'>Nenhuma conversa encontrada.</p>
            )}
          </div>
        )}
      </div>
      <NewConversationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSend={handleSend} users={users} title="Nova Conversa" userRole="Destinatário" />
    </PrivateRoute>
  );
}
