import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

function Field({ label, htmlFor, error, hint, optional, className, children, ...props }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional && <span className="text-xs text-foreground-muted">opcional</span>}
      </div>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-foreground-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-negative">
          {error}
        </p>
      )}
    </div>
  );
}

export { Field };
