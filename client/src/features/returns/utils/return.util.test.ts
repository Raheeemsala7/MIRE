import { describe, expect, it } from "vitest";
import {
  getStatusStyle,
  formatCurrency,
  formatDate,
  ALLOWED_STATUS_TRANSITIONS,
  STATUS_CONFIG,
  REASON_CONFIG,
  CONDITION_CONFIG,
  CALL_RESULT_CONFIG,
} from "./return.util";
import {
  RETURN_STATUSES,
  RETURN_REASONS,
  ITEM_CONDITIONS,
  CALL_ATTEMPT_RESULTS,
} from "../types/return.types";

describe("Return Utilities", () => {
  describe("getStatusStyle", () => {
    it("returns correct English and Arabic labels for all return statuses", () => {
      for (const status of Object.values(RETURN_STATUSES)) {
        const style = getStatusStyle(status);
        expect(style.labelEn).toBeDefined();
        expect(style.labelAr).toBeDefined();
        expect(style.badgeClass).toBeDefined();
        expect(style.dotClass).toBeDefined();
      }
    });

    it("falls back gracefully for an unknown status", () => {
      // @ts-expect-error testing unknown status fallback
      const style = getStatusStyle("CUSTOM_UNKNOWN");
      expect(style.labelEn).toBe("CUSTOM_UNKNOWN");
    });
  });

  describe("formatCurrency", () => {
    it("formats EGP amount in English and Arabic correctly", () => {
      const en = formatCurrency(1500, "en");
      expect(en).toContain("1,500");
      expect(en).toContain("EGP");

      const ar = formatCurrency(1500, "ar");
      expect(ar).toContain("ج.م");
    });
  });

  describe("formatDate", () => {
    it("formats ISO date string without throwing", () => {
      const formatted = formatDate("2026-11-20T12:00:00.000Z", "en");
      expect(formatted).toContain("2026");
    });

    it("handles null or undefined safely", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
    });
  });

  describe("ALLOWED_STATUS_TRANSITIONS", () => {
    it("allows RETURN_REQUESTED to transition to RETURN_APPROVED or REJECTED", () => {
      const allowed = ALLOWED_STATUS_TRANSITIONS[RETURN_STATUSES.RETURN_REQUESTED];
      expect(allowed).toContain(RETURN_STATUSES.RETURN_APPROVED);
      expect(allowed).toContain(RETURN_STATUSES.REJECTED);
    });

    it("marks terminal statuses (REFUNDED, REJECTED) with empty next transitions", () => {
      expect(ALLOWED_STATUS_TRANSITIONS[RETURN_STATUSES.REFUNDED]).toHaveLength(0);
      expect(ALLOWED_STATUS_TRANSITIONS[RETURN_STATUSES.REJECTED]).toHaveLength(0);
    });
  });

  describe("Configs Mapping Completeness", () => {
    it("has complete configuration for statuses, reasons, conditions, and call outcomes", () => {
      for (const s of Object.values(RETURN_STATUSES)) {
        expect(STATUS_CONFIG[s].labelEn).toBeDefined();
        expect(STATUS_CONFIG[s].labelAr).toBeDefined();
        expect(STATUS_CONFIG[s].dotClass).toBeDefined();
        expect(STATUS_CONFIG[s].badgeClass).toBeDefined();
      }
      for (const r of Object.values(RETURN_REASONS)) {
        expect(REASON_CONFIG[r].labelEn).toBeDefined();
        expect(REASON_CONFIG[r].labelAr).toBeDefined();
      }
      for (const c of Object.values(ITEM_CONDITIONS)) {
        expect(CONDITION_CONFIG[c].labelEn).toBeDefined();
        expect(CONDITION_CONFIG[c].labelAr).toBeDefined();
      }
      for (const o of Object.values(CALL_ATTEMPT_RESULTS)) {
        expect(CALL_RESULT_CONFIG[o].labelEn).toBeDefined();
        expect(CALL_RESULT_CONFIG[o].labelAr).toBeDefined();
      }
    });
  });
});
