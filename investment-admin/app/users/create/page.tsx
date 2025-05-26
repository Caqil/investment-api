// investment-admin/app/users/create/page.tsx
"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserForm } from "@/components/users/user-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User } from "@/types/auth";

export default function CreateUserPage() {
  // Empty user object for creating a new user
  const newUser: Partial<User> = {
    name: "",
    email: "",
    phone: "",
    is_admin: false,
    is_blocked: false,
    balance: 0,
  };

  const handleSubmit = async (values: any) => {
    // Call your API to create a user
    const response = await api.users.create(values);

    if (response.error) {
      throw new Error(response.error);
    }

    // Handle success, perhaps redirect to the users list
    window.location.href = "/users";
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>
      <UserForm user={newUser} onSubmit={handleSubmit} />
    </div>
  );
}
