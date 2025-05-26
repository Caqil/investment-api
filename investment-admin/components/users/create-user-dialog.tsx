"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { AlertCircle, PlusCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "@/types/auth";
import { CreateUserRequest } from "@/lib/api";

interface CreateUserDialogProps {
  onSuccess?: (user: User) => void;
}

export function CreateUserDialog({ onSuccess }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    balance: 0,
    is_admin: false,
    is_blocked: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userData: CreateUserRequest = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        balance: formData.balance,
        is_admin: formData.is_admin,
        is_blocked: formData.is_blocked,
      };

      const response = await api.users.create(userData);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.user) {
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          balance: 0,
          is_admin: false,
          is_blocked: false,
        });

        // Close dialog
        setOpen(false);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data.user);
        }
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.password.trim() !== "" &&
      formData.password.length >= 6
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password (min 6 chars)"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance" className="text-right">
              Initial Balance
            </Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              placeholder="Initial Balance"
              value={formData.balance.toString()}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center space-x-8 pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_admin"
                checked={formData.is_admin}
                onCheckedChange={(checked) =>
                  handleSwitchChange("is_admin", checked)
                }
              />
              <Label htmlFor="is_admin">Admin User</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_blocked"
                checked={formData.is_blocked}
                onCheckedChange={(checked) =>
                  handleSwitchChange("is_blocked", checked)
                }
              />
              <Label htmlFor="is_blocked">Block User</Label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
