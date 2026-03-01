import masterData from "../utils/global-tw4-master.FINAL_GOD_JSON_V5_UNIFIED.json";

type Primitive = string | number | boolean | null;

type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

interface SearchHit {
  path: string;
  value: string;
}

interface SuggestionRequest {
  query?: string;
  prefix?: string;
  snippet?: string;
  combo?: string;
  className?: string;
  limit?: number;
}

interface ToolBundle {
  hint: string[];
  ghostInline: string;
  lineSnippet: string[];
  suggestion: string[];
  autocomplete: string[];
  combos: Record<string, string[]>;
  classMapping: {
    twoKey: string[];
    fourKey: string[];
  };
  dataHits: SearchHit[];
}

const DEFAULT_LIMIT = 20;

const shortHints = (masterData.suggestionRegistry?.short ?? {}) as Record<string, string[]>;
const suggestionCombos = (masterData.suggestionRegistry?.combos ?? {}) as Record<string, { classes?: string[] }>;
const registryCombos = (masterData.comboSystemRegistry?.shortCombos ?? {}) as Record<string, string[]>;
const fullComboDefs = (masterData.comboSystemRegistry?.fullCombos ?? {}) as Record<string, JsonValue>;

const flattenValue = (value: JsonValue): string[] => {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => flattenValue(item));
  return Object.values(value).flatMap((item) => flattenValue(item as JsonValue));
};

const fullCombos = Object.fromEntries(
  Object.entries(fullComboDefs).map(([key, value]) => [
    key,
    Array.from(new Set(flattenValue(value as JsonValue).filter((token) => /[-:[\]/.]/.test(token) && !token.includes(" ")))),
  ]),
) as Record<string, string[]>;

const mergedCombos: Record<string, string[]> = {
  ...registryCombos,
  ...fullCombos,
  ...Object.fromEntries(
    Object.entries(suggestionCombos).map(([key, value]) => [key, value?.classes ?? []]),
  ),
};

const collectSearchableEntries = (): SearchHit[] => {
  const hits: SearchHit[] = [];

  const walk = (value: JsonValue, path: string): void => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      hits.push({ path, value: String(value) });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item as JsonValue, `${path}[${index}]`));
      return;
    }

    Object.entries(value).forEach(([key, item]) => {
      walk(item as JsonValue, path ? `${path}.${key}` : key);
    });
  };

  walk(masterData as JsonValue, "");
  return hits;
};

const searchableEntries = collectSearchableEntries();

const allClasses = Array.from(
  new Set(
    [
      ...Object.values(shortHints).flatMap((classes) => classes),
      ...Object.values(mergedCombos).flatMap((classes) => classes),
      ...flattenValue(masterData as JsonValue).filter((value) => /[-:[\]/.]/.test(value) && !value.includes(" ")),
    ].filter(Boolean),
  ),
);

const classTo2Key = new Map<string, string[]>();
const classTo4Key = new Map<string, string[]>();

allClasses.forEach((className) => {
  const normalized = className.toLowerCase();
  const key2 = normalized.slice(0, 2);
  const key4 = normalized.slice(0, 4);

  if (key2.length === 2) {
    const existing = classTo2Key.get(key2) ?? [];
    existing.push(className);
    classTo2Key.set(key2, existing);
  }

  if (key4.length === 4) {
    const existing = classTo4Key.get(key4) ?? [];
    existing.push(className);
    classTo4Key.set(key4, existing);
  }
});

for (const [key, values] of classTo2Key.entries()) {
  classTo2Key.set(key, Array.from(new Set(values)).sort());
}

for (const [key, values] of classTo4Key.entries()) {
  classTo4Key.set(key, Array.from(new Set(values)).sort());
}

const limitResults = (items: string[], limit = DEFAULT_LIMIT): string[] => items.slice(0, Math.max(1, limit));

const queryClasses = (prefix: string, limit = DEFAULT_LIMIT): string[] => {
  const normalized = prefix.trim().toLowerCase();
  if (!normalized) {
    return limitResults(allClasses, limit);
  }

  return limitResults(
    allClasses
      .filter((className) => className.toLowerCase().startsWith(normalized))
      .sort((a, b) => a.localeCompare(b)),
    limit,
  );
};

const queryHints = (query: string, limit = DEFAULT_LIMIT): string[] => {
  const normalized = query.trim().toLowerCase();

  const fromShortKey = Object.entries(shortHints)
    .filter(([key]) => key.toLowerCase().includes(normalized))
    .flatMap(([, classes]) => classes);

  const fromShortClass = Object.values(shortHints)
    .flatMap((classes) => classes)
    .filter((className) => className.toLowerCase().includes(normalized));

  return limitResults(Array.from(new Set([...fromShortKey, ...fromShortClass])).sort(), limit);
};

const queryGhostInline = (line: string): string => {
  const trimmed = line.trimEnd();
  if (!trimmed) return "";

  const token = trimmed.split(/\s+/).pop() ?? "";
  if (!token) return "";

  const [best] = queryClasses(token, 1);
  if (!best || best === token) return "";

  return `${trimmed.slice(0, trimmed.length - token.length)}${best}`;
};

const queryLineSnippet = (snippet: string): string[] => {
  const key = snippet.trim();
  if (!key) return [];
  if (shortHints[key]) return shortHints[key];
  if (mergedCombos[key]) return mergedCombos[key];

  const [bestKey] = Object.keys(shortHints)
    .concat(Object.keys(mergedCombos))
    .filter((candidate) => candidate.toLowerCase().includes(key.toLowerCase()));

  return bestKey ? shortHints[bestKey] ?? mergedCombos[bestKey] ?? [] : [];
};

const queryData = (query: string, limit = DEFAULT_LIMIT): SearchHit[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return searchableEntries.slice(0, limit);
  }

  return searchableEntries
    .filter((entry) => entry.path.toLowerCase().includes(normalized) || entry.value.toLowerCase().includes(normalized))
    .slice(0, limit);
};

const queryClassMapping = (className: string, limit = DEFAULT_LIMIT): { twoKey: string[]; fourKey: string[] } => {
  const normalized = className.trim().toLowerCase();
  const key2 = normalized.slice(0, 2);
  const key4 = normalized.slice(0, 4);

  return {
    twoKey: limitResults(classTo2Key.get(key2) ?? [], limit),
    fourKey: limitResults(classTo4Key.get(key4) ?? [], limit),
  };
};

export const tailwindGlobalTools = {
  source: masterData.id,
  version: masterData.version,
  getHints: (query = "", limit = DEFAULT_LIMIT): string[] => queryHints(query, limit),
  getGhostInline: (line = ""): string => queryGhostInline(line),
  getLineSnippet: (snippet = ""): string[] => queryLineSnippet(snippet),
  getSuggestion: (query = "", limit = DEFAULT_LIMIT): string[] => queryHints(query, limit),
  getAutocomplete: (prefix = "", limit = DEFAULT_LIMIT): string[] => queryClasses(prefix, limit),
  getCombo: (combo = ""): Record<string, string[]> => {
    if (!combo.trim()) return mergedCombos;
    const exact = mergedCombos[combo];
    if (exact) return { [combo]: exact };

    const filtered = Object.fromEntries(
      Object.entries(mergedCombos).filter(([key]) => key.toLowerCase().includes(combo.toLowerCase())),
    );
    return filtered;
  },
  getClassMapping: (className = "", limit = DEFAULT_LIMIT): { twoKey: string[]; fourKey: string[] } =>
    queryClassMapping(className, limit),
  getDataHits: (query = "", limit = DEFAULT_LIMIT): SearchHit[] => queryData(query, limit),
  getFullFeatureBundle: (request: SuggestionRequest = {}): ToolBundle => {
    const query = request.query ?? "";
    const prefix = request.prefix ?? query;
    const snippet = request.snippet ?? query;
    const combo = request.combo ?? query;
    const className = request.className ?? prefix;
    const limit = request.limit ?? DEFAULT_LIMIT;

    return {
      hint: queryHints(query, limit),
      ghostInline: queryGhostInline(query),
      lineSnippet: queryLineSnippet(snippet),
      suggestion: queryHints(query, limit),
      autocomplete: queryClasses(prefix, limit),
      combos: tailwindGlobalTools.getCombo(combo),
      classMapping: queryClassMapping(className, limit),
      dataHits: queryData(query, limit),
    };
  },
};

export type { SuggestionRequest, ToolBundle, SearchHit };
