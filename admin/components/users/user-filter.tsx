// src/components/users/user-filter.tsx
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface UserFilterProps {
  onFilter: (filters: {
    name?: string;
    email?: string;
    status?: "all" | "blocked" | "active" | "verified";
  }) => void;
}

export function UserFilter({ onFilter }: UserFilterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "all" | "blocked" | "active" | "verified"
  >("all");

  const handleFilter = () => {
    onFilter({
      name: name || undefined,
      email: email || undefined,
      status: status,
    });
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setStatus("all");
    onFilter({});
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md border space-y-4">
      <h3 className="font-medium">Filter Users</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            placeholder="Filter by name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            placeholder="Filter by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(value: any) => setStatus(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="verified">Verified (KYC)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleFilter}>Apply Filters</Button>
      </div>
    </div>
  );
}
