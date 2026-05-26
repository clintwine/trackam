# Domain Model

## Core primitives

| Primitive | Role | Owned by |
|---|---|---|
| User | Platform account with roles and auth | trackam |
| Rider | Delivery agent registered to an operator | trackam |
| Route | Saved pickup-to-delivery pair with default rider and fee | trackam |
| Shipment | A single dispatch leg with cost, status, and risk score | trackam |
| DispatchRun | A grouped vehicle trip carrying multiple shipment legs | trackam |
| LiteWaybill | A cross-operator waybill with a physical claim token | OLI Switch (trackam mirrors) |
| HandoverToken | One-time token that authorizes a custody transfer | OLI Switch |
| HandoverEvent | Immutable PoH record — who gave to whom, when, with what evidence | OLI Switch |
| CustodianSession | OTP-verified session for a non-platform handler (rider, hub staff) | OLI Switch |
| Dispute | A contested handover event with lifecycle and evidence | OLI Switch |

## Shipment status transitions

```
pending
  └─► in_transit
        ├─► handed_over     (custody passed to another operator via PoH)
        ├─► delivered        (final receiver confirmed via PoH)
        ├─► failed
        ├─► ghosted          (no update past configurable threshold)
        └─► disputed         (dispute raised; custody frozen)
ghosted
  └─► in_transit            (rider resurfaces; recovery flow)
disputed
  └─► [previous status]     (resolved by admin)
```

## Waybill and shipment relationship

A `LiteWaybill` represents the physical goods journey end-to-end. Multiple operators can each have a `Shipment` linked to the same waybill. Each operator's shipment tracks their leg of the journey independently. The waybill ties the legs together into a verifiable chain.

```
LiteWaybill
  └── Shipment (Operator A leg)   ──► HandoverEvent (A → B)
  └── Shipment (Operator B leg)   ──► HandoverEvent (B → Receiver)
```

## Handover event structure

Every `HandoverEvent` records:
- Giver identity (platform user or custodian session)
- Giver actor type: `ACTOR_SENDER` / `ACTOR_COURIER` / `ACTOR_HUB` / `ACTOR_RECEIVER`
- Receiver name, phone, actor type
- Receiver BVN hash (government ID, for non-final handovers)
- GPS coordinates at time of handover
- BVN verification status: verified / override with reason / not required (final receiver)
- Proof hash (tamper-evident, derived from all event fields)
- Timestamp

## Evidence weight

The OLI Switch scores each handover event's evidence weight for use in dispute investigation:

| Condition | Weight |
|---|---|
| BVN verified + GPS captured | very_high |
| BVN verified, no GPS | high |
| BVN provider unavailable, bypass reason recorded | medium |
| No BVN (ACTOR_RECEIVER) | low |

## Custodian session lifecycle

```
HandoverEvent confirmed (receiver is ACTOR_COURIER or ACTOR_HUB)
  └─► CustodianSession created (OTP sent to receiver phone)
  └─► Receiver verifies OTP → session_token issued
  └─► Receiver uses session_token to initiate next HandoverToken
  └─► Session invalidated when HandoverToken is confirmed
```

## Dispatch run lifecycle

```
loading       (shipment legs being added)
  └─► in_transit   (vehicle departed)
        └─► completed
        └─► cancelled
```

## Invariants

- A shipment in `disputed` status cannot have new handover tokens initiated
- A handover token is single-use — claimed atomically via conditional UPDATE on the switch
- Custodian sessions are invalidated when the shipment's custody passes
- A waybill's claim token is single-use — proves physical handoff before digital tracking begins
- HandoverEvents are immutable once written
- Dispute resolution restores the shipment to its `pre_dispute_status`
