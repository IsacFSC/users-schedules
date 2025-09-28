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
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'LEADER')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
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
      console.log('Fetched users:', fetchedUsers);
      const adminUsers = fetchedUsers.filter(u => u.role === 'ADMIN');
      console.log('Filtered admins:', adminUsers);
      setUsers(fetchedUsers);
      setAdmins(adminUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'LEADER')) {
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

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'LEADER')) {
    return <p>Redirecionando para o login...</p>;
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-200 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mensagens</h1>
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

        {loading && <p>Loading conversations...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Conversations</h2>
            <div className="bg-white shadow-md rounded-lg p-4">
              <ul>
                {conversations.map((convo, index) => (
                  <li
                    key={convo.id}
                    onClick={() => handleSelectConversation(convo)}
                    className={`mx-0 cursor-pointer p-2 text-gray-800 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200`}
                  >
                    {convo.subject}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            {selectedConversation ? (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900">{selectedConversation.subject}</h2>
                <div className="bg-neutral-300 shadow-md rounded-lg p-4 h-96 overflow-y-auto mb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`mb-2 ${msg.authorId === user?.id ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-2 rounded-lg ${msg.authorId === user?.id ? 'bg-emerald-500' : 'bg-violet-500'}`}>
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
                      <p className="text-xs text-gray-600">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Escreva uma mensagem..."
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
              <p className="text-gray-800">Selecione uma mensagem para abrir o chat.</p>
            )}
          </div>
        </div>
        <NewConversationModal
          isOpen={isNewConversationModalOpen}
          onClose={() => setIsNewConversationModalOpen(false)}
          users={admins}
          onSend={handleSendNewConversation}
          title="Nova Conversa"
          userRole="Admin"
        />
      </div>
    </PrivateRoute>
  );
}
