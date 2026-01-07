// app/auth/login/page.tsx
'use client'

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Usuario o contraseña incorrectos');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex bg-gradient-to-r from-emerald-500 to-white w-[50%]">
        <div className="flex flex-col justify-center p-[17%] text-white space-y-6">
          <img src="/img.png" alt="Logo B1 Portal" className="w-full" />
        </div>
      </div>
      <div className="w-[50%]">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-full max-w-lg p-8 bg-white rounded-3xl shadow-2xl">
            <div className="flex justify-center mt-5">
              <div className="w-40 h-40 rounded-3xl flex items-center justify-center">
                <div className="text-center relative w-full h-full">
                  <Image
                    src="/img.png"
                    alt="Logo B1P"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="text-gray-900">
              <form onSubmit={handleSubmit} className="flex flex-col space-y-7">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-3">
                    Usuario
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6A3EF0] focus:bg-white text-gray-900 placeholder-gray-500 transition-all duration-300"
                    placeholder="usuario"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-3">
                    Ingrese contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-4 pr-24 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6A3EF0] focus:bg-white text-gray-900 placeholder-gray-500 transition-all duration-300"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <input
                  type="submit"
                  value={loading ? "Autenticando..." : "Iniciar Sesión"}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-600/30 transform hover:-translate-y-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}