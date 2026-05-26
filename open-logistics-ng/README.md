# open-logistics-ng

**Open Logistics Interconnect (OLI)** — an open schema and vocabulary for Nigerian logistics interoperability.

OLI defines the shared language that lets different logistics companies, courier apps, warehouses, and merchants hand off shipments to each other digitally. It is built on [GS1 EPCIS 2.0](https://ref.gs1.org/standards/epcis/) and [JSON-LD](https://json-ld.org/).

---

## The problem

Every logistics company in Nigeria runs a silo. A package that moves from a Lagos merchant → interstate truck → Abuja bike fleet → end customer passes through 4 systems with 4 different tracking formats. When something goes wrong, nobody has the receipts.

OLI is the NIBSS for logistics — a neutral, open standard that makes those handoffs machine-readable and verifiable.

---

## Core concepts

### Custody Transfer Event
A `CustodyTransferEvent` is generated every time physical custody of goods changes hands. It contains:
- A Proof of Handover (PoH) hash — SHA-256 of the event fields
- The actor types on both sides (Sender, Courier, Hub, Receiver)
- GPS coordinates of the transfer point
- Identity verification flags (`idVerified`, `idOverride`) and evidence weight
- A link to the waybill EPC

### Actor Types
| Type | Description |
|---|---|
| `ACTOR_SENDER` | The merchant or origin party releasing the goods |
| `ACTOR_COURIER` | The rider, driver, or fleet executing transport |
| `ACTOR_HUB` | A sortation hub, warehouse, or trans-shipment centre |
| `ACTOR_RECEIVER` | The end customer or consignee |

### Waybill EPC
Every shipment is identified by a URN: `urn:ol:waybill:{uuid}`. This URN resolves to a public tracking URL when dereferenced.

### Claim Token
Every waybill includes a `claimToken` — a short alphanumeric code printed on the physical document. Single-use. Proves physical handoff from sender to the first operator without requiring digital auth. The operator scans or types this token to claim the waybill into their system.

### Current Custodian
The `currentCustodian` block tells the OLI Switch which operator currently holds custody and where to query for live location. It contains:
- `operatorId` — the operator's UUID in the switch registry
- `trackingEndpoint` — the base URL of that operator's trackam instance
- `custodyType` — `OPERATOR_HUB` (static) or `RIDER_IN_TRANSIT` (live GPS stream)

When the switch needs to resolve a shipment's current location, it reads `currentCustodian.trackingEndpoint` and calls `GET /api/shipments/:id` with `Accept: application/ld+json` against that operator's instance.

### Identity Verification
Government ID verification is required for non-final handovers. The scheme is country-specific: Nigeria uses BVN, Ghana uses the Ghana Card, Kenya and Rwanda use National ID numbers, South Africa uses the SA ID number. The ID is verified against the relevant national registry and stored as an HMAC-SHA256 hash — the plaintext ID is never stored. The `idVerified` flag on the event indicates whether verification succeeded. The `receiverIdScheme` field (e.g. `ng:bvn`, `gh:ghana-card`) records which scheme was used.

---

## Making your app OLI-compatible

### Step 1 — Reference the context
Add the OLI context to your JSON-LD responses:
```json
{
  "@context": [
    "https://ref.gs1.org/standards/epcis/epcis-context.jsonld",
    "https://open-logistics-ng.github.io/schema/context.jsonld"
  ]
}
```

### Step 2 — Map your statuses to EPCIS bizSteps

| Your status | EPCIS bizStep |
|---|---|
| `pending` | `urn:epcglobal:cbv:bizstep:staging_outbound` |
| `in_transit` | `urn:epcglobal:cbv:bizstep:in_transit` |
| `handed_over` | `urn:epcglobal:cbv:bizstep:receiving` |
| `delivered` | `urn:epcglobal:cbv:bizstep:delivering` |
| `failed` | `urn:epcglobal:cbv:bizstep:void_shipping` |
| `ghosted` | `urn:ol:cbv:bizstep:ghosted` (OLI extension) |

### Step 3 — Emit CustodyTransferEvents
When a handover occurs, POST or log a `CustodyTransferEvent` conforming to [`schemas/custody-transfer-event.json`](schemas/custody-transfer-event.json).

### Step 4 — Expose a JSON-LD tracking endpoint

```
GET /api/shipments/{id}
Accept: application/ld+json
```

Should return a JSON-LD `ObjectEvent` with OLI extensions including `currentCustodian`. See [`examples/handover-event.jsonld`](examples/handover-event.jsonld) and [`examples/waybill.jsonld`](examples/waybill.jsonld).

### Step 5 — Register your tracking endpoint with the OLI Switch
When you register as an operator on the switch, provide your `trackingEndpoint` (your trackam base URL). The switch uses this to resolve live location for any waybill where you are the `currentCustodian`.

---

## Files in this repo

```
open-logistics-ng/
  context.jsonld                        — The OLI JSON-LD vocabulary
  schemas/
    custody-transfer-event.json         — JSON Schema for PoH events
    waybill.json                        — JSON Schema for OLI waybills
    actor.json                          — JSON Schema for actor identity
  examples/
    handover-event.jsonld               — Example CustodyTransferEvent
    waybill.jsonld                      — Example LiteWaybill with currentCustodian
```

---

## Reference implementation

[Trackam](https://github.com/jeffreyon/trackam) is the reference implementation of OLI Phase 1.

API endpoints:
- `GET /api/shipments/:id` with `Accept: application/ld+json` — returns GS1 EPCIS-compatible JSON-LD with `currentCustodian`
- `POST /api/waybill` — generates a lite waybill with claim token
- `POST /api/handover/initiate` — creates a handover QR token
- `POST /api/handover/confirm` — confirms handover (public, no auth required)

---

## Status

**Phase 1 — complete**
Online custody transfer events with government ID verification, GPS capture, evidence weight scoring, claim tokens, and `currentCustodian` pointer for federated tracking resolution.

**Phase 2 — planned**
Federated live tracking. The `currentCustodian.custodyType` field distinguishes static hubs from riders in active transit. When `custodyType` is `RIDER_IN_TRANSIT`, the switch will query the operator's live telemetry stream rather than the static shipment endpoint. This requires a per-custody-session credential handshake between the switch and the operator.

**Phase 3 — planned**
Offline-first PoH with sync queue. For areas with intermittent connectivity, events are signed locally and synced when the device comes back online.

**Phase 4 — planned**
Settlement API. Trigger payment release on delivery confirmation, with fee distribution across the full handover chain.

---

## Contributing

Open an issue or PR at `github.com/open-logistics-ng/schema`. The vocabulary is intentionally minimal — extensions should be proposed as issues before being merged into `context.jsonld`.
