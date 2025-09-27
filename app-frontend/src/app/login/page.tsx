'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:1939/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || JSON.stringify(errorData) || "Falha no login";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Login bem-sucedido, dados recebidos:", data);
      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      login(data.token, user);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        {isMounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2 rounded-md bg-gray-200 px-3 py-1 dark:bg-gray-700 dark:text-white"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" /> Claro
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" /> Escuro
              </>
            )}
          </button>
        )}
      </div>
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-center text-3xl font-bold font-sans  text-gray-900 dark:text-white">
          Faça o seu Login
          </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha
            </label>
            <input
              type="password"
              id="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="mb-4 text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
