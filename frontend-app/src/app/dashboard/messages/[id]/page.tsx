'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMessages, createMessage, Message } from '../../../../services/messagingService';
import { useAuth } from '../../../../hooks/useAuth';
import PrivateRoute from '@/components/PrivateRoute';

export default function ConversationPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const conversationId = parseInt(id, 10);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const fetchedMessages = await getMessages(conversationId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Falha ao enviar mensagem.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      const sentMessage = await createMessage(conversationId, newMessage);
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setNewMessage('');
      // Optionally, refetch messages to get the author details populated
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Conversa</h1>
          <Link href="/dashboard/messages" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Voltar para Mensagens
          </Link>
        </div>

        <div className="flex-grow bg-white rounded-lg shadow-md p-4 overflow-y-auto">
          {loading ? (
            <p>Carregando mensagens...</p>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.authorId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`inline-block p-2 rounded-lg ${msg.authorId === user?.id ? 'bg-emerald-500' : 'bg-violet-500'} text-white`}>
                    <p className="font-bold">{msg.author?.name || (msg.authorId === user?.id ? user.name : 'Participante')}</p>
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-600">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-grow p-2 border border-gray-300 rounded-md"
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2">
              Enviar
            </button>
          </form>
        </div>
      </div>
    </PrivateRoute>
  );
}
