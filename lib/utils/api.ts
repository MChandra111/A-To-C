export async function readApiJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`Request failed (${response.status})`);
  }
}

export async function getApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return `${fallback} (${response.status})`;
  }
}
