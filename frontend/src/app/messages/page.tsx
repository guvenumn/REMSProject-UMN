// File: src/app/messages/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Common/Card";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { useAuth } from "@/contexts/AuthContext";
import {
  getConversations,
  updateConversationStatus,
  Conversation,
} from "@/utils/messageClient";
import { getInquiries, PropertyInquiry } from "@/utils/dashboardClient";
// Remove the Sidebar import since it's now in the layout
// import { Sidebar } from "@/components/Layout/Sidebar";

// Define proper types
interface MessageItemType {
  id: string;
  type: "inquiry" | "message";
  title: string;
  sender: string;
  date: string;
  content: string;
  status: string;
  propertyTitle: string;
  unread: boolean;
}

interface ConversationStats {
  totalMessages: number;
  totalInquiries: number;
  newInquiries: number;
  respondedInquiries: number;
  closedInquiries: number;
}

// Define types for the StatusDropdown component props
interface StatusDropdownProps {
  itemId: string;
  currentStatus: string;
  type: string;
}

// Define better types instead of using 'any'
interface ConversationWithInquiryStatus extends Conversation {
  isInquiry?: boolean;
  inquiryStatus?: "NEW" | "RESPONDED" | "CLOSED";
}

// Separate the component that uses useSearchParams into its own component
function MessagesPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get active filter from URL or default to "all"
  const activeFilter = searchParams?.get("filter") || "all";

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<
    ConversationWithInquiryStatus[]
  >([]);
  // Using empty destructuring instead of variable name
  const [, setInquiries] = useState<PropertyInquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("any");
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Stats for dashboard
  const [stats, setStats] = useState<ConversationStats>({
    totalMessages: 0,
    totalInquiries: 0,
    newInquiries: 0,
    respondedInquiries: 0,
    closedInquiries: 0,
  });

  // Fetch conversations and inquiries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch conversations
        const conversationsData = await getConversations();
        const conversationsList = Array.isArray(conversationsData)
          ? conversationsData
          : [];
        setConversations(conversationsList as ConversationWithInquiryStatus[]);

        // Fetch inquiries
        const inquiriesResponse = await getInquiries({ page: 1, limit: 100 });
        const inquiriesList = inquiriesResponse?.inquiries || [];
        setInquiries(inquiriesList);

        // Calculate correct stats based on our improved detection logic
        let regularMessageCount = 0;
        let inquiryCount = 0;
        let newInquiryCount = 0;
        let respondedInquiryCount = 0;
        let closedInquiryCount = 0;

        conversationsList.forEach((conv) => {
          // Cast to our extended type for type safety
          const extendedConv = conv as ConversationWithInquiryStatus;
          // Use the same logic as in getFilteredItems for consistency
          const hasInquiryFlag = Boolean(
            extendedConv.isInquiry || extendedConv.inquiryStatus
          );
          const hasPropertyAndMessage = Boolean(
            extendedConv.property &&
              extendedConv.lastMessage?.content?.includes("interested in")
          );

          const isInquiry = hasInquiryFlag || hasPropertyAndMessage;

          if (isInquiry) {
            inquiryCount++;

            // Count by status
            const status = extendedConv.inquiryStatus;
            if (status === "NEW" || !status) {
              newInquiryCount++;
            } else if (status === "RESPONDED") {
              respondedInquiryCount++;
            } else if (status === "CLOSED") {
              closedInquiryCount++;
            }
          } else {
            regularMessageCount++;
          }
        });

        setStats({
          totalMessages: regularMessageCount,
          totalInquiries: inquiryCount,
          newInquiries: newInquiryCount,
          respondedInquiries: respondedInquiryCount,
          closedInquiries: closedInquiryCount,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          "Failed to load messages and inquiries. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Combine and filter conversations and inquiries based on active filter and search
  const getFilteredItems = (): MessageItemType[] => {
    const items: MessageItemType[] = [];

    // Add regular conversations
    conversations.forEach((conv) => {
      // Get other participant name for display
      const otherParticipant = conv.participants?.find(
        (p) => p.id !== user?.id
      );
      const participantName = otherParticipant?.name || "Unknown";

      // More robust inquiry detection using multiple signals
      const hasInquiryFlag = Boolean(conv.isInquiry || conv.inquiryStatus);
      const hasPropertyAndMessage = Boolean(
        conv.property && conv.lastMessage?.content?.includes("interested in")
      );

      const isInquiry = hasInquiryFlag || hasPropertyAndMessage;

      items.push({
        id: conv.id,
        type: isInquiry ? "inquiry" : "message",
        title: conv.title || `Conversation with ${participantName}`,
        sender: participantName,
        date: conv.updatedAt || new Date().toISOString(),
        content: conv.lastMessage?.content || "No messages yet",
        status: conv.inquiryStatus || (isInquiry ? "NEW" : "N/A"),
        propertyTitle: conv.property?.title || "",
        unread: conv.unreadCount > 0,
      });
    });

    // Filter items based on active filter
    let filteredItems = [...items];

    if (activeFilter !== "all") {
      filteredItems = items.filter((item) => item.type === activeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.sender.toLowerCase().includes(search) ||
          item.content.toLowerCase().includes(search) ||
          item.propertyTitle.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.status === selectedStatus
      );
    }

    // Filter by date
    if (dateFilter !== "any") {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      filteredItems = filteredItems.filter((item) => {
        const itemDate = new Date(item.date);

        switch (dateFilter) {
          case "today":
            return itemDate >= today;
          case "yesterday":
            return itemDate >= yesterday && itemDate < today;
          case "week":
            return itemDate >= lastWeek;
          case "month":
            return itemDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Sort by date (newest first)
    return filteredItems.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const filteredItems = getFilteredItems();

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Compare year, month, and day
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    router.push(`/messages?filter=${filter}`);
  };

  // Get status badge style
  const getStatusBadge = (status: string): string => {
    switch (status) {
      case "NEW":
        return "bg-yellow-100 text-yellow-800";
      case "RESPONDED":
        return "bg-blue-100 text-blue-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  // Handle view/respond button click
  const handleViewMessage = (item: MessageItemType) => {
    router.push(`/messages/${item.id}`);
  };

  // Handle status change directly from the list
  const handleStatusChange = async (
    itemId: string,
    newStatus: "NEW" | "RESPONDED" | "CLOSED"
  ) => {
    if (!itemId || !newStatus || itemId === updatingStatus) return;

    setUpdatingStatus(itemId);

    try {
      await updateConversationStatus(itemId, newStatus);

      // Update conversations list in state
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === itemId) {
          return {
            ...conv,
            inquiryStatus: newStatus,
          };
        }
        return conv;
      });

      setConversations(updatedConversations);

      // Update stats
      const newStats: ConversationStats = { ...stats };

      // Determine the old status to decrement
      const oldItem = conversations.find((conv) => conv.id === itemId);
      const oldStatus = oldItem?.inquiryStatus || "NEW";

      // Decrement old status count
      if (oldStatus === "NEW")
        newStats.newInquiries = Math.max(0, newStats.newInquiries - 1);
      else if (oldStatus === "RESPONDED")
        newStats.respondedInquiries = Math.max(
          0,
          newStats.respondedInquiries - 1
        );
      else if (oldStatus === "CLOSED")
        newStats.closedInquiries = Math.max(0, newStats.closedInquiries - 1);

      // Increment new status count
      if (newStatus === "NEW") newStats.newInquiries++;
      else if (newStatus === "RESPONDED") newStats.respondedInquiries++;
      else if (newStatus === "CLOSED") newStats.closedInquiries++;

      setStats(newStats);
    } catch (err) {
      console.error("Error updating status:", err);
      // Show error notification in a real app
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Status dropdown component - Fixed to avoid conditional hook issue
  const StatusDropdown: React.FC<StatusDropdownProps> = ({
    itemId,
    currentStatus,
    type,
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Only show dropdown functionality for inquiries
    if (type !== "inquiry") {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
            currentStatus
          )}`}
        >
          {currentStatus !== "N/A" ? currentStatus : "-"}
        </span>
      );
    }

    const statuses = [
      { value: "NEW", label: "New" },
      { value: "RESPONDED", label: "Responded" },
      { value: "CLOSED", label: "Closed" },
    ];

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
            currentStatus
          )}`}
          disabled={updatingStatus === itemId}
        >
          {currentStatus}
          {updatingStatus === itemId ? (
            <svg className="w-3 h-3 ml-1 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-3 h-3 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-32 bg-white shadow-lg rounded-md z-10 border border-gray-200">
            <ul className="py-1">
              {statuses.map((status) => (
                <li key={status.value}>
                  <button
                    onClick={() => {
                      handleStatusChange(
                        itemId,
                        status.value as "NEW" | "RESPONDED" | "CLOSED"
                      );
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-sm ${
                      status.value === currentStatus
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    disabled={status.value === currentStatus}
                  >
                    {status.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Removed the Sidebar from here */}

      {/* Main Content */}
      <div className="p-2 sm:p-4 md:p-6 overflow-x-hidden">
        <div className="container mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">
              Messages & Inquiries
            </h1>
            <Button onClick={() => router.push("/messages/new")}>
              New Message
            </Button>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Card className="p-3 sm:p-4 bg-white text-center h-24 sm:h-28">
              <div className="text-xs sm:text-sm text-gray-500">
                Total Messages
              </div>
              <div className="text-xl sm:text-3xl font-bold mt-1 flex justify-center items-center h-10">
                {stats.totalMessages}
              </div>
            </Card>

            <Card className="p-3 sm:p-4 bg-white text-center h-24 sm:h-28">
              <div className="text-xs sm:text-sm text-gray-500">
                Total Inquiries
              </div>
              <div className="text-xl sm:text-3xl font-bold mt-1 flex justify-center items-center h-10">
                {stats.totalInquiries}
              </div>
            </Card>

            <Card className="p-3 sm:p-4 bg-white text-center h-24 sm:h-28">
              <div className="text-xs sm:text-sm text-yellow-500">
                New Inquiries
              </div>
              <div className="text-xl sm:text-3xl font-bold mt-1 text-yellow-600 flex justify-center items-center h-10">
                {stats.newInquiries}
              </div>
            </Card>

            <Card className="p-3 sm:p-4 bg-white text-center h-24 sm:h-28">
              <div className="text-xs sm:text-sm text-blue-500">
                Responded Inquiries
              </div>
              <div className="text-xl sm:text-3xl font-bold mt-1 text-blue-600 flex justify-center items-center h-10">
                {stats.respondedInquiries}
              </div>
            </Card>

            <Card className="p-3 sm:p-4 bg-white text-center h-24 sm:h-28">
              <div className="text-xs sm:text-sm text-green-500">
                Closed Inquiries
              </div>
              <div className="text-xl sm:text-3xl font-bold mt-1 text-green-600 flex justify-center items-center h-10">
                {stats.closedInquiries}
              </div>
            </Card>
          </div>

          {/* Filters Section */}
          <Card className="mb-4 sm:mb-6 p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {/* Message Type Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Message Type
                </label>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleFilterChange("all")}
                    className={`py-1 px-2 sm:py-2 sm:px-3 text-xs rounded-md ${
                      activeFilter === "all"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleFilterChange("message")}
                    className={`py-1 px-2 sm:py-2 sm:px-3 text-xs rounded-md ${
                      activeFilter === "message"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => handleFilterChange("inquiry")}
                    className={`py-1 px-2 sm:py-2 sm:px-3 text-xs rounded-md ${
                      activeFilter === "inquiry"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Inquiries
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search by subject, sender or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={[
                    { label: "All Statuses", value: "all" },
                    { label: "New", value: "NEW" },
                    { label: "Responded", value: "RESPONDED" },
                    { label: "Closed", value: "CLOSED" },
                  ]}
                />
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  options={[
                    { label: "Any Time", value: "any" },
                    { label: "Today", value: "today" },
                    { label: "Yesterday", value: "yesterday" },
                    { label: "Last 7 Days", value: "week" },
                    { label: "Last 30 Days", value: "month" },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 sm:mb-6">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="ml-2 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Messages & Inquiries Table */}
          {!loading && !error && (
            <Card className="overflow-hidden">
              {filteredItems.length === 0 ? (
                <div className="p-4 sm:p-8 text-center text-gray-500">
                  <p className="mb-4">No messages or inquiries found</p>
                  <Button onClick={() => router.push("/messages/new")}>
                    Start a Conversation
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-1 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="px-1 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[38%] sm:w-[28%]"
                        >
                          Subject
                        </th>
                        <th
                          scope="col"
                          className="px-1 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-[20%]"
                        >
                          Sender
                        </th>
                        <th
                          scope="col"
                          className="px-1 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell w-[15%]"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-1 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%] sm:w-[15%]"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-1 sm:px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%] sm:w-[15%]"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr
                          key={`${item.type}-${item.id}`}
                          className={item.unread ? "bg-blue-50" : ""}
                        >
                          <td className="px-1 sm:px-3 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                item.type === "inquiry"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {item.type === "inquiry" ? "Inquiry" : "Message"}
                            </span>
                          </td>
                          <td className="px-1 sm:px-3 py-2">
                            <div className="flex items-center">
                              {item.unread && (
                                <span
                                  className="w-2 h-2 bg-blue-600 rounded-full mr-1 flex-shrink-0"
                                  title="Unread"
                                ></span>
                              )}
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-[180px]">
                                {item.title}
                                {item.propertyTitle && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {item.propertyTitle}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 truncate sm:hidden">
                                  {item.sender}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-1 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-500 hidden sm:table-cell">
                            <div className="truncate max-w-[120px]">
                              {item.sender}
                            </div>
                          </td>
                          <td className="px-1 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-500 hidden md:table-cell">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-1 sm:px-3 py-2 whitespace-nowrap">
                            <StatusDropdown
                              itemId={item.id}
                              currentStatus={item.status}
                              type={item.type}
                            />
                          </td>
                          <td className="px-1 sm:px-3 py-2 whitespace-nowrap text-right text-xs">
                            <Button
                              size="sm"
                              onClick={() => handleViewMessage(item)}
                              className="text-xs py-1 px-1.5 sm:px-2"
                            >
                              <span className="sm:hidden">View</span>
                              <span className="hidden sm:inline">
                                View & Respond
                              </span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Create a loading UI for the suspense boundary - Remove Sidebar here too
function MessagesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="p-6">
        <div className="container mx-auto">
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the content in a Suspense boundary
export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesPageContent />
    </Suspense>
  );
}
