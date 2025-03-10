// Path: /frontend/src/app/dashboard/users/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { Button } from "@/components/Common/Button";
import { AddUserModal } from "@/components/User/AddUserModal";
import { EditUserModal } from "@/components/User/EditUserModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  UserRole,
} from "@/utils/userClient";

// User role options for filtering
const roleOptions = [
  { label: "All Roles", value: "" },
  { label: "Admin", value: "ADMIN" },
  { label: "Agent", value: "AGENT" },
  { label: "User", value: "USER" },
];

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<User | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getUsers();
      setUsers(response);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search term and selected role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone &&
        user.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = selectedRole ? user.role === selectedRole : true;

    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (userData: any) => {
    try {
      setIsLoading(true);

      // Create new user via API
      const newUser = await createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role as UserRole,
        phone: userData.phone || undefined,
        active: userData.active,
      });

      // Add user to local state
      setUsers((prevUsers) => [...prevUsers, newUser]);
      setSuccessMessage("User created successfully");
      setIsAddUserModalOpen(false);
      return newUser;
    } catch (error: any) {
      console.error("Error adding user:", error);
      setError(error.message || "Failed to add user. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (id: string, userData: any) => {
    try {
      setIsLoading(true);

      // Update user via API
      const updatedUser = await updateUser(id, {
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        phone: userData.phone,
        ...(userData.password ? { password: userData.password } : {}),
        ...(userData.removeAvatar ? { removeAvatar: true } : {}),
        ...(userData.avatarUrl ? { avatarUrl: userData.avatarUrl } : {}),
      });

      // Update in local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === id ? updatedUser : user))
      );

      setSuccessMessage("User updated successfully");
      setCurrentEditUser(null);
      setIsEditUserModalOpen(false);
      return updatedUser;
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError(error.message || "Failed to update user. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      setIsLoading(true);

      // Delete user via API
      const success = await deleteUser(id);

      if (success) {
        // Remove from local state
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
        setSuccessMessage("User deleted successfully");
      } else {
        setError("Failed to delete user. Please try again.");
      }

      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setError(error.message || "Failed to delete user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setCurrentEditUser(user);
    setIsEditUserModalOpen(true);
  };

  return (
    <Layout variant="dashboard">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>

          <div className="mt-4 md:mt-0">
            <Button onClick={() => setIsAddUserModalOpen(true)}>
              Add New User
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-800 hover:text-green-900"
            >
              &times;
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900"
            >
              &times;
            </button>
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="w-full md:w-48">
                <Select
                  options={roleOptions}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  placeholder="Filter by role"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && users.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Phone</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.phone || "—"}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded ${
                                user.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : user.role === "AGENT"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-primary hover:underline text-sm"
                              disabled={isLoading}
                            >
                              Edit
                            </button>
                            {confirmDeleteId === user.id ? (
                              <>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-destructive font-medium hover:underline text-sm"
                                  disabled={isLoading}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-foreground hover:underline text-sm"
                                  disabled={isLoading}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(user.id)}
                                className="text-destructive hover:underline text-sm"
                                disabled={
                                  isLoading || user.id === currentUser?.id
                                } // Prevent deleting yourself
                                title={
                                  user.id === currentUser?.id
                                    ? "You cannot delete your own account"
                                    : "Delete user"
                                }
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-gray-500"
                        >
                          {isLoading
                            ? "Loading users..."
                            : "No users found matching your criteria"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add User Modal */}
        {isAddUserModalOpen && (
          <AddUserModal
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
            onSubmit={handleAddUser}
          />
        )}

        {/* Edit User Modal */}
        {isEditUserModalOpen && currentEditUser && (
          <EditUserModal
            isOpen={isEditUserModalOpen}
            onClose={() => {
              setIsEditUserModalOpen(false);
              setCurrentEditUser(null);
            }}
            onSubmit={(userData) => handleEditUser(currentEditUser.id, userData)}
            user={currentEditUser}
          />
        )}
      </div>
    </Layout>
  );
}