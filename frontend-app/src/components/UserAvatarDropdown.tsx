"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { User, LogOut, Image as ImageIcon } from "lucide-react"; // Import icons
import ProfileModal from "./ProfileModal"; // Import the new ProfileModal

import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  email: string;
  name: string; // Assuming the token contains the user's name
  avatar: string | null; // Assuming the token contains the user's avatar URL
  role: string;
}

const UserAvatarDropdown = () => {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // State for modal
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown container

  let userName = "Usuário"; // Default to a generic Portuguese name
  let userAvatar: string | null = null;

  if (token) {
    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      userName = decodedToken.name || decodedToken.email; // Use name from token, fallback to email
      userAvatar = decodedToken.avatar ? `http://localhost:1939${decodedToken.avatar}` : null; // Get avatar from token
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      // Handle invalid token, e.g., force logout
      logout();
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    setIsProfileModalOpen(true); // Open the modal instead of navigating
  };

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}> {/* Attach ref to the container */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-lg font-semibold text-gray-800 dark:bg-gray-700 dark:text-white focus:outline-none"
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt=" "
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <User className="h-6 w-6 text-gray-500" />
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Render the ProfileModal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default UserAvatarDropdown;
