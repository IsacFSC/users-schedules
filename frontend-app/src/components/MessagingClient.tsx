'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaDownload } from 'react-icons/fa';
import { getConversations, getMessages, createMessage, createConversation, uploadFile, Conversation, Message, downloadFile } from '../services/messagingService';
import { getUsers, User } from '../services/userService';
import NewConversationModal from './NewConversationModal';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface MessagingClientProps {
  userRole: 'ADMIN' | 'LEADER' | 'USER';
}

export default function MessagingClient({ userRole }: MessagingClientProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [view, setView] = useState<'conversations' | 'messages'>('conversations');

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
      if (user) {
        setUsers(fetchedUsers.filter(u => u.id !== user.id));
      } else {
        setUsers(fetchedUsers);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchUsers();
    }
  }, [fetchConversations, fetchUsers, isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConversation) {
        handleSelectConversation(selectedConversation, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const handleSelectConversation = async (conversation: Conversation, isRefresh = false) => {
    if (!isRefresh) {
      setView('messages');
    }
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
      setIsNewConversationModalOpen(false);
    } catch (error) {
      setError('Falha ao iniciar conversa.');
      throw error;
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const blob = await downloadFile(fileName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Falha ao baixar o arquivo.", error);
    }
  };

  const handleBack = () => {
    if (view === 'messages') {
      setView('conversations');
      setSelectedConversation(null);
    } else {
      router.back();
    }
  };

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 bg-gray-100 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">Mensagens</h1>
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

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`md:col-span-1 ${view === 'messages' && 'hidden md:block'}`}>
          <h2 className="text-xl font-bold mb-4 dark:text-gray-200">Conversas</h2>
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
            {conversations.length > 0 ? (
              <ul>
                {conversations.map((convo) => (
                  <li key={convo.id} onClick={() => handleSelectConversation(convo)} className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200">
                    {convo.subject}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dark:text-gray-400">Nenhuma conversa encontrada.</p>
            )}
          </div>
        </div>

        <div className={`md:col-span-2 ${view === 'conversations' && 'hidden md:block'}`}>
          {selectedConversation ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <button onClick={() => setView('conversations')} className="md:hidden mr-4 text-gray-800 dark:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold dark:text-gray-200">{selectedConversation.subject}</h2>
              </div>
              <div className="flex-grow bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 overflow-y-auto mb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`mb-2 flex ${msg.authorId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`inline-block p-2 rounded-lg ${msg.authorId === user?.id ? 'bg-emerald-500' : 'bg-violet-500'} text-white`}>
                      <p className="font-bold">{msg.author?.name || 'Participante'}</p>
                      {msg.file ? (
                        msg.fileMimeType && msg.fileMimeType.startsWith('image/') ? (
                          <img src={`${process.env.NEXT_PUBLIC_API_URL}/messaging/messages/download/${msg.file}`} alt={msg.content} className="max-w-xs rounded-lg" />
                        ) : (
                          <button onClick={() => handleDownload(msg.file!)} className="text-blue-200 hover:underline flex items-center">
                            <FaDownload className="mr-2" />
                            {msg.content || 'Baixar Arquivo'}
                          </button>
                        )
                      ) : (
                        <p>{msg.content}</p>
                      )}
                       <p className="text-xs text-gray-200">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
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
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Selecione uma conversa para ver as mensagens.</p>
            </div>
          )}
        </div>
      </div>
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        users={users}
        onSend={handleSendNewConversation}
        title="Nova Conversa"
        userRole={userRole === 'ADMIN' ? 'Leader' : 'Admin'}
      />
    </div>
  );
}