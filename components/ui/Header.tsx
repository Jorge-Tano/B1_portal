import { UserAvatarMenu } from "./AvatarMenu"

interface HeaderProps {
  isNavExpanded?: boolean
}

export function Header({ isNavExpanded = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-violet-200 dark:border-gray-800 p-1">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo que desaparece completamente */}
        <div className={`transition-all duration-300 ${
          isNavExpanded 
            ? 'invisible opacity-0 scale-95' 
            : 'visible opacity-100 scale-100'
        }`}>
          <div className="w-30 h-26">
            <img 
              src="/img.png" 
              alt="Logo" 
            />
          </div>
        </div>

        <UserAvatarMenu />
      </div>
    </header>
  )
}