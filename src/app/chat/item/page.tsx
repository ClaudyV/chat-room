"use client";

import { FaHeart, FaImage, FaLaugh, FaThumbsUp, FaTimes } from "react-icons/fa";
import { Message, useChatStore } from "@/store/chatStore";
import {
  simulateBackgroundActivity,
  simulateResponse,
} from "@/services/webSocketSimulation";
import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const {
    setSelectedChat,
    messages,
    conversations,
    addMessage,
    toggleReaction,
    markAsRead,
    darkMode,
    currentUser,
  } = useChatStore();
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeReactionMessage, setActiveReactionMessage] = useState<
    string | null
  >(null);
  const [bgActivityInitialized, setBgActivityInitialized] = useState(false);
  const isReactionUpdate = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentChatId = id as string;
  const currentMessages = useMemo(
    () => messages[currentChatId] || [],
    [messages, currentChatId]
  );

  const currentConversation = conversations.find(
    (c) => c.id.toString() === currentChatId
  );

  useEffect(() => {
    if (!bgActivityInitialized) {
      simulateBackgroundActivity();
      setBgActivityInitialized(true);
    }
  }, [bgActivityInitialized]);

  useEffect(() => {
    setSelectedChat(currentChatId);
    markAsRead(currentChatId);
  }, [currentChatId, setSelectedChat, markAsRead]);

  useEffect(() => {
    if (isReactionUpdate.current) {
      isReactionUpdate.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const imageMessages = currentMessages.filter((msg) => msg.content.image);
    if (imageMessages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentMessages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeReactionMessage &&
        !(event.target as Element).closest(".reaction-popup")
      ) {
        setActiveReactionMessage(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeReactionMessage]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReaction = (
    messageId: string,
    reactionType: "like" | "love" | "laugh"
  ) => {
    isReactionUpdate.current = true;
    toggleReaction(currentChatId, messageId, reactionType);
    setActiveReactionMessage(null);
  };

  const sendMessage = () => {
    if (!input.trim() && !image) return;
    if (!currentConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      sender: currentUser,
      content: {
        ...(input.trim() && { text: input.trim() }),
        ...(imagePreview && { image: imagePreview }),
      },
      timestamp: new Date().getTime(),
      reactions: { like: 0, love: 0, laugh: 0 },
      status: "sent",
    };

    addMessage(currentChatId, newMessage);
    setInput("");
    setImage(null);
    setImagePreview(null);
    simulateResponse(currentChatId, input.trim() || "image", currentUser);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = "";
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const renderReactionCount = (msg: Message) => {
    const likeCount = msg.reactions?.like || 0;
    const loveCount = msg.reactions?.love || 0;
    const laughCount = msg.reactions?.laugh || 0;

    if (likeCount === 0 && loveCount === 0 && laughCount === 0) return null;

    return (
      <div className="flex items-center space-x-2 text-xs mt-1">
        <div className="flex gap-1">
          {likeCount > 0 && (
            <button
              onClick={() => handleReaction(msg.id, "like")}
              className={`flex items-center bg-blue-500 rounded-full p-1 transition-transform hover:scale-110`}
            >
              <FaThumbsUp className={`w-3 h-3 text-white`} />
              <span className="ml-1 text-white text-xs">{likeCount}</span>
            </button>
          )}
          {loveCount > 0 && (
            <button
              onClick={() => handleReaction(msg.id, "love")}
              className={`flex items-center bg-red-500 rounded-full p-1 transition-transform hover:scale-110`}
            >
              <FaHeart className={`w-3 h-3 text-white`} />
              <span className="ml-1 text-white text-xs">{loveCount}</span>
            </button>
          )}
          {laughCount > 0 && (
            <button
              onClick={() => handleReaction(msg.id, "laugh")}
              className={`flex items-center bg-yellow-500 rounded-full p-1 transition-transform hover:scale-110`}
            >
              <FaLaugh className={`w-3 h-3 text-white`} />
              <span className="ml-1 text-white text-xs">{laughCount}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const ReactionPopup = ({
    messageId,
    currentReactions,
  }: {
    messageId: string;
    currentReactions: Message["reactions"];
  }) => {
    const [position, setPosition] = useState<"top" | "bottom">("top");
    const [horizontalOffset, setHorizontalOffset] = useState<
      "left" | "center" | "right"
    >("center");
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const HEADER_HEIGHT = 73;
        const MARGIN = 10;

        if (rect.top < HEADER_HEIGHT + MARGIN) {
          setPosition("bottom");
        } else if (rect.bottom > viewportHeight - MARGIN) {
          setPosition("top");
        } else {
          setPosition("top");
        }

        if (rect.right > viewportWidth - MARGIN) {
          setHorizontalOffset("left");
        } else if (rect.left < MARGIN) {
          setHorizontalOffset("right");
        } else {
          setHorizontalOffset("center");
        }
      }
    }, [messageId]);

    const getHorizontalClass = () => {
      switch (horizontalOffset) {
        case "left":
          return "right-0 translate-x-0";
        case "right":
          return "left-0 translate-x-0";
        default:
          return "left-1/2 -translate-x-1/2";
      }
    };

    return (
      <div
        ref={popupRef}
        className={`absolute ${
          position === "top" ? "bottom-full mb-2" : "top-full mt-2"
        } ${getHorizontalClass()} bg-white dark:bg-gray-700 rounded-full shadow-lg p-2 flex space-x-2 reaction-popup z-50`}
      >
        <button
          onClick={() => handleReaction(messageId, "like")}
          className={`hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-full transition-colors`}
        >
          <FaThumbsUp
            className={`${
              currentReactions.like > 0 ? "text-blue-500" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => handleReaction(messageId, "love")}
          className={`hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-full transition-colors`}
        >
          <FaHeart
            className={`${
              currentReactions.love > 0 ? "text-red-500" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => handleReaction(messageId, "laugh")}
          className={`hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-full transition-colors`}
        >
          <FaLaugh
            className={`${
              currentReactions.laugh > 0 ? "text-yellow-500" : "text-gray-400"
            }`}
          />
        </button>
      </div>
    );
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        Conversation not found
      </div>
    );
  }

  // Get the other participant
  const otherParticipant = currentConversation.participants.find(
    (p) => p.id !== currentUser.id
  );

  if (!otherParticipant) {
    return (
      <div className="flex items-center justify-center h-full">
        Invalid conversation data
      </div>
    );
  }

  return (
    <div
      className={`${
        darkMode ? "bg-white dark:bg-gray-800" : "bg-white"
      } flex flex-col h-screen`}
    >
      {/* Chat Header */}
      <div
        className={`p-4 border-b flex items-center space-x-3 ${
          darkMode ? "bg-gray-100 dark:bg-gray-700" : "bg-white"
        }`}
      >
        <Image
          src={otherParticipant.avatar}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full"
          alt="avatar"
        />
        <div className="flex-1 min-w-0">
          <h2
            className={`text-lg font-semibold truncate ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            {otherParticipant.name}
          </h2>
          {currentConversation.isTyping && (
            <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
              typing...
            </p>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {currentMessages.map((msg) => {
          const isMe = msg.sender.id === currentUser.id;
          const isSystem = msg.content.system && msg.content.system?.length > 0;
          return (
            <div
              key={msg.id}
              className={`flex ${
                isSystem
                  ? "justify-center"
                  : isMe
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-full ${
                  isMe ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                {!isMe && !isSystem && (
                  <Image
                    src={msg.sender.avatar}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    alt="avatar"
                  />
                )}

                <div
                  className={`relative ${
                    isSystem ? "p-0" : "p-3 rounded-lg"
                  } max-w-xs sm:max-w-sm break-words ${
                    isSystem
                      ? "text-gray-400 dark:text-gray-500 text-sm"
                      : isMe
                      ? darkMode
                        ? "bg-[#545556] text-white"
                        : "bg-[#dbdbdb] text-[#545556]"
                      : darkMode
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                      : "bg-gray-100 text-[#545556]"
                  }`}
                  onDoubleClick={() =>
                    isSystem ? null : setActiveReactionMessage(msg.id)
                  }
                >
                  <div className="space-y-2">
                    {msg.content.image && (
                      <div className="relative w-full">
                        <Image
                          src={msg.content.image}
                          alt="sent image"
                          width={200}
                          height={200}
                          className="rounded-md max-w-full h-auto object-contain"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23cccccc'/%3E%3C/svg%3E"
                        />
                      </div>
                    )}
                    {msg.content.text && (
                      <p className="break-words">{msg.content.text}</p>
                    )}

                    {msg.content.system && (
                      <p className="break-words">{msg.content.system}</p>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-300 dark:text-gray-400 mt-1">
                    <span
                      className={`${
                        darkMode ? "text-gray-400" : "text-[#696969]"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                    {isMe && !isSystem && (
                      <span className="flex items-center space-x-1">
                        {msg.status === "sent" && <span>✓</span>}
                        {msg.status === "delivered" && <span>✓✓</span>}
                        {msg.status === "read" && (
                          <span className="text-white dark:text-blue-400">
                            ✓✓
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {!isSystem && renderReactionCount(msg)}
                  {activeReactionMessage === msg.id && (
                    <ReactionPopup
                      messageId={msg.id}
                      currentReactions={msg.reactions}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {currentConversation.isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <Image
                src={otherParticipant.avatar}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
                alt="avatar"
              />
              <div
                className={`p-3 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Image Preview */}
      <div className={`p-3 border-t ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        {imagePreview && (
          <div className="relative inline-block mb-2">
            <Image
              src={imagePreview}
              alt="preview"
              width={100}
              height={100}
              className="rounded-md object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 flex mb-2 sm:mb-0">
            <input
              type="text"
              className={`flex-1 p-2 border rounded-md ${
                darkMode ? "bg-gray-700 text-white" : "text-black"
              }`}
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
            />
            <label
              htmlFor="image-upload"
              className="ml-2 flex items-center cursor-pointer"
            >
              <FaImage className="text-2xl text-gray-500 hover:text-blue-500" />
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-md sm:ml-2 w-full sm:w-auto"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
