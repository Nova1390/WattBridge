# ADR-0001: App Platform

## Status

Accepted

## Context

WattBridge needs to collect local and cloud energy data, normalize it, store or refresh history as appropriate, evaluate automation rules, and present a dashboard. The first integrations are an Enphase SunPower photovoltaic system with an Envoy S Metered EU gateway and Samsung appliances through SmartThings.

The first product problem is orchestration and decision safety, not native mobile polish. Real device control must wait until the safety model and manual approval flow are documented and tested.

The dashboard should be usable away from home. This adds a remote access requirement, but it does not automatically require a native mobile app or public cloud backend.

## Assumptions

- A trusted local device can run an always-on backend inside the home network.
- The first private MVP can run on a Mac.
- The first user is comfortable running local software during discovery and MVP stages.
- Enphase access may require local network communication, cloud communication, or both.
- SmartThings access is likely cloud API based and token driven.
- Mobile notifications and deep mobile UX are useful, but not required for the first validation milestone.
- Remote dashboard access is required, but the access mechanism can be decided separately.

## Decision Drivers

- Local network access.
- Remote access away from home.
- Speed of MVP.
- Dashboard quality.
- Background automation reliability.
- Mobile notifications.
- Long-term maintainability.
- Integration flexibility.
- Testing complexity.
- Deployment complexity.
- User experience.

## Options Considered

1. Responsive web app/PWA with a local backend.
2. Native iOS/Android apps.
3. Cross-platform mobile app such as React Native or Flutter.
4. Home Assistant-first integration/dashboard.
5. Hybrid approach: local backend + web dashboard first, native companion app later.

## Comparison

| Criteria | Local backend + web/PWA | Native iOS/Android | React Native/Flutter | Home Assistant-first | Hybrid local first, native later |
| --- | --- | --- | --- | --- | --- |
| Local network access | Strong through backend | Mixed; mobile LAN constraints vary | Mixed; still needs backend for reliability | Strong if HA is present | Strong through backend |
| Remote access away from home | Medium; needs VPN/tunnel/auth layer | High if paired with cloud/backend | High if paired with cloud/backend | Medium; depends on HA remote access | Medium first, high later |
| Speed of MVP | High | Low | Medium | Medium if HA is already installed | High |
| Dashboard quality | High | High but duplicated per platform | High | Medium to high within HA constraints | High |
| Background automation reliability | High if backend is always on | Weak on phones due OS background limits | Weak to medium without backend | High in HA runtime | High through backend |
| Mobile notifications | Medium through PWA/web push depending platform | High | High | Medium through HA/mobile app | Medium first, high later |
| Long-term maintainability | High with one backend and one UI | Lower due multiple clients | Medium | Medium; coupled to HA ecosystem | High with staged clients |
| Integration flexibility | High | Medium; integrations should not live on phones | Medium; still needs backend | Medium; best for HA ecosystem | High |
| Testing complexity | Medium | High | High | Medium | Medium now, higher later |
| Deployment complexity | Medium; local service needed | High; app distribution plus backend likely | High; app distribution plus backend likely | Medium; requires HA setup | Medium now, higher later |
| User experience | Good dashboard, acceptable mobile | Best mobile | Good mobile | Best for HA users | Good now, best later |

## Decision

Recommend option 5: a hybrid approach that starts with a responsive web dashboard/PWA, Supabase-backed control plane, and optional edge connector for local-only integrations, with native companion apps deferred until the backend, safety model, and core workflows are validated.

In practical Phase 1 terms, this means implementing the web/PWA client first while preserving a path to native apps later. ADR-0005 covers whether the backend remains local-only or uses a Supabase control plane.

## Rationale

The system's hardest early problems are reliable data collection, normalization, rule evaluation, safety controls, history, and observability. These belong in a backend/agent that can run continuously on the local network. A responsive dashboard can validate the product quickly without duplicating platform-specific mobile work.

Remote access should be handled as a secure transport/authentication decision around the local backend, not as a reason to put integration and automation logic inside a phone app.

Native apps become more attractive after the core orchestration layer exists, especially for notifications, quick actions, widgets, and polished mobile interactions.

## Consequences

Positive:

- Fastest path to a useful dashboard and integration validation.
- Keeps automation out of mobile background execution limits.
- Encourages a clean API boundary between backend and clients.
- Makes future integrations easier to add through adapters.
- Reduces duplicated early UI work.
- Allows Supabase or another control plane to be added without moving integration logic into the web client.

Negative:

- Requires a local runtime host.
- Initial mobile experience may be less polished than native.
- Push notifications may be limited or platform-dependent until a companion app exists.
- Deployment packaging must be solved for non-developer use.
- Remote access setup must be solved before the app feels valuable away from home.

## Tradeoffs

- We choose backend reliability over immediate native mobile polish.
- We choose secure remote access around a local backend over direct public exposure.
- We choose integration flexibility over Home Assistant-only speed.
- We choose a staged product path over committing to app-store distribution before validating the orchestration model.

## Follow-Up Tasks

- Confirm target local host for development and first home deployment.
- Use Mac as the first private MVP host unless discovery reveals a blocker.
- Decide remote access mechanism in ADR-0004.
- Decide backend topology in ADR-0005.
- Validate Enphase local/cloud API availability.
- Validate SmartThings API scopes and appliance capabilities.
- Define backend API boundaries with future native clients in mind.
- Revisit native companion app requirements after Dashboard MVP and Automation Engine phases.

## Review Notes

This ADR is proposed, not accepted. Implementation should not start until this platform direction is reviewed.
