type ChampionRecord = {
  id: string;
  key: string;
  name: string;
  image?: {
    full?: string;
  };
};

type ChampionJsonResponse = {
  data: Record<string, ChampionRecord>;
};

type ChampionEntry = {
  id: string;
  name: string;
  normalizedName: string;
  normalizedId: string;
  iconUrl: string;
};

let cachedChampions: ChampionEntry[] | null = null;
let cachedVersion: string | null = null;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const EXTRA_ALIASES: Record<string, string> = {
  wukong: "MonkeyKing",
  monkeyking: "MonkeyKing",
  nunuandwillump: "Nunu",
  nunuwillump: "Nunu",
  renataglasc: "Renata",
  ksante: "KSante",
  belveth: "Belveth",
  chogath: "Chogath",
  drmundo: "DrMundo",
  jarvaniv: "JarvanIV",
  kaisa: "Kaisa",
  khazix: "Khazix",
  kogmaw: "KogMaw",
  leesin: "LeeSin",
  masteryi: "MasterYi",
  missfortune: "MissFortune",
  reksai: "RekSai",
  tahmkench: "TahmKench",
  twistedfate: "TwistedFate",
  velkoz: "Velkoz",
  xinzhao: "XinZhao",
  aurelionsol: "AurelionSol",
};

async function getLatestDDragonVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;

  const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch Data Dragon versions: ${response.status}`);
  }

  const versions = (await response.json()) as string[];
  cachedVersion = versions[0] ?? "16.7.1";
  return cachedVersion;
}

async function loadChampions(): Promise<ChampionEntry[]> {
  if (cachedChampions) return cachedChampions;

  const version = await getLatestDDragonVersion();
  const response = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch champion.json: ${response.status}`);
  }

  const json = (await response.json()) as ChampionJsonResponse;

  cachedChampions = Object.values(json.data).map((champ) => {
    const imageFile = champ.image?.full ?? `${champ.id}.png`;

    return {
      id: champ.id,
      name: champ.name,
      normalizedName: normalizeText(champ.name),
      normalizedId: normalizeText(champ.id),
      iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageFile}`,
    };
  });

  return cachedChampions;
}

function findChampionInText(text: string, champions: ChampionEntry[]): ChampionEntry | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;

  // 🔥 Fix spécifique Viego (sécurité)
  if (normalized.includes("viego")) {
    const viego = champions.find((c) => c.id === "Viego");
    if (viego) return viego;
  }

  // 🔥 Alias (ex: wukong → MonkeyKing)
  const aliasId = EXTRA_ALIASES[normalized];
  if (aliasId) {
    const byAlias = champions.find((c) => c.id === aliasId);
    if (byAlias) return byAlias;
  }

  // 🔥 Match exact
  const exact = champions.find(
    (c) => c.normalizedName === normalized || c.normalizedId === normalized,
  );
  if (exact) return exact;

  // 🔥 IMPORTANT : tri par longueur (évite Vi avant Viego)
  const sortedChampions = [...champions].sort((a, b) => {
    const aLen = Math.max(a.normalizedName.length, a.normalizedId.length);
    const bLen = Math.max(b.normalizedName.length, b.normalizedId.length);
    return bLen - aLen;
  });

  // 🔥 Match inclus (après tri)
  const included = sortedChampions.find(
    (c) =>
      normalized.includes(c.normalizedName) ||
      normalized.includes(c.normalizedId),
  );

  if (included) return included;

  return null;
}

export async function detectChampionIconUrl(params: {
  champions?: string[];
  displayTitle?: string;
  fallbackTitle?: string;
}): Promise<string | null> {
  const champions = await loadChampions();

  for (const champ of params.champions ?? []) {
    const found = findChampionInText(champ, champions);
    if (found) return found.iconUrl;
  }

  if (params.displayTitle) {
    const found = findChampionInText(params.displayTitle, champions);
    if (found) return found.iconUrl;
  }

  if (params.fallbackTitle) {
    const found = findChampionInText(params.fallbackTitle, champions);
    if (found) return found.iconUrl;
  }

  return null;
}