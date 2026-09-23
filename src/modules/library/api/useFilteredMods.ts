```tsx
import type { InstalledMod } from "@/lib/tauri";
import { getCustomModMeta } from "@/modules/library/utils/customModMeta";
import { sortMods } from "@/modules/library/utils";
import { useLibraryFilterStore } from "@/stores";
import { useMemo } from "react";

const ALL_CHAMPIONS = [
  "Aatrox","Ahri","Akali","Akshan","Alistar","Ambessa","Amumu","Anivia","Annie",
  "Aphelios","Ashe","Aurelion Sol","Aurora","Azir","Bard","Bel'Veth","Blitzcrank",
  "Brand","Braum","Briar","Caitlyn","Camille","Cassiopeia","Cho'Gath","Corki",
  "Darius","Diana","Dr. Mundo","Draven","Ekko","Elise","Evelynn","Ezreal",
  "Fiddlesticks","Fiora","Fizz","Galio","Gangplank","Garen","Gnar","Gragas",
  "Graves","Gwen","Hecarim","Heimerdinger","Hwei","Illaoi","Irelia","Ivern",
  "Janna","Jarvan IV","Jax","Jayce","Jhin","Jinx","Kai'Sa","Kalista","Karma",
  "Karthus","Kassadin","Katarina","Kayle","Kayn","Kennen","Kha'Zix","Kindred",
  "Kled","Kog'Maw","K'Sante","LeBlanc","Lee Sin","Leona","Lillia","Lissandra",
  "Lucian","Lulu","Lux","Malphite","Malzahar","Maokai","Master Yi","Milio","Mel",
  "Miss Fortune","Mordekaiser","Morgana","Naafiri","Nami","Nasus","Nautilus",
  "Neeko","Nidalee","Nilah","Nocturne","Nunu & Willump","Olaf","Orianna","Ornn",
  "Pantheon","Poppy","Pyke","Qiyana","Quinn","Rakan","Rammus","Rek'Sai","Rell",
  "Renata Glasc","Renekton","Rengar","Riven","Rumble","Ryze","Samira","Sejuani",
  "Senna","Seraphine","Sett","Shaco","Shen","Shyvana","Singed","Sion","Sivir",
  "Skarner","Smolder","Sona","Soraka","Swain","Sylas","Syndra","Tahm Kench",
  "Taliyah","Talon","Taric","Teemo","Thresh","Tristana","Trundle","Tryndamere",
  "Twisted Fate","Twitch","Udyr","Urgot","Varus","Vayne","Veigar","Vel'Koz","Vex","Vi","Viego","Viktor",
  "Vladimir","Volibear","Warwick","Wukong","Xayah","Xerath","Xin Zhao","Yasuo","Yone","Yorick","Yuumi","Yunara",
  "Zac","Zed","Zeri","Ziggs","Zilean","Zoe","Zyra","Zaahen",
];

// 🔥 normalisation
function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// 🔥 alias simples pour fiabiliser
const ALIASES: Record<string, string> = {
  shyvana: "Shyvana",
  viego: "Viego",
};

// 🔥 détection robuste
function detectChampions(mod: InstalledMod): string[] {
  const detected = new Set<string>();

  // 1. metadata
  for (const champ of mod.champions ?? []) {
    const normalizedChamp = normalize(champ);

    const alias = ALIASES[normalizedChamp];
    if (alias) {
      detected.add(alias);
      continue;
    }

    const exact = ALL_CHAMPIONS.find(
      (c) => normalize(c) === normalizedChamp
    );

    if (exact) detected.add(exact);
  }

  // 2. nom du mod
  const text = `${mod.displayName ?? ""} ${mod.name ?? ""}`;
  const normalizedText = normalize(text);

  if (normalizedText) {
    const sorted = [...ALL_CHAMPIONS].sort(
      (a, b) => normalize(b).length - normalize(a).length
    );

    for (const champ of sorted) {
      if (normalizedText.includes(normalize(champ))) {
        detected.add(champ);
      }
    }
  }

  return [...detected];
}

export function useFilteredMods(mods: InstalledMod[], searchQuery: string): InstalledMod[] {
  const { selectedTags, selectedChampions, selectedMaps, favoritesOnly, sort } =
  useLibraryFilterStore();

  return useMemo(() => {
    let result = mods;

    // 🔍 search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (mod) =>
          mod.displayName.toLowerCase().includes(q) ||
          mod.name.toLowerCase().includes(q),
      );
    }

    // 🏷️ tags
    if (selectedTags.size > 0) {
      result = result.filter((mod) =>
        mod.tags.some((t) => selectedTags.has(t))
      );
    }

    // 🧠 champions (FIX ULTRA ROBUSTE)
    if (selectedChampions.size > 0) {
      const normalizedSelected = new Set(
        [...selectedChampions].map((c) => normalize(c))
      );

      result = result.filter((mod) => {
        const champs = detectChampions(mod);

        return champs.some((c) =>
          normalizedSelected.has(normalize(c))
        );
      });
    }
    if (favoritesOnly) {
      result = result.filter((mod) => getCustomModMeta(mod.id).favorite === true);
    }

    // 🗺️ maps
    if (selectedMaps.size > 0) {
      result = result.filter((mod) =>
        mod.maps.some((m) => selectedMaps.has(m))
      );
    }

    return sortMods(result, sort);
  }, [mods, searchQuery, selectedTags, selectedChampions, selectedMaps, favoritesOnly, sort]);
}
