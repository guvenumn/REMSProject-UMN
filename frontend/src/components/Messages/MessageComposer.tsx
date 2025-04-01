// Path: src/components/Messages/MessageComposer.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { searchUsers } from "@/utils/searchClient";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { TextArea } from "@/components/Common/TextArea";
import { Card } from "@/components/Common/Card";
import { Avatar } from "@/components/Common/Avatar";

interface MessageComposerProps {
  onSend: (
    recipientId: string,
    message: string,
    propertyId?: string
  ) => Promise<void>;
  propertyId?: string;
  propertyTitle?: string;
  initialRecipientId?: string;
  initialRecipientName?: string;
  placeholder?: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

// Define the expected search results structure
interface SearchResult {
  users?: Array<{
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  }>;
}

export default function MessageComposer({
  onSend,
  propertyId,
  propertyTitle,
  initialRecipientId,
  initialRecipientName,
  placeholder = "Type your message here...",
}: MessageComposerProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    initialRecipientId && initialRecipientName
      ? {
          id: initialRecipientId,
          name: initialRecipientName,
          email: "", // This field is just a placeholder
        }
      : null
  );
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiSearchFailed, setApiSearchFailed] = useState(false);
  const debouncedSearch = useDebounce(recipientSearch, 300);

  // Debug message and recipient
  useEffect(() => {
    console.log("Current message state:", message);
    console.log("Current recipient state:", selectedRecipient);
    console.log(
      "Send button should be disabled:",
      !message.trim() || !selectedRecipient
    );
  }, [message, selectedRecipient]);

  // Handle recipient search
  useEffect(() => {
    const searchForUsers = async () => {
      if (!debouncedSearch.trim() || debouncedSearch.length < 2) {
        setRecipients([]);
        setShowDropdown(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the searchUsers function
        const results: SearchResult = await searchUsers(debouncedSearch);

        // Check if we successfully got users
        const usersList = results?.users || [];

        if (usersList.length > 0) {
          // Filter out the current user
          const usersExcludingCurrent = usersList.filter(
            (u) => u.id !== user?.id
          );

          setRecipients(
            usersExcludingCurrent.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email || "",
              avatarUrl: u.avatarUrl,
            }))
          );

          setShowDropdown(usersExcludingCurrent.length > 0);

          // Reset API failure flag if we successfully got data
          if (apiSearchFailed) {
            setApiSearchFailed(false);
          }
        } else {
          // If we don't have users from the API
          console.warn("Search returned no users");
          setApiSearchFailed(true);
          setRecipients([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error("Error handling user search:", error);
        setError("Failed to search for users");
        setApiSearchFailed(true);
        setRecipients([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    };

    searchForUsers();
  }, [debouncedSearch, user, apiSearchFailed]);

  const handleRecipientSelect = (recipient: Recipient) => {
    console.log("Selected recipient:", recipient);
    setSelectedRecipient(recipient);
    setRecipientSearch("");
    setShowDropdown(false);
  };

  const handleSend = async () => {
    // Debug logs
    console.log("Send button clicked");
    console.log("Selected recipient:", selectedRecipient);
    console.log("Message content:", message);
    console.log("Property ID:", propertyId);

    if (!selectedRecipient) {
      console.warn("No recipient selected");
      setError("Please select a recipient");
      return;
    }

    if (!message.trim()) {
      console.warn("Message is empty");
      setError("Please enter a message");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Sending message...");
      await onSend(selectedRecipient.id, message, propertyId);
      console.log("Message sent successfully");

      // Clear form after sending
      setMessage("");
      if (!initialRecipientId) {
        setSelectedRecipient(null);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      {apiSearchFailed && (
        <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Note: User search may not be working correctly. API connection issues
          detected.
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">New Message</h2>

      {propertyTitle && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">Regarding Property:</p>
          <p className="font-medium">{propertyTitle}</p>
        </div>
      )}

      <div className="space-y-4">
        {!initialRecipientId && (
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Recipient
            </label>

            {selectedRecipient ? (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <Avatar
                    src={selectedRecipient.avatarUrl || ""}
                    alt={selectedRecipient.name}
                    size="sm"
                  />
                  <div className="ml-2">
                    <p className="font-medium">{selectedRecipient.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedRecipient.email}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecipient(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={recipientSearch}
                  onChange={(e) => {
                    setRecipientSearch(e.target.value);
                    if (e.target.value.trim()) {
                      setShowDropdown(true);
                    }
                  }}
                />

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {loading ? (
                      <div className="p-3 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : recipients.length > 0 ? (
                      <ul>
                        {recipients.map((recipient) => (
                          <li
                            key={recipient.id}
                            onClick={() => handleRecipientSelect(recipient)}
                            className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <Avatar
                              src={recipient.avatarUrl || ""}
                              alt={recipient.name}
                              size="sm"
                            />
                            <div className="ml-2">
                              <p className="font-medium">{recipient.name}</p>
                              <p className="text-xs text-gray-500">
                                {recipient.email}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Message
          </label>
          <TextArea
            rows={5}
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-gray-500 text-sm">
            {message.length > 0 && `${message.length} characters`}
          </div>
          <Button
            onClick={handleSend}
            disabled={loading || !message.trim() || !selectedRecipient}
          >
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
