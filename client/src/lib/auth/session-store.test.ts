import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  request: vi.fn(), connect: vi.fn(), findOne: vi.fn(), deleteOne: vi.fn(),
  updateOne: vi.fn(), createIndex: vi.fn(),
}));
vi.mock("next/server", () => ({ connection: mocks.request }));
vi.mock("mongodb", () => ({ MongoClient: class {
  connect = mocks.connect;
} }));
vi.mock("./crypto", () => ({
  hashSessionId: () => "hashed-id", decrypt: (value: string) => value,
}));
const id = "a".repeat(43);
const record = {
  _id: "hashed-id", user: { id: "backend-user", role: "CUSTOMER" },
  rememberMe: true, expiresAt: new Date("2099-01-01"),
  encryptedAccessToken: "test-access", encryptedRefreshToken: "test-refresh",
};

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("SESSION_MONGODB_URI", "mongodb://unused-test-host/test");
  mocks.request.mockResolvedValue(undefined);
  mocks.connect.mockResolvedValue({ db: () => ({ collection: () => mocks }) });
  mocks.createIndex.mockResolvedValue("expiresAt_1");
  mocks.findOne.mockResolvedValue(record);
});

describe("request-time session lookup", () => {
  it("does not connect or query MongoDB while the request boundary is pending", async () => {
    const boundary = Promise.withResolvers<void>();
    mocks.request.mockReturnValue(boundary.promise);
    const { getSession } = await import("./session-store");
    const pending = getSession(id);
    expect(mocks.request).toHaveBeenCalledOnce();
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.findOne).not.toHaveBeenCalled();
    boundary.resolve();
    expect(await pending).toMatchObject({ user: record.user, accessToken: "test-access" });
    expect(mocks.findOne).toHaveBeenCalledWith({ _id: "hashed-id" });
  });

  it("still revokes expired sessions after entering request time", async () => {
    mocks.findOne.mockResolvedValue({ ...record, expiresAt: new Date("2000-01-01") });
    const { getSession } = await import("./session-store");
    expect(await getSession(id)).toBeNull();
    expect(mocks.deleteOne).toHaveBeenCalledWith({ _id: "hashed-id" });
  });

  it("rejects malformed identifiers without database access", async () => {
    const { getSession } = await import("./session-store");
    expect(await getSession("invalid")).toBeNull();
    expect(mocks.findOne).not.toHaveBeenCalled();
  });
});
