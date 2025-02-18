import { Message, Participant, useChatStore } from "@/store/chatStore";

// Mock responses for different conversation types
const MOCK_RESPONSES: Record<string, string[]> = {
  default: [
    "Sure, I'll get back to you soon!",
    "Thanks for letting me know.",
    "That's interesting. Tell me more!",
    "Got it, I'll check and respond later.",
    "I see what you mean. Let me think about that.",
  ],
  alice: [
    "Hey, just saw your message! How's your day going?",
    "Have you tried that new restaurant downtown?",
    "Let's meet up this weekend if you're free!",
    "Did you finish that project we talked about?",
    "I'm sending you that file you requested.",
  ],
  bob: [
    "Thanks for the update on the meeting!",
    "I'll be there at 3 PM, does that work?",
    "Just finished the report, will share it soon.",
    "Can we reschedule our call to tomorrow?",
    "I saw your email, will respond in detail shortly.",
  ],
};

// Get response based on participant name
const getResponsesForParticipant = (name: string): string[] => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("alice")) return MOCK_RESPONSES.alice;
  if (lowerName.includes("bob")) return MOCK_RESPONSES.bob;
  return MOCK_RESPONSES.default;
};

// Get a random response from the appropriate list
const getRandomResponse = (name: string): string => {
  const responses = getResponsesForParticipant(name);
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// Generate a simulated response with typing indicator
export const simulateResponse = (
  conversationId: string,
  senderMessage: string,
  currentUser: Participant
) => {
  const store = useChatStore.getState();
  const conversation = store.conversations.find((c) => c.id === conversationId);

  if (!conversation) return;

  const sender = conversation.participants.find((p) => p.id !== currentUser.id);
  if (!sender) return;

  store.updateConversation(conversationId, {
    isTyping: true,
  });

  const typingDelay = Math.max(1000, Math.min(3000, senderMessage.length * 30));

  setTimeout(() => {
    store.updateConversation(conversationId, { isTyping: false });

    const responseText = getRandomResponse(sender.name);

    const responseMessage: Message = {
      id: `msg_${Date.now()}`,
      sender: sender,
      content: { text: responseText },
      timestamp: new Date().getTime(),
      reactions: { like: 0, love: 0, laugh: 0 },
      status: "sent",
    };

    store.addMessage(conversationId, responseMessage);

    setTimeout(() => {
      store.updateMessage(conversationId, responseMessage.id, {
        status: "delivered",
      });

      if (store.selectedChatId === conversationId) {
        setTimeout(() => {
          store.updateMessage(conversationId, responseMessage.id, {
            status: "read",
          });
        }, 1500);
      }
    }, 1000);
  }, typingDelay);
};

// Simulate automatic responses for inactive chats (to create the illusion of active conversations)
export const simulateBackgroundActivity = () => {
  const store = useChatStore.getState();
  const { conversations, selectedChatId, currentUser } = store;

  const runSimulation = () => {
    const inactiveChats = conversations.filter(
      (conv) => conv.id !== selectedChatId
    );

    if (inactiveChats.length > 0) {
      const randomIndex = Math.floor(Math.random() * inactiveChats.length);
      const randomChat = inactiveChats[randomIndex];

      const sender = randomChat.participants.find(
        (p) => p.id !== currentUser.id
      );
      if (!sender) return;

      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        sender: sender,
        content: { text: getRandomResponse(sender.name) },
        timestamp: new Date().getTime(),
        reactions: { like: 0, love: 0, laugh: 0 },
        status: "sent",
      };

      store.addMessage(randomChat.id, newMessage);

      setTimeout(() => {
        store.updateMessage(randomChat.id, newMessage.id, {
          status: "delivered",
        });
      }, 1000);
    }

    const nextDelay = 30000 + Math.floor(Math.random() * 60000);
    setTimeout(runSimulation, nextDelay);
  };

  setTimeout(runSimulation, 45000);
};
