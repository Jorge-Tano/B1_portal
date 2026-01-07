'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AvatarMenu } from './AvatarMenu';

interface HeaderProps {
  isNavExpanded?: boolean;
}

export function Header({ isNavExpanded = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showImage, setShowImage] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detectar hover del navbar lateral
  useEffect(() => {
    const navbar = document.querySelector('[class*="fixed left-0 top-0 h-screen"]');

    if (!navbar) return;

    const handleEnter = () => setShowImage(false);
    const handleLeave = () => setShowImage(true);

    navbar.addEventListener('mouseenter', handleEnter);
    navbar.addEventListener('mouseleave', handleLeave);

    return () => {
      navbar.removeEventListener('mouseenter', handleEnter);
      navbar.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white dark:bg-gray-900
      border-b border-violet-200 dark:border-gray-800
      transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''}`}
    >
      <div className="flex items-center justify-between h-20 px-6">
        {/* LOGO */}
        <div
          className={`transition-all duration-300 ${isNavExpanded ? 'ml-64' : 'ml-0'
            }`}
        >
          <div
            className={`transition-all duration-500 ease-in-out ${showImage
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-4 pointer-events-none'
              }`}
          >
            {/* CONTENEDOR CON OVERFLOW CONTROLADO */}
            <a href="/dashboard" className="block h-full">
              <div className="relative h-16 w-44 overflow-hidden flex items-center">
                <img
                  src="/img.png"
                  alt="Logo"
                  className='h-[50px] w-[50px]'
                />
              </div>
            </a>
          </div>
        </div>

        {/* AVATAR */}
        <div className="flex items-center gap-4 relative z-50">
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
