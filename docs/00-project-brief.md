# Project Brief

## Purpose

WattBridge helps a household understand and orchestrate home energy flows across photovoltaic production, grid import/export, and controllable devices.

The first practical target is to connect an Enphase SunPower photovoltaic system with an Envoy S Metered EU gateway to Samsung appliances exposed through SmartThings.

## Problem

Home energy systems often expose useful data through separate vendor apps and APIs. That fragmentation makes it hard to answer simple operational questions:

- Is there photovoltaic surplus right now?
- Which devices are consuming energy?
- Which appliance could safely run now?
- Did an automation recommend or trigger an action, and why?
- Can I check this and approve a recommendation while away from home?

## Initial Users

- A technically comfortable homeowner operating a photovoltaic system.
- A household that wants recommendations first, and automation later.
- A maintainer who needs clear logs, predictable behavior, and recoverable local state.

## Principles

- Documentation and explicit decisions before irreversible implementation.
- Adapter-based integrations instead of vendor assumptions in the core.
- Manual approval before automatic device control.
- Remote access through an explicit secure path, not accidental public exposure.
- Small milestones with test gates.
- Local-first operation where possible.
- Observability by default: logs, health checks, audit trails, and decision records.

## First Success Definition

WattBridge can read energy data from the photovoltaic system, read dryer state from SmartThings, normalize both into one model, and show a basic dashboard that is reachable away from home without sending real control commands automatically.

## Out Of Scope Initially

- Cloud-hosted SaaS.
- Billing.
- Multi-household account management.
- Fully autonomous appliance control.
- Broad integration marketplace.
