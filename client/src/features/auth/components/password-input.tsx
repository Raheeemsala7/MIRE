"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  showLabel: string;
  hideLabel: string;
};

export function PasswordInput({ showLabel, hideLabel, className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} disabled={disabled}
        autoCapitalize="none" spellCheck={false} className={cn(className, "pe-14")} />
      <Button type="button" variant="ghost" size="icon" disabled={disabled}
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? hideLabel : showLabel} aria-pressed={visible}
        className="absolute inset-y-1 end-1 h-auto w-10 rounded-md text-ds-text-muted hover:bg-ds-subtle hover:text-ds-text-primary focus-visible:ring-ds-primary">
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </Button>
    </div>
  );
}
