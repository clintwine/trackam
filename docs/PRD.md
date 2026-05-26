# PRD

## What trackam is

Trackam is an open source operator platform for logistics companies. It gives operators a dashboard to dispatch shipments, manage riders and routes, and participate in the OLI network — a shared trust layer for cross-operator custody verification.

The problem it solves: when goods move across multiple independent companies, trust breaks. There is no standard way to prove who had what, when, and in what condition. Disputes get resolved by whoever has the better argument, not the better evidence.

Trackam's answer is the Proof of Handover (PoH) chain — every custody transfer is a cryptographic event with verified receiver identity, GPS coordinates, and a tamper-evident proof hash. The chain is append-only.

## Target users

| User | What they need |
|---|---|
| Logistics operator / business owner | Dashboard to dispatch shipments, manage riders, see costs, and monitor delivery performance |
| Dispatcher / operations staff | Quick dispatch, route lookup, rider assignment, shipment status updates |
| Rider / courier | OTP-verified custodian session to initiate and confirm handovers without a platform account |
| Hub staff | Same as rider — OTP session, scan-in confirmation |
| End receiver | Confirm receipt via handover QR or link — no account required |
| Network admin (OLI) | Cross-operator dispute resolution, fee management, operator onboarding |

## Core product goals

1. Give any logistics operator a production-ready dispatch platform they can self-host or deploy to Railway in under an hour
2. Make every custody transfer in the network cryptographically verifiable — from the moment goods leave the sender to final delivery
3. Enable multi-operator shipments without requiring operators to share a database or trust each other blindly
4. Give operators honest cost accounting — fuel, rider fees, and total logistics spend per shipment
5. Surface risk early — ghosting detection, delayed shipment flags, risk scoring before dispatch

## What is open source

The operator-facing platform — everything in this repository:
- Dispatch dashboard
- Rider and route management
- Shipment lifecycle and status log
- Dispatch runs
- OLI Switch proxy (waybill, handover, custodian, disputes)
- Cost accounting and risk scoring

## What stays private

The OLI Switch — the trust and settlement infrastructure:
- Proof of Handover chain
- Government ID verification
- Prepaid operator wallets
- Fee settlement
- Dispute resolution
- Cross-operator webhook delivery

This separation is intentional. The operator tooling is open because network effects require adoption. The trust infrastructure is private because it is the network's moat.

## Success criteria

- An operator can deploy trackam, register with OLI Switch, and dispatch their first verified shipment without engineering support
- A multi-operator waybill with three independent carriers produces an auditable, dispute-defensible handover chain
- When a dispute is raised, the evidence is already captured — no reconstruction from memory or paper
- Operators can see exactly what they are being charged and why

## Out of scope (current)

- Consumer-facing tracking pages (this is a B2B operator tool)
- Native mobile apps
- Route optimization or logistics marketplace features
- Storefront, catalog, or e-commerce
