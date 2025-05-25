"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityType = "join" | "deposit" | "withdraw" | "kyc" | "plan";

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: string;
  details: string;
  amount?: number;
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "join":
      return "bg-blue-500";
    case "deposit":
      return "bg-green-500";
    case "withdraw":
      return "bg-yellow-500";
    case "kyc":
      return "bg-purple-500";
    case "plan":
      return "bg-indigo-500";
    default:
      return "bg-gray-500";
  }
}

function getActivityTitle(activity: ActivityItem) {
  const { type, user, details, amount } = activity;

  switch (type) {
    case "join":
      return (
        <p>
          <span className="font-medium">{user.name}</span>{" "}
          <span className="text-muted-foreground">joined the platform</span>
        </p>
      );
    case "deposit":
      return (
        <p>
          <span className="font-medium">{user.name}</span>{" "}
          <span className="text-muted-foreground">made a deposit of</span>{" "}
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(amount || 0)}
          </span>
        </p>
      );
    case "withdraw":
      return (
        <p>
          <span className="font-medium">{user.name}</span>{" "}
          <span className="text-muted-foreground">
            requested a withdrawal of
          </span>{" "}
          <span className="font-medium text-yellow-600 dark:text-yellow-400">
            {formatCurrency(amount || 0)}
          </span>
        </p>
      );
    case "kyc":
      return (
        <p>
          <span className="font-medium">{user.name}</span>{" "}
          <span className="text-muted-foreground">{details}</span>
        </p>
      );
    case "plan":
      return (
        <p>
          <span className="font-medium">{user.name}</span>{" "}
          <span className="text-muted-foreground">{details}</span>
        </p>
      );
    default:
      return <p>{details}</p>;
  }
}

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
  title?: string;
  description?: string;
}

export function RecentActivity({
  activities,
  loading = false,
  title = "Recent Activity",
  description = "Latest user actions across the platform",
}: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-auto">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar
                  className={`h-10 w-10 ${getActivityIcon(activity.type)}`}
                >
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback>
                    {getInitials(activity.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  {getActivityTitle(activity)}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
