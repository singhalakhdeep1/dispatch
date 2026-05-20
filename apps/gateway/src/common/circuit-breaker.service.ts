import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import CircuitBreaker from "opossum";

export interface CircuitBreakerOptions {
    timeout?: number;        // ms before a call is considered failed (default: 5000)
    errorThresholdPercentage?: number; // % failures to trip (default: 50)
    resetTimeout?: number;   // ms before HALF_OPEN probe (default: 30000)
    volumeThreshold?: number; // min requests before stats are evaluated (default: 10)
}

/**
 * Wraps any async function in an opossum CircuitBreaker.
 * Each unique `name` gets its own breaker instance — one per downstream service.
 *
 * States:
 *   CLOSED     → call executes normally
 *   OPEN       → fast-fail immediately (no network round-trip)
 *   HALF_OPEN  → one probe request; re-closes on success, re-opens on failure
 */
@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger(CircuitBreakerService.name);
    private readonly breakers = new Map<string, CircuitBreaker>();

    getBreaker(name: string, opts: CircuitBreakerOptions = {}): CircuitBreaker {
        if (this.breakers.has(name)) return this.breakers.get(name)!;

        const breaker = new CircuitBreaker(async (fn: () => Promise<unknown>) => fn(), {
            name,
            timeout: opts.timeout ?? 10_000,
            errorThresholdPercentage: opts.errorThresholdPercentage ?? 50,
            resetTimeout: opts.resetTimeout ?? 30_000,
            volumeThreshold: opts.volumeThreshold ?? 5,
        });

        breaker.on("open", () =>
            this.logger.warn(`Circuit OPEN for "${name}" — fast-failing requests`),
        );
        breaker.on("halfOpen", () =>
            this.logger.log(`Circuit HALF-OPEN for "${name}" — probing service`),
        );
        breaker.on("close", () =>
            this.logger.log(`Circuit CLOSED for "${name}" — service recovered`),
        );
        breaker.on("fallback", () =>
            this.logger.warn(`Circuit fallback triggered for "${name}"`),
        );

        this.breakers.set(name, breaker);
        return breaker;
    }

    /**
     * Convenience wrapper — runs `action` through the named circuit breaker.
     * Throws ServiceUnavailableException if the circuit is open.
     */
    async fire<T>(name: string, action: () => Promise<T>, opts?: CircuitBreakerOptions): Promise<T> {
        const breaker = this.getBreaker(name, opts);
        try {
            return (await breaker.fire(action)) as T;
        } catch (err: any) {
            if (err?.name === "OpenCircuitError" || err?.code === "EOPENBREAKER") {
                throw new ServiceUnavailableException(
                    `Service "${name}" is temporarily unavailable. Please retry shortly.`,
                );
            }
            throw err;
        }
    }
}
