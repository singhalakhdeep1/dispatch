import * as path from "path";

/**
 * Returns the absolute path to a .proto file in this package.
 * Usage: protoPath("orders.proto")
 */
export function protoPath(filename: string): string {
    return path.join(__dirname, "..", "proto", filename);
}

export const ORDERS_PROTO_PATH = path.join(__dirname, "..", "proto", "orders.proto");
export const PRICING_PROTO_PATH = path.join(__dirname, "..", "proto", "pricing.proto");
