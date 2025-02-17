import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Participant {
  id: string;
  name: string;
  avatar: string;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isTyping?: boolean;
}

type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  sender: Participant;
  content: {
    text?: string;
    image?: string;
  };
  timestamp: string;
  reactions: Record<"like" | "love" | "laugh", boolean>;
  status: "sent" | "delivered" | "read";
}

interface ChatState {
  // State
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  selectedChatId: string | null;
  currentUser: Participant;

  // Actions
  setSelectedChat: (id: string) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  toggleReaction: (
    conversationId: string,
    messageId: string,
    reactionType: "like" | "love" | "laugh"
  ) => void;
  markAsRead: (conversationId: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Record<string, Message[]>) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      messages: {},
      selectedChatId: null,
      currentUser: { id: "me", name: "You", avatar: "/avatars/you.jpg" },

      setSelectedChat: (id) => set({ selectedChatId: id }),

      setConversations: (conversations) => set({ conversations }),

      setMessages: (messages) => set({ messages }),

      addConversation: (conversation) => {
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          messages: {
            ...state.messages,
            [conversation.id]: [],
          },
        }));
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, ...updates } : conv
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          const conversationMessages = [
            ...(state.messages[conversationId] || []),
            message,
          ];
      
          const updatedConversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              // Only increment unreadCount if the message is not from the current user
              // AND the conversation is not currently selected
              const shouldIncrementUnread = 
                message.sender.id !== "me" && 
                state.selectedChatId !== conversationId;
              
              return {
                ...conv,
                lastMessage: message.content.text || "Sent an image",
                timestamp: message.timestamp,
                unreadCount: shouldIncrementUnread
                  ? (conv.unreadCount || 0) + 1
                  : conv.unreadCount,
              };
            }
            return conv;
          });
      
          return {
            messages: {
              ...state.messages,
              [conversationId]: conversationMessages,
            },
            conversations: updatedConversations,
          };
        });
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => {
          const updatedMessages =
            state.messages[conversationId]?.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ) || [];

          return {
            messages: {
              ...state.messages,
              [conversationId]: updatedMessages,
            },
          };
        });
      },

      toggleReaction: (conversationId, messageId, reactionType) => {
        set((state) => {
          const updatedMessages =
            state.messages[conversationId]?.map((msg) => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  reactions: {
                    ...msg.reactions,
                    [reactionType]: !msg.reactions[reactionType],
                  },
                };
              }
              return msg;
            }) || [];

          return {
            messages: {
              ...state.messages,
              [conversationId]: updatedMessages,
            },
          };
        });
      },

      markAsRead: (conversationId) => {
        set((state) => {
          const updatedMessages =
            state.messages[conversationId]?.map((msg) => {
              if (msg.sender.id !== "me" && msg.status !== "read") {
                return { ...msg, status: "read" as MessageStatus };
              }
              return msg;
            }) || [];

          const updatedConversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          });

          return {
            messages: {
              ...state.messages,
              [conversationId]: updatedMessages,
            },
            conversations: updatedConversations,
          };
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
        currentUser: state.currentUser,
      }),
    }
  )
);

export const initializeStore = async () => {
  try {
    const [conversationsResponse, messagesResponse] = await Promise.all([
      fetch("/mock/conversations.json"),
      fetch("/mock/messages.json"),
    ]);

    if (!conversationsResponse.ok || !messagesResponse.ok) {
      throw new Error("Failed to fetch data");
    }

    const conversations: Conversation[] = await conversationsResponse.json();
    const messages: Record<string, Message[]> = await messagesResponse.json();

    useChatStore.setState({
      conversations,
      messages,
    });
  } catch (error) {
    console.error("Error initializing chat store:", error);
  }
};
