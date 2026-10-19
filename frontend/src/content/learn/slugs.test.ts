import { describe, expect, it } from "vitest";
import { learnEntries } from "./articles";
import { LEARN_SLUGS } from "./slugs";

describe("LEARN_SLUGS", () => {
  it("lists exactly the slugs of the learn entries", () => {
    expect([...LEARN_SLUGS].sort()).toEqual(learnEntries.map((e) => e.slug).sort());
  });
});
