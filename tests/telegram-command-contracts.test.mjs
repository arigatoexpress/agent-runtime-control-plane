import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { buildTelegramPmBotStatusContract } from "../scripts/telegram-command-contracts.mjs";

const cwd = "/Users/aribs/Code/agent-runtime-control-plane";

test("telegram command contract script parses", () => {
  execFileSync("node", ["--check", "scripts/telegram-command-contracts.mjs"], {
    cwd,
    stdio: "pipe"
  });
  assert.ok(true);
});

test("builds a dry-run /status contract without runtime send posture", () => {
  const sapphireRoot = makeFixtureSapphireRoot();
  const contract = buildTelegramPmBotStatusContract({
    sapphireRoot,
    now: new Date("2026-05-10T00:00:00.000Z")
  });

  assert.equal(contract.schema, "aribs.telegram_pm_bot_status_command_contract.v1");
  assert.equal(contract.generatedAt, "2026-05-10T00:00:00.000Z");
  assert.equal(contract.safety.wouldSend, false);
  assert.equal(contract.command.dryRunInvocation.wouldSend, false);
  assert.deepEqual(contract.command.dryRunInvocation.telegramApiMethodsCalled, []);
  assert.equal(contract.safety.readsEnvironmentValues, false);
  assert.equal(contract.safety.readsTokenValues, false);
  assert.equal(contract.safety.readsRecipientValues, false);
  assert.equal(contract.shadowComparisonGate.sourceRemainsOwner, true);
  assert.equal(contract.strictPass, true);
});

test("exposes key names and paths but not token or recipient values", () => {
  const sapphireRoot = makeFixtureSapphireRoot();
  const oldToken = process.env.SAPPHIRE_PM_BOT_TOKEN;
  const oldAllowed = process.env.SAPPHIRE_PM_BOT_ALLOWED_USER_IDS;
  process.env.SAPPHIRE_PM_BOT_TOKEN = "9999999999:abcdefghijklmnopqrstuvwxyzABCDE";
  process.env.SAPPHIRE_PM_BOT_ALLOWED_USER_IDS = "9876543210987654";
  try {
    const contract = buildTelegramPmBotStatusContract({ sapphireRoot });
    const rendered = JSON.stringify(contract);

    assert.ok(contract.tokenConfigKeyNames.includes("SAPPHIRE_PM_BOT_TOKEN"));
    assert.ok(contract.recipientConfigKeyNames.includes("SAPPHIRE_PM_BOT_ALLOWED_USER_IDS"));
    assert.ok(contract.sourcePaths.every((source) => source.path.startsWith(sapphireRoot)));
    assert.ok(!rendered.includes(process.env.SAPPHIRE_PM_BOT_TOKEN));
    assert.ok(!rendered.includes(process.env.SAPPHIRE_PM_BOT_ALLOWED_USER_IDS));
  } finally {
    restoreEnv("SAPPHIRE_PM_BOT_TOKEN", oldToken);
    restoreEnv("SAPPHIRE_PM_BOT_ALLOWED_USER_IDS", oldAllowed);
  }
});

test("CLI emits strict JSON for a fixture source root", () => {
  const sapphireRoot = makeFixtureSapphireRoot();
  const output = execFileSync(
    "node",
    ["scripts/telegram-command-contracts.mjs", "--sapphire-root", sapphireRoot, "--strict"],
    { cwd, encoding: "utf8", stdio: "pipe" }
  );
  const contract = JSON.parse(output);

  assert.equal(contract.strictPass, true);
  assert.equal(contract.command.name, "/status");
  assert.equal(contract.sourceEvidence.statusDispatchRegistered, true);
  assert.equal(contract.sourceEvidence.readinessEndpointRegistered, true);
  assert.ok(contract.command.readinessEndpoint.fieldNames.includes("telegram_delivery_ready"));
});

function makeFixtureSapphireRoot() {
  const root = mkdtempSync(join(tmpdir(), "sapphire-pm-contract-"));
  writeFixture(
    root,
    "services/pm_bot/server.py",
    `
_SUPPORTED_UPDATE_TYPES = ["message", "edited_message", "channel_post", "edited_channel_post"]
class Settings:
    token_source = "explicit_env"
def _resolve_bot_token():
    return "not-used-by-contract"
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "sapphire-pm-bot",
        "mode": "webhook",
        "token_source": "explicit_env",
        "polling_active": False,
        "last_poll_error": None,
        "shared_polling_allowed": False,
        "webhook_secret_configured": False,
        "bot_username": "SapphirePMBot",
        "supported_update_types": list(_SUPPORTED_UPDATE_TYPES),
        "telegram_delivery_ready": False,
        "telegram_delivery_reason": "webhook_missing",
        "telegram_probe_ok": True,
        "telegram_probe_error": None,
        "telegram_webhook_registered": False,
        "telegram_pending_update_count": 0,
        "telegram_allowed_updates": ["message"],
    }
def process_update(update):
    TELEGRAM_API.send_message(chat_id=1, text="not executed", parse_mode=None)
`
  );
  writeFixture(
    root,
    "plugins/claw-sapphire/tools/sapphire_pm_bot.py",
    `
STATUS_HELP_TEXT = """
• /help
• /status
• /health
• /services
• /svc status
• /pm list [--project <id>]
• /pm new <title>
• /rag <query>
• /claw <prompt>
• /routines list
• /routines status
• /routines pause <name>
• /routines resume <name> CONFIRM
• /digest morning
• /digest dev
• /cancel-routine <name> CONFIRM
• /whoami
"""
def _format_status_report():
    return {"text": "status", "parse_mode": "MarkdownV2"}
def _dispatch(text, update):
    if text == "/status":
        return _format_status_report()
    if text == "/health":
        return {}
`
  );
  writeFixture(
    root,
    "plugins/claw-sapphire/tools/internal/_telegram_safety.py",
    `
LIVE_TRADING_DISABLED_FROM_TELEGRAM = True
FORBIDDEN_COMMAND_RE = r"^/(trade|buy|sell)"
SAPPHIRE_PM_BOT_ALLOWED_USER_IDS = "key-name-only"
SAPPHIRE_PM_BOT_TOKEN = "key-name-only"
def redact_secrets(text):
    return text
def is_forbidden_command(text):
    return False
`
  );
  writeFixture(
    root,
    "services/pm_bot/README.md",
    `
Required key names:
- SAPPHIRE_PM_BOT_TOKEN
- TELEGRAM_BOT_TOKEN
- SAPPHIRE_PM_BOT_ALLOWED_USER_IDS
- SAPPHIRE_PM_BOT_ALLOWED_USER_IDS_FILE
- SAPPHIRE_PM_BOT_WEBHOOK_SECRET
- TELEGRAM_WEBHOOK_SECRET
Delivery reasons:
- webhook_registered
- webhook_missing
- polling_active
- polling_inactive
- probe_failed
`
  );
  return root;
}

function writeFixture(root, relativePath, contents) {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents.trimStart());
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
