'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMessages, createMessage, uploadFile, Message, downloadFile } from '../../../../services/messagingService';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const fetchedMessages = await getMessages(conversationId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Falha ao buscar mensagens.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    if (!newMessage.trim() && !selectedFile) return;

    try {
      if (selectedFile) {
        await uploadFile(conversationId, selectedFile);
        setSelectedFile(null);
      } else {
        await createMessage(conversationId, newMessage);
        setNewMessage('');
      }
      fetchMessages();
    } catch (error) {
      console.error("Falha ao enviar mensagem.", error);
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
                    {msg.file && msg.fileMimeType ? (
                      msg.fileMimeType.startsWith('image/') ? (
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}/messaging/messages/download/${msg.file}`} alt={msg.content} className="max-w-xs rounded-lg" />
                      ) : (
                        <button onClick={() => handleDownload(msg.file!)} className="text-blue-200 hover:underline">
                          {msg.content}
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
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer">
              Anexar
            </label>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2">
              Enviar
            </button>
          </form>
        </div>
      </div>
    </PrivateRoute>
  );
}
