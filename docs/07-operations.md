# Operations

## Deployment Assumption

The first deployment should run on a trusted Mac inside the home network.

Candidate hosts:

- Mac for discovery and first private MVP.
- Raspberry Pi or similar always-on device for home operation.
- NAS or home server if already available.

## Runtime Expectations

- Service can restart without losing configuration.
- Integrations report degraded status instead of crashing the service.
- Dashboard shows stale data clearly.
- Dashboard can be reached away from home only through the selected secure access path.
- Logs are readable during local troubleshooting.

## Health Checks

Minimum health signals:

- Backend process status.
- Database connectivity.
- Last energy sample timestamp.
- Last SmartThings sync timestamp.
- Adapter-specific last error.

## Logging

Logs should include:

- Startup configuration summary without secrets.
- Integration sync start, success, and failure.
- Rule evaluation decisions.
- Recommendation lifecycle.
- Command lifecycle when commands are eventually enabled.

Logs must not include:

- Tokens.
- Passwords.
- Full authorization headers.
- Unredacted raw responses containing credentials or private identifiers.

## Backup And Recovery

Initial backup scope:

- Configuration.
- Local database.
- ADRs and documentation.

Secrets backup must be decided separately before real deployment.

## Operational Runbook Draft

1. Check service health.
2. Check integration health.
3. Confirm last successful sample time.
4. Inspect recent errors with redaction.
5. Restart service if the process is unhealthy.
6. Disable automation mode before troubleshooting real device-control behavior.
7. If remote access fails, verify the secure tunnel or VPN before changing backend exposure.
