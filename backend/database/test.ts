import { api } from "encore.dev/api";

interface SimpleResponse {
  message: string;
}

export const test = api<void, SimpleResponse>(
  { expose: true, method: "GET", path: "/test" },
  async (): Promise<SimpleResponse> => {
    return { message: "Database service is working" };
  }
);