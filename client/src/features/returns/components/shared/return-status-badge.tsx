import React from "react";
import type { ReturnStatus } from "../../types/return.types";
import { getStatusStyle } from "../../utils/return.util";

interface ReturnStatusBadgeProps {
  status: ReturnStatus;
  locale?: string;
  className?: string;
}

export const ReturnStatusBadge = React.memo(function ReturnStatusBadge({
  status,
  locale = "en",
  className = "",
}: ReturnStatusBadgeProps) {
  const style = getStatusStyle(status);
  const isAr = locale === "ar";
  const label = isAr ? style.labelAr : style.labelEn;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${style.badgeClass} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${style.dotClass}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
});
