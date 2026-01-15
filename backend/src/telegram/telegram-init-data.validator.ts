import * as crypto from "crypto";

export interface TelegramInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  auth_date: number;
  hash: string;
}

export class TelegramInitDataValidator {
  constructor(private readonly botToken: string) {}

  /**
   * Validates Telegram WebApp initData signature
   *
   * Algorithm (from Telegram docs):
   * 1. Parse initData query string into key-value pairs
   * 2. Sort pairs alphabetically (excluding 'hash')
   * 3. Create data_check_string: "key=value\nkey=value\n..."
   * 4. Compute secret_key = HMAC-SHA256(bot_token, "WebAppData")
   * 5. Compute expected_hash = HMAC-SHA256(data_check_string, secret_key)
   * 6. Compare expected_hash with provided hash
   */
  validate(initData: string): TelegramInitData {
    // Parse query string
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      throw new Error("Missing hash in initData");
    }

    // Extract all params except hash, sort alphabetically
    const dataCheckPairs: string[] = [];
    params.delete("hash");

    const sortedKeys = Array.from(params.keys()).sort();
    for (const key of sortedKeys) {
      dataCheckPairs.push(`${key}=${params.get(key)}`);
    }

    const dataCheckString = dataCheckPairs.join("\n");

    // Compute secret key: HMAC-SHA256(bot_token, "WebAppData")
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(this.botToken)
      .digest();

    // Compute expected hash: HMAC-SHA256(data_check_string, secret_key)
    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Compare hashes
    if (hash !== expectedHash) {
      throw new Error("Invalid initData signature");
    }

    // Parse auth_date (must be recent to prevent replay attacks)
    const authDate = parseInt(params.get("auth_date") || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 5 * 60; // 5 minutes

    if (now - authDate > maxAge) {
      throw new Error("InitData is too old (replay attack prevention)");
    }

    // Parse user data
    const userParam = params.get("user");
    let user;
    if (userParam) {
      try {
        user = JSON.parse(userParam);
      } catch (e) {
        throw new Error("Invalid user data in initData");
      }
    }

    return {
      query_id: params.get("query_id") || undefined,
      user,
      auth_date: authDate,
      hash,
    };
  }
}
