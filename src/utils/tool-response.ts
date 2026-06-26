export function jsonResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function errorResponse(error: unknown) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: error instanceof Error ? error.message : String(error),
      },
    ],
  };
}

export async function callTool<T>(handler: () => Promise<T>) {
  try {
    return jsonResponse(await handler());
  } catch (error) {
    return errorResponse(error);
  }
}
