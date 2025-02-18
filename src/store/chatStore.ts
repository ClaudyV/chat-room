import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Participant {
  id: string;
  name: string;
  avatar: string;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: string;
  timestamp: number;
  unreadCount?: number;
  isTyping?: boolean;
}

interface JsonConversation {
  id: number;
  participants: {
    userId: number;
    user: string;
    avatar: string;
  }[];
  lastMessage: string;
  timestamp: number;
}

type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  sender: Participant;
  content: {
    text?: string;
    image?: string;
    system?: string;
  };
  timestamp: number;
  reactions: {
    like: number;
    love: number;
    laugh: number;
  };
  status: "sent" | "delivered" | "read";
}

export interface JsonMessage {
  id: string;
  conversationId: number | string;
  userId: number | string;
  user: string;
  avatar: string;
  messageType: "text" | "image" | "system";
  message: string;
  image?: string;
  reactions: {
    like: number;
    love: number;
    laugh: number;
  };
  timestamp: number;
  status?: "sent" | "delivered" | "read";
}

interface ChatState {
  // State
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  selectedChatId: string | null;
  currentUser: Participant;
  darkMode: boolean;

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
  toggleDarkMode: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      messages: {},
      selectedChatId: null,
      currentUser: { id: "me", name: "You", avatar: "/avatars/you.jpg" }, // Default
      darkMode: true,
      setSelectedChat: (id) => {
        set((state) => {
          const selectedConversation = state.conversations.find(
            (conv) => conv.id === id
          );

          if (
            selectedConversation &&
            selectedConversation.participants.length >= 2
          ) {
            return {
              selectedChatId: id,
              currentUser: selectedConversation.participants[1],
            };
          }

          return { selectedChatId: id };
        });
      },
      setConversations: (conversations) => {
        const firstConversation = conversations[0];
        if (firstConversation && firstConversation.participants.length >= 2) {
          set({
            currentUser: firstConversation.participants[1],
          });
        }
        set({ conversations });
      },
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
              const shouldIncrementUnread =
                message.sender.id !== state.currentUser.id &&
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
                    [reactionType]: msg.reactions[reactionType] + 1,
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
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
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

    const conversations: JsonConversation[] =
      await conversationsResponse.json();
    const jsonMessages: JsonMessage[] = await messagesResponse.json();

    const transformedConversations = transformConversations(conversations);
    const transformedMessages = transformMessages(jsonMessages, conversations);

    useChatStore.setState({
      conversations: transformedConversations,
      messages: transformedMessages,
    });
  } catch (error) {
    console.error("Error initializing chat store:", error);
  }
};

export function transformMessages(
  jsonMessages: JsonMessage[],
  conversations: JsonConversation[]
): Record<string, Message[]> {
  const messagesByConversation: Record<string, JsonMessage[]> = {};

  jsonMessages.forEach((msg) => {
    const convId = `${msg.conversationId}`;
    if (!messagesByConversation[convId]) {
      messagesByConversation[convId] = [];
    }
    messagesByConversation[convId].push(msg);
  });

  const transformedMessages: Record<string, Message[]> = {};

  Object.keys(messagesByConversation).forEach((convId) => {
    const conversation = conversations.find((c) => `${c.id}` === convId);
    if (!conversation) return;

    const currentUser = conversation.participants[1];

    transformedMessages[convId] = messagesByConversation[convId].map((msg) => {
      const isCurrentUser = msg.userId === currentUser.userId;

      const sender: Participant = isCurrentUser
        ? {
            id: currentUser.userId.toString(),
            name: currentUser.user,
            avatar: currentUser.avatar,
          }
        : {
            id: conversation.participants[0].userId.toString(),
            name: conversation.participants[0].user,
            avatar: conversation.participants[0].avatar,
          };

      return {
        id: `msg_${msg.timestamp}`,
        sender,
        content:
          msg.messageType === "text"
            ? { text: msg.message }
            : msg.messageType === "system"
            ? { system: msg.message }
            : { image: msg.message },
        timestamp: msg.timestamp,
        reactions: msg.reactions,
        status: isCurrentUser ? "delivered" : "sent",
      };
    });
  });
  return transformedMessages;
}

function transformConversations(
  conversations: JsonConversation[]
): Conversation[] {
  return conversations.map((conv) => {
    const participants = conv.participants.map((participant) => {
      return {
        id: participant.userId.toString(),
        name: participant.user,
        avatar: participant.avatar,
      };
    });
    return {
      ...conv,
      id: conv.id.toString(),
      timestamp: conv.timestamp,
      participants,
    };
  });
}
