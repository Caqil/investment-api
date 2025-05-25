"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getInitials } from "@/lib/utils";
import { User } from "@/types/auth";
import { ChevronRight, UserPlus } from "lucide-react";

interface RecentUsersProps {
  users: User[];
  loading?: boolean;
}

export function RecentUsers({ users, loading = false }: RecentUsersProps) {
  const router = useRouter();

  const handleViewUser = (userId: number) => {
    router.push(`/users/${userId}`);
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>
            Latest users who joined the platform
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => router.push("/users")}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.profile_pic_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleViewUser(user.id)}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs text-muted-foreground">
              New users will appear here when they join
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
