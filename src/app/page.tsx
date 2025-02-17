"use client";

import ConversationList from "@/components/ConversationList";
import { useChatStore } from "@/store/chatStore";

export default function Home() {
  const { darkMode } = useChatStore();
  return (
    <div className="flex h-screen">
      {/* Sidebar - Conversation List */}
      <div className={`w-1/4 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <ConversationList />
      </div>

      {/* Main Chat Content */}
      <div className={`flex-1 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <NoChatSelected />
      </div>
    </div>
  );
}

function NoChatSelected() {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      Select a conversation to start chatting.
    </div>
  );
}
