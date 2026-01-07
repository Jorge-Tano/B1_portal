'use client'

import { useState } from 'react'

interface NavBarProps {
  onExpandChange?: (isExpanded: boolean) => void
}

export function NavBar({ onExpandChange }: NavBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleMouseEnter = () => {
    setIsExpanded(true)
    onExpandChange?.(true)
  }

  const handleMouseLeave = () => {
    setIsExpanded(false)
    onExpandChange?.(false)
  }

  return (
    <div
      className="fixed left-0 top-0 h-screen z-40 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`h-full transition-all duration-400 ${isExpanded ? 'w-64' : 'w-3'
        }`}>

        <div className={`h-full bg-gradient-to-b hover:from-gray-400 from-gray-200 hover:to-gray-300 to-gray-200 border-r border-gray-400 transition-all duration-400 ${isExpanded ? 'shadow-xl' : ''
          }`}>

          <div className={`absolute top-1/2 transition-all duration-400 ${isExpanded ? 'right-2' : 'right-1/2'
            }`} style={{ transform: 'translateY(-50%)' }}>
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isExpanded ? 'bg-violet-600' : 'bg-violet-500'
                }`}></div>
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isExpanded ? 'bg-violet-500' : 'bg-violet-400'
                }`}></div>
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isExpanded ? 'bg-violet-400' : 'bg-violet-300'
                }`}></div>
            </div>
          </div>

          {isExpanded && (
            <div className="h-full overflow-hidden">
              <a href="/dashboard">
                <div className="p-8 border-b border-violet-200/50">
                  <div className="w-30 h-28 mx-auto rounded-full bg-gradient-to-br from-white to-violet-50 p-4 shadow-lg">
                    <img
                      src="/img.png"
                      alt="Logo"
                    />
                  </div>
                </div>
              </a>

              <div className="flex-1 p-5 mt-8">
                <a
                  href="/mis_anticipos"
                  className="group relative flex items-center p-4 text-gray-900 hover:text-violet-800 rounded-xl transition-all duration-300 bg-white/50 hover:bg-white shadow-sm hover:shadow-md"
                >
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-violet-500 to-purple-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-r" />
                  <div className="flex items-center justify-between w-full ml-4">
                    <span className="font-medium group-hover:translate-x-2 transition-transform duration-300">
                      Anticipos
                    </span>
                    <span className="text-gray-400 text-sm transition-transform duration-300">
                      ›
                    </span>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}