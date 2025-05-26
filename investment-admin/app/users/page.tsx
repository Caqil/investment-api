// investment-admin/app/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { User } from "@/types/auth";
import { AlertCircle, Plus, RefreshCw, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { UserStats } from "@/components/users/user-stats";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { RecentUsers } from "@/components/users/recent-user";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // User statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    verifiedUsers: 0,
    planDistribution: [] as Array<{ name: string; value: number }>,
  });

  // Sort users by registration date (newest first)
  const sortedUsers = [...users].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.users.getAll();

      if (response.error) {
        throw new Error(response.error);
      }

      const fetchedUsers = response.data?.users || [];
      setUsers(fetchedUsers);

      // Calculate stats
      const totalUsers = fetchedUsers.length;
      const activeUsers = fetchedUsers.filter(
        (user) => !user.is_blocked
      ).length;
      const blockedUsers = fetchedUsers.filter(
        (user) => user.is_blocked
      ).length;
      const verifiedUsers = fetchedUsers.filter(
        (user) => user.is_kyc_verified
      ).length;

      // Calculate plan distribution
      const planCounts: Record<string, number> = {};
      fetchedUsers.forEach((user) => {
        const planId = user.plan_id || "Unknown";
        planCounts[planId] = (planCounts[planId] || 0) + 1;
      });

      const planDistribution = Object.entries(planCounts).map(
        ([name, value]) => ({
          name,
          value,
        })
      );

      setStats({
        totalUsers,
        activeUsers,
        blockedUsers,
        verifiedUsers,
        planDistribution,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  // Apply search filter whenever users or searchQuery changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.id.toString().includes(query)
    );

    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAddUser = () => {
    router.push("/users/new");
  };

  const handleViewUser = (userId: number) => {
    router.push(`/users/${userId}`);
  };

  const handleBlockUser = async (userId: number) => {
    try {
      const response = await api.users.block(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Refresh the list
      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to block user");
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await api.users.unblock(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Refresh the list
      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unblock user");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await api.users.delete(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Refresh the list
      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddUser} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User Statistics */}
      <UserStats stats={stats} loading={loading} />
      {/* Search Bar */}
      <div className="flex mb-6">
        <Input
          placeholder="Search users by name, email, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>${user.balance.toFixed(2)}</TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                    {user.is_admin && (
                      <Badge variant="secondary" className="ml-2">
                        Admin
                      </Badge>
                    )}
                    {user.is_kyc_verified && (
                      <Badge variant="default" className="ml-2">
                        Verified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewUser(user.id)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.is_blocked ? (
                          <DropdownMenuItem
                            onClick={() => handleUnblockUser(user.id)}
                          >
                            Unblock User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleBlockUser(user.id)}
                          >
                            Block User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No users found</CardTitle>
            <CardDescription>
              {searchQuery
                ? "Try adjusting your search query"
                : "There are no users to display"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </DashboardShell>
  );
}
