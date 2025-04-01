// Folder: src/app/dashboard/inquiries/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getFilteredConversations,
  updateConversationStatus,
} from "@/utils/messageClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/Common/Button";
import { Card } from "@/components/Common/Card";

interface Inquiry {
  id: string;
  inquiryStatus: "NEW" | "RESPONDED" | "CLOSED";
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  messages?: { createdAt: string }[];
  participants?: {
    userId: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    user?: { name?: string; email?: string; avatarUrl?: string };
  }[];
  property?: {
    id: string;
    title: string;
  };
}

interface Stats {
  total: number;
  new: number;
  responded: number;
  closed: number;
}

export default withSuspense(function DashboardInquiriesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    responded: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(
    null
  );

  // Fetch inquiries and calculate stats
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        let inquiryConversations: Inquiry[] = [];
        try {
          if (filter !== "ALL") {
            inquiryConversations = await getFilteredConversations({
              isInquiry: true,
              status: filter as "NEW" | "RESPONDED" | "CLOSED",
            });
          } else {
            inquiryConversations = await getFilteredConversations({
              isInquiry: true,
            });
          }

          if (inquiryConversations.length > 0) {
            console.log(
              "First inquiry conversation:",
              JSON.stringify(inquiryConversations[0], null, 2)
            );
          }

          // Ensure each conversation has a valid createdAt and inquiryStatus
          inquiryConversations = inquiryConversations.map((conversation) => {
            const validCreatedAt =
              conversation.createdAt && conversation.createdAt !== ""
                ? conversation.createdAt
                : conversation.updatedAt ||
                  conversation.lastMessageAt ||
                  (conversation.messages && conversation.messages.length > 0
                    ? conversation.messages[0]?.createdAt
                    : new Date().toISOString());
            return {
              ...conversation,
              createdAt: validCreatedAt,
              inquiryStatus: conversation.inquiryStatus
                ? conversation.inquiryStatus
                : "NEW",
            };
          });
        } catch (err) {
          console.error("Failed to get filtered conversations:", err);
          inquiryConversations = [];
        }

        const calcStats: Stats = {
          total: inquiryConversations.length,
          new: 0,
          responded: 0,
          closed: 0,
        };

        inquiryConversations.forEach((conversation) => {
          if (conversation.inquiryStatus === "NEW") calcStats.new++;
          else if (conversation.inquiryStatus === "RESPONDED")
            calcStats.responded++;
          else if (conversation.inquiryStatus === "CLOSED") calcStats.closed++;
        });

        setStats(calcStats);
        setInquiries(inquiryConversations);
      } catch (err) {
        console.error("Error in dashboard inquiries page:", err);
        setError(
          "There was an error loading your inquiries. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, filter]);

  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    console.log(`Formatting date: ${dateString}`);
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${dateString}`);
        return "N/A";
      }
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error(`Error formatting date (${dateString}):`, error);
      return "N/A";
    }
  };

  // Get CSS classes for the status badge
  const getStatusBadgeClass = (
    status: "NEW" | "RESPONDED" | "CLOSED" | string
  ): string => {
    switch (status) {
      case "NEW":
        return "bg-yellow-100 text-yellow-800";
      case "RESPONDED":
        return "bg-blue-100 text-blue-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle status change with improved error handling
  const handleStatusChange = async (
    inquiryId: string,
    newStatus: "NEW" | "RESPONDED" | "CLOSED"
  ) => {
    setStatusUpdating(inquiryId);

    // First update UI immediately (optimistic update)
    // Store original status in case we need to revert
    const originalInquiry = inquiries.find(
      (inquiry) => inquiry.id === inquiryId
    );
    const originalStatus = originalInquiry?.inquiryStatus;

    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === inquiryId
          ? { ...inquiry, inquiryStatus: newStatus }
          : inquiry
      )
    );

    // Update stats immediately
    const updatedStats = { ...stats };
    if (originalInquiry) {
      if (originalStatus === "NEW") updatedStats.new--;
      else if (originalStatus === "RESPONDED") updatedStats.responded--;
      else if (originalStatus === "CLOSED") updatedStats.closed--;

      if (newStatus === "NEW") updatedStats.new++;
      else if (newStatus === "RESPONDED") updatedStats.responded++;
      else if (newStatus === "CLOSED") updatedStats.closed++;

      setStats(updatedStats);
    }

    try {
      const result = await updateConversationStatus(inquiryId, newStatus);
      if (!result) {
        console.log(
          `Status change to ${newStatus} may have failed but UI is updated`
        );
      } else {
        console.log(`Status updated to ${newStatus} successfully`);
      }
    } catch (error) {
      console.error("Error in status update handler:", error);
      // Optionally, revert UI update if desired.
    } finally {
      setStatusUpdating(null);
      setOpenStatusDropdown(null);
    }
  };

  // Get participant's name with fallbacks
  const getParticipantName = (inquiry: Inquiry): string => {
    const otherParticipant = inquiry.participants?.find(
      (p) => p.userId !== user?.id
    );
    if (!otherParticipant) return "User";
    return (
      otherParticipant.name ||
      otherParticipant.user?.name ||
      otherParticipant.email ||
      otherParticipant.user?.email ||
      "User"
    );
  };

  // Get participant's avatar with fallbacks
  const getParticipantAvatar = (inquiry: Inquiry): string | null => {
    const otherParticipant = inquiry.participants?.find(
      (p) => p.userId !== user?.id
    );
    if (!otherParticipant) return null;
    return (
      otherParticipant.avatarUrl || otherParticipant.user?.avatarUrl || null
    );
  };

  // Get participant's email with fallbacks
  const getParticipantEmail = (inquiry: Inquiry): string => {
    const otherParticipant = inquiry.participants?.find(
      (p) => p.userId !== user?.id
    );
    if (!otherParticipant) return "";
    return otherParticipant.email || otherParticipant.user?.email || "";
  };

  // Toggle the status dropdown for an inquiry
  const toggleStatusDropdown = (inquiryId: string) => {
    setOpenStatusDropdown((prev) => (prev === inquiryId ? null : inquiryId));
  };

  // Determine the best available date for the inquiry
  const getInquiryDate = (inquiry: Inquiry): string | undefined => {
    return (
      inquiry.createdAt ||
      inquiry.updatedAt ||
      inquiry.lastMessageAt ||
      (inquiry.messages && inquiry.messages.length > 0
        ? inquiry.messages[0]?.createdAt
        : "")
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Property Inquiries</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Inquiries</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">New</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.new}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Responded</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.responded}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Closed</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.closed}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex mb-4 border-b">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 ${
            filter === "ALL"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500"
          }`}
        >
          All Inquiries
        </button>
        <button
          onClick={() => setFilter("NEW")}
          className={`px-4 py-2 ${
            filter === "NEW"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500"
          }`}
        >
          New
          {stats.new > 0 && (
            <span className="ml-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
              {stats.new}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("RESPONDED")}
          className={`px-4 py-2 ${
            filter === "RESPONDED"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500"
          }`}
        >
          Responded
        </button>
        <button
          onClick={() => setFilter("CLOSED")}
          className={`px-4 py-2 ${
            filter === "CLOSED"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500"
          }`}
        >
          Closed
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 text-red-600 rounded-md mb-4">
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Inquiries List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2">No inquiries found</h2>
          <p className="text-gray-500">
            {filter === "ALL"
              ? "You don't have any property inquiries yet."
              : `You don't have any ${filter.toLowerCase()} inquiries.`}
          </p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inquiries.map((inquiry) => {
                  const clientName = getParticipantName(inquiry);
                  const clientEmail = getParticipantEmail(inquiry);
                  const clientAvatar = getParticipantAvatar(inquiry);
                  const initials = clientName?.charAt(0)?.toUpperCase() || "?";
                  const inquiryDate = getInquiryDate(inquiry);
                  return (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            {clientAvatar ? (
                              <Image
                                className="rounded-full"
                                src={clientAvatar}
                                alt={clientName}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-500">
                                  {initials}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{clientName}</div>
                            <div className="text-sm text-gray-500">
                              {clientEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inquiry.property ? (
                          <Link
                            href={`/properties/${inquiry.property.id}`}
                            className="text-primary hover:underline"
                          >
                            {inquiry.property.title}
                          </Link>
                        ) : (
                          <span className="text-gray-500">No property</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(inquiryDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            className={`inline-flex items-center px-2.5 py-1.5 text-xs rounded-full ${getStatusBadgeClass(
                              inquiry.inquiryStatus
                            )}`}
                            onClick={() => toggleStatusDropdown(inquiry.id)}
                            disabled={statusUpdating === inquiry.id}
                          >
                            {inquiry.inquiryStatus || "NEW"}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 ml-1 ${
                                statusUpdating === inquiry.id
                                  ? "animate-spin"
                                  : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={
                                  statusUpdating === inquiry.id
                                    ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    : "M19 9l-7 7-7-7"
                                }
                              />
                            </svg>
                          </button>
                          {openStatusDropdown === inquiry.id && (
                            <div className="absolute left-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10">
                              <div className="py-1">
                                <button
                                  className={`block w-full text-left px-4 py-2 text-sm ${
                                    inquiry.inquiryStatus === "NEW"
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                  onClick={() =>
                                    handleStatusChange(inquiry.id, "NEW")
                                  }
                                  disabled={inquiry.inquiryStatus === "NEW"}
                                >
                                  New
                                </button>
                                <button
                                  className={`block w-full text-left px-4 py-2 text-sm ${
                                    inquiry.inquiryStatus === "RESPONDED"
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                  onClick={() =>
                                    handleStatusChange(inquiry.id, "RESPONDED")
                                  }
                                  disabled={
                                    inquiry.inquiryStatus === "RESPONDED"
                                  }
                                >
                                  Responded
                                </button>
                                <button
                                  className={`block w-full text-left px-4 py-2 text-sm ${
                                    inquiry.inquiryStatus === "CLOSED"
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                  onClick={() =>
                                    handleStatusChange(inquiry.id, "CLOSED")
                                  }
                                  disabled={inquiry.inquiryStatus === "CLOSED"}
                                >
                                  Closed
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/messages/${inquiry.id}`)}
                        >
                          View &amp; Respond
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
});
