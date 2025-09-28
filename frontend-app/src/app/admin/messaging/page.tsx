'use client';

import { useEffect, useState, useCallback } from 'react';
import { getConversations, getMessages, createMessage, createConversation, uploadFile, Conversation, Message } from '../../../services/messagingService';
import { getUsers, User } from '../../../services/userService';
import NewConversationModal from '../../../components/NewConversationModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import PrivateRoute from '@/components/PrivateRoute';

export default function MessagingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedConversations = await getConversations();
      setConversations(fetchedConversations);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar conversas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      setLeaders(fetchedUsers.filter(u => u.role === 'LEADER'));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchConversations();
      fetchUsers();
    }
  }, [fetchConversations, fetchUsers, isAuthenticated, user]);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    try {
      const fetchedMessages = await getMessages(conversation.id);
      setMessages(fetchedMessages);
    } catch (error) {
      setError('Falha ao buscar mensagens.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) return;
    if (!newMessage.trim() && !selectedFile) return;

    try {
      if (selectedFile) {
        await uploadFile(selectedConversation.id, selectedFile);
        setSelectedFile(null);
      } else {
        await createMessage(selectedConversation.id, newMessage);
        setNewMessage('');
      }
      const fetchedMessages = await getMessages(selectedConversation.id);
      setMessages(fetchedMessages);
      setSuccessMessage('Mensagem enviada com sucesso!');
    } catch (error) {
      setError('Falha ao enviar mensagem.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSendNewConversation = async (recipientId: number, subject: string, message: string) => {
    try {
      await createConversation(subject, message, recipientId);
      fetchConversations();
      setSuccessMessage('Conversa iniciada com sucesso!');
    } catch (error) {
      setError('Falha ao iniciar conversa.');
      throw error;
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <p>Redirecionando para o login...</p>;
  }

  return (
    <PrivateRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Mensagens</h1>
          <div>
            <button
              onClick={() => setIsNewConversationModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
            >
              Nova Conversa
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Voltar
            </button>
          </div>
        </div>

        {loading && <p>Carregando conversas...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <h2 className="text-xl font-bold mb-4">Conversas</h2>
            <div className="bg-gray-500 shadow-md rounded-lg p-4">
              {conversations.length > 0 ? (
                <ul>
                  {conversations.map((convo) => (
                    <li key={convo.id} onClick={() => handleSelectConversation(convo)} className="cursor-pointer p-2 hover:bg-gray-100">
                      {convo.subject}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma conversa encontrada.</p>
              )}
            </div>
          </div>

          <div className="col-span-2">
            {selectedConversation ? (
              <div>
                <h2 className="text-xl font-bold mb-4">{selectedConversation.subject}</h2>
                <div className="bg-white shadow-md rounded-lg p-4 h-96 overflow-y-auto mb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`mb-2 ${msg.authorId === user?.id ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-2 rounded-lg ${msg.authorId === user?.id ? 'bg-fuchsia-200' : 'bg-emerald-200'}`}>
                        {msg.file ? (
                          msg.fileMimeType?.startsWith('image/') ? (
                            <img src={`${api.defaults.baseURL}/files/${msg.file}`} alt={msg.content} className="max-w-xs rounded-lg" />
                          ) : (
                            <a href={`${api.defaults.baseURL}/files/${msg.file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {msg.content}
                            </a>
                          )
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Digite uma mensagem..."
                  />
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer">
                    Anexar
                  </label>
                  <button onClick={handleSendMessage} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2">
                    Enviar
                  </button>
                </div>
              </div>
            ) : (
              conversations.length > 0 && <p>Selecione uma conversa para ver as mensagens.</p>
            )}
          </div>
        </div>
        <NewConversationModal
          isOpen={isNewConversationModalOpen}
          onClose={() => setIsNewConversationModalOpen(false)}
          users={leaders}
          onSend={handleSendNewConversation}
          title="New Conversation with Leader"
          userRole="Leader"
        />
      </div>
    </PrivateRoute>
  );
}
