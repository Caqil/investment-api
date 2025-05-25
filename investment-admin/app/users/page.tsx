// src/app/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { User } from "@/types/auth";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Search,
  Shield,
  User as UserIcon,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.users.getAll();

      if (response.error) {
        throw new Error(response.error);
      }

      // Ensure we're properly typing our data
      if (
        response.data &&
        "users" in response.data &&
        Array.isArray(response.data.users)
      ) {
        const fetchedUsers = response.data.users as User[];
        setUsers(fetchedUsers);
        setTotalPages(Math.ceil(fetchedUsers.length / itemsPerPage));
      } else {
        // If API doesn't return expected data, set empty array
        setUsers([]);
        setTotalPages(1);
      }
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
  }, []);

  // Filter and paginate users
  const filteredUsers = users.filter((user) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "blocked" && user.is_blocked) ||
      (statusFilter === "active" && !user.is_blocked);

    const matchesKyc =
      kycFilter === "all" ||
      (kycFilter === "verified" && user.is_kyc_verified) ||
      (kycFilter === "unverified" && !user.is_kyc_verified);

    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));

    return matchesStatus && matchesKyc && matchesSearch;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalFilteredPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage)
  );

  const handleBlockUser = async (userId: number) => {
    try {
      const response = await api.users.block(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Refresh user list
      fetchUsers();
    } catch (err) {
      console.error("Error blocking user:", err);
      setError(err instanceof Error ? err.message : "Failed to block user");
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await api.users.unblock(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Refresh user list
      fetchUsers();
    } catch (err) {
      console.error("Error unblocking user:", err);
      setError(err instanceof Error ? err.message : "Failed to unblock user");
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or phone"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                KYC Status
              </label>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            #{user.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.is_blocked ? (
                              <Badge variant="destructive">Blocked</Badge>
                            ) : (
                              <Badge variant="secondary">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.is_kyc_verified ? (
                              <Badge variant="secondary">Verified</Badge>
                            ) : (
                              <Badge variant="default">Unverified</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/users/${user.id}`}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Link>
                              </Button>
                              {user.is_blocked ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnblockUser(user.id)}
                                >
                                  <UserCheck className="h-4 w-4" />
                                  <span className="sr-only">Unblock</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBlockUser(user.id)}
                                >
                                  <UserX className="h-4 w-4" />
                                  <span className="sr-only">Block</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {Math.min(
                      filteredUsers.length,
                      (currentPage - 1) * itemsPerPage + 1
                    )}{" "}
                    to{" "}
                    {Math.min(filteredUsers.length, currentPage * itemsPerPage)}{" "}
                    of {filteredUsers.length} users
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalFilteredPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
