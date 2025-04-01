// File: /frontend/src/components/Messages/UnifiedInbox.tsx
import React, { useState, useEffect } from "react";
import { Card } from "@/components/Common/Card";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { Button } from "@/components/Common/Button";
import { useAuth } from "@/contexts/AuthContext";
import { getConversations, Conversation } from "@/utils/messageClient";
import {
  getInquiries,
  PropertyInquiry,
  InquiryResponse,
} from "@/utils/dashboardClient";

// Remove unused Participant interface and directly use the structure in the functions

// Combined type for the unified inbox
interface UnifiedItem {
  id: string;
  type: "message" | "inquiry";
  title: string;
  lastMessage?: string;
  timestamp: string;
  participants: {
    id: string;
    name: string;
    avatarUrl?: string;
  }[];
  propertyId?: string;
  propertyTitle?: string;
  status?: "NEW" | "RESPONDED" | "CLOSED";
  unread?: boolean;
}

export default function UnifiedInbox() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "messages" | "inquiries">("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages and inquiries
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch conversations first
        let conversationsData: Conversation[] = [];
        let messagesLoaded = false;
        try {
          conversationsData = await getConversations();
          messagesLoaded = true;
          console.log(
            "Conversations loaded successfully:",
            conversationsData.length
          );
        } catch (convError) {
          console.error("Error fetching conversations:", convError);
          setError(
            "Could not load messages. Backend service may be unavailable."
          );
        }

        // Transform conversations to unified format
        const messageItems: UnifiedItem[] = Array.isArray(conversationsData)
          ? conversationsData.map((conv) => ({
              id: conv.id || "unknown",
              type: "message",
              title:
                conv.title ||
                `Conversation with ${getOtherParticipantName(
                  conv.participants || [],
                  user?.id || "unknown"
                )}`,
              lastMessage: conv.lastMessage?.content || "No messages yet",
              timestamp:
                conv.updatedAt || conv.createdAt || new Date().toISOString(),
              participants: Array.isArray(conv.participants)
                ? conv.participants.map((p) => ({
                    id: p.userId || "unknown",
                    name: p.user?.name || "Unknown User",
                    avatarUrl: p.user?.avatarUrl || undefined,
                  }))
                : [],
              propertyId: conv.property?.id || undefined,
              propertyTitle: conv.property?.title || undefined,
              unread: (conv.unreadCount || 0) > 0,
              status: conv.inquiryStatus as
                | "NEW"
                | "RESPONDED"
                | "CLOSED"
                | undefined,
            }))
          : [];

        // Now try to fetch inquiries
        let inquiriesData: InquiryResponse = {
          inquiries: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          },
        };

        // Removing the unused variable
        // let inquiriesLoaded = false;

        try {
          console.log("Attempting to load inquiries...");
          const fetchedInquiries = await getInquiries({ page: 1, limit: 50 });
          inquiriesData = fetchedInquiries;

          // Validate the response structure
          if (inquiriesData && Array.isArray(inquiriesData.inquiries)) {
            // inquiriesLoaded = true; - This was unused
            console.log(
              "Inquiries loaded successfully:",
              inquiriesData.inquiries.length
            );
          } else {
            console.warn(
              "getInquiries returned unexpected format:",
              inquiriesData
            );
            // If the structure is invalid, reset to empty
            inquiriesData = {
              inquiries: [],
              pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
            };
          }
        } catch (inqError) {
          console.error("Error fetching inquiries:", inqError);
          if (!messagesLoaded) {
            setError(
              "Could not load messages or inquiries. Backend service may be unavailable."
            );
          } else {
            setError("Could not load inquiries. Some content may be missing.");
          }
        }

        // Transform inquiries to unified format
        const inquiryItems: UnifiedItem[] = Array.isArray(
          inquiriesData.inquiries
        )
          ? inquiriesData.inquiries.map((inq: PropertyInquiry) => ({
              id: inq.id || "unknown",
              type: "inquiry",
              title: `Inquiry: ${inq.propertyTitle || "Unknown Property"}`,
              lastMessage: inq.message || "",
              timestamp: inq.createdAt || new Date().toISOString(),
              participants: [
                {
                  id: inq.userId || "unknown",
                  name: inq.userName || "Unknown User",
                  avatarUrl: undefined,
                },
              ],
              propertyId: inq.propertyId,
              propertyTitle: inq.propertyTitle,
              status: inq.status as "NEW" | "RESPONDED" | "CLOSED",
              unread: inq.status === "NEW",
            }))
          : [];

        // Combine and sort by timestamp (newest first)
        const allItems = [...messageItems, ...inquiryItems].sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA; // newest first
        });

        console.log("Combined items:", allItems.length);
        setItems(allItems);

        // Select the first item if nothing is selected
        if (allItems.length > 0 && !selectedItem) {
          setSelectedItem(allItems[0]);
        }
      } catch (error) {
        console.error("Error fetching messages and inquiries:", error);
        setError("Failed to load communications. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedItem]);

  // Filter and search items
  const filteredItems = items.filter((item) => {
    // Apply type filter
    if (
      filter !== "all" &&
      item.type !== (filter === "messages" ? "message" : "inquiry")
    ) {
      return false;
    }

    // Apply search filter if there's a search term
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      const matchesTitle = item.title.toLowerCase().includes(searchTerm);
      const matchesMessage = item.lastMessage
        ?.toLowerCase()
        .includes(searchTerm);
      const matchesParticipants = item.participants.some((p) =>
        p.name.toLowerCase().includes(searchTerm)
      );
      const matchesProperty = item.propertyTitle
        ?.toLowerCase()
        .includes(searchTerm);

      return (
        matchesTitle || matchesMessage || matchesParticipants || matchesProperty
      );
    }

    return true;
  });

  // Helper function to get the name of the other participant
  function getOtherParticipantName(
    participants: {
      id: string;
      userId: string;
      name?: string | undefined;
      email?: string | undefined;
      avatarUrl?: string | undefined;
      isActive?: boolean | undefined;
      lastReadAt?: string | undefined;
      user?:
        | {
            name?: string | undefined;
            email?: string | undefined;
            avatarUrl?: string | undefined;
          }
        | undefined;
    }[],
    currentUserId: string
  ): string {
    if (!Array.isArray(participants) || participants.length === 0) {
      return "Unknown";
    }

    const otherParticipant = participants.find(
      (p) => p.userId !== currentUserId
    );

    if (!otherParticipant) {
      // If we can't find other participant, return the first one's name
      return participants[0]?.user?.name || "Unknown";
    }

    return otherParticipant?.user?.name || "Unknown";
  }

  // Helper function to format time ago
  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  }

  // Handle retrying the data fetch
  const handleRetry = () => {
    setError(null);
    setLoading(true);

    // Re-trigger the fetch by forcing a component update
    setItems([]);
    setSelectedItem(null);
  };

  // Handle item selection
  const handleSelectItem = (item: UnifiedItem) => {
    setSelectedItem(item);

    // Navigate to the appropriate view
    if (item.type === "message") {
      // Navigate to conversation detail
      window.location.href = `/messages/${item.id}`;
    } else {
      // Navigate to inquiry detail
      window.location.href = `/dashboard/inquiries?id=${item.id}`;
    }
  };

  // Create new message or inquiry
  const handleNewMessage = () => {
    // Navigate to new message form
    window.location.href = "/messages/new";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <Button onClick={handleRetry} size="sm" variant="outline">
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="mb-4">
            <div className="p-4">
              <div className="flex flex-col space-y-3">
                <Button onClick={handleNewMessage}>New Message</Button>

                <div className="flex space-x-2">
                  <Select
                    value={filter}
                    onChange={(e) =>
                      setFilter(
                        e.target.value as "all" | "messages" | "inquiries"
                      )
                    }
                    options={[
                      { label: "All", value: "all" },
                      { label: "Messages", value: "messages" },
                      { label: "Inquiries", value: "inquiries" },
                    ]}
                    className="w-full"
                  />
                </div>

                <Input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="divide-y">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {error
                    ? "Unable to load items. Please try again."
                    : `No ${
                        filter === "all" ? "messages or inquiries" : filter
                      } found`}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedItem?.id === item.id &&
                      selectedItem?.type === item.type
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <span
                            className={`font-medium ${
                              item.unread ? "text-blue-600" : ""
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.unread && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>

                        <div className="text-sm text-gray-500 mt-1 truncate">
                          {item.lastMessage}
                        </div>

                        {item.propertyTitle && (
                          <div className="text-xs text-gray-500 mt-1">
                            Property: {item.propertyTitle}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end min-w-[80px]">
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(item.timestamp)}
                        </div>

                        {item.type === "inquiry" && item.status && (
                          <span
                            className={`mt-1 text-xs px-2 py-0.5 rounded-full ${
                              item.status === "NEW"
                                ? "bg-blue-100 text-blue-800"
                                : item.status === "RESPONDED"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        )}

                        <span
                          className={`mt-1 text-xs px-2 py-0.5 rounded-full ${
                            item.type === "message"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {item.type === "message" ? "Message" : "Inquiry"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Main content area */}
        <div className="md:col-span-2">
          <Card>
            {!selectedItem ? (
              <div className="p-8 text-center text-gray-500">
                <p>Select a conversation or inquiry from the list</p>
                <p className="mt-2">or</p>
                <Button onClick={handleNewMessage} className="mt-2">
                  Start a new conversation
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedItem.title}
                  {selectedItem.type === "inquiry" && selectedItem.status && (
                    <span
                      className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                        selectedItem.status === "NEW"
                          ? "bg-blue-100 text-blue-800"
                          : selectedItem.status === "RESPONDED"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedItem.status}
                    </span>
                  )}
                </h2>

                {selectedItem.propertyTitle && (
                  <div className="text-sm text-gray-600 mb-4">
                    Property: {selectedItem.propertyTitle}
                  </div>
                )}

                <div className="text-sm mb-4">
                  <span className="font-medium">Participants: </span>
                  {selectedItem.participants.map((p) => p.name).join(", ")}
                </div>

                <p className="text-right text-xs text-gray-500">
                  Last activity: {formatTimeAgo(selectedItem.timestamp)}
                </p>

                <div className="mt-4 border-t pt-4">
                  <p className="font-medium">Preview:</p>
                  <p className="mt-2">{selectedItem.lastMessage}</p>

                  <div className="mt-6 text-center">
                    <Button onClick={() => handleSelectItem(selectedItem)}>
                      View Full{" "}
                      {selectedItem.type === "message"
                        ? "Conversation"
                        : "Inquiry"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
