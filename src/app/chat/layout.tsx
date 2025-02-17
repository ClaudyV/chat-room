"use client";

import ConversationList from "@/components/ConversationList";
import { useChatStore } from "@/store/chatStore";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { darkMode } = useChatStore();
  return (
    <div className="flex h-screen">
      {/* Sidebar - Conversation List */}
      <div className={`w-1/4 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <ConversationList />
      </div>

      {/* Main Chat Content */}
      <div className={`flex-1 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        {children}
      </div>
    </div>
  );
}
