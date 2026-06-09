import { describe, it, expect } from "vitest";

/**
 * Date utility tests for Vicissometer.
 * These test the normalizeDate logic that protects historical data integrity
 * during CSV imports.
 */

// Mirror of the normalizeDate function from CsvImport.tsx.
// If that function is ever extracted to a shared utility, update the import.
function normalizeDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Ambiguous numeric formats like MM/DD/YYYY or DD-MM-YYYY must be rejected first,
  // before passing to Date constructor which silently guesses.
  if (new RegExp('^\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}$').test(dateStr)) {
    throw new Error(`Ambiguous date format: ${dateStr}. Please convert to YYYY-MM-DD in your spreadsheet.`);
  }

  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}. Please use YYYY-MM-DD.`);
  }

  return dateObj.toISOString().split("T")[0];
}

describe("normalizeDate", () => {
  it("passes through valid YYYY-MM-DD strings unchanged", () => {
    expect(normalizeDate("2026-04-23")).toBe("2026-04-23");
  });

  it("throws on ambiguous MM/DD/YYYY formats", () => {
    expect(() => normalizeDate("03/04/2026")).toThrow("Ambiguous date format");
  });

  it("throws on ambiguous DD-MM-YYYY formats", () => {
    expect(() => normalizeDate("23-04-2026")).toThrow("Ambiguous date format");
  });

  it("throws on ambiguous MM.DD.YYYY formats", () => {
    expect(() => normalizeDate("04.23.2026")).toThrow("Ambiguous date format");
  });

  it("throws on completely invalid date strings", () => {
    expect(() => normalizeDate("not-a-date")).toThrow("Invalid date format");
  });
});
