"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/auth";
import { api, UpdateUserRequest } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LockIcon,
  UnlockIcon,
  UserX,
  AlertCircle,
  Edit,
  Save,
  X,
  UserCog,
  RefreshCw,
  CreditCard,
} from "lucide-react";

interface UserDetailsDialogProps {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: () => void;
}

export function UserDetailsDialog({
  userId,
  open,
  onOpenChange,
  onAction,
}: UserDetailsDialogProps) {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Define our own version of UpdateUserRequest to ensure proper typing
  interface UserUpdateForm {
    name: string;
    phone: string;
    balance: number;
    is_admin: boolean;
    is_blocked: boolean;
  }

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserUpdateForm>({
    name: "",
    phone: "",
    balance: 0,
    is_admin: false,
    is_blocked: false,
  });

  // Action dialogs
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails(userId);
    } else {
      // Reset state when dialog closes
      setUser(null);
      setDevices([]);
      setTransactions([]);
      setActiveTab("overview");
      setIsEditing(false);
      setError(null);
    }
  }, [open, userId]);

  const fetchUserDetails = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.users.getById(id);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        // Safely set the user
        if (response.data.user) {
          setUser(response.data.user);

          // Initialize edit form with user data
          setEditForm({
            name: response.data.user.name || "",
            phone: response.data.user.phone || "",
            balance: response.data.user.balance || 0,
            is_admin: response.data.user.is_admin || false,
            is_blocked: response.data.user.is_blocked || false,
          });
        }

        // If there are devices in the response (type assertion to handle any response structure)
        const responseData = response.data as any;
        if (responseData.devices && Array.isArray(responseData.devices)) {
          setDevices(responseData.devices);
        }
      }

      // Fetch recent transactions
      const transactionsResponse = await api.transactions.getByUserId(id, 5);
      if (
        !transactionsResponse.error &&
        transactionsResponse.data?.transactions
      ) {
        setTransactions(transactionsResponse.data.transactions);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load user details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    setActionLoading(true);
    setError(null);

    try {
      // Convert our form to the API's expected format
      const updateData: UpdateUserRequest = {
        name: editForm.name,
        phone: editForm.phone,
        balance: editForm.balance,
        is_admin: editForm.is_admin,
        is_blocked: editForm.is_blocked,
      };

      const response = await api.users.update(user.id, updateData);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.user) {
        setUser(response.data.user);
        setIsEditing(false);

        // Call onAction to refresh the user list
        if (onAction) {
          onAction();
        }
      }
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const response = await api.users.block(user.id);

      if (response.error) {
        throw new Error(response.error);
      }

      setShowBlockDialog(false);

      // Refresh user details
      await fetchUserDetails(user.id);

      // Call onAction to refresh the user list
      if (onAction) {
        onAction();
      }
    } catch (err) {
      console.error("Error blocking user:", err);
      setError(err instanceof Error ? err.message : "Failed to block user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const response = await api.users.unblock(user.id);

      if (response.error) {
        throw new Error(response.error);
      }

      setShowUnblockDialog(false);

      // Refresh user details
      await fetchUserDetails(user.id);

      // Call onAction to refresh the user list
      if (onAction) {
        onAction();
      }
    } catch (err) {
      console.error("Error unblocking user:", err);
      setError(err instanceof Error ? err.message : "Failed to unblock user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const response = await api.users.delete(user.id);

      if (response.error) {
        throw new Error(response.error);
      }

      setShowDeleteDialog(false);
      onOpenChange(false);

      // Call onAction to refresh the user list
      if (onAction) {
        onAction();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setEditForm({ ...editForm, [name]: parseFloat(value) || 0 });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setEditForm({ ...editForm, [name]: checked });
  };

  // Content to show while loading
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Loading user information...</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              User information could not be loaded
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl">
                  {isEditing ? "Edit User" : "User Details"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Edit user information"
                    : `Viewing details for ${user.name}`}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={actionLoading}
                      className="gap-1"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit User
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isEditing ? (
            // Edit Form
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  value={editForm.balance.toString()}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center space-x-8 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_admin"
                    checked={editForm.is_admin}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("is_admin", checked)
                    }
                  />
                  <Label htmlFor="is_admin">Admin User</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_blocked"
                    checked={editForm.is_blocked}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("is_blocked", checked)
                    }
                  />
                  <Label htmlFor="is_blocked">Block User</Label>
                </div>
              </div>
            </div>
          ) : (
            // View Mode
            <Tabs
              defaultValue="overview"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* User Profile Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-gray-500">{user.email}</p>
                    <div className="flex space-x-2 mt-1">
                      {user.is_admin && (
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800"
                        >
                          Admin
                        </Badge>
                      )}
                      {user.is_blocked ? (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800"
                        >
                          Blocked
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      )}
                      {user.is_kyc_verified && (
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800"
                        >
                          KYC Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        User ID
                      </h4>
                      <p>{user.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Phone
                      </h4>
                      <p>{user.phone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Registration Date
                      </h4>
                      <p>{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Balance
                      </h4>
                      <p className="text-lg font-semibold">
                        {formatCurrency(user.balance, "BDT")}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Referral Code
                      </h4>
                      <p>{user.referral_code}</p>
                    </div>
                    {user.plan_id && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Plan
                        </h4>
                        <p>Plan ID: {user.plan_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <h3 className="text-lg font-semibold">Recent Transactions</h3>
                {transactions.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {transaction.id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm capitalize">
                              {transaction.type.replace("_", " ")}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {formatCurrency(transaction.amount, "BDT")}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <Badge
                                variant="outline"
                                className={
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {formatDate(transaction.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-gray-50">
                    <CreditCard className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-gray-500">
                      No transactions found for this user
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`/transactions?userId=${user.id}`, "_blank")
                    }
                  >
                    View All Transactions
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="devices" className="space-y-6">
                <h3 className="text-lg font-semibold">Registered Devices</h3>
                {devices.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Device ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Device Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Last Login
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {devices.map((device) => (
                          <tr key={device.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                              {device.device_id.substring(0, 16)}...
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {device.device_name || "Unknown Device"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {device.last_login
                                ? formatDate(device.last_login)
                                : "Never"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <Badge
                                variant="outline"
                                className={
                                  device.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {device.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-gray-50">
                    <UserCog className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-gray-500">
                      No devices registered for this user
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <h3 className="text-lg font-semibold">User Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-3">Account Status</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      {user.is_blocked
                        ? "This user is currently blocked and cannot access the system."
                        : "This user is currently active and can access the system."}
                    </p>
                    {user.is_blocked ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowUnblockDialog(true)}
                        className="w-full justify-start gap-2"
                      >
                        <UnlockIcon className="h-4 w-4" />
                        Unblock User
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShowBlockDialog(true)}
                        className="w-full justify-start gap-2 text-amber-600 hover:text-amber-700"
                      >
                        <LockIcon className="h-4 w-4" />
                        Block User
                      </Button>
                    )}
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-3">Danger Zone</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Permanently delete this user and all associated data. This
                      action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full justify-start gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Delete User
                    </Button>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-3">Refresh Data</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Reload the latest user data from the server.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fetchUserDetails(user.id)}
                      className="w-full justify-start gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh User Data
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Block User Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {user.name}? They will not be able
              to log in or use the system while blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading ? "Blocking..." : "Block User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock User Dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock {user.name}? They will regain
              access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblockUser}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Unblocking..." : "Unblock User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {user.name}? This
              action cannot be undone and will remove all their data from the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
