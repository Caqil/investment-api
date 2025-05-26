// investment-admin/components/users/recent-users.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/types/auth";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentUsersProps {
  users: User[];
  loading: boolean;
}

export function RecentUsers({ users, loading }: RecentUsersProps) {
  // Get the initials of a name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Registrations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            No recent user registrations found
          </div>
        ) : (
          <div className="space-y-4">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    {user.profile_pic_url ? (
                      <img
                        src={user.profile_pic_url}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {user.is_blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
