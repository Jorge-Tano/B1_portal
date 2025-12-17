'use client'
import { useState } from 'react';


export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex h-screen">
      <div className="flex bg-gradient-to-r from-emerald-500 to-white w-[50%]">
        <div className="flex flex-col justify-center p-[17%] text-white space-y-6">
          <img src="/img.png" alt="" />
        </div>
      </div>
      <div className="w-[50%]">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-full max-w-lg p-8 bg-white rounded-3xl shadow-2xl">
            <div className="flex justify-center mb-10">
              <div className="w-28 h-28 bg-gradient-to-r from-[#4279ED] to-[#c52f30] rounded-3xl flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="text-black font-bold text-5xl leading-none">B1P</div>
                </div>
              </div>
            </div>

            <div className="text-gray-900">
              <form className="flex flex-col space-y-7">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-3">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6A3EF0] focus:bg-white text-gray-900 placeholder-gray-500 transition-all duration-300"
                    placeholder="correo@ejemplo.com"
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
                      onChange={(e) => setPassword(e.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-4 pr-24 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6A3EF0] focus:bg-white text-gray-900 placeholder-gray-500 transition-all duration-300"
                    />
                  </div>
                </div>
                <input
                  type="submit"
                  value="Iniciar Sesión"
                  className="w-full bg-[#6A3EF0] text-white py-4 rounded-xl font-bold hover:bg-[#1BB5B2] transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-[#6A3EF0]/30 transform hover:-translate-y-1 cursor-pointer"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

