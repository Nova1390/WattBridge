# Platform Options Research

## Summary

The recommended starting point is a local backend with a responsive web dashboard/PWA, with native companion apps deferred.

## Option 1: Local Backend + Responsive Web App/PWA

Best for:

- Local network access.
- Continuous data collection.
- Rule evaluation.
- Dashboard iteration.
- Single implementation path.

Limitations:

- Needs a local runtime host.
- Mobile notifications may be less reliable than native apps.
- Packaging for non-developers must be solved later.

## Option 2: Native iOS/Android Apps

Best for:

- Mobile UX.
- Notifications.
- Widgets and platform integrations.

Limitations:

- Poor fit for always-on orchestration by itself.
- Higher testing and distribution complexity.
- Likely still needs a backend.

## Option 3: React Native Or Flutter

Best for:

- Shared mobile UI.
- Faster mobile delivery than fully native apps.

Limitations:

- Does not remove the need for a backend.
- Still adds mobile build and distribution complexity.
- Background automation remains constrained by mobile operating systems.

## Option 4: Home Assistant-First

Best for:

- Users already committed to Home Assistant.
- Fast access to an existing automation ecosystem.
- Local runtime and dashboard primitives.

Limitations:

- Product identity and UX become coupled to Home Assistant.
- Non-HA users face setup friction.
- Some architecture decisions become HA-specific.

## Option 5: Hybrid

Best for:

- Validating backend orchestration first.
- Keeping native apps as future companion clients.
- Balancing MVP speed with long-term user experience.

Limitations:

- Requires disciplined API boundaries.
- Native app requirements must be revisited later.
