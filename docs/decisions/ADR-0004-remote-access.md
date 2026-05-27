# ADR-0004: Remote Access

## Status

Accepted

## Context

WattBridge should be usable away from home. A local-only dashboard would reduce product value because the user may want to inspect photovoltaic surplus, device state, and recommendations while outside the home.

At the same time, WattBridge may expose household energy patterns and, later, manual approval controls for appliances. Remote access must not become accidental public exposure of the local backend.

## Assumptions

- The first private MVP runs on a trusted Mac inside the home network.
- Remote access is required for the dashboard experience.
- The first MVP uses manual approval only.
- Public SaaS, billing, and multi-user account management remain out of scope.

## Options Considered

1. LAN/localhost only.
2. Direct router port forwarding to the local backend.
3. VPN-style private network access.
4. Secure tunnel with authenticated access.
5. Cloud-hosted backend.

## Decision

Prefer authenticated remote access through the selected control plane. If ADR-0005 is accepted, this means Supabase Auth plus a remote dashboard/control-plane model where any edge connector syncs outward and is not directly exposed.

VPN-style private network access or a secure authenticated tunnel remains an acceptable fallback for early development. Do not directly port-forward the local backend.

The exact tool should be chosen during Phase 0 after checking operational convenience, device support, authentication model, and whether the access path works well from mobile networks.

## Consequences

Positive:

- Preserves the local-first architecture while allowing use away from home.
- Avoids exposing the backend directly to the public internet.
- Keeps device integration and command execution out of the browser.
- Leaves room for native companion apps later.

Negative:

- Adds setup complexity for the private MVP.
- Remote access reliability depends on Supabase or the chosen VPN/tunnel provider.
- Push notifications may still need a separate solution later.

## Follow-Up Tasks

- Compare Supabase control plane, VPN-style access, and authenticated tunnel options.
- Decide whether localhost-only remains acceptable during early development.
- Require authentication before any remote manual approval action.
- Add audit fields that identify whether an approval happened locally or remotely.
- Revisit cloud relay or native companion app needs after Dashboard MVP.
