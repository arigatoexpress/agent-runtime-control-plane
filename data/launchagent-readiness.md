# LaunchAgent Readiness

Generated: 2026-05-09T23:51:37.927Z

This is a read-only source-file readiness pass. It does not call `launchctl`, load, unload, start, stop, or execute any LaunchAgent command.

## Summary

- total agents: 36
- ready for shadow check: 27
- needs review: 9
- blocked: 0
- source plist missing: 0
- command path missing: 0
- working directory missing: 0

## Issue Counts

- working_directory_unknown: 9

## Blocked Or Needs Review

| Label | Repo | Path | Readiness | Issues |
| --- | --- | --- | --- | --- |
| com.sapphire.logrotate | Sapphire | `infra/launchagents/com.sapphire.logrotate.plist` | needs_review | working_directory_unknown |
| com.sapphire.mac-to-windows-tunnel | Sapphire | `infra/launchagents/com.sapphire.mac-to-windows-tunnel.plist` | needs_review | working_directory_unknown |
| com.sapphire.readiness-cache | Sapphire | `infra/launchagents/com.sapphire.readiness-cache.plist` | needs_review | working_directory_unknown |
| com.sapphire.telemetry-collector | Sapphire | `infra/launchagents/com.sapphire.telemetry-collector.plist` | needs_review | working_directory_unknown |
| com.sapphire.threat-refresh | Sapphire | `infra/launchagents/com.sapphire.threat-refresh.plist` | needs_review | working_directory_unknown |
| com.sapphire.tradingview-cdp | Sapphire | `infra/launchagents/com.sapphire.tradingview-cdp.plist` | needs_review | working_directory_unknown |
| com.sapphire.tradingview-pine-batch | Sapphire | `infra/launchagents/com.sapphire.tradingview-pine-batch.plist` | needs_review | working_directory_unknown |
| com.sapphire.tradingview-ta-capture | Sapphire | `infra/launchagents/com.sapphire.tradingview-ta-capture.plist` | needs_review | working_directory_unknown |
| com.sapphire.cyber-threat-bot | cyber-threat-bot | `infra/com.sapphire.cyber-threat-bot.plist` | needs_review | working_directory_unknown |

## Next Safe Step

For each `ready_for_shadow_check` LaunchAgent, build a dry-run or artifact comparator in this repo before proposing any live runtime cutover.

