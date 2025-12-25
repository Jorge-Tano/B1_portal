// ✅ CORRECTO
'use client';

import { useState, useEffect } from 'react';
import { AvatarMenu } from './AvatarMenu';

interface HeaderProps {
  isNavExpanded?: boolean;
}

export function Header({ isNavExpanded = false }: HeaderProps) {
  // 1. TODOS LOS HOOKS PRIMERO
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  
  // 2. Effects después
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // 3. Lógica condicional DESPUÉS de hooks
  // if (condition) {
  //   return null; // ← Esto sería un problema si hay hooks antes
  // }
  
  // 4. Renderizado final
  return (
    <header className={`sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-violet-200 dark:border-gray-800 p-1 transition-all duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      <div className="flex items-center justify-between h-16 px-6">
        <div className={`transition-all duration-300 ${
          isNavExpanded ? 'ml-64' : 'ml-0'
        }`}>
          {/* Logo y navegación */}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Otros elementos del header */}
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}