export const SIGNALS = {
  x402: [
    /\bx402\b/i,
    /402 Payment/i,
    /PAYMENT-REQUIRED/i,
    /@x402\//i,
    /paymentMiddleware/i,
    /live_settlement_allowed/i,
    /liveSettlementAllowed/i
  ],
  telegram: [
    /\btelegram\b/i,
    /sendMessage/i,
    /chat_id/i,
    /TELEGRAM_[A-Z0-9_]+/i,
    /pm[_-]?bot/i
  ],
  hermes: [
    /\bhermes\b/i,
    /ai\.hermes/i,
    /hermes_runtime/i
  ],
  localRuntime: [
    /LaunchAgent/i,
    /launchctl/i,
    /127\.0\.0\.1/i,
    /\blocalhost\b/i,
    /mac-local/i,
    /local_failover/i,
    /ollama/i
  ],
  windowsRuntime: [
    /windows-gpu/i,
    /Scheduled Task/i,
    /Task Scheduler/i,
    /\.ps1\b/i,
    /\.bat\b/i,
    /start_tv_agent/i
  ],
  edgeRuntime: [
    /Raspberry/i,
    /\bPi\b/,
    /systemd/i,
    /\.service\b/i,
    /deploy_to_pi/i
  ],
  tradingExecution: [
    /live trading/i,
    /order signing/i,
    /order[-_ ]?draft/i,
    /execution dispatcher/i,
    /paper_trading/i,
    /TRADINGVIEW_EXECUTION_ENABLED/i
  ]
};

export function classifyText(text) {
  const matches = {};
  for (const [signal, patterns] of Object.entries(SIGNALS)) {
    if (patterns.some((pattern) => pattern.test(text))) {
      matches[signal] = true;
    }
  }
  return matches;
}

export function hasAnySignal(text) {
  return Object.keys(classifyText(text)).length > 0;
}

