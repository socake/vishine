const instances = new Map<HTMLElement, () => void>();
async function start(host: HTMLElement) {
  if (host.dataset.started) return;
  host.dataset.started = "true";
  try {
    const config = JSON.parse(
      host.querySelector("[data-ki-config]")!.textContent || "",
    );
    const runtime = await import("./runtime");
    instances.set(host, runtime.mount(host, config));
  } catch {
    const status = host.querySelector("[data-ki-loading]");
    if (status)
      status.textContent = document.documentElement.lang.startsWith("en")
        ? "Interactive content could not load. Read the explanation below."
        : "交互内容未能加载，请阅读下方静态说明。";
    host.dataset.ready = "error";
  }
}
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        observer.unobserve(e.target);
        void start(e.target as HTMLElement);
      }
    }),
  { rootMargin: "300px" },
);
document
  .querySelectorAll<HTMLElement>("[data-knowledge]")
  .forEach((host) => observer.observe(host));
addEventListener("pagehide", (event) => {
  if ((event as PageTransitionEvent).persisted) return;
  observer.disconnect();
  instances.forEach((dispose) => dispose());
  instances.clear();
});
