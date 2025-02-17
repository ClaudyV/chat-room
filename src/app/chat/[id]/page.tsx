"use client";

import { FaHeart, FaImage, FaLaugh, FaThumbsUp, FaTimes } from "react-icons/fa";
import { Message, useChatStore } from "@/store/chatStore";
import {
  simulateBackgroundActivity,
  simulateResponse,
} from "@/services/webSocketSimulation";
import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const { id } = useParams();
  const {
    setSelectedChat,
    messages,
    conversations,
    addMessage,
    toggleReaction,
    markAsRead,
  } = useChatStore();
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeReactionMessage, setActiveReactionMessage] = useState<
    string | null
  >(null);
  const [bgActivityInitialized, setBgActivityInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentChatId = id as string;
  const currentMessages = useMemo(
    () => messages[currentChatId] || [],
    [messages, currentChatId]
  );
  const currentConversation = conversations.find((c) => c.id === currentChatId);

  useEffect(() => {
    if (!bgActivityInitialized) {
      simulateBackgroundActivity();
      setBgActivityInitialized(true);
    }
  }, [bgActivityInitialized]);

  useEffect(() => {
    setSelectedChat(currentChatId);
    // Mark messages as read when opening conversation
    markAsRead(currentChatId);
  }, [currentChatId, setSelectedChat, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  useEffect(() => {
    // Close reaction popup when clicking outside
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReaction = (
    messageId: string,
    reactionType: "like" | "love" | "laugh"
  ) => {
    toggleReaction(currentChatId, messageId, reactionType);
    setActiveReactionMessage(null);
  };

  const sendMessage = () => {
    if (!input.trim() && !image) return;
    if (!currentConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      sender: {
        id: "me",
        name: "You",
        avatar: "/avatars/you.jpg",
      },
      content: {
        ...(input.trim() && { text: input.trim() }),
        ...(imagePreview && { image: imagePreview }),
      },
      timestamp: new Date().toISOString(),
      reactions: { like: false, love: false, laugh: false },
      status: "sent",
    };

    addMessage(currentChatId, newMessage);
    setInput("");
    setImage(null);
    setImagePreview(null);
    simulateResponse(currentChatId, input.trim() || "image");
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
    const like = msg.reactions?.like || false;
    const love = msg.reactions?.love || false;
    const laugh = msg.reactions?.laugh || false;

    if (!like && !love && !laugh) return null;

    return (
      <div className="flex items-center space-x-2 text-xs mt-1">
        <div className="flex -space-x-1">
          {like && (
            <button
              onClick={() => handleReaction(msg.id, "like")}
              className={`bg-blue-500 rounded-full p-1 transition-transform hover:scale-110`}
            >
              <FaThumbsUp className={`w-3 h-3 text-white`} />
            </button>
          )}
          {love && (
            <button
              onClick={() => handleReaction(msg.id, "love")}
              className={`bg-red-500 rounded-full p-1 transition-transform hover:scale-110`}
            >
              <FaHeart className={`w-3 h-3 text-white`} />
            </button>
          )}
          {laugh && (
            <button
              onClick={() => handleReaction(msg.id, "laugh")}
              className={`bg-yellow-500 rounded-full p-1 transition-transform hover:scale-110`}
            >
              <FaLaugh className={`w-3 h-3 text-white`} />
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
              currentReactions.like ? "text-blue-500" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => handleReaction(messageId, "love")}
          className={`hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-full transition-colors`}
        >
          <FaHeart
            className={`${
              currentReactions.love ? "text-red-500" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => handleReaction(messageId, "laugh")}
          className={`hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-full transition-colors`}
        >
          <FaLaugh
            className={`${
              currentReactions.laugh ? "text-yellow-500" : "text-gray-400"
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
    (p) => p.id !== "me"
  );

  if (!otherParticipant) {
    return (
      <div className="flex items-center justify-center h-full">
        Invalid conversation data
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-800">
      {/* Chat Header */}
      <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b flex items-center space-x-3">
        <Image
          src={otherParticipant.avatar}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full"
          alt="avatar"
        />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
          const isMe = msg.sender.id === "me";

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start space-x-3 ${
                  isMe ? "flex-row-reverse" : ""
                }`}
              >
                {!isMe && (
                  <Image
                    src={msg.sender.avatar}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                    alt="avatar"
                  />
                )}

                <div
                  className={`relative p-3 rounded-lg max-w-xs ${
                    isMe
                      ? "bg-[#545556] text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  }`}
                  onDoubleClick={() => setActiveReactionMessage(msg.id)}
                >
                  <div className="space-y-2">
                    {msg.content.image && (
                      <Image
                        src={msg.content.image}
                        alt="sent image"
                        width={200}
                        height={200}
                        className="rounded-md"
                      />
                    )}
                    {msg.content.text && <p>{msg.content.text}</p>}
                  </div>
                  <div className="flex justify-between text-xs text-gray-300 dark:text-gray-400 mt-1">
                    <span>{formatTime(msg.timestamp)}</span>
                    {isMe && (
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
                  {renderReactionCount(msg)}
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
              <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
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
      <div className="p-3 border-t bg-white dark:bg-gray-800">
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
        <div className="flex">
          <input
            type="text"
            className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          />
          <label htmlFor="image-upload" className="ml-2 cursor-pointer">
            <FaImage className="text-2xl text-gray-500 hover:text-blue-500" />
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={sendMessage}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
