// ═══════════════════════════════════════════════════════════════════
//  Taller Backend — PokéAPI Explorer
//  Conceptos: fetch, async/await, Promise.all,
//             map · filter · reduce · find · every · some · sort
// ═══════════════════════════════════════════════════════════════════

// ── Configuración (ajusta según necesites) ──────────────────────────
const BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const WEIGHT_THRESHOLD = 100;   // umbral para some() (en decagramos)
const START_LETTER = "b";   // letra para find()
const TYPE_FILTER = "fire"; // tipo para filter() — ajusta si no hay resultados



// ══════════════════════════════════════════════════════════════════
//  BLOQUE 1 — FETCH
//  Cada función tiene UNA sola responsabilidad.
// ══════════════════════════════════════════════════════════════════

/**
 * Trae la lista de pokémon (solo name + url).
 * Valida que el HTTP sea exitoso antes de parsear JSON.
 */
async function fetchPokemonList(limit) {
  const response = await fetch(`${BASE_URL}?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al cargar la lista`);
  }
  const data = await response.json();
  return data.results; // [{ name, url }, ...]
}

/**
 * Trae el detalle de UN pokémon dado su URL.
 * Si la URL falla, lanza un error descriptivo.
 * No trae informacion limitada
 */
async function fetchPokemonDetail(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} en ${url}`);
  }
  return response.json();
}

/**
 * Promise.all: lanza TODAS las peticiones de detalle en paralelo.
 * Mucho más rápido que hacerlas una por una con un bucle await.
 * ¿Por qué Promise.all aquí?
 *   Si hacemos await uno a uno, esperamos ~20 respuestas en serie.
 *   Con Promise.all las lanzamos todas a la vez y esperamos
 *   solo a la más lenta → el tiempo total ≈ la petición más lenta.
 */
async function fetchAllDetails(urls) {
  // Creamos un array de promesas 
  const promises = urls.map(url => fetchPokemonDetail(url));
  const rawList = await Promise.all(promises);
  // Extraemos solo los campos útiles de cada respuesta
  return rawList.map(extractDetail);
}

/**
 * Normaliza un objeto crudo de la API al shape que nos interesa.
 * Centralizarlo aquí significa que si cambia la API solo tocamos este lugar.
 */
function extractDetail(raw) {
  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: raw.types.map(t => t.type.name), // ya usamos map internamente
    base_experience: raw.base_experience ?? 0,        // puede venir null
  };
}



// ══════════════════════════════════════════════════════════════════
//  BLOQUE 2 — MÉTODOS DE ARRAYS
//  Cada función recibe el array y devuelve un resultado limpio.
// ══════════════════════════════════════════════════════════════════

// ── map ─────────────────────────────────────────────────────────
// Transforma CADA elemento del array en otra cosa (1 a 1).
// Aquí: pokémon → nombre en mayúscula.
function getUpperCaseNames(pokemon) {
  return pokemon.map(p => p.name.toUpperCase());
}

// ── filter ──────────────────────────────────────────────────────
// Devuelve SOLO los elementos que cumplen una condición (0 a 1).
// Aquí: solo los pokémon que tengan el tipo indicado.
function filterByType(pokemon, TYPE_FILTER) {
  return pokemon.filter(p => p.types.includes(TYPE_FILTER));
}

// ── reduce (peso) ───────────────────────────────────────────────
// Colapsa el array a UN solo valor acumulando.
// Aquí: suma todos los pesos y calcula el promedio.
function getWeightStats(pokemon) {
  const total = pokemon.reduce((acc, p) => acc + p.weight, 0);
  return {
    total,
    avg: (total / pokemon.length).toFixed(2),
  };
}

// ── reduce (conteo por tipo) ─────────────────────────────────────
// Construye un objeto { tipo: cantidad } desde cero.
// Un pokémon puede tener varios tipos, por eso iteramos p.types.
function countByType(pokemon) {
  return pokemon.reduce((acc, p) => {
    p.types.forEach(t => {
      acc[t] = (acc[t] ?? 0) + 1;
    });
    return acc;
  }, {});
}

// ── find ─────────────────────────────────────────────────────────
// Devuelve el PRIMER elemento que cumple la condición (o undefined).
// Aquí: primer pokémon cuyo nombre empieza por START_LETTER.
function findByLetter(pokemon, letter) {
  return pokemon.find(p => p.name.startsWith(letter));
}

// ── every ────────────────────────────────────────────────────────
// true si TODOS los elementos cumplen la condición, false si alguno no.
// Aquí: comprobamos que ningún pokémon tenga base_experience = 0.
function allHaveBaseExp(pokemon) {
  return pokemon.every(p => p.base_experience > 0);
}

// ── some ─────────────────────────────────────────────────────────
// true si AL MENOS UN elemento cumple la condición.
// Aquí: ¿hay algún pokémon que pese más de WEIGHT_THRESHOLD?
function someExceedsWeight(pokemon, threshold) {
  return pokemon.some(p => p.weight > threshold);
}

// ── sort (por peso, descendente) ─────────────────────────────────
// Ordena el array por un criterio. Usamos spread [...] para no
// mutar el array original (sort muta in-place).
function topHeaviest(pokemon, n = 5) {
  return [...pokemon]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n);
}

// ── sort (por nombre, A-Z) ───────────────────────────────────────
// localeCompare maneja correctamente acentos y mayúsculas/minúsculas.
function sortedByName(pokemon, n = 10) {
  return [...pokemon]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, n);
}



// ══════════════════════════════════════════════════════════════════
//  BLOQUE 3 — UTILIDADES DE PRESENTACIÓN
// ══════════════════════════════════════════════════════════════════

/** Actualiza el párrafo de estado ("Cargando...", "Listo", etc.) */
function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

/** Vuelca el array de líneas al <pre> de resultados */
function renderLines(lines) {
  document.getElementById("output").textContent = lines.join("\n");
}

/** Genera un separador visual con título para cada sección */
function section(title) {
  const bar = "─".repeat(52);
  return `\n${bar}\n  ${title}\n${bar}`;
}

/** Formatea un pokémon en una línea legible */
function formatPokemon(p) {
  const name = p.name.padEnd(16);
  const types = `[${p.types.join(", ")}]`.padEnd(20);
  return `  #${String(p.id).padStart(3, "0")} ${name} peso:${String(p.weight).padStart(4)}  tipos:${types}  exp:${p.base_experience}`;
}



// ══════════════════════════════════════════════════════════════════
//  BLOQUE 4 — ORQUESTADOR PRINCIPAL
// ══════════════════════════════════════════════════════════════════

async function main(limit, detailCount) {
  const lines = [];

  // ── A) Lista principal ────────────────────────────────────────
  setStatus("Paso 1/2 — Cargando lista…");
  const results = await fetchPokemonList(limit);
  lines.push(`Lista recibida: ${results.length} pokémon  (limit=${limit})`);

  // ── B) Detalles en paralelo con Promise.all ───────────────────
  setStatus(`Paso 2/2 — Cargando ${detailCount} detalles en paralelo…`);
  const urls = results.slice(0, detailCount).map(r => r.url);
  const pokemon = await fetchAllDetails(urls);
  lines.push(`Detalles en paralelo: ${pokemon.length} pokémon listos\n`);

  // ── C) Métodos de arrays ──────────────────────────────────────

  // MAP ──────────────────────────────────────────────────────────
  lines.push(section("MAP — nombres en MAYÚSCULA"));
  lines.push("  " + getUpperCaseNames(pokemon).join(", "));

  // FILTER ───────────────────────────────────────────────────────
  lines.push(section(`FILTER — tipo "${TYPE_FILTER}"`));
  const typed = filterByType(pokemon, TYPE_FILTER);
  if (typed.length === 0) {
    lines.push(`  (ninguno de tipo "${TYPE_FILTER}" en este lote)`);
  } else {
    typed.forEach(p => lines.push(formatPokemon(p)));
  }

  // REDUCE — peso ────────────────────────────────────────────────
  lines.push(section("REDUCE — peso total y promedio (decagramos)"));
  const { total, avg } = getWeightStats(pokemon);
  lines.push(`  Peso total : ${total} dg`);
  lines.push(`  Peso medio : ${avg} dg`);

  // REDUCE — conteo por tipo ─────────────────────────────────────
  lines.push(section("REDUCE — conteo de pokémon por tipo"));
  const counts = countByType(pokemon);
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, n]) => {
      const bar = "█".repeat(n);
      lines.push(`  ${type.padEnd(12)} ${bar} (${n})`);
    });

  // FIND ─────────────────────────────────────────────────────────
  lines.push(section(`FIND — primer pokémon cuyo nombre empieza por "${START_LETTER}"`));
  const found = findByLetter(pokemon, START_LETTER);
  lines.push(found
    ? formatPokemon(found)
    : `  Ninguno empieza por "${START_LETTER}" en este lote`
  );

  // EVERY ────────────────────────────────────────────────────────
  lines.push(section("EVERY — ¿TODOS tienen base_experience > 0?"));
  const allExp = allHaveBaseExp(pokemon);
  lines.push(`  Resultado: ${allExp ? "✓ SÍ, todos tienen experiencia base" : "✗ NO, alguno tiene 0"}`);

  // SOME ─────────────────────────────────────────────────────────
  lines.push(section(`SOME — ¿ALGUNO pesa más de ${WEIGHT_THRESHOLD} dg?`));
  const heavy = someExceedsWeight(pokemon, WEIGHT_THRESHOLD);
  lines.push(`  Resultado: ${heavy ? `✓ SÍ, hay al menos uno` : "✗ NO, ninguno supera el umbral"}`);

  // SORT — peso desc ─────────────────────────────────────────────
  lines.push(section("SORT — top 5 más pesados (descendente)"));
  topHeaviest(pokemon, 5).forEach((p, i) =>
    lines.push(`  ${i + 1}. ${formatPokemon(p)}`)
  );

  // SORT — nombre A-Z ────────────────────────────────────────────
  lines.push(section("SORT — primeros 10 por nombre (A → Z)"));
  sortedByName(pokemon, 10).forEach((p, i) =>
    lines.push(`  ${i + 1}. ${formatPokemon(p)}`)
  );

  return lines;
}



// ══════════════════════════════════════════════════════════════════
//  BLOQUE 5 — EVENTO DEL BOTÓN
// ══════════════════════════════════════════════════════════════════

document.getElementById("loadBtn").addEventListener("click", async () => {
  const btn = document.getElementById("loadBtn");
  const limit = parseInt(document.getElementById("limitInput").value, 10) || 200;
  const detailCount = parseInt(document.getElementById("detailInput").value, 10) || 20;

  // Estado inicial
  btn.disabled = true;
  document.getElementById("output").textContent = "";
  setStatus("Iniciando…");

  try {
    const lines = await main(limit, detailCount);
    renderLines(lines);
    setStatus("✓ Completado sin errores.");
  } catch (err) {
    // Mostramos el error en pantalla (no solo en consola)
    document.getElementById("output").textContent =
      `⚠ ERROR:\n  ${err.message}\n\nRevisa la consola para más detalles.`;
    setStatus("Falló la carga.");
    console.error("[PokéAPI Explorer]", err);
  } finally {
    // Siempre re-habilitamos el botón, haya error o no
    btn.disabled = false;
  }
});
