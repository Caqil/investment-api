import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface VerificationInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  length?: number;
  onComplete?: (code: string) => void;
  className?: string;
  inputClassName?: string;
}

export function VerificationInput({
  length = 6,
  onComplete,
  className,
  inputClassName,
  disabled,
  ...props
}: VerificationInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;

    // Only proceed if the input is a single digit or empty
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    // Update the code array
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // If value is entered and not the last input, focus the next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    const completeCode = newCode.join("");
    if (completeCode.length === length && onComplete) {
      onComplete(completeCode);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        // If current input is empty and not the first, focus the previous input
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Handle left arrow key
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle right arrow key
    else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted data is numeric and has correct length
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    // Take only the first {length} characters
    const pastedCode = pastedData.slice(0, length).split("");

    // Fill the code array with pasted data
    const newCode = [...code];
    for (let i = 0; i < pastedCode.length; i++) {
      if (i < length) {
        newCode[i] = pastedCode[i];
      }
    }

    setCode(newCode);

    // Focus the last filled input
    const lastIndex = Math.min(pastedCode.length, length) - 1;
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }

    // Check if code is complete
    const completeCode = newCode.join("");
    if (completeCode.length === length && onComplete) {
      onComplete(completeCode);
    }
  };

  return (
    <div
      className={cn(
        "flex justify-between items-center gap-2 w-full",
        className
      )}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={code[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={cn(
            "w-full h-12 text-center text-lg font-semibold rounded-md border border-input bg-background focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
          {...props}
        />
      ))}
    </div>
  );
}
