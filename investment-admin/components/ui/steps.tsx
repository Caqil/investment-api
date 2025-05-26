import * as React from "react";
import { cn } from "@/lib/utils";

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active: number;
  vertical?: boolean;
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  completed?: boolean;
  step?: number;
}

export const Steps = ({
  children,
  active,
  vertical = false,
  className,
  ...props
}: StepsProps) => {
  // Clone children and add active state
  const stepsWithProps = React.Children.map(children, (child, index) => {
    if (React.isValidElement<StepProps>(child)) {
      // Explicitly type the child
      return React.cloneElement(child, {
        active: index === active,
        completed: index < active,
        step: index + 1,
      });
    }
    return child;
  });

  return (
    <div
      className={cn(
        "flex",
        vertical ? "flex-col space-y-4" : "flex-row space-x-4",
        className
      )}
      {...props}
    >
      {stepsWithProps}
    </div>
  );
};

export const Step = ({
  title,
  description,
  icon: Icon,
  active,
  completed,
  step,
  className,
  ...props
}: StepProps) => {
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        active
          ? "text-primary"
          : completed
          ? "text-primary/80"
          : "text-muted-foreground",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border text-center font-medium",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : completed
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-muted-foreground/20 text-muted-foreground"
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : step}
      </div>
      <div className="flex flex-col">
        <div className="font-medium">{title}</div>
        {description && (
          <div
            className={cn(
              "text-sm",
              active ? "text-muted-foreground" : "text-muted-foreground/70"
            )}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
};
