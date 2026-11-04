import { ENDPOINT_TO_PROVIDER } from "./ens-resolver.js";
import type { ServiceConfig } from "./services.js";

export const DEFAULT_PRICES: Record<string, string> = {
  search: "$0.000002", llm: "$0.015", sentiment: "$0.0003",
  classify: "$0.0004", data: "$0.001", embeddings: "$0.0005",
  translate: "$0.0008", summarize: "$0.015", vision: "$0.002",
  code: "$0.005", injective: "$0.001",
};

export const providerFor = (service: string) => ENDPOINT_TO_PROVIDER[service] ?? service;

export function priceFor(service: string, ensPrices: Record<string, string>) {
  const price = ensPrices[providerFor(service)];
  return price && /^\$\d+(\.\d+)?$/.test(price) && Number.isFinite(Number(price.slice(1))) && Number(price.slice(1)) > 0
    ? price
    : DEFAULT_PRICES[service];
}

export function listedPrices(ensPrices: Record<string, string>) {
  return {
    ...ensPrices,
    ...Object.fromEntries(Object.keys(DEFAULT_PRICES).map((service) => [service, priceFor(service, ensPrices)])),
  };
}

export function serviceConfigs(ensPrices: Record<string, string>): ServiceConfig[] {
  return Object.keys(DEFAULT_PRICES).map((service) => ({
    name: service,
    ensName: `${providerFor(service)}.flowbroker.eth`,
    endpoint: `/api/${service}`,
    price: priceFor(service, ensPrices),
    priceUsd: Number(priceFor(service, ensPrices).slice(1)),
    method: ["llm", "translate", "summarize", "vision", "code"].includes(service) ? "POST" : "GET",
  }));
}
