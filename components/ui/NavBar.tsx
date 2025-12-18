export function NavBar() {
    return (
        <nav className="flex flex-col w-64 h-screen bg-gradient-to-b from-violet-300 to-gray-400 border-r border-violet-200">
            <div className="p-8 border-b border-violet-200/50">
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-white to-violet-50 p-4 shadow-lg">
                    <img
                        src="/img.png"
                        alt="Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
            <div className="flex-1 p-5 mt-8">
                <a
                    href="/anticipos"
                    className="group relative flex items-center p-4 text-gray-900 hover:text-violet-800 rounded-xl transition-all duration-300 bg-white/50 hover:bg-white shadow-sm hover:shadow-md"
                >
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-violet-500 to-purple-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-r" />
                    
                    <div className="flex items-center gap-3 ml-4">
                        <span className="font-medium group-hover:translate-x-2 transition-transform duration-300">
                            Anticipos
                        </span>
                    </div>
                </a>
            </div>
        </nav>
    );
}