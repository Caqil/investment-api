import { Button } from "@/components/ui/button";
import Link from "next/link";

// admin/app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
      <p className="text-center mb-6">
        You do not have permission to access the admin dashboard. This area is
        restricted to administrators only.
      </p>
      <Button asChild>
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}
