# open-logistics-ng

**Open Logistics Interconnect (OLI)** — an open schema and vocabulary for Nigerian logistics interoperability.

OLI defines the shared language that lets different logistics companies, courier apps, warehouses, and merchants "hand off" shipments to each other digitally. It is built on [GS1 EPCIS 2.0](https://ref.gs1.org/standards/epcis/) and [JSON-LD](https://json-ld.org/).

---

## The problem

Every logistics company in Nigeria runs a silo. A package that moves from a Lagos merchant → interstate truck → Abuja bike fleet → end customer passes through 4 systems with 4 different tracking formats. When something goes wrong, nobody has the receipts.

OLI is the NIBSS for logistics — a neutral, open standard that makes those handoffs machine-readable and verifiable.

---

## Core concepts

### Custody Transfer Event
A `CustodyTransferEvent` is generated every time physical custody of goods changes hands. It contains:
- A Proof of Handover (PoH) hash — SHA-256 of `token:waybillId:receiverBvn:timestamp`
- The actor types on both sides (Sender, Courier, Hub, Receiver)
- GPS coordinates of the transfer point
- A link to the waybill EPC

### Actor Types
| Type             | Description |
|---|---|
| `ACTOR_SENDER`   | The merchant or origin party releasing the goods |
| `ACTOR_COURIER`  | The rider, driver, or fleet executing transport |
| `ACTOR_HUB`      | A sortation hub, warehouse, or trans-shipment centre |
| `ACTOR_RECEIVER` | The end customer or consignee |

### Waybill EPC
Every shipment is identified by a URN: `urn:ol:waybill:{uuid}`. This URN resolves to a public tracking URL when dereferenced.

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

| Your status   | EPCIS bizStep |
|---|---|
| `pending`     | `urn:epcglobal:cbv:bizstep:staging_outbound` |
| `in_transit`  | `urn:epcglobal:cbv:bizstep:in_transit` |
| `handed_over` | `urn:epcglobal:cbv:bizstep:receiving` |
| `delivered`   | `urn:epcglobal:cbv:bizstep:delivering` |
| `failed`      | `urn:epcglobal:cbv:bizstep:void_shipping` |
| `ghosted`     | `urn:ol:cbv:bizstep:ghosted` (OLI extension) |

### Step 3 — Emit CustodyTransferEvents

When a handover occurs, POST or log a `CustodyTransferEvent` conforming to [`schemas/custody-transfer-event.json`](schemas/custody-transfer-event.json).

### Step 4 — Expose a JSON-LD tracking endpoint

```
GET /api/shipments/{id}
Accept: application/ld+json
```

Should return an EPCIS `ObjectEvent` with OLI extensions. See [`examples/handover-event.jsonld`](examples/handover-event.jsonld).

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
```

---

## Reference implementation

[Trackam](https://github.com/jeffreyon/trackam) is the reference implementation of OLI Phase 1.

API endpoints:
- `GET /api/shipments/:id` with `Accept: application/ld+json` — returns GS1 EPCIS-compatible JSON-LD
- `POST /api/handover/initiate` — creates a handover QR token
- `POST /api/handover/confirm` — confirms handover (public, no auth)
- `POST /api/waybill` — generates a lite waybill

---

## Status

Phase 1 — online-only custody transfer events with BVN identity linkage.

Planned:
- Phase 2: Federated operator accounts (cross-company handovers between registered orgs)
- Phase 3: Offline-first PoH with sync queue
- Phase 4: Settlement API (trigger payments on delivery confirmation)

---

## Contributing

Open an issue or PR at `github.com/open-logistics-ng/schema`. The vocabulary is intentionally minimal — extensions should be proposed as issues before being merged into `context.jsonld`.
