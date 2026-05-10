# Telegram PM Bot Status Contract

This repo now carries a shadow contract for the Sapphire Telegram PM bot
`/status` behavior. It is not a runtime replacement yet.

## Source Owner

Sapphire remains the active owner:

- `/Users/aribs/Code/Sapphire/services/pm_bot/server.py`
- `/Users/aribs/Code/Sapphire/plugins/claw-sapphire/tools/sapphire_pm_bot.py`
- `/Users/aribs/Code/Sapphire/plugins/claw-sapphire/tools/internal/_telegram_safety.py`
- `/Users/aribs/Code/Sapphire/services/pm_bot/README.md`

The control-plane script reads those files as source metadata only. It does not
import Sapphire Python, call Telegram, read environment values, mutate launchd,
or write runtime state.

## Dry-Run Guarantees

`scripts/telegram-command-contracts.mjs` emits
`aribs.telegram_pm_bot_status_command_contract.v1` with:

- `wouldSend=false`
- `sendsTelegram=false`
- `mutatesRuntime=false`
- `mutatesLaunchAgents=false`
- `readsEnvironmentValues=false`
- `readsTokenValues=false`
- `readsRecipientValues=false`

The emitted contract is limited to paths, counts, command token names,
configuration key names, readiness field names, delivery reason names, and
boolean evidence flags. It must not contain token values, recipient IDs, chat
IDs, rendered Telegram payloads, or source lines.

## Status And Readiness Shape

The shadow contract tracks the Sapphire `/status` command and the PM bot
`GET /health` readiness surface. The readiness field names are:

- `telegram_delivery_ready`
- `telegram_delivery_reason`
- `telegram_probe_ok`
- `telegram_webhook_registered`
- `telegram_pending_update_count`
- `telegram_allowed_updates`
- plus the surrounding local process fields such as `mode`, `token_source`,
  `polling_active`, and `last_poll_error`

Delivery reason names are metadata only:

- `webhook_registered`
- `webhook_missing`
- `polling_active`
- `polling_inactive`
- `probe_failed`

## Shadow Comparison Gate

The control plane may compare metadata shape and safe counts against Sapphire,
but it must not send Telegram messages or read token/recipient values. Cutover
requires a separate shadow comparison artifact showing matching safe field
names/counts and an explicit reversible cutover plan.

Until that passes, the source Sapphire PM bot remains the owner.

## Rollback

Rollback is source-only and does not touch runtime:

- remove the package script entry that invokes the contract;
- remove `scripts/telegram-command-contracts.mjs`;
- remove `tests/telegram-command-contracts.test.mjs`;
- remove this document.

No LaunchAgent, webhook, polling mode, Telegram token, recipient allowlist,
cloud service, or Sapphire runtime state needs to change because this slice is
shadow-contract-only.
