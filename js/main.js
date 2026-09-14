const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const map = (value, start, end) => clamp((value - start) / (end - start), 0, 1);

const pin = document.querySelector(".pin");
const frame = document.querySelector(".pin__frame");
const experience = document.querySelector("[data-scene='experience']");
const projects = document.querySelector("[data-scene='projects']");

if (reduceMotion) {
  document.body.classList.add("no-pin");
}

const headSize = () => {
  const styles = getComputedStyle(document.documentElement);
  const raw = styles.getPropertyValue("--head-h").trim();
  const value = Number.parseFloat(raw);
  if (raw.endsWith("rem")) {
    return value * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  return value || 108;
};

const sceneProgress = () => {
  const total = pin.offsetHeight - window.innerHeight;
  if (total <= 0) return 0;
  return clamp(-pin.getBoundingClientRect().top / total, 0, 1);
};

const sceneAmounts = (progress) => {
  if (progress < 0.08) return { experience: 0, projects: 0 };
  if (progress < 0.46) {
    return { experience: easeOutCubic(map(progress, 0.08, 0.46)), projects: 0 };
  }
  if (progress < 0.55) return { experience: 1, projects: 0 };
  const t = easeOutCubic(map(progress, 0.55, 0.93));
  return { experience: 1 - t, projects: t };
};

const setScene = (section, amount, height) => {
  section.style.setProperty("--open", amount.toFixed(4));
  section.style.setProperty("--h", `${height}px`);
};

const measureBody = (section) => {
  const body = section.querySelector(".panel__body");
  const inner = body?.firstElementChild;
  if (!body || !inner) return 0;
  const styles = getComputedStyle(body);
  return (
    inner.scrollHeight +
    Number.parseFloat(styles.paddingTop) +
    Number.parseFloat(styles.paddingBottom)
  );
};

const overlapSize = 58;

const openHeight = (section, amount) => {
  const head = headSize();
  const needed = head + measureBody(section) * amount;
  if (section !== experience || amount < 0.02) return needed;
  const maxH = frame.clientHeight - headSize() + overlapSize;
  return Math.min(needed, maxH);
};

const previewScene = Number(new URLSearchParams(location.search).get("scene"));

const applyForcedScene = () => {
  if (previewScene !== 2 && previewScene !== 3) return false;
  if (previewScene === 2) {
    setScene(experience, 1, openHeight(experience, 1));
    setScene(projects, 0, openHeight(projects, 0));
  } else {
    setScene(experience, 0, openHeight(experience, 0));
    setScene(projects, 1, openHeight(projects, 1));
  }
  return true;
};

const update = () => {
  if (reduceMotion) {
    setScene(experience, 1, openHeight(experience, 1));
    setScene(projects, 1, openHeight(projects, 1));
    return;
  }

  if (applyForcedScene()) return;

  const { experience: exp, projects: proj } = sceneAmounts(sceneProgress());
  setScene(experience, exp, openHeight(experience, exp));
  setScene(projects, proj, openHeight(projects, proj));
};

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    update();
    ticking = false;
  });
};

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", update);

update();

if (document.fonts?.ready) {
  document.fonts.ready.then(update);
}
