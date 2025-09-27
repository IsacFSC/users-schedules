"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Upload, Trash2, X, User2, User, User2Icon } from "lucide-react";
import toast from "react-hot-toast"; // Import toast

import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  email: string;
  name: string; // Assuming the token contains the user's name
  avatar: string | null; // Assuming the token contains the user's avatar URL
  role: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { token, logout, updateToken } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  let userName = "Convidado";
  let userAvatar: string | null = null;
  let userRole = "";

  if (token) {
    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      userName = decodedToken.name || decodedToken.email;
      userAvatar = decodedToken.avatar ? `http://localhost:1939${decodedToken.avatar}` : null;
      userRole = decodedToken.role;
      console.log("DEBUG: User Avatar URL:", userAvatar); // Added for debugging
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      logout();
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:1939/users/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Falha ao enviar avatar.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData) || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Avatar enviado com sucesso:", result);
      toast.success("Avatar enviado com sucesso!"); // Success toast
      updateToken(result.token); // Update the token in AuthContext
      onClose(); // Close modal after successful upload
      setSelectedFile(null);
      // router.refresh(); // No longer needed if token is updated
    } catch (error: any) {
      console.error("Erro ao enviar avatar:", error);
      toast.error(`Falha ao enviar avatar: ${error.message}`); // Error toast
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const response = await fetch("http://localhost:1939/users/avatar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Falha ao remover avatar.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData) || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Avatar removed successfully", result);
      toast.success("Avatar removido com sucesso!"); // Success toast
      updateToken(result.token); // Update the token in AuthContext
      onClose(); // Close modal after successful removal
      // router.refresh(); // No longer needed if token is updated
    } catch (error: any) {
      console.error("Error removing avatar:", error);
      toast.error(`Falha ao remover avatar: ${error.message}`); // Error toast
    }
  };

  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Perfil do Usuário</h3>

        <div className="mb-6 flex flex-col items-center">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt=""
              className="mb-4 h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gray-300 text-5xl font-semibold text-gray-800 dark:bg-gray-700 dark:text-white">
              {getInitials(userName)}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{userName}</h2>
          <p className="text-gray-600 dark:text-gray-400">Perfil: {userRole}</p>
        </div>

        <div className="flex flex-col space-y-4">
          <div>
            <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Alterar Avatar</label>
            <input
              id="avatar-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="mb-2 w-full text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept="image/*"
            />
            <button
              onClick={handleUploadAvatar}
              disabled={!selectedFile}
              className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Upload className="mr-2 h-5 w-5" />
              Carregar Nova Foto
            </button>
          </div>

          {userAvatar && (
            <button
              onClick={handleRemoveAvatar}
              className="flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Remover Foto Atual
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
