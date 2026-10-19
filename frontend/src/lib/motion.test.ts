import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CountUp } from "@/components/motion/count-up";
import { formatMoney } from "@/lib/money";
import { countFrames } from "@/lib/motion";

const xof = (n: number) => formatMoney(n, "XOF", "fr");
const eur = (n: number) => formatMoney(n, "EUR", "en");

describe("countFrames", () => {
  it("starts and ends on the exact formatted values", () => {
    const frames = countFrames(0, 123_457, xof);
    expect(frames[0]).toBe(xof(0));
    expect(frames.at(-1)).toBe(xof(123_457));
  });

  it("is monotone, up and down, on integer minor units", () => {
    const nums = countFrames(0, 98_765, String).map(Number);
    nums.slice(1).forEach((n, i) => expect(n).toBeGreaterThanOrEqual(nums[i]));
    nums.forEach((n) => expect(Number.isInteger(n)).toBe(true));
    const down = countFrames(5_000, 1_000, String).map(Number);
    down.slice(1).forEach((n, i) => expect(n).toBeLessThanOrEqual(down[i]));
  });

  it("formats every frame with money.ts (EUR keeps cents)", () => {
    const frames = countFrames(0, 250_075, eur);
    expect(frames.at(-1)).toBe("€2,500.75");
    frames.forEach((f) => expect(f).toMatch(/^€[\d,]+\.\d{2}$/));
  });

  it("returns one frame when nothing moves", () => {
    expect(countFrames(42, 42, xof)).toEqual([xof(42)]);
  });
});

describe("CountUp", () => {
  it("server-renders the exact final value, without aria-live", () => {
    const html = renderToString(createElement(CountUp, { value: 500_000, format: xof }));
    expect(html).toContain(`>${xof(500_000)}<`);
    expect(html).not.toContain("aria-live");
  });
});
