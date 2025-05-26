"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { User } from "@/types/auth";
import { AlertCircle, RefreshCw, Search, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsersTable } from "@/components/users/user-table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { toast } from "sonner";

// Stats component for user metrics
function UserStats({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <h3 className="text-2xl font-bold">{stats.total_users || 0}</h3>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-green-100 rounded-full">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Users</p>
            <h3 className="text-2xl font-bold">{stats.active_users || 0}</h3>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-purple-100 rounded-full">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Verified Users</p>
            <h3 className="text-2xl font-bold">{stats.verified_users || 0}</h3>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<{
    total_users: number;
    active_users: number;
    blocked_users: number;
    verified_users: number;
    plan_distribution: Array<{ name: string; value: number }>;
  }>({
    total_users: 0,
    active_users: 0,
    blocked_users: 0,
    verified_users: 0,
    plan_distribution: [],
  });

  // In investment-admin/app/users/page.tsx
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.users.getAll();

      if (response.error) {
        throw new Error(response.error);
      }

      const fetchedUsers = response.data?.users || [];

      // Log to debug what properties are in the user objects
      console.log("Fetched users:", fetchedUsers);

      // Check if is_blocked exists in the user objects
      if (fetchedUsers.length > 0) {
        console.log("First user properties:", Object.keys(fetchedUsers[0]));
        console.log("is_blocked value:", fetchedUsers[0].is_blocked);
      }

      setUsers(fetchedUsers);

      // Fetch user statistics
      const statsResponse = await api.users.getStats();
      if (!statsResponse.error && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
      toast.error(
        "Failed to load users: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  useEffect(() => {
    if (users.length === 0) {
      setFilteredUsers([]);
      return;
    }

    let result = [...users];
    console.log("Applying filter:", activeTab);

    // Apply status filter based on active tab
    if (activeTab === "active") {
      result = result.filter((user) => !user.is_blocked);
      console.log("Active users count:", result.length);
    } else if (activeTab === "blocked") {
      result = result.filter((user) => user.is_blocked === true);
      console.log("Blocked users count:", result.length);

      // Log the blocked users for debugging
      if (result.length > 0) {
        console.log("Sample blocked user:", result[0]);
      } else {
        console.log("No blocked users found");

        // Check if any users have is_blocked set to true
        const blockedUsersCheck = users.filter(
          (user) => user.is_blocked === true
        );
        console.log(
          "Manual check for blocked users:",
          blockedUsersCheck.length
        );

        // Log all users to check their is_blocked property
        console.log(
          "All users is_blocked check:",
          users.map((u) => ({
            id: u.id,
            name: u.name,
            is_blocked: u.is_blocked,
          }))
        );
      }
    } else if (activeTab === "admin") {
      result = result.filter((user) => user.is_admin === true);
      console.log("Admin users count:", result.length);
    }

    if (activeTab === "active") {
      result = result.filter((user) => !user.is_blocked);
    } else if (activeTab === "blocked") {
      result = result.filter((user) => user.is_blocked === true);
    } else if (activeTab === "admin") {
      result = result.filter((user) => user.is_admin === true);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.phone && user.phone.toLowerCase().includes(query)) ||
          (user.id && user.id.toString().includes(query)) ||
          (user.referral_code &&
            user.referral_code.toLowerCase().includes(query))
      );
    }

    // Apply plan filter - calculate plans inside this effect
    if (
      planFilter !== "all" &&
      stats.plan_distribution &&
      stats.plan_distribution.length > 0
    ) {
      const selectedPlan = stats.plan_distribution.find(
        (plan) => plan.name === planFilter
      );
      if (selectedPlan) {
        result = result.filter((user) => user.plan_id === selectedPlan.value);
      }
    }

    // Update filtered users state
    setFilteredUsers(result);
  }, [users, activeTab, planFilter, searchQuery, stats.plan_distribution]);

  // Make handleRefresh async
  const handleRefresh = async () => {
    try {
      await fetchUsers();
      toast.success("User list refreshed");
    } catch (error) {
      toast.error("Failed to refresh user list");
    }
  };

  const handleUserCreated = (newUser: User) => {
    // Refresh the user list
    setRefreshTrigger((prev) => prev + 1);
    toast.success(`User ${newUser.name} created successfully`);
  };

  // Get unique plans for filter
  const plans = stats.plan_distribution || [];

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          {/* Using the CreateUserDialog component */}
          <CreateUserDialog onSuccess={handleUserCreated} />
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, phone, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            disabled={loading}
          />
        </div>
        <Select
          value={planFilter}
          onValueChange={setPlanFilter}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((plan: { name: string; value: number }) => (
              <SelectItem key={plan.name} value={plan.name}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for filtering by status */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UsersTable
            users={filteredUsers}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="active">
          <UsersTable
            users={filteredUsers}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="blocked">
          <UsersTable
            users={filteredUsers}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="admin">
          <UsersTable
            users={filteredUsers}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No users found</CardTitle>
            <CardDescription>
              {searchQuery || planFilter !== "all"
                ? "Try adjusting your filters"
                : "There are no users to display"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </DashboardShell>
  );
}
