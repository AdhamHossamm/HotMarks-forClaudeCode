import { describe, it, expect } from "vitest";
import { parseMarkers, type ParseResult } from "../src/parser.js";

describe("parseMarkers", () => {
  it("returns empty when no markers present", () => {
    const result = parseMarkers("plain text with no markers");
    expect(result.hasMarkers).toBe(false);
    expect(result.directives).toEqual([]);
    expect(result.criticals).toEqual([]);
  });

  it("extracts bold directive markers", () => {
    const result = parseMarkers("please **always use semicolons** in code");
    expect(result.hasMarkers).toBe(true);
    expect(result.directives).toEqual(["always use semicolons"]);
  });

  it("extracts underline critical markers", () => {
    const result = parseMarkers("the __database must not be dropped__ ever");
    expect(result.hasMarkers).toBe(true);
    expect(result.criticals).toEqual(["database must not be dropped"]);
  });

  it("extracts multiple markers of same type", () => {
    const result = parseMarkers("**rule one** and **rule two** apply");
    expect(result.directives).toEqual(["rule one", "rule two"]);
  });

  it("extracts both types in same prompt", () => {
    const result = parseMarkers("**use TypeScript** and __never skip tests__");
    expect(result.directives).toEqual(["use TypeScript"]);
    expect(result.criticals).toEqual(["never skip tests"]);
  });

  it("ignores markers inside fenced code blocks", () => {
    const input = `some text
\`\`\`
**this is code not a directive**
__this is code not critical__
\`\`\`
**this IS a directive**`;
    const result = parseMarkers(input);
    expect(result.directives).toEqual(["this IS a directive"]);
    expect(result.criticals).toEqual([]);
  });

  it("ignores markers inside inline code", () => {
    const result = parseMarkers("use `**bold**` syntax for directives");
    expect(result.hasMarkers).toBe(false);
  });

  it("ignores empty markers", () => {
    const result = parseMarkers("**** and ____ are empty");
    expect(result.hasMarkers).toBe(false);
  });

  it("ignores unmatched markers", () => {
    const result = parseMarkers("**unmatched bold and __unmatched underline");
    expect(result.hasMarkers).toBe(false);
  });

  it("handles nested markers - outer wins", () => {
    const result = parseMarkers("**__nested text__**");
    expect(result.directives).toEqual(["__nested text__"]);
    expect(result.criticals).toEqual([]);
  });
});
