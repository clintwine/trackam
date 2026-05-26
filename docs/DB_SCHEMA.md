# DB Schema

## Migration sources

| File | Purpose |
|---|---|
| `0001_baseline.sql` | Generic scaffold baseline (users, roles, notifications, events, devices, sessions, settings) |
| `0002_phase1_contracts.sql` | Additive indexes on scaffold tables |
| `0003_remove_app_registry_and_installed_apps.sql` | Removes legacy app registry |
| `0004_trackam_logistics.sql` | Core logistics tables: riders, routes, shipments, shipment_status_log, logistics_settings |
| `0005_shipment_recipient.sql` | Recipient contact fields on shipments |
| `0006_shipment_value_recovered.sql` | Declared value and recovery tracking |
| `0007_handover.sql` | handover_tokens, handover_events, lite_waybills |
| `0008_waybill_claim.sql` | Claim token on waybills; waybill_id link on shipments and events |
| `0009_custodian_sessions.sql` | custodian_sessions; optional user_id on tokens; giver identity columns |
| `0010_handover_gaps.sql` | BVN override fields, operator_id on events |
| `0011_bvn_hashing_and_dispute.sql` | Rename receiver_bvn → receiver_bvn_hash; disputed status; phone_verifications |
| `0012_dispatch_runs.sql` | dispatch_runs, dispatch_run_legs |

## Tables

### Platform

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Operator accounts | `id`, `email` UNIQUE, `roles text[]`, `password_hash` |
| `roles` | RBAC definitions | `id`, `permissions text[]` |
| `notifications` | User notification feed | `id`, `to_uid` FK→users, `read` |
| `events` | Generic operational log | `id`, `type`, `payload jsonb` |
| `devices` | Known device records | `id`, `uid` FK→users, `is_current` |
| `sessions` | Login session history | `id`, `uid` FK→users, `created_at`, `ended_at` |
| `settings` | Global config row | `id='global'`, `support_email`, `allowed_regions text[]` |
| `schema_migrations` | Applied migration tracker | `version` PK, `applied_at` |

### Logistics

| Table | Purpose | Key columns |
|---|---|---|
| `riders` | Rider profiles | `id`, `user_id` FK→users, `name`, `phone`, `vehicle_type`, `bvn`, `ghost_rate`, `active` |
| `routes` | Saved dispatch routes | `id`, `user_id` FK→users, `name`, `pickup_location`, `delivery_location`, `default_rider_id`, `default_fee_kobo` |
| `shipments` | Dispatch legs | `id`, `user_id`, `rider_id`, `route_id`, `waybill_id` FK→lite_waybills, `status`, `risk_score`, `fuel_cost_kobo`, `rider_fee_kobo`, `goods_value_kobo` |
| `shipment_status_log` | Immutable status audit trail | `id`, `shipment_id` FK→shipments, `status`, `note`, `changed_at` |
| `logistics_settings` | Per-user config | `user_id` PK, `fuel_price_per_litre`, `efficiency_multiplier`, `ghosting_threshold_hours` |
| `dispatch_runs` | Grouped vehicle trips | `id`, `user_id`, `rider_id`, `status`, `departed_at`, `completed_at` |
| `dispatch_run_legs` | Run ↔ shipment junction | `run_id` FK→dispatch_runs, `shipment_id` FK→shipments UNIQUE |

### OLI Network

| Table | Purpose | Key columns |
|---|---|---|
| `lite_waybills` | Cross-operator waybill | `id`, `waybill_number` UNIQUE, `claim_token` UNIQUE, `claimed_at`, `claimed_by_user_id` FK→users, sender/receiver fields |
| `handover_tokens` | One-time custody transfer authorization | `id`, `shipment_id` FK→shipments, `user_id` FK→users (nullable), `token` UNIQUE, `actor_type`, `expires_at`, `used_at`, `giver_name`, `giver_phone`, `custodian_session_id` |
| `handover_events` | Immutable PoH records | `id`, `shipment_id`, `waybill_id`, `token_id`, `giver_actor_type`, `giver_name`, `giver_phone`, `receiver_name`, `receiver_bvn_hash`, `receiver_phone`, `receiver_actor_type`, `proof_hash`, `latitude`, `longitude`, `bvn_verified`, `bvn_override`, `bvn_override_reason`, `occurred_at` |
| `custodian_sessions` | OTP-verified non-platform handler sessions | `id`, `handover_event_id`, `shipment_id`, `waybill_id`, `phone`, `receiver_name`, `receiver_actor_type`, `otp_hash`, `session_token` UNIQUE, `verified_at` |
| `phone_verifications` | OTP for sender identity at waybill creation | `id`, `phone`, `otp_hash`, `verified_at`, `token` UNIQUE, `token_expires_at` |

## Key indexes

```sql
idx_handover_tokens_token           ON handover_tokens(token)
idx_handover_tokens_shipment_id     ON handover_tokens(shipment_id)
idx_handover_events_shipment_id     ON handover_events(shipment_id)
idx_handover_events_waybill_id      ON handover_events(waybill_id)
idx_lite_waybills_number            ON lite_waybills(waybill_number)
idx_lite_waybills_claim_token       ON lite_waybills(claim_token)
idx_custodian_sessions_token        ON custodian_sessions(session_token) WHERE session_token IS NOT NULL
idx_shipments_waybill_id            ON shipments(waybill_id)
idx_dispatch_runs_user_id           ON dispatch_runs(user_id)
idx_dispatch_run_legs_run_id        ON dispatch_run_legs(run_id)
```

## Schema notes

- Timestamps in OLI tables use `TIMESTAMPTZ`. Scaffold tables use `BIGINT` epoch milliseconds — this is a historical artifact from the base template.
- `handover_events` is append-only. No UPDATE path exists for these rows.
- `handover_tokens.used_at` is set atomically via conditional UPDATE (`WHERE used_at IS NULL AND expires_at > NOW()`). Never set directly by application code.
- `shipments.status` CHECK constraint includes all valid statuses including `disputed` and `handed_over`. Status transitions are enforced at the service layer, not the DB layer.
- `dispatch_run_legs` has a UNIQUE constraint on `shipment_id` — a shipment leg can only belong to one run at a time.
