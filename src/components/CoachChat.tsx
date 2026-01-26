import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  ChatMessage, 
  CoachAction,
  sendMessageToCoach, 
  applyCoachAction, 
  generateMessageId 
} from "@/lib/coachChat";
import { toast } from "sonner";

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hey! I'm your FitTrack coach. You can tell me what you ate, ask about your plan, or let me know if you need to adjust your schedule. How can I help today?",
  timestamp: new Date(),
};

export function CoachChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<{ messageId: string; actions: CoachAction[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send all messages for context
      const allMessages = [...messages, userMessage];
      const response = await sendMessageToCoach(allMessages);

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        actions: response.actions,
        pendingConfirmation: response.requiresConfirmation && response.actions.length > 0,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If actions need confirmation, store them
      if (response.requiresConfirmation && response.actions.length > 0) {
        setPendingActions({ messageId: assistantMessage.id, actions: response.actions });
      } else if (response.actions.length > 0) {
        // Auto-apply actions that don't need confirmation
        response.actions.forEach(action => {
          const result = applyCoachAction(action);
          if (result.success && result.message) {
            toast.success(result.message);
          }
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMsg = error instanceof Error ? error.message : "Sorry, I'm having trouble right now. Please try again in a moment.";
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: errorMsg,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Show toast only for non-rate-limit errors
      if (!errorMsg.toLowerCase().includes("rate limit") && !errorMsg.toLowerCase().includes("too many requests")) {
        toast.error("Failed to get response");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmActions = () => {
    if (!pendingActions) return;

    pendingActions.actions.forEach(action => {
      const result = applyCoachAction(action);
      if (result.success && result.message) {
        toast.success(result.message);
      } else if (!result.success) {
        toast.error(result.message || "Failed to apply change");
      }
    });

    // Update message to show it's been confirmed
    setMessages(prev => prev.map(msg => 
      msg.id === pendingActions.messageId 
        ? { ...msg, pendingConfirmation: false }
        : msg
    ));

    setPendingActions(null);

    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: generateMessageId(),
      role: "assistant",
      content: "Done! I've applied those changes for you. Anything else?",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  const handleDeclineActions = () => {
    if (!pendingActions) return;

    setMessages(prev => prev.map(msg => 
      msg.id === pendingActions.messageId 
        ? { ...msg, pendingConfirmation: false }
        : msg
    ));

    setPendingActions(null);

    const declineMessage: ChatMessage = {
      id: generateMessageId(),
      role: "assistant",
      content: "No problem! Let me know if you'd like to try something else.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, declineMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "transition-all duration-300 hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isOpen && "rotate-90"
        )}
        aria-label={isOpen ? "Close chat" : "Open coach chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-40 right-4 z-[60] w-[calc(100vw-2rem)] max-w-sm",
          "bg-background border border-border rounded-2xl shadow-2xl",
          "transition-all duration-300 origin-bottom-right",
          "flex flex-col overflow-hidden",
          isOpen 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
        style={{ maxHeight: "min(70vh, 500px)" }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">FitTrack Coach</h3>
              <p className="text-xs text-muted-foreground">Ask me anything</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Confirmation buttons */}
                  {message.pendingConfirmation && pendingActions?.messageId === message.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-8 text-xs"
                        onClick={handleConfirmActions}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={handleDeclineActions}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 h-10 rounded-xl text-sm"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
