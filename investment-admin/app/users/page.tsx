"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { User } from "@/types/auth";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
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
  UserPlus,
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
import { toast } from "sonner";
import { UsersTable } from "@/components/users/user-list";

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

      // Update user in the list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, is_blocked: true } : user
        )
      );

      toast.success("User blocked successfully");
    } catch (err) {
      console.error("Error blocking user:", err);
      toast.error(err instanceof Error ? err.message : "Failed to block user");
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await api.users.unblock(userId);
      if (response.error) {
        throw new Error(response.error);
      }

      // Update user in the list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, is_blocked: false } : user
        )
      );

      toast.success("User unblocked successfully");
    } catch (err) {
      console.error("Error unblocking user:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to unblock user"
      );
    }
  };

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        User Management
      </h1>
      <UsersTable />
    </DashboardShell>
  );
}
