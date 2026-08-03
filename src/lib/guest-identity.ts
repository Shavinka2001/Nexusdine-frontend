const GUEST_ID_KEY = "nexusdine.qr.guestId";
const GUEST_NAME_KEY = "nexusdine.qr.guestName";

const ADJECTIVES = [
  "Happy",
  "Sunny",
  "Lucky",
  "Cozy",
  "Swift",
  "Bright",
  "Calm",
  "Bold",
];
const ANIMALS = [
  "Fox",
  "Panda",
  "Otter",
  "Koala",
  "Falcon",
  "Tiger",
  "Dove",
  "Lynx",
];

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${a} ${b}`;
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(GUEST_ID_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function getOrCreateGuestDisplayName(): string {
  if (typeof window === "undefined") return "Guest";
  try {
    const existing = localStorage.getItem(GUEST_NAME_KEY);
    if (existing) return existing;
    const name = randomName();
    localStorage.setItem(GUEST_NAME_KEY, name);
    return name;
  } catch {
    return randomName();
  }
}
