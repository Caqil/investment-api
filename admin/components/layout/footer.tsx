// src/components/layout/footer.tsx
import React from "react";

export function Footer() {
  return (
    <footer className="border-t py-4 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Investment Admin. All rights
          reserved.
        </p>
        <p className="text-sm text-muted-foreground">
          Built with Next.js and shadcn/ui
        </p>
      </div>
    </footer>
  );
}
