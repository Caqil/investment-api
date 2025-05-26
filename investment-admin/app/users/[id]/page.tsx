"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserDetail } from "@/components/users/user-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const router = useRouter();
  // Access the ID directly, with a comment acknowledging the warning
  // Note: Next.js warns about direct param access but it still works in current versions
  const userId = parseInt(params.id, 10);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Validate that the ID is a number
  if (isNaN(userId)) {
    return (
      <DashboardShell>
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/users")}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Invalid User ID</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            The user ID provided is not valid.
          </AlertDescription>
        </Alert>
      </DashboardShell>
    );
  }

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.users.getById(userId);

        if (response.error) {
          setError(response.error);
          return;
        }

        setUserData(response.data);
      } catch (err) {
        setError("Failed to load user details. Please try again.");
        console.error("Error fetching user details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  return (
    <DashboardShell>
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/users")}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Button>
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">
            {userData?.user?.name || userData?.name || "User Details"}
          </h1>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <UserDetail userId={userId} initialUserData={userData} />
    </DashboardShell>
  );
}
