// file: /frontend/src/components/Messages/UnreadIndicator.ts

import React, { useState, useEffect } from "react";
import { getConversations } from "@/utils/messageClient";

type UnreadIndicatorProps = {
  currentUserId: string;
};

export const UnreadIndicator: React.FC<UnreadIndicatorProps> = ({
  currentUserId,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip if no user ID is provided
    if (!currentUserId) {
      console.log("[UnreadIndicator] No user ID provided, not fetching");
      setLoading(false);
      return;
    }

    const fetchUnreadMessages = async () => {
      try {
        console.log("[UnreadIndicator] Fetching conversations");
        setLoading(true);

        // Get all conversations
        const conversations = await getConversations();
        console.log(
          "[UnreadIndicator] Fetched conversations:",
          conversations.length
        );

        // Calculate total unread messages from conversation objects
        const totalUnread = conversations.reduce((total, conv) => {
          return total + (conv.unreadCount || 0);
        }, 0);

        console.log("[UnreadIndicator] Total unread count:", totalUnread);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("[UnreadIndicator] Error fetching conversations:", error);
        // Don't modify the unread count on error
      } finally {
        setLoading(false);
      }
    };

    // Fetch on component mount
    fetchUnreadMessages();

    // Set up interval to refresh count periodically
    const interval = setInterval(fetchUnreadMessages, 30000); // Poll every 30 seconds

    // Clean up on unmount
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Don't render anything if loading or no unread messages
  if (loading || unreadCount === 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-bold text-white bg-red-500 rounded-full">
      {unreadCount > 9 ? "9+" : unreadCount}
    </div>
  );
};

export default UnreadIndicator;
