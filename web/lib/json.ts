// JSON yanıt yardımcısı. charset=utf-8'i açıkça belirtir ki Türkçe karakterler
// (İ, ğ, ş, ö, ü, ç) tarayıcıda doğru görünsün.
export function json(
  data: unknown,
  init?: { status?: number; headers?: Record<string, string> },
) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}
