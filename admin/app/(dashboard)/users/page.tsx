"use client";

import React, { useEffect, useState } from "react";
import { UsersTable } from "@/components/users/users-table";
import { UserFilter } from "@/components/users/user-filter";
import { usersApi } from "@/lib/api";
import { User } from "@/types/user";
import { toast } from "sonner"; // Import toast from sonner

// Define the expected response type from the API
interface UsersResponse {
  users: User[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // Add type assertion to handle the API response
        const data = (await usersApi.getAll()) as UsersResponse;
        setUsers(data.users);
        setFilteredUsers(data.users);
        setError(null);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users data");
        toast.error("Failed to load users data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []); // Removed toast from dependency array since it's not a hook

  // Handle user block/unblock
  const handleBlockStatusChange = async (
    userId: number,
    isBlocked: boolean
  ) => {
    try {
      if (isBlocked) {
        await usersApi.unblock(userId);
        toast.success("User has been unblocked");
      } else {
        await usersApi.block(userId);
        toast.success("User has been blocked");
      }

      // Update user in the state
      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, is_blocked: !isBlocked } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(
        filteredUsers.map((user) =>
          user.id === userId ? { ...user, is_blocked: !isBlocked } : user
        )
      );
    } catch (error) {
      console.error("Error updating user block status:", error);
      toast.error(`Failed to ${isBlocked ? "unblock" : "block"} user`);
    }
  };

  // Filter users
  const handleFilter = (filters: {
    name?: string;
    email?: string;
    status?: "all" | "blocked" | "active" | "verified";
  }) => {
    let result = [...users];

    if (filters.name) {
      result = result.filter((user) =>
        user.name.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }

    if (filters.email) {
      result = result.filter((user) =>
        user.email.toLowerCase().includes(filters.email!.toLowerCase())
      );
    }

    if (filters.status && filters.status !== "all") {
      switch (filters.status) {
        case "blocked":
          result = result.filter((user) => user.is_blocked);
          break;
        case "active":
          result = result.filter((user) => !user.is_blocked);
          break;
        case "verified":
          result = result.filter((user) => user.is_kyc_verified);
          break;
      }
    }

    setFilteredUsers(result);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          Manage all users of your investment platform
        </p>
      </div>

      <UserFilter onFilter={handleFilter} />

      <UsersTable
        users={filteredUsers}
        isLoading={isLoading}
        error={error}
        onBlockStatusChange={handleBlockStatusChange}
      />
    </div>
  );
}
