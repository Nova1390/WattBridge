import { describe, expect, it } from "vitest";
import { sanitize } from "@/scripts/shared/sanitize";

describe("discovery fixture sanitization", () => {
  it("redacts identifiers, secrets, and household energy readings", () => {
    const sanitized = sanitize({
      system_id: 123,
      name: "Home",
      serial_number: "SERIAL",
      authorization: "Bearer token",
      current_power: 3210,
      energy_today: 12345,
      intervals: [
        {
          end_at: 1779890400,
          wh_del: 100,
          enwh: 200,
          wh_imported: 20,
          wh_exported: 80
        }
      ],
      product_name: "Envoy-S-Metered-EU"
    });

    expect(sanitized).toEqual({
      system_id: "[REDACTED]",
      name: "[REDACTED]",
      serial_number: "[REDACTED]",
      authorization: "[REDACTED]",
      current_power: "[REDACTED]",
      energy_today: "[REDACTED]",
      intervals: [
        {
          end_at: 1779890400,
          wh_del: "[REDACTED]",
          enwh: "[REDACTED]",
          wh_imported: "[REDACTED]",
          wh_exported: "[REDACTED]"
        }
      ],
      product_name: "Envoy-S-Metered-EU"
    });
  });
});
