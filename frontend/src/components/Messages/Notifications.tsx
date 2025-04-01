// file /var/www/rems/frontend/src/components/Messages/Notifications.tsx

import React, { useState, useEffect, useRef } from "react";
import { getUnreadCount } from "@/utils/messageClient";

type NotificationsProps = {
  currentUserId: string;
};

export const Notifications: React.FC<NotificationsProps> = ({
  currentUserId,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // Add these for troubleshooting
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(false);

  // Add this immediately to log the passed props on each render
  console.log("[Notifications] Rendering with userId:", currentUserId);

  useEffect(() => {
    // Log that the component mounted
    console.log("[Notifications] Component mounted, userId:", currentUserId);
    mountedRef.current = true;

    // Function to get the unread count
    const fetchUnreadCount = async () => {
      // Skip if no user ID
      if (!currentUserId) {
        console.log("[Notifications] No userId provided, skipping fetch");
        setLoading(false);
        return;
      }

      try {
        console.log(
          "[Notifications] Starting fetch for userId:",
          currentUserId
        );
        setLoading(true);

        // Make the API call
        const result = await getUnreadCount();
        console.log("[Notifications] API response:", result);

        // Update state if component is still mounted
        if (mountedRef.current) {
          const count = result?.count || 0;
          console.log("[Notifications] Setting unread count to:", count);
          setUnreadCount(count);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (error) {
        console.error("[Notifications] Error fetching unread count:", error);
        // Update state if component is still mounted
        if (mountedRef.current) {
          setUnreadCount(0);
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up interval for polling
    const interval = setInterval(fetchUnreadCount, 30000);

    // Cleanup function
    return () => {
      console.log("[Notifications] Component unmounting");
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [currentUserId]);

  // Log the rendering decision
  useEffect(() => {
    console.log("[Notifications] Render state:", {
      loading,
      unreadCount,
      willRender: !loading && unreadCount > 0,
      lastUpdated: lastUpdated?.toISOString(),
    });
  }, [loading, unreadCount, lastUpdated]);

  // Determine whether to render anything
  if (loading) {
    console.log("[Notifications] Still loading, not rendering badge");
    return null;
  }

  if (unreadCount === 0) {
    console.log("[Notifications] No unread messages, not rendering badge");
    return null;
  }

  // Render the badge
  console.log("[Notifications] Rendering badge with count:", unreadCount);
  return (
    <div className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-bold text-white bg-red-500 rounded-full">
      {unreadCount > 9 ? "9+" : unreadCount}
    </div>
  );
};

export default Notifications;
