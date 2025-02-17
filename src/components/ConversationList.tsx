"use client";

import { Conversation, useChatStore } from "@/store/chatStore";
import { FaMoon, FaPlus, FaSun } from "react-icons/fa";
import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConversationList() {
  const router = useRouter();
  const {
    selectedChatId,
    setSelectedChat,
    conversations,
    addConversation,
    currentUser,
    darkMode,
    toggleDarkMode,
  } = useChatStore();
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");

  // Apply dark mode class to the `html` tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Format the timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCreateNewChat = () => {
    if (!newContactName.trim()) return;

    const newId = `conv${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      participants: [
        currentUser,
        {
          id: `user${Date.now()}`,
          name: newContactName,
          avatar: "https://cdn-icons-png.flaticon.com/512/3541/3541871.png",
        },
      ],
      lastMessage: "Start a new conversation",
      timestamp: new Date().toISOString(),
      unreadCount: 0,
    };

    addConversation(newConversation);

    setNewContactName("");
    setShowNewChatForm(false);
    setSelectedChat(newId);

    router.push(`/chat/${newId}`);
  };

  return (
    <div
      className={`p-4 space-y-4 h-screen w-full flex flex-col gap-2 transition-colors ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="text-2xl font-bold py-2">
        <h1>Chat Room</h1>
      </div>

      {/* New Chat Button */}
      <div className="sticky top-0 py-2 z-10 !mt-0 transition-colors bg-opacity-90">
        <button
          onClick={() => setShowNewChatForm(!showNewChatForm)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          <FaPlus size={14} />
          <span>New Conversation</span>
        </button>

        {/* New Chat Form */}
        {showNewChatForm && (
          <div
            className={`mt-2 p-3 rounded-lg shadow-md transition-colors ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Enter contact name"
              className="w-full p-2 mb-2 border rounded-md transition-colors 
                bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewChatForm(false)}
                className="px-3 py-1 rounded-md transition-colors 
                  bg-gray-300 text-gray-700 hover:bg-gray-400 
                  dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewChat}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conversation List */}
      {conversations.map((conv) => (
        <Link key={conv.id} href={`/chat/${conv.id}`} className="!mt-0">
          <div
            onClick={() => setSelectedChat(conv.id)}
            className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
              selectedChatId === conv.id
                ? "bg-gray-300 dark:bg-gray-500"
                : "hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image
                  src={conv.participants[1].avatar}
                  width={40}
                  height={40}
                  className="rounded-full"
                  alt="avatar"
                />
                {conv.unreadCount ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                ) : null}
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    selectedChatId === conv.id ? "text-white" : ""
                  }`}
                >
                  {conv.participants[1].name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-48">
                  {conv.lastMessage}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(conv.timestamp)}
            </p>
          </div>
        </Link>
      ))}

      {/* Dark Mode Toggle */}
      <div className="mt-auto flex justify-center p-3">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-2 p-2 rounded-lg transition-colors 
            bg-gray-300 text-gray-700 hover:bg-gray-400 
            dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </div>
  );
}
