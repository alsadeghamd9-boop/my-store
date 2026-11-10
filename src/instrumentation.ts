export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { bootstrap } = await import("@/db/bootstrap");
    await bootstrap();
    // eslint-disable-next-line no-console
    console.log("[souq] database ready");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[souq] database bootstrap failed", error);
  }
}
