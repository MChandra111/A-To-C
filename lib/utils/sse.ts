export interface SseMessage {
  event: string;
  data: unknown;
}

function parseSsePart(part: string): SseMessage | null {
  if (!part.trim()) return null;

  let event = "message";
  let data = "";

  for (const line of part.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data = line.slice(5).trim();
    }
  }

  if (!data) return null;

  try {
    return { event, data: JSON.parse(data) };
  } catch {
    return { event, data };
  }
}

export async function consumeSseStream(
  response: Response,
  handlers: {
    onEvent: (message: SseMessage) => void;
  }
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const message = parseSsePart(part);
      if (message) handlers.onEvent(message);
    }
  }

  buffer += decoder.decode();
  const trailing = parseSsePart(buffer);
  if (trailing) handlers.onEvent(trailing);
}
