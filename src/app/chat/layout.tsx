"use client";

import { FaBars, FaTimes } from "react-icons/fa";
import { useEffect, useState } from "react";

import ConversationList from "@/components/ConversationList";
import { useChatStore } from "@/store/chatStore";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { darkMode } = useChatStore();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setShowSidebar((prevState) => !prevState);
  };

  return (
    <div className="flex h-screen relative">
      {/* Sidebar - Conversation List */}
      <aside
        className={`
          fixed lg:static left-0 top-0 bottom-0
          ${
            showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } 
          transition-transform duration-300 ease-in-out 
          z-40
          ${darkMode ? "bg-gray-900" : "bg-gray-100"}
          ${isMobile ? "w-3/4" : "w-1/4"}
        `}
      >
        <ConversationList />

        {isMobile && (
          <button
            onClick={toggleSidebar}
            className={`absolute top-4 right-4 p-2 rounded-full 
              ${
                darkMode
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
          >
            <FaTimes />
          </button>
        )}
      </aside>

      {/* Main Chat Content */}
      <main
        className={`flex-1 flex flex-col ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className={`fixed top-4 right-4 p-2 z-50
              ${
                darkMode
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-gray-800"
              }
              rounded-full shadow-lg`}
          >
            <FaBars />
          </button>
        )}

        <div className="flex-1 overflow-hidden">{children}</div>
      </main>

      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
