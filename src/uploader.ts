/**
 * Drains the offline queue to Appwrite, with retry + 429 back-off.
 */
import { OfflineQueue } from "./storage/offlineQueue";
import { HeartbeatService } from "./api/heartbeats";
import * as log from "./util/logger";

const BATCH_SIZE = 25;
const MAX_ATTEMPTS_PER_HEARTBEAT = 6;
const MAX_BACKOFF_MS = 60_000;

export class Uploader {
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private inFlight = false;
  private backoffMs = 0;
  private consecutiveErrors = 0;

  constructor(
    private readonly queue: OfflineQueue,
    private readonly api: HeartbeatService,
    private readonly onProgress?: () => void
  ) {}

  start(intervalSeconds: number): void {
    const ms = Math.max(5, intervalSeconds) * 1000;
    this.stop();
    this.timer = setInterval(() => {
      void this.tick();
    }, ms);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async flushNow(): Promise<number> {
    return this.drain();
  }

  /**
   * Returns the number of heartbeats sent in this tick.
   */
  async tick(): Promise<number> {
    if (this.inFlight) {
      return 0;
    }
    if (this.backoffMs > 0) {
      return 0;
    }
    if (this.queue.pendingCount() === 0) {
      return 0;
    }
    return this.drain();
  }

  private async drain(): Promise<number> {
    if (this.inFlight) {
      return 0;
    }
    this.inFlight = true;
    try {
      let sent = 0;
      let hadRateLimit = false;
      let hadOtherError = false;
      // Process in batches
      // Outer loop: while there's something to send
      // Inner loop: take a batch, try to send each
      for (;;) {
        const batch = this.queue.fetchPending(BATCH_SIZE);
        if (batch.length === 0) {
          break;
        }
        for (const hb of batch) {
          try {
            await this.api.upload(hb);
            this.queue.markSent(hb.id);
            sent++;
            this.onProgress?.();
          } catch (err) {
            const status = statusOf(err);
            if (status === 429) {
              hadRateLimit = true;
              this.queue.markError(hb.id, "rate_limited");
              log.warn(`rate limited; backing off`);
              this.scheduleBackoff();
              return sent;
            }
            if (status === 401 || status === 403) {
              hadOtherError = true;
              this.queue.markError(hb.id, "unauthorized");
              log.warn("unauthorized while uploading; user may need to sign in again");
              this.scheduleBackoff(30_000);
              return sent;
            }
            // Other error: mark and skip; will retry next tick
            hadOtherError = true;
            this.queue.markError(hb.id, messageOf(err));
            log.warn(`upload error: ${messageOf(err)}`);
          }
        }
        if (hadRateLimit || hadOtherError) {
          // If we hit errors in this batch, stop and retry later
          break;
        }
      }
      if (!hadRateLimit && !hadOtherError) {
        this.consecutiveErrors = 0;
      } else {
        this.consecutiveErrors++;
      }
      return sent;
    } finally {
      this.inFlight = false;
    }
  }

  private scheduleBackoff(ms?: number): void {
    const base = ms ?? Math.min(MAX_BACKOFF_MS, 2000 * Math.pow(2, this.consecutiveErrors));
    this.backoffMs = base;
    log.debug(`backing off upload for ${base}ms`);
    setTimeout(() => {
      this.backoffMs = 0;
    }, base).unref?.();
  }
}

function statusOf(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null) {
    const code = (err as { code?: number }).code;
    if (typeof code === "number") {
      return code;
    }
    const status = (err as { status?: number; response?: { status?: number } }).status;
    if (typeof status === "number") {
      return status;
    }
    if (typeof (err as { response?: { status?: number } }).response?.status === "number") {
      return (err as { response: { status: number } }).response.status;
    }
  }
  return undefined;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

void MAX_ATTEMPTS_PER_HEARTBEAT;
