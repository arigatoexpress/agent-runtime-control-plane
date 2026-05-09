import assert from "node:assert/strict";
import test from "node:test";
import { classifyText, hasAnySignal } from "../src/classifier.mjs";

test("classifies x402 and Telegram without needing source lines", () => {
  const signals = classifyText("Use @x402/hono and Telegram dry-run quote flow.");
  assert.equal(signals.x402, true);
  assert.equal(signals.telegram, true);
});

test("classifies local, Windows, and edge runtime references", () => {
  const signals = classifyText("LaunchAgent for localhost, Windows Scheduled Task, and Raspberry Pi service.");
  assert.equal(signals.localRuntime, true);
  assert.equal(signals.windowsRuntime, true);
  assert.equal(signals.edgeRuntime, true);
});

test("hasAnySignal stays false for neutral product prose", () => {
  assert.equal(hasAnySignal("Rights-cleared source metadata and public previews."), false);
});

