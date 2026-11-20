import { describe, expect, it } from "vitest";
import {
  customerAddressSchema,
  customerSocialProfilesSchema,
  updateCustomerSchema,
  customerFilterSchema,
} from "./customer.schema";

describe("customer.schema", () => {
  describe("customerAddressSchema", () => {
    it("validates valid address data", () => {
      const validAddress = {
        street: "18 Gezira Street",
        building: "Tower 4",
        apartment: "12B",
        city: "Zamalek",
        governorate: "Cairo",
        postalCode: "11561",
        country: "Egypt",
        landmark: "Next to Embassy",
        isDefault: true,
      };
      const res = customerAddressSchema.safeParse(validAddress);
      expect(res.success).toBe(true);
    });

    it("requires street, city, and governorate", () => {
      const invalid = {
        building: "Tower 4",
      };
      const res = customerAddressSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        const issues = res.error.issues.map((i) => i.path[0]);
        expect(issues).toContain("street");
        expect(issues).toContain("city");
        expect(issues).toContain("governorate");
      }
    });

    it("allows empty optional strings", () => {
      const minimal = {
        street: "Street 1",
        city: "Alexandria",
        governorate: "Alexandria",
        building: "",
        apartment: "",
        postalCode: "",
      };
      const res = customerAddressSchema.safeParse(minimal);
      expect(res.success).toBe(true);
    });
  });

  describe("customerSocialProfilesSchema", () => {
    it("validates social profile handles and URLs", () => {
      const valid = {
        whatsapp: "+201012345678",
        instagram: "@mire.customer",
        facebook: "https://facebook.com/customer",
      };
      const res = customerSocialProfilesSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("accepts empty strings for social profiles", () => {
      const empty = {
        whatsapp: "",
        instagram: "",
        facebook: "",
      };
      const res = customerSocialProfilesSchema.safeParse(empty);
      expect(res.success).toBe(true);
    });
  });

  describe("updateCustomerSchema", () => {
    it("validates valid customer update payload", () => {
      const payload = {
        fullName: "Nouran Mostafa",
        email: "nouran@example.com",
        phone: "+201012345678",
        secondaryPhone: "+201123456789",
        tags: ["VIP", "Repeat Buyer"],
        notes: "Prefers evening deliveries after 6 PM.",
        socialProfiles: {
          whatsapp: "+201012345678",
        },
      };
      const res = updateCustomerSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("rejects names shorter than 2 characters", () => {
      const res = updateCustomerSchema.safeParse({ fullName: "N" });
      expect(res.success).toBe(false);
    });

    it("rejects invalid email formats unless empty", () => {
      const resInvalid = updateCustomerSchema.safeParse({ email: "not-an-email" });
      expect(resInvalid.success).toBe(false);

      const resEmpty = updateCustomerSchema.safeParse({ email: "" });
      expect(resEmpty.success).toBe(true);
    });

    it("rejects notes longer than 2000 characters", () => {
      const longNotes = "a".repeat(2001);
      const res = updateCustomerSchema.safeParse({ notes: longNotes });
      expect(res.success).toBe(false);
    });

    it("accepts partial updates", () => {
      const res = updateCustomerSchema.safeParse({
        tags: ["VIP", "New"],
      });
      expect(res.success).toBe(true);
    });

    it("accepts empty strings to allow clearing secondaryPhone, notes, and social profiles", () => {
      const payload = {
        secondaryPhone: "",
        email: "",
        notes: "",
        socialProfiles: {
          whatsapp: "",
          instagram: "",
          facebook: "",
        },
      };
      const res = updateCustomerSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });
  });

  describe("customerFilterSchema", () => {
    it("coerces pagination numbers and defaults", () => {
      const res = customerFilterSchema.safeParse({
        page: "2",
        limit: "50",
        search: "Layla",
        sortBy: "totalSpent:desc",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(2);
        expect(res.data.limit).toBe(50);
        expect(res.data.search).toBe("Layla");
        expect(res.data.sortBy).toBe("totalSpent:desc");
      }
    });

    it("applies default page and limit", () => {
      const res = customerFilterSchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(1);
        expect(res.data.limit).toBe(20);
      }
    });
  });
});
