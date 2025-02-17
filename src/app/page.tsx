"use client";

import ConversationList from "@/components/ConversationList";

export default function Home() {
  return (
    <div className="flex h-screen">
      {/* Sidebar - Conversation List */}
      <div className="w-1/4 bg-gray-100 dark:bg-gray-900">
        <ConversationList />
      </div>

      {/* Main Chat Content */}
      <div className="flex-1 bg-white dark:bg-gray-800">
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
