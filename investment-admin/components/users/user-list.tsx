// components/users/users-table.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Search,
  RefreshCw,
  MoreHorizontal,
  User,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  AlertTriangle,
  Loader2,
  CreditCard,
  BadgeCheck,
  Calendar,
} from "lucide-react";
import { User as UserType } from "@/types/auth";
import { api } from "@/lib/api";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { DeleteUserDialog } from "./delete-user-dialog";

interface UsersTableProps {
  initialUsers?: UserType[];
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<UserType[]>(initialUsers || []);
  const [loading, setLoading] = useState<boolean>(!initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [blockingUser, setBlockingUser] = useState<number | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState<boolean>(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState<boolean>(false);
  const itemsPerPage = 10;

  // Fetch users data
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.users.getAll();

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data && "users" in response.data) {
        const fetchedUsers = response.data.users || [];
        setUsers(fetchedUsers);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError("Failed to load users. Please try again.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (!initialUsers) {
      fetchUsers();
    }
  }, [initialUsers]);

  // Filter and sort users
  const filteredUsers = users.filter((user) => {
    // Apply search filter
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone &&
        user.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.is_blocked) ||
      (statusFilter === "blocked" && user.is_blocked);

    // Apply KYC filter
    const matchesKyc =
      kycFilter === "all" ||
      (kycFilter === "verified" && user.is_kyc_verified) ||
      (kycFilter === "pending" && !user.is_kyc_verified);

    return matchesSearch && matchesStatus && matchesKyc;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;

    switch (sortColumn) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "email":
        comparison = a.email.localeCompare(b.email);
        break;
      case "balance":
        comparison = a.balance - b.balance;
        break;
      case "created_at":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Paginate users
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle block/unblock user
  const handleBlockUser = async (userId: number) => {
    setBlockingUser(userId);
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
      setShowBlockDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to block user");
    } finally {
      setBlockingUser(null);
    }
  };

  const handleUnblockUser = async (userId: number) => {
    setBlockingUser(userId);
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
      setShowUnblockDialog(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to unblock user"
      );
    } finally {
      setBlockingUser(null);
    }
  };

  const handleUserDeleted = () => {
    if (userToDelete) {
      // Remove the deleted user from state
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      setUserToDelete(null);
    }
  };

  // Get the sort indicator icon
  const getSortIndicator = (column: string) => {
    if (sortColumn !== column) return null;

    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl">Users</CardTitle>
          <CardDescription>Manage your system users</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/users/create">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative w-full md:w-auto md:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email or phone..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={kycFilter}
              onValueChange={(value) => {
                setKycFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    User {getSortIndicator("name")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort("balance")}
                  >
                    Balance {getSortIndicator("balance")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">KYC</TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort("created_at")}
                  >
                    Joined {getSortIndicator("created_at")}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className={user.is_blocked ? "bg-muted/40" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={user.profile_pic_url || undefined}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground md:hidden truncate max-w-[180px]">
                              {user.email}
                            </div>
                            {user.is_admin && (
                              <Badge variant="outline" className="mt-1 w-fit">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="text-sm">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="text-sm text-muted-foreground">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="font-medium">
                          {formatCurrency(user.balance, "BDT")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_blocked ? (
                          <Badge
                            variant="destructive"
                            className="whitespace-nowrap"
                          >
                            <UserX className="mr-1 h-3 w-3" />
                            Blocked
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap"
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.is_kyc_verified ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <BadgeCheck className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/users/${user.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/users/${user.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit user
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_blocked ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setBlockingUser(user.id);
                                  setShowUnblockDialog(true);
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Unblock user
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setBlockingUser(user.id);
                                  setShowBlockDialog(true);
                                }}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Block user
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-8 w-8 mb-2" />
                        <p>No users found</p>
                        {searchTerm && (
                          <p className="text-sm">
                            Try adjusting your search or filters
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredUsers.length
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>

      {/* Delete User Dialog */}
      {userToDelete && (
        <DeleteUserDialog
          user={userToDelete}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onDeleted={handleUserDeleted}
        />
      )}

      {/* Block User Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Block User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block this user? They will no longer be
              able to access the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBlockDialog(false)}
              disabled={blockingUser !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => blockingUser && handleBlockUser(blockingUser)}
              disabled={blockingUser === null}
            >
              {blockingUser !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Block User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock User Dialog */}
      <Dialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unblock this user? They will be able to
              access the platform again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnblockDialog(false)}
              disabled={blockingUser !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() => blockingUser && handleUnblockUser(blockingUser)}
              disabled={blockingUser === null}
            >
              {blockingUser !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unblocking...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unblock User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
