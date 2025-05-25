// src/components/kyc/document-viewer.tsx
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { SearchIcon, ZoomIn, ZoomOut } from "lucide-react";

interface DocumentViewerProps {
  imageUrl: string;
  title: string;
}

export function DocumentViewer({ imageUrl, title }: DocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <SearchIcon className="h-4 w-4" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>View document image</DialogDescription>
        </DialogHeader>

        <div className="relative overflow-auto py-2 h-[60vh]">
          <div className="flex justify-center items-center min-h-full">
            <div
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.2s",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                className="max-w-full object-contain rounded-md border"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-1" />
            Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 mr-1" />
            Zoom In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
