type RpcClient = {
  rpc: (
    fn: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

// Returns true if the request is within the allowed rate, false if it should be blocked.
// Fails open: if the DB call errors, the request is allowed through.
export async function checkRateLimit(
  supabase: RpcClient,
  key: string,
  maxCount: number,
  windowSeconds = 3600,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error.message);
    return true;
  }

  return data === true;
}
