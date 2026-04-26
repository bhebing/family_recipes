import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/s3", () => ({
  s3: { send: vi.fn() },
  S3_BUCKET: "my-bucket",
  S3_BASE_URL: "https://my-bucket.s3.eu-west-2.amazonaws.com",
  IMAGES_BASE_URL: "https://my-bucket.s3.eu-west-2.amazonaws.com",
}));

vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: vi.fn().mockImplementation((args) => args),
  DeleteObjectCommand: vi.fn().mockImplementation((args) => args),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://signed-url.example.com"),
}));

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return { ...actual, randomUUID: vi.fn().mockReturnValue("test-uuid") };
});

describe("getPresignedUploadUrl", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { getPresignedUploadUrl } = await import("@/app/actions/upload");
    await expect(getPresignedUploadUrl("image/jpeg", 1000)).rejects.toThrow("Unauthorized");
  });

  it("throws for unsupported file types", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const { getPresignedUploadUrl } = await import("@/app/actions/upload");
    await expect(getPresignedUploadUrl("image/gif", 1000)).rejects.toThrow("Unsupported file type");
  });

  it("throws when file exceeds 10 MB", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const { getPresignedUploadUrl } = await import("@/app/actions/upload");
    await expect(getPresignedUploadUrl("image/jpeg", 11 * 1024 * 1024)).rejects.toThrow("File too large");
  });

  it("returns signed URL and public URL for valid upload", async () => {
    const { auth } = await import("@/auth");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(getSignedUrl).mockResolvedValueOnce("https://signed-url.example.com");
    const { getPresignedUploadUrl } = await import("@/app/actions/upload");
    const result = await getPresignedUploadUrl("image/jpeg", 1024);

    expect(result.url).toBe("https://signed-url.example.com");
    expect(result.publicUrl).toMatch(/^https:\/\/my-bucket\.s3\.eu-west-2\.amazonaws\.com\/recipes\/.+\.jpg$/);
  });

  it("maps jpeg content type to jpg extension", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const { getPresignedUploadUrl } = await import("@/app/actions/upload");
    const result = await getPresignedUploadUrl("image/jpeg", 1024);
    expect(result.publicUrl).toMatch(/\.jpg$/);
  });

  it("uses correct extension for png", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const { getPresignedUploadUrl } = await import("@/app/actions/upload");
    const result = await getPresignedUploadUrl("image/png", 1024);
    expect(result.publicUrl).toMatch(/\.png$/);
  });
});

describe("deleteUploadedImage", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { deleteUploadedImage } = await import("@/app/actions/upload");
    await expect(
      deleteUploadedImage("https://my-bucket.s3.eu-west-2.amazonaws.com/recipes/test.jpg")
    ).rejects.toThrow("Unauthorized");
  });

  it("throws when URL does not match expected S3 origin", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const { deleteUploadedImage } = await import("@/app/actions/upload");
    await expect(
      deleteUploadedImage("https://attacker.example.com/recipes/test.jpg")
    ).rejects.toThrow("Invalid image URL");
  });

  it("skips deletion for keys outside the recipes/ prefix", async () => {
    const { auth } = await import("@/auth");
    const { s3 } = await import("@/lib/s3");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const { deleteUploadedImage } = await import("@/app/actions/upload");
    await deleteUploadedImage("https://my-bucket.s3.eu-west-2.amazonaws.com/other/file.jpg");
    expect(s3.send).not.toHaveBeenCalled();
  });

  it("deletes the S3 object for a valid recipes/ URL", async () => {
    const { auth } = await import("@/auth");
    const { s3 } = await import("@/lib/s3");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(s3.send).mockResolvedValueOnce({} as never);

    const { deleteUploadedImage } = await import("@/app/actions/upload");
    await deleteUploadedImage("https://my-bucket.s3.eu-west-2.amazonaws.com/recipes/abc.jpg");

    expect(s3.send).toHaveBeenCalled();
  });
});
