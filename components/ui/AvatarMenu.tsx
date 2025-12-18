export function UserAvatarMenu() {
  return (
    <div className="absolute right-0 top-0 p-3">  
      <div className="flex w-fit h-full p-2 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-gray-800 dark:to-gray-900 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-center items-center w-15 h-auto  rounded-[50%] bg-gradient-to-br from-emerald-300 to-teal-500 shadow-md">
          <strong className="text-white font-semibold text-lg">J</strong>
        </div>

        <div className="w-full flex flex-col justify-center ml-4">
          <p className="text-gray-800 dark:text-gray-100 font-medium text-sm truncate">
            Juan José
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">
            Tecnología
          </p>
        </div>
      </div>
    </div>
  );
}