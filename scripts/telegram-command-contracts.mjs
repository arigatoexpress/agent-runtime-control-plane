#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultSapphireRoot = "/Users/aribs/Code/Sapphire";

export const SOURCE_FILE_DEFS = Object.freeze([
  {
    role: "telegram-service-readiness",
    relativePath: "services/pm_bot/server.py"
  },
  {
    role: "telegram-command-dispatch",
    relativePath: "plugins/claw-sapphire/tools/sapphire_pm_bot.py"
  },
  {
    role: "telegram-safety-policy",
    relativePath: "plugins/claw-sapphire/tools/internal/_telegram_safety.py"
  },
  {
    role: "source-runbook",
    relativePath: "services/pm_bot/README.md"
  }
]);

export const STATUS_READINESS_FIELD_NAMES = Object.freeze([
  "status",
  "service",
  "mode",
  "token_source",
  "polling_active",
  "last_poll_error",
  "shared_polling_allowed",
  "webhook_secret_configured",
  "bot_username",
  "supported_update_types",
  "telegram_delivery_ready",
  "telegram_delivery_reason",
  "telegram_probe_ok",
  "telegram_probe_error",
  "telegram_webhook_registered",
  "telegram_pending_update_count",
  "telegram_allowed_updates"
]);

export const DELIVERY_REASON_NAMES = Object.freeze([
  "webhook_registered",
  "webhook_missing",
  "polling_active",
  "polling_inactive",
  "probe_failed"
]);

export const SUPPORTED_UPDATE_TYPE_NAMES = Object.freeze([
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post"
]);

const SOURCE_READ_LIMIT_BYTES = 1024 * 1024;
const COMMAND_VERBS = Object.freeze(
  new Set([
    "help",
    "start",
    "status",
    "health",
    "services",
    "dev",
    "pulse",
    "svc",
    "whoami",
    "routines",
    "cancel-routine",
    "digest",
    "pm",
    "rag",
    "claw",
    "trade",
    "buy",
    "sell",
    "transfer",
    "withdraw",
    "deposit",
    "rotate-key",
    "rotate-secret",
    "launch",
    "deploy",
    "exec",
    "eval",
    "sudo",
    "shell",
    "bash",
    "cmd",
    "ssh",
    "kill-switch",
    "wire",
    "send-funds"
  ])
);
const COMMAND_SUBCOMMANDS = Object.freeze(
  new Map([
    ["dev", new Set(["pulse"])],
    ["svc", new Set(["status"])],
    ["routines", new Set(["list", "status", "pause", "resume"])],
    ["digest", new Set(["morning", "dev"])],
    ["pm", new Set(["list", "new"])]
  ])
);
const ENV_KEY_PATTERNS = Object.freeze([
  /\b(?:SAPPHIRE_PM_BOT|TELEGRAM|THO|MODE|LIVE_TRADING)[A-Z0-9_]*\b/g,
  /\b[A-Z][A-Z0-9_]*(?:TOKEN|SECRET|CHAT_ID|USER_IDS|API_KEY|WEBHOOK|HOST|PORT|PROJECT_ID|TIMEOUT_SECONDS|POLLING|TRADING)[A-Z0-9_]*\b/g
]);
const COMMAND_TOKEN_RE = /(?<![\w/])\/[a-z][a-z0-9_-]*(?:\s+[a-z][a-z0-9_-]*)?/g;
const TELEGRAM_TOKEN_VALUE_RE = /\b\d{7,12}:[A-Za-z0-9_-]{20,}\b/g;

export function buildTelegramPmBotStatusContract(options = {}) {
  const sapphireRoot = resolve(options.sapphireRoot ?? defaultSapphireRoot);
  const now = options.now instanceof Date ? options.now : new Date();
  const sourceSnapshots = SOURCE_FILE_DEFS.map((def) =>
    readSourceSnapshot(resolve(sapphireRoot, def.relativePath), def)
  );
  const textByRole = Object.fromEntries(
    sourceSnapshots.map((snapshot) => [snapshot.role, snapshot.text])
  );
  const sourceTexts = sourceSnapshots.map((snapshot) => snapshot.text).join("\n");

  const configKeyNames = extractConfigKeyNames(sourceTexts);
  const recipientConfigKeyNames = configKeyNames.filter((key) =>
    /CHAT|RECIPIENT|CHANNEL|ALLOWED_USER_IDS/i.test(key)
  );
  const tokenConfigKeyNames = configKeyNames.filter(
    (key) => /BOT_TOKEN|TELEGRAM_BOT_TOKEN|PM_BOT_TOKEN/i.test(key) && !/REDACTED/i.test(key)
  );
  const secretConfigKeyNames = configKeyNames.filter((key) =>
    /SECRET|API_KEY|AUTHORIZATION|CREDENTIAL/i.test(key)
  );
  const commandTokenNames = extractCommandTokenNames(textByRole["telegram-command-dispatch"] ?? "");
  const readinessFieldEvidence = evidenceByName(
    STATUS_READINESS_FIELD_NAMES,
    textByRole["telegram-service-readiness"] ?? ""
  );
  const deliveryReasonEvidence = evidenceByName(
    DELIVERY_REASON_NAMES,
    `${textByRole["telegram-service-readiness"] ?? ""}\n${textByRole["source-runbook"] ?? ""}`
  );

  const sourcePaths = sourceSnapshots.map(({ role, path, relativePath, exists, bytes, lineCount }) => ({
    role,
    path,
    relativePath,
    exists,
    bytes,
    lineCount
  }));

  const sourceEvidence = {
    statusDispatchRegistered: /if\s+text\s*==\s*["']\/status["']/.test(
      textByRole["telegram-command-dispatch"] ?? ""
    ),
    statusHandlerPresent: /def\s+_format_status_report\b/.test(
      textByRole["telegram-command-dispatch"] ?? ""
    ),
    readinessEndpointRegistered: /@app\.get\(["']\/health["']\)/.test(
      textByRole["telegram-service-readiness"] ?? ""
    ),
    sendCallPresentInSource: /\bsend_message\b|sendMessage/.test(sourceTexts),
    forbiddenCommandGuardPresent: /FORBIDDEN_COMMAND_RE|is_forbidden_command/.test(
      textByRole["telegram-safety-policy"] ?? ""
    ),
    liveTradingTripwirePresent: /LIVE_TRADING_DISABLED_FROM_TELEGRAM/.test(
      textByRole["telegram-safety-policy"] ?? ""
    ),
    secretRedactionPresent: /redact_secrets|_redact_sensitive_text/.test(sourceTexts),
    supportedUpdatesDeclared: SUPPORTED_UPDATE_TYPE_NAMES.every((name) =>
      sourceTexts.includes(`"${name}"`) || sourceTexts.includes(`'${name}'`)
    ),
    readinessFieldNamesPresentCount: Object.values(readinessFieldEvidence).filter(Boolean).length,
    deliveryReasonNamesPresentCount: Object.values(deliveryReasonEvidence).filter(Boolean).length
  };

  const contract = {
    schema: "aribs.telegram_pm_bot_status_command_contract.v1",
    generatedAt: now.toISOString(),
    repo: {
      name: "agent-runtime-control-plane",
      path: repoRoot
    },
    sourceOwner: {
      name: "Sapphire PM bot",
      rootPath: sapphireRoot,
      ownerPosture: "read-only source owner until shadow comparison passes",
      rollback: "Keep Sapphire services/pm_bot and plugins/claw-sapphire/tools/sapphire_pm_bot.py as the active owner; remove this shadow contract slice if comparison fails."
    },
    safety: {
      mode: "dry-run-contract",
      wouldSend: false,
      sendsTelegram: false,
      mutatesRuntime: false,
      mutatesLaunchAgents: false,
      mutatesRepos: false,
      readsEnvironmentValues: false,
      readsTokenValues: false,
      readsRecipientValues: false,
      storesSourceLines: false,
      storesSecretValues: false,
      exposesOnly: [
        "source paths",
        "counts",
        "command token names",
        "configuration key names",
        "readiness field names",
        "delivery reason names",
        "boolean evidence flags"
      ]
    },
    command: {
      name: "/status",
      sourceHandlerName: "_format_status_report",
      readinessEndpoint: {
        method: "GET",
        path: "/health",
        fieldNames: [...STATUS_READINESS_FIELD_NAMES],
        deliveryReasonNames: [...DELIVERY_REASON_NAMES],
        supportedUpdateTypeNames: [...SUPPORTED_UPDATE_TYPE_NAMES]
      },
      dryRunInvocation: {
        wouldSend: false,
        telegramApiMethodsCalled: [],
        networkCallsAllowed: false,
        sampleUpdateValuePolicy: "shape-only; no chat_id, user_id, token, or rendered response values are stored",
        outputValuePolicy: "metadata-only; no rendered PM status body is stored"
      }
    },
    configKeyNames,
    recipientConfigKeyNames,
    tokenConfigKeyNames,
    secretConfigKeyNames,
    counts: {
      sourceFilePaths: sourcePaths.length,
      sourceFilesPresent: sourcePaths.filter((source) => source.exists).length,
      sourceFilesMissing: sourcePaths.filter((source) => !source.exists).length,
      commandTokenNames: commandTokenNames.length,
      configKeyNames: configKeyNames.length,
      recipientConfigKeyNames: recipientConfigKeyNames.length,
      tokenConfigKeyNames: tokenConfigKeyNames.length,
      secretConfigKeyNames: secretConfigKeyNames.length,
      readinessFieldNames: STATUS_READINESS_FIELD_NAMES.length,
      readinessFieldNamesPresent: sourceEvidence.readinessFieldNamesPresentCount,
      deliveryReasonNames: DELIVERY_REASON_NAMES.length,
      deliveryReasonNamesPresent: sourceEvidence.deliveryReasonNamesPresentCount
    },
    commandTokenNames,
    sourcePaths,
    sourceEvidence,
    shadowComparisonGate: {
      currentPhase: "shadow-contract-only",
      sourceRemainsOwner: true,
      compareBeforeCutover: [
        "Sapphire /status command remains the active implementation.",
        "This repo may compare metadata shape and readiness field names only.",
        "No Telegram send, webhook mutation, polling mutation, launchctl mutation, deploy, or token read is allowed in this phase.",
        "Promotion requires a separate shadow comparison result showing matching safe field names/counts and an explicit reversible cutover plan."
      ],
      rollback: [
        "Remove the package script entry that invokes this contract.",
        "Remove scripts/telegram-command-contracts.mjs, tests/telegram-command-contracts.test.mjs, and docs/TELEGRAM_PM_BOT_STATUS_CONTRACT.md.",
        "Leave Sapphire PM bot runtime untouched; it is already the source owner."
      ]
    }
  };

  contract.assertions = buildAssertions(contract);
  contract.strictPass = contract.assertions.every((assertion) => assertion.passed);
  return contract;
}

function readSourceSnapshot(path, def) {
  const snapshot = {
    role: def.role,
    path,
    relativePath: def.relativePath,
    exists: existsSync(path),
    bytes: 0,
    lineCount: 0,
    text: ""
  };
  if (!snapshot.exists) return snapshot;

  try {
    const stat = statSync(path);
    snapshot.bytes = stat.size;
    if (stat.size <= SOURCE_READ_LIMIT_BYTES) {
      snapshot.text = readFileSync(path, "utf8");
      snapshot.lineCount = countLines(snapshot.text);
    }
  } catch {
    snapshot.exists = false;
    snapshot.text = "";
  }
  return snapshot;
}

function countLines(text) {
  if (!text) return 0;
  return text.endsWith("\n") ? text.split("\n").length - 1 : text.split("\n").length;
}

function extractConfigKeyNames(text) {
  const keys = new Set();
  for (const pattern of ENV_KEY_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const key = match[0];
      if (key.length <= 80) keys.add(key);
    }
  }
  return [...keys].sort();
}

function extractCommandTokenNames(text) {
  const commands = new Set();
  for (const match of text.matchAll(COMMAND_TOKEN_RE)) {
    const command = normalizeCommandToken(match[0]);
    if (command) commands.add(command);
  }
  return [...commands].sort();
}

function normalizeCommandToken(raw) {
  const parts = raw.trim().replace(/\s+/g, " ").slice(1).split(" ");
  const verb = parts[0];
  if (!COMMAND_VERBS.has(verb)) return null;
  const subcommands = COMMAND_SUBCOMMANDS.get(verb);
  const subcommand = parts[1];
  if (subcommands?.has(subcommand)) return `/${verb} ${subcommand}`;
  return `/${verb}`;
}

function evidenceByName(names, text) {
  return Object.fromEntries(
    names.map((name) => [
      name,
      text.includes(`"${name}"`) || text.includes(`'${name}'`) || text.includes(name)
    ])
  );
}

function buildAssertions(contract) {
  return [
    {
      name: "would_send_false",
      passed: contract.safety.wouldSend === false && contract.command.dryRunInvocation.wouldSend === false
    },
    {
      name: "no_telegram_api_methods_called",
      passed: contract.command.dryRunInvocation.telegramApiMethodsCalled.length === 0
    },
    {
      name: "no_env_values_read",
      passed:
        contract.safety.readsEnvironmentValues === false &&
        contract.safety.readsTokenValues === false &&
        contract.safety.readsRecipientValues === false
    },
    {
      name: "all_source_files_present",
      passed: contract.counts.sourceFilesMissing === 0
    },
    {
      name: "status_dispatch_registered",
      passed: contract.sourceEvidence.statusDispatchRegistered === true
    },
    {
      name: "status_handler_present",
      passed: contract.sourceEvidence.statusHandlerPresent === true
    },
    {
      name: "health_endpoint_registered",
      passed: contract.sourceEvidence.readinessEndpointRegistered === true
    },
    {
      name: "critical_readiness_fields_present",
      passed:
        contract.sourceEvidence.readinessFieldNamesPresentCount >=
        STATUS_READINESS_FIELD_NAMES.length - 1
    },
    {
      name: "no_token_value_shape_in_contract",
      passed: !TELEGRAM_TOKEN_VALUE_RE.test(JSON.stringify(contract))
    },
    {
      name: "source_remains_owner",
      passed: contract.shadowComparisonGate.sourceRemainsOwner === true
    }
  ];
}

function parseArgs(argv) {
  const options = {
    sapphireRoot: defaultSapphireRoot,
    compact: false,
    strict: false,
    help: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--sapphire-root") {
      options.sapphireRoot = argv[index + 1];
      index += 1;
    } else if (arg === "--compact") {
      options.compact = true;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function usage() {
  return [
    "Usage: node scripts/telegram-command-contracts.mjs [--sapphire-root <path>] [--strict] [--compact]",
    "",
    "Builds a dry-run, metadata-only Telegram PM bot /status command contract.",
    "It reads source files only, never environment values, and never sends Telegram messages."
  ].join("\n");
}

function isCli() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isCli()) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      process.exit(0);
    }
    const contract = buildTelegramPmBotStatusContract({ sapphireRoot: options.sapphireRoot });
    process.stdout.write(`${JSON.stringify(contract, null, options.compact ? 0 : 2)}\n`);
    if (options.strict && !contract.strictPass) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
