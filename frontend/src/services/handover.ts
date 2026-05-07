import { apiClient } from "@/lib/apiClient";
import axios from "axios";

export type ActorType = "ACTOR_SENDER" | "ACTOR_COURIER" | "ACTOR_HUB" | "ACTOR_RECEIVER";

export const ACTOR_LABELS: Record<ActorType, string> = {
  ACTOR_SENDER:   "Sender / Merchant",
  ACTOR_COURIER:  "Courier / Driver",
  ACTOR_HUB:      "Hub / Warehouse Staff",
  ACTOR_RECEIVER: "Receiver / Customer",
};

export interface HandoverToken {
  token: string;
  expiresAt: string;
  shipmentId: string;
}

export interface TokenInfo {
  token: string;
  expiresAt: string;
  giverActorType: ActorType;
  shipment: {
    id: string;
    goodsDescription: string;
    pickupLocation: string;
    deliveryLocation: string;
    distanceKm: number;
    status: string;
  };
}

export interface HandoverConfirmation {
  proofHash: string;
  occurredAt: string;
  shipmentId: string;
  receiverName: string;
  receiverActorType: ActorType;
}

export interface HandoverEvent {
  id: string;
  shipmentId: string;
  giverActorType: ActorType;
  receiverName: string;
  receiverBvn: string;
  receiverPhone: string | null;
  receiverActorType: ActorType;
  proofHash: string;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
}

export const handoverApi = {
  initiate: (shipmentId: string, actorType: ActorType = "ACTOR_COURIER") =>
    apiClient.post<HandoverToken>("/api/handover/initiate", { shipmentId, actorType }).then((r) => r.data),

  getEvents: (shipmentId: string) =>
    apiClient.get<HandoverEvent[]>(`/api/handover/shipment/${shipmentId}/events`).then((r) => r.data),
};

// Public API calls — no auth header, using raw axios pointed at same base
function publicBase() {
  const cfg = (window as unknown as { __APP_CONFIG__?: { VITE_API_URL?: string } }).__APP_CONFIG__;
  return cfg?.VITE_API_URL || import.meta.env.VITE_API_URL || "";
}

export const publicHandoverApi = {
  getTokenInfo: (token: string) =>
    axios.get<TokenInfo>(`${publicBase()}/api/handover/token/${token}`).then((r) => r.data),

  confirm: (body: {
    token: string;
    receiverName: string;
    receiverBvn: string;
    receiverPhone?: string;
    receiverActorType: ActorType;
    latitude?: number;
    longitude?: number;
  }) =>
    axios.post<HandoverConfirmation>(`${publicBase()}/api/handover/confirm`, body).then((r) => r.data),
};

export const publicWaybillApi = {
  get: (id: string) =>
    axios.get(`${publicBase()}/api/waybill/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    axios.post(`${publicBase()}/api/waybill`, data).then((r) => r.data),
  pdfUrl: (id: string) => `${publicBase()}/api/waybill/${id}/pdf`,
};
