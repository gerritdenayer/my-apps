/* ===================== Versie ===================== */
/* Hoog dit op bij elke merkbare aanpassing, zodat je in de app kan zien welke versie live staat. */
const APP_VERSIE = "v4.1";

/* Klein potlood-icoontje voor de "Aanpassen"-knop in de ranglijst (i.p.v. tekst, past zo op elk scherm). */
const AANPAS_ICOON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;

/* Klein spraakwolkje-icoontje voor de opmerking-knop in het wedstrijdoverzicht. */
const OPMERKING_ICOON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

/* ===================== Standaardgegevens (Brabantse Golf) ===================== */
/* Deze data komt overeen met baan.json en categorieen.json. Gebruik de "laden vanuit
   JSON-bestand" knoppen in Instellingen om deze te vervangen zonder de app te herbouwen. */

const DEFAULT_BAAN = {
  "naam": "Brabantse Golf",
  "holes": [
    { "nummer": 1,  "par": 4, "si_heren": 9,  "si_dames": 11, "afstand_m": { "wit": 393, "geel": 380, "blauw": 341, "rood": 331, "oranje": 255, "roze": 180 } },
    { "nummer": 2,  "par": 5, "si_heren": 5,  "si_dames": 5,  "afstand_m": { "wit": 553, "geel": 482, "blauw": 455, "rood": 410, "oranje": 322, "roze": 276 } },
    { "nummer": 3,  "par": 4, "si_heren": 1,  "si_dames": 1,  "afstand_m": { "wit": 370, "geel": 337, "blauw": 333, "rood": 288, "oranje": 240, "roze": 190 } },
    { "nummer": 4,  "par": 4, "si_heren": 3,  "si_dames": 3,  "afstand_m": { "wit": 297, "geel": 297, "blauw": 281, "rood": 199, "oranje": 195, "roze": 150 } },
    { "nummer": 5,  "par": 4, "si_heren": 13, "si_dames": 13, "afstand_m": { "wit": 293, "geel": 278, "blauw": 250, "rood": 208, "oranje": 185, "roze": 147 } },
    { "nummer": 6,  "par": 4, "si_heren": 15, "si_dames": 17, "afstand_m": { "wit": 309, "geel": 309, "blauw": 265, "rood": 244, "oranje": 201, "roze": 162 } },
    { "nummer": 7,  "par": 3, "si_heren": 17, "si_dames": 15, "afstand_m": { "wit": 159, "geel": 145, "blauw": 126, "rood": 122, "oranje": 83,  "roze": 56  } },
    { "nummer": 8,  "par": 4, "si_heren": 11, "si_dames": 9,  "afstand_m": { "wit": 320, "geel": 310, "blauw": 299, "rood": 245, "oranje": 215, "roze": 175 } },
    { "nummer": 9,  "par": 4, "si_heren": 7,  "si_dames": 7,  "afstand_m": { "wit": 347, "geel": 331, "blauw": 285, "rood": 240, "oranje": 240, "roze": 195 } },
    { "nummer": 10, "par": 5, "si_heren": 8,  "si_dames": 4,  "afstand_m": { "wit": 451, "geel": 451, "blauw": 427, "rood": 370, "oranje": 340, "roze": 325 } },
    { "nummer": 11, "par": 4, "si_heren": 2,  "si_dames": 2,  "afstand_m": { "wit": 398, "geel": 391, "blauw": 359, "rood": 285, "oranje": 255, "roze": 195 } },
    { "nummer": 12, "par": 3, "si_heren": 16, "si_dames": 16, "afstand_m": { "wit": 154, "geel": 151, "blauw": 144, "rood": 137, "oranje": 116, "roze": 93  } },
    { "nummer": 13, "par": 5, "si_heren": 4,  "si_dames": 6,  "afstand_m": { "wit": 546, "geel": 502, "blauw": 464, "rood": 424, "oranje": 370, "roze": 297 } },
    { "nummer": 14, "par": 3, "si_heren": 18, "si_dames": 18, "afstand_m": { "wit": 127, "geel": 127, "blauw": 122, "rood": 122, "oranje": 87,  "roze": 70  } },
    { "nummer": 15, "par": 4, "si_heren": 6,  "si_dames": 8,  "afstand_m": { "wit": 348, "geel": 318, "blauw": 301, "rood": 250, "oranje": 215, "roze": 165 } },
    { "nummer": 16, "par": 4, "si_heren": 14, "si_dames": 14, "afstand_m": { "wit": 275, "geel": 261, "blauw": 255, "rood": 240, "oranje": 175, "roze": 123 } },
    { "nummer": 17, "par": 4, "si_heren": 10, "si_dames": 10, "afstand_m": { "wit": 306, "geel": 306, "blauw": 299, "rood": 265, "oranje": 202, "roze": 180 } },
    { "nummer": 18, "par": 4, "si_heren": 12, "si_dames": 12, "afstand_m": { "wit": 289, "geel": 276, "blauw": 252, "rood": 212, "oranje": 212, "roze": 160 } }
  ],
  "tees": [
    { "naam": "Wit",    "heren": { "cr_18": 71.5, "slope_18": 127, "cr_uit": 36.4, "slope_uit": 131, "cr_in": 35.2, "slope_in": 123 }, "dames": null },
    { "naam": "Geel",   "heren": { "cr_18": 70.0, "slope_18": 125, "cr_uit": 35.5, "slope_uit": 130, "cr_in": 34.5, "slope_in": 120 }, "dames": { "cr_18": 75.6, "slope_18": 135, "cr_uit": 38.5, "slope_uit": 141, "cr_in": 37.2, "slope_in": 128 } },
    { "naam": "Blauw",  "heren": { "cr_18": 68.2, "slope_18": 120, "cr_uit": 34.6, "slope_uit": 122, "cr_in": 33.6, "slope_in": 118 }, "dames": { "cr_18": 73.7, "slope_18": 128, "cr_uit": 37.4, "slope_uit": 131, "cr_in": 36.4, "slope_in": 125 } },
    { "naam": "Rood",   "heren": { "cr_18": 64.9, "slope_18": 114, "cr_uit": 32.9, "slope_uit": 115, "cr_in": 32.1, "slope_in": 112 }, "dames": { "cr_18": 69.5, "slope_18": 121, "cr_uit": 35.2, "slope_uit": 121, "cr_in": 34.4, "slope_in": 122 } },
    { "naam": "Oranje", "heren": { "cr_18": 61.5, "slope_18": 107, "cr_uit": 31.1, "slope_uit": 108, "cr_in": 30.4, "slope_in": 105 }, "dames": { "cr_18": 65.4, "slope_18": 111, "cr_uit": 33.0, "slope_uit": 112, "cr_in": 32.4, "slope_in": 110 } },
    { "naam": "Roze",   "heren": { "cr_18": 57.7, "slope_18": 99,  "cr_uit": 29.1, "slope_uit": 100, "cr_in": 28.6, "slope_in": 98  }, "dames": { "cr_18": 60.7, "slope_18": 102, "cr_uit": 30.6, "slope_uit": 101, "cr_in": 30.1, "slope_in": 103 } }
  ],
  "par_totaal": 72
};

const DEFAULT_CATEGORIEEN = [
  { "id": "reeks1_heren", "naam": "Reeks 1", "geslacht": "M", "hcp_min": 0.0,  "hcp_max": 12.4 },
  { "id": "reeks2_heren", "naam": "Reeks 2", "geslacht": "M", "hcp_min": 12.5, "hcp_max": 20.4 },
  { "id": "reeks3_heren", "naam": "Reeks 3", "geslacht": "M", "hcp_min": 20.5, "hcp_max": 28.4 },
  { "id": "bga_heren",    "naam": "BGA",     "geslacht": "M", "hcp_min": 28.5, "hcp_max": 54.0 },
  { "id": "reeks1_dames", "naam": "Reeks 1", "geslacht": "V", "hcp_min": 0.0,  "hcp_max": 15.4 },
  { "id": "reeks2_dames", "naam": "Reeks 2", "geslacht": "V", "hcp_min": 15.5, "hcp_max": 24.4 },
  { "id": "reeks3_dames", "naam": "Reeks 3", "geslacht": "V", "hcp_min": 24.5, "hcp_max": 32.4 },
  { "id": "bga_dames",    "naam": "BGA",     "geslacht": "V", "hcp_min": 32.5, "hcp_max": 54.0 }
];

/* Standaard tee per handicapband. Regels worden van hoog naar laag doorlopen: de eerste
   regel waarvoor de handicap index boven de ondergrens ligt, bepaalt de tee. Pas dit aan
   in Instellingen als de club de grenzen wijzigt (bv. volgend seizoen). */
const DEFAULT_TEEREGELS = [
  { "id": "teeregel_1", "ondergrens_hcp": 45.0, "tee_dames": "Roze",   "tee_heren": "Roze" },
  { "id": "teeregel_2", "ondergrens_hcp": 40.0, "tee_dames": "Roze",   "tee_heren": "Oranje" },
  { "id": "teeregel_3", "ondergrens_hcp": -99.0, "tee_dames": "Oranje", "tee_heren": "Blauw" }
];

/* Normen om te slagen voor de baantest (enkel de AGS telt, hoe lager hoe beter). Pas dit aan
   in Instellingen > Baantest-normen als de club de grenzen wijzigt. Geen regel voor "18 holes"
   omdat de baantest normaal over 9 holes gespeeld wordt; voeg er zelf 1 toe indien nodig. */
const DEFAULT_BAANTESTREGELS = [
  { "id": "baantest_heren_uit", "geslacht": "M", "ronde": "uit", "max_ags": 53 },
  { "id": "baantest_heren_in",  "geslacht": "M", "ronde": "in",  "max_ags": 52 },
  { "id": "baantest_dames_uit", "geslacht": "V", "ronde": "uit", "max_ags": 55 },
  { "id": "baantest_dames_in",  "geslacht": "V", "ronde": "in",  "max_ags": 55 }
];

/* Vooraf ingestelde opmerkingen die je per speler kan kiezen in Wedstrijdoverzicht (bv. een
   speler op wie je bij het scoren extra moet letten). "Andere" staat daar altijd apart bij als
   vaste keuze en hoeft hier niet in te staan. Pas deze lijst aan in Instellingen > Opmerkingen. */
const DEFAULT_OPMERKINGEN = [
  "Speelt buiten wedstrijd",
  "Verlaat de wedstrijd vroegtijdig",
  "Nieuwe speler, extra begeleiding"
];

/* ===================== Status / opslag ===================== */

const OPSLAG_SLEUTEL = "golfwedstrijd_status_v1";

let STATE = laadStatus();

function vandaagISO() {
  return new Date().toISOString().slice(0, 10);
}

/* Standaardnaam voor een nieuw seizoen: gewoon het huidige jaartal (de midweekcompetitie
   loopt per kalenderjaar). Kan bij "Nieuw seizoen starten" altijd naar iets anders aangepast
   worden (bv. "2026-2027") indien de club een ander seizoensysteem hanteert. */
function seizoenSuggestie() {
  return vandaagISO().slice(0, 4);
}

function laadStatus() {
  const raw = localStorage.getItem(OPSLAG_SLEUTEL);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        baan: parsed.baan || DEFAULT_BAAN,
        categorieen: parsed.categorieen || DEFAULT_CATEGORIEEN,
        teeregels: parsed.teeregels || DEFAULT_TEEREGELS,
        baantestregels: parsed.baantestregels || DEFAULT_BAANTESTREGELS,
        opmerkingenLijst: parsed.opmerkingenLijst || DEFAULT_OPMERKINGEN,
        spelers: parsed.spelers || [],
        scores: parsed.scores || {},
        wedstrijdnaam: parsed.wedstrijdnaam || "midweek",
        wedstrijddatum: parsed.wedstrijddatum || vandaagISO(),
        afgesloten: parsed.afgesloten || false,
        seizoen: parsed.seizoen || seizoenSuggestie()
      };
    } catch (e) {
      console.warn("Kon opgeslagen status niet lezen, start met standaardgegevens.", e);
    }
  }
  return { baan: DEFAULT_BAAN, categorieen: DEFAULT_CATEGORIEEN, teeregels: DEFAULT_TEEREGELS, baantestregels: DEFAULT_BAANTESTREGELS, opmerkingenLijst: DEFAULT_OPMERKINGEN, spelers: [], scores: {}, wedstrijdnaam: "midweek", wedstrijddatum: vandaagISO(), afgesloten: false, seizoen: seizoenSuggestie() };
}

function bewaarStatus() {
  localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(STATE));
}

/* ===================== Rekenlogica handicap ===================== */

function holesVoorRonde(ronde, baan) {
  const b = baan || STATE.baan;
  if (ronde === "uit") return b.holes.filter(h => h.nummer <= 9);
  if (ronde === "in") return b.holes.filter(h => h.nummer >= 10);
  return b.holes;
}

function ratingVeldenVoorRonde(ronde) {
  if (ronde === "uit") return { cr: "cr_uit", slope: "slope_uit", par: 36 };
  if (ronde === "in") return { cr: "cr_in", slope: "slope_in", par: 36 };
  return { cr: "cr_18", slope: "slope_18", par: 72 };
}

function vindTee(teeNaam) {
  return STATE.baan.tees.find(t => t.naam === teeNaam);
}

function ratingVoorSpeler(teeNaam, geslacht, ronde) {
  const tee = vindTee(teeNaam);
  if (!tee) return null;
  const bron = geslacht === "M" ? tee.heren : tee.dames;
  if (!bron) return null;
  const velden = ratingVeldenVoorRonde(ronde);
  return { cr: bron[velden.cr], slope: bron[velden.slope], par: velden.par };
}

function berekenCourseHandicap(hcpIndex, teeNaam, geslacht, ronde) {
  const rating = ratingVoorSpeler(teeNaam, geslacht, ronde);
  if (!rating) return null;
  /* Voor een 9-holes ronde wordt de helft van de handicap index gebruikt (WHS-regel),
     samen met de course rating/slope van die 9 holes. */
  const effectieveHcp = ronde === "18" ? hcpIndex : hcpIndex / 2;
  const ch = effectieveHcp * (rating.slope / 113) + (rating.cr - rating.par);
  return Math.round(ch);
}

function categorieVoorSpeler(hcpIndex, geslacht) {
  return STATE.categorieen.find(c => c.geslacht === geslacht && hcpIndex >= c.hcp_min && hcpIndex <= c.hcp_max) || null;
}

function rondeLabel(ronde) {
  return ronde === "18" ? "18 holes" : (ronde === "uit" ? "9 holes - uit" : "9 holes - in");
}

/* Zelfde onderscheid, maar dan met de "Front/Back"-terminologie die op het wedstrijdoverzicht
   (de flight-lijst) gebruikt wordt. */
function rondeFrontBackLabel(ronde) {
  return ronde === "18" ? "18 holes" : (ronde === "uit" ? "Front (uit)" : "Back (in)");
}

/* Opvallende badge voor front/back bij 9 holes (zie renderSpelerInfo, Score invoeren), met een
   pijltje in de richting van de 9 holes (uit = vooruit/1-9, in = terug/10-18) zodat in 1 oogopslag
   duidelijk is welke helft van de baan de speler speelt - i.p.v. gewone platte tekst. */
function rondeBadgeHtml(ronde) {
  if (ronde === "18") return `<span class="badge grijs">18 holes</span>`;
  if (ronde === "uit") return `<span class="badge front">Front : 9 holes uit</span>`;
  return `<span class="badge back">Back : 9 holes in</span>`;
}

/* ===================== Startuur en flight ===================== */
/* Elke speler kan een flight-nummer en een startuur (tee time) krijgen, zodat het
   wedstrijdoverzicht (tab "Wedstrijdoverzicht") per flight getoond kan worden en iedereen
   weet wanneer hij start. Dit gebeurt niet meer bij het aanmaken van de speler (dat werd in
   de praktijk overgeslagen), maar achteraf in het Wedstrijdoverzicht zelf: daar vink je een
   aantal spelers aan, kies je een flight-nummer en een startuur, en klik je op "Flight
   toewijzen" om dat in 1 keer aan alle aangevinkte spelers toe te kennen. Spelers zonder
   flight staan in dat overzicht apart bovenaan, zodat je ze makkelijk kan aanvinken. */

function huidigeTijd() {
  const nu = new Date();
  return `${String(nu.getHours()).padStart(2, "0")}:${String(nu.getMinutes()).padStart(2, "0")}`;
}

/* Telt deltaMinuten (kan negatief zijn) op bij een "UU:MM"-tekst, met wraparound over
   middernacht. Valt terug op het huidige tijdstip als de tekst niet leesbaar is. */
function wijzigTijdString(tijd, deltaMinuten) {
  const match = /^(\d{1,2}):(\d{2})$/.exec((tijd || "").trim());
  let uren, minuten;
  if (match) {
    uren = parseInt(match[1], 10);
    minuten = parseInt(match[2], 10);
  } else {
    [uren, minuten] = huidigeTijd().split(":").map(Number);
  }
  let totaal = ((uren * 60 + minuten + deltaMinuten) % 1440 + 1440) % 1440;
  return `${String(Math.floor(totaal / 60)).padStart(2, "0")}:${String(totaal % 60).padStart(2, "0")}`;
}

/* Eerstvolgend vrij flight-nummer: 1 hoger dan het hoogste nummer dat al aan een speler
   toegekend is, of 1 als nog niemand een flight heeft. Louter een voorstel - met de +/-
   knoppen kies je desgewenst ook een bestaand nummer, om er nog spelers aan toe te voegen. */
function volgendeVrijeFlightNummer() {
  const nummers = (STATE.spelers || []).map(s => s.flight).filter(fl => typeof fl === "number" && !isNaN(fl));
  return nummers.length === 0 ? 1 : Math.max(...nummers) + 1;
}

/* Voorstel voor het startuur van de volgende flight: 10 minuten na het startuur van de
   laatst toegewezen flight (de flight met het hoogste nummer), zodat opeenvolgende flights
   vanzelf een paar minuten na elkaar starten in plaats van telkens terug op "nu" te springen.
   Enkel bij de allereerste flight van de wedstrijd (nog geen enkele toewijzing gebeurd) is er
   nog niets om op verder te bouwen, en valt dit terug op het huidige tijdstip. */
function volgendeFlightStartuurSuggestie() {
  const laatsteFlightNummer = volgendeVrijeFlightNummer() - 1;
  if (laatsteFlightNummer < 1) return huidigeTijd();
  const speler = (STATE.spelers || []).find(s => s.flight === laatsteFlightNummer && s.startuur);
  if (!speler) return huidigeTijd();
  return wijzigTijdString(speler.startuur, 10);
}

function wijzigNieuweFlightNummer(delta) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, er kan niets meer aangepast worden.", "fout"); return; }
  const el = document.getElementById("in-nieuwe-flight-nummer");
  let waarde = parseInt(el.value, 10);
  if (isNaN(waarde)) waarde = 1;
  el.value = String(Math.max(1, waarde + delta));
}

function wijzigNieuweFlightStartuur(deltaMinuten) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, er kan niets meer aangepast worden.", "fout"); return; }
  const el = document.getElementById("in-nieuwe-flight-startuur");
  el.value = wijzigTijdString(el.value, deltaMinuten);
}

/* Het startuur-veld bij "Flight toewijzen" is rechtstreeks intikbaar (naast de +/- knoppen).
   Bij het verlaten van het veld (onchange) wordt de invoer genormaliseerd naar "UU:MM" (bv.
   "9:5" -> "09:05"), of teruggezet op het huidige tijdstip als de invoer geen geldig uur is. */
function valideerNieuweFlightStartuurInvoer() {
  const el = document.getElementById("in-nieuwe-flight-startuur");
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(el.value.trim());
  const uren = match ? parseInt(match[1], 10) : NaN;
  const minuten = match ? parseInt(match[2], 10) : NaN;
  if (!match || isNaN(uren) || isNaN(minuten) || uren < 0 || uren > 23 || minuten < 0 || minuten > 59) {
    el.value = huidigeTijd();
    return;
  }
  el.value = `${String(uren).padStart(2, "0")}:${String(minuten).padStart(2, "0")}`;
}

/* Zet het "Flight toewijzen"-paneel terug op zijn voorstelwaarden: eerstvolgend vrij
   flight-nummer, en als startuur 10 minuten na de laatst toegewezen flight (of "nu" als er nog
   geen enkele flight is). Wordt aangeroepen telkens het wedstrijdoverzicht opnieuw getekend
   wordt (renderWedstrijdOverzicht), dus ook meteen na een toewijzing. */
function resetFlightToewijzenDefaults() {
  const nummerEl = document.getElementById("in-nieuwe-flight-nummer");
  const startuurEl = document.getElementById("in-nieuwe-flight-startuur");
  if (nummerEl) nummerEl.value = String(volgendeVrijeFlightNummer());
  if (startuurEl) startuurEl.value = volgendeFlightStartuurSuggestie();
}

/* Onthoudt welke spelers in het wedstrijdoverzicht aangevinkt staan (los van welke groep ze
   op dat moment in staan), zodat de selectie overeind blijft als het overzicht om een andere
   reden opnieuw getekend wordt. */
window._overzichtGeselecteerd = window._overzichtGeselecteerd || new Set();
function overzichtCheckboxGewijzigd(id, aangevinkt) {
  if (aangevinkt) window._overzichtGeselecteerd.add(id);
  else window._overzichtGeselecteerd.delete(id);
}

/* Volgorde waarin de flights getoond worden in het wedstrijdoverzicht: "asc" (laag naar hoog,
   standaard) of "desc" (hoog naar laag). Onthouden zolang de pagina open blijft. */
window._overzichtFlightVolgorde = window._overzichtFlightVolgorde || "asc";
function wisselFlightVolgorde() {
  window._overzichtFlightVolgorde = window._overzichtFlightVolgorde === "asc" ? "desc" : "asc";
  renderWedstrijdOverzicht();
}

/* Kent het ingestelde flight-nummer en startuur toe aan alle aangevinkte spelers in 1 keer -
   dit is de kern van "Flight toewijzen": spelers aanvinken, nummer/uur instellen, klikken. */
function wijsFlightToe() {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, er kan niets meer aangepast worden.", "fout"); return; }
  const ids = Array.from(window._overzichtGeselecteerd);
  if (ids.length === 0) { toonMelding("Vink minstens 1 speler aan om een flight toe te wijzen.", "fout"); return; }

  let flight = parseInt(document.getElementById("in-nieuwe-flight-nummer").value, 10);
  if (isNaN(flight) || flight < 1) flight = 1;

  // Bestaat deze flight al (spelers met dit nummer die nu niet aangevinkt zijn)? Gebruik dan
  // hun startuur, in plaats van het ingetikte startuur - anders zou je per ongeluk 1 speler met
  // een ander startuur dan de rest van zijn flight kunnen toevoegen (bv. bij het terugzetten
  // van een speler na een front/back-wissel via de "x"-knop, zie ook "Flight aanpassen").
  const bestaandeFlightSpeler = STATE.spelers.find(s => s.flight === flight && !ids.includes(s.id) && s.startuur);
  const startuurRuw = document.getElementById("in-nieuwe-flight-startuur").value.trim();
  const startuur = bestaandeFlightSpeler
    ? bestaandeFlightSpeler.startuur
    : (/^\d{1,2}:\d{2}$/.test(startuurRuw) ? startuurRuw : huidigeTijd());

  let aantal = 0;
  ids.forEach(id => {
    const speler = STATE.spelers.find(s => s.id === id);
    if (!speler) return;
    speler.flight = flight;
    speler.startuur = startuur;
    aantal++;
  });
  bewaarStatus();
  window._overzichtGeselecteerd.clear();
  renderWedstrijdOverzicht();
  toonMelding(`Flight ${flight} (${startuur}) toegewezen aan ${aantal} speler${aantal === 1 ? "" : "s"}.`, "ok");
}

/* Een flight is "vergrendeld" zodra iedereen erin zijn score volledig heeft ingevuld: er valt
   dan niks meer aan te passen aan de flight zelf (startuur/nummer/front-back/eruit halen) - puur
   om te vermijden dat iemand per ongeluk nog aan een in principe afgewerkte flight zit te
   schuiven. De scores zelf blijven gewoon aanpasbaar via Score invoeren (die heeft haar eigen
   "bevestigd"-vergrendeling per speler). Dit is enkel gedrag/weergave, niks wordt bewaard. */
function isFlightVergrendeld(flightNummer) {
  const leden = STATE.spelers.filter(s => s.flight === flightNummer);
  return leden.length > 0 && leden.every(s => spelerScoreData(s).compleet);
}

/* Haalt 1 speler weer uit zijn flight (bv. om hem in een andere flight te herplaatsen, of
   omdat hij toch niet meespeelt). Geen bevestigingsvraag: makkelijk te herstellen door de
   speler gewoon opnieuw aan te vinken en aan een flight toe te wijzen. */
function haalUitFlight(id) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, er kan niets meer aangepast worden.", "fout"); return; }
  const speler = STATE.spelers.find(s => s.id === id);
  if (!speler) return;
  if (typeof speler.flight === "number" && isFlightVergrendeld(speler.flight)) {
    toonMelding(`Flight ${speler.flight} is vergrendeld (iedereen heeft al gescoord), kan niet meer aangepast worden.`, "fout");
    return;
  }
  speler.flight = undefined;
  speler.startuur = undefined;
  bewaarStatus();
  renderWedstrijdOverzicht();
  toonMelding(`${speler.naam} is uit de flight gehaald.`, "ok");
}

/* ===================== Een volledige flight in 1 keer aanpassen ===================== */
/* Klik op de kop van een reeds geconfigureerde flight in het wedstrijdoverzicht: opent een
   venster om in 1 keer het startuur, het flight-nummer en/of de ronde (front/back/18) van alle
   spelers in die flight aan te passen, zonder ze eerst individueel uit de flight te moeten
   halen (dat gaf voorheen als neveneffect dat het startuur bij het terugzetten weer op "nu"
   sprong i.p.v. het bestaande startuur van de flight te behouden). */
window._flightBewerkNummer = null; // huidig flight-nummer dat bewerkt wordt, of null als de modal dicht is

function openFlightBewerkenModal(flightNummer) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, er kan niets meer aangepast worden.", "fout"); return; }
  if (isFlightVergrendeld(flightNummer)) {
    toonMelding(`Flight ${flightNummer} is vergrendeld (iedereen heeft al gescoord), kan niet meer aangepast worden.`, "fout");
    return;
  }
  const leden = STATE.spelers.filter(s => s.flight === flightNummer);
  if (leden.length === 0) return;
  window._flightBewerkNummer = flightNummer;

  document.getElementById("flight-bewerk-titel").textContent = `Flight ${flightNummer} aanpassen (${leden.length} speler${leden.length === 1 ? "" : "s"})`;
  document.getElementById("flight-bewerk-nummer").value = String(flightNummer);

  const starturen = new Set(leden.map(s => s.startuur || ""));
  document.getElementById("flight-bewerk-startuur").value = (starturen.size === 1 && leden[0].startuur) ? leden[0].startuur : huidigeTijd();

  const rondes = new Set(leden.map(s => s.ronde));
  document.getElementById("flight-bewerk-ronde").value = rondes.size === 1 ? leden[0].ronde : "__ongewijzigd__";

  document.getElementById("flight-bewerk-modal").style.display = "flex";
}

function sluitFlightBewerkenModal() {
  document.getElementById("flight-bewerk-modal").style.display = "none";
  window._flightBewerkNummer = null;
}

function wijzigFlightBewerkNummer(delta) {
  const el = document.getElementById("flight-bewerk-nummer");
  let waarde = parseInt(el.value, 10);
  if (isNaN(waarde)) waarde = window._flightBewerkNummer || 1;
  el.value = String(Math.max(1, waarde + delta));
}

function wijzigFlightBewerkStartuur(deltaMinuten) {
  const el = document.getElementById("flight-bewerk-startuur");
  el.value = wijzigTijdString(el.value, deltaMinuten);
}

function valideerFlightBewerkStartuurInvoer() {
  const el = document.getElementById("flight-bewerk-startuur");
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(el.value.trim());
  const uren = match ? parseInt(match[1], 10) : NaN;
  const minuten = match ? parseInt(match[2], 10) : NaN;
  if (!match || isNaN(uren) || isNaN(minuten) || uren < 0 || uren > 23 || minuten < 0 || minuten > 59) {
    el.value = huidigeTijd();
    return;
  }
  el.value = `${String(uren).padStart(2, "0")}:${String(minuten).padStart(2, "0")}`;
}

function bevestigFlightBewerken() {
  const huidigNummer = window._flightBewerkNummer;
  if (huidigNummer === null) return;
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, er kan niets meer aangepast worden.", "fout"); return; }
  if (isFlightVergrendeld(huidigNummer)) {
    toonMelding(`Flight ${huidigNummer} is vergrendeld (iedereen heeft al gescoord), kan niet meer aangepast worden.`, "fout");
    sluitFlightBewerkenModal();
    return;
  }

  const leden = STATE.spelers.filter(s => s.flight === huidigNummer);
  if (leden.length === 0) { sluitFlightBewerkenModal(); return; }

  let nieuwNummer = parseInt(document.getElementById("flight-bewerk-nummer").value, 10);
  if (isNaN(nieuwNummer) || nieuwNummer < 1) nieuwNummer = huidigNummer;
  if (nieuwNummer !== huidigNummer) {
    const bestaatAl = STATE.spelers.some(s => s.flight === nieuwNummer);
    if (bestaatAl) {
      toonMelding(`Flight ${nieuwNummer} bestaat al. Kies een ander (nog vrij) nummer.`, "fout");
      return;
    }
  }

  const startuurRuw = document.getElementById("flight-bewerk-startuur").value.trim();
  const startuur = /^\d{1,2}:\d{2}$/.test(startuurRuw) ? startuurRuw : huidigeTijd();

  const rondeKeuze = document.getElementById("flight-bewerk-ronde").value;
  const rondeWijzigt = rondeKeuze !== "__ongewijzigd__";

  if (rondeWijzigt) {
    const heeftAlScores = leden.some(s => {
      const arr = (STATE.scores[s.id] && STATE.scores[s.id].holes) || [];
      return s.ronde !== rondeKeuze && arr.some(v => v !== null && v !== undefined);
    });
    if (heeftAlScores) {
      const doorgaan = confirm("Van ronde wisselen maakt de scorekaart leeg voor spelers in deze flight die al scores hadden ingevuld. Doorgaan?");
      if (!doorgaan) return;
    }
  }

  leden.forEach(s => {
    s.flight = nieuwNummer;
    s.startuur = startuur;
    if (rondeWijzigt && s.ronde !== rondeKeuze) {
      s.ronde = rondeKeuze;
      STATE.scores[s.id] = { holes: new Array(holesVoorRonde(rondeKeuze).length).fill(null), bevestigd: false };
    }
  });

  bewaarStatus();
  sluitFlightBewerkenModal();
  renderWedstrijdOverzicht();
  renderSpelerlijst();
  renderHoleTabel();
  renderRanglijst();
  vulSpelerSelects();
  toonMelding(`Flight ${nieuwNummer} aangepast (${leden.length} speler${leden.length === 1 ? "" : "s"}).`, "ok");
}

/* ===================== "Nog geen flight": sortering ===================== */
/* Elke speler-id bevat het tijdstip van aanmaken (s_<timestamp>_<random>, zie voegSpelerToe),
   dus dat tijdstip is al ergens bewaard en kan gewoon uit het id afgeleid worden - geen apart
   veld nodig. Werkt daardoor ook meteen voor spelers uit oudere wedstrijdbestanden. */
function spelerAangemaaktOp(s) {
  const match = /^s_(\d+)_/.exec(s.id || "");
  return match ? parseInt(match[1], 10) : 0;
}
function formatUurVanTijdstip(ms) {
  if (!ms) return "-";
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* Standaard gesorteerd op tijdstip van inschrijving (oudste eerst), i.p.v. alfabetisch - klik
   op een kolomkop om op naam, HCP of tijdstip te sorteren (nogmaals klikken keert de richting
   om). Enkel van toepassing op de groep "Nog geen flight"; flights zelf blijven gesorteerd op
   startuur/naam zoals voorheen. */
window._zonderFlightSorteerVeld = window._zonderFlightSorteerVeld || "tijdstip";
window._zonderFlightSorteerRichting = window._zonderFlightSorteerRichting || "asc";
function wisselZonderFlightSortering(veld) {
  if (window._zonderFlightSorteerVeld === veld) {
    window._zonderFlightSorteerRichting = window._zonderFlightSorteerRichting === "asc" ? "desc" : "asc";
  } else {
    window._zonderFlightSorteerVeld = veld;
    window._zonderFlightSorteerRichting = "asc";
  }
  renderWedstrijdOverzicht();
}

/* ===================== Opmerkingen per speler (wedstrijdoverzicht) ===================== */
/* Laat toe om per speler 1 opmerking te kiezen uit de lijst in Instellingen > Opmerkingen, of
   zelf iets in te typen via "Andere...". Wordt bij het overschakelen naar die speler in Score
   invoeren als waarschuwing getoond (zie scoreSpelerGewijzigd), zodat je er niet naast kijkt
   tijdens het invoeren. */
window._opmerkingSpelerId = null;

function openOpmerkingModal(spelerId) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, er kan niets meer aangepast worden.", "fout"); return; }
  const speler = STATE.spelers.find(s => s.id === spelerId);
  if (!speler) return;
  window._opmerkingSpelerId = spelerId;
  document.getElementById("opmerking-modal-naam").textContent = speler.naam;
  renderOpmerkingModalInhoud(speler.opmerking || "");
  document.getElementById("opmerking-modal").style.display = "flex";
}

function renderOpmerkingModalInhoud(huidigeTekst) {
  const lijst = STATE.opmerkingenLijst || DEFAULT_OPMERKINGEN;
  const isPreset = !!huidigeTekst && lijst.includes(huidigeTekst);
  const isAndere = !!huidigeTekst && !isPreset;

  const opties = [`<option value="" ${!huidigeTekst ? "selected" : ""}>Geen opmerking</option>`]
    .concat(lijst.map(o => `<option value="${o}" ${o === huidigeTekst ? "selected" : ""}>${o}</option>`))
    .concat([`<option value="__andere__" ${isAndere ? "selected" : ""}>Andere...</option>`])
    .join("");

  const zone = document.getElementById("opmerking-modal-inhoud");
  zone.innerHTML = `
    <div>
      <label for="opmerking-select">Opmerking</label>
      <select id="opmerking-select" onchange="opmerkingSelectGewijzigd()">${opties}</select>
    </div>
    <div id="opmerking-andere-zone" style="display:${isAndere ? "block" : "none"}; margin-top:10px;">
      <label for="opmerking-andere-tekst">Eigen tekst</label>
      <input type="text" id="opmerking-andere-tekst" value="${isAndere ? huidigeTekst : ""}" placeholder="Typ hier de opmerking">
    </div>
    <div class="rij-knoppen" style="margin-top:16px;">
      <button class="knop" onclick="bewaarOpmerkingVoorSpeler()">Bewaren</button>
      <button class="knop secundair" onclick="sluitOpmerkingModal()">Annuleren</button>
    </div>`;
}

function opmerkingSelectGewijzigd() {
  const select = document.getElementById("opmerking-select");
  const andereZone = document.getElementById("opmerking-andere-zone");
  andereZone.style.display = select.value === "__andere__" ? "block" : "none";
}

function bewaarOpmerkingVoorSpeler() {
  const speler = STATE.spelers.find(s => s.id === window._opmerkingSpelerId);
  if (!speler) { sluitOpmerkingModal(); return; }
  const select = document.getElementById("opmerking-select");
  const tekst = select.value === "__andere__"
    ? document.getElementById("opmerking-andere-tekst").value.trim()
    : select.value;
  speler.opmerking = tekst;
  bewaarStatus();
  sluitOpmerkingModal();
  renderWedstrijdOverzicht();
  toonMelding(tekst ? `Opmerking bewaard voor ${speler.naam}.` : `Opmerking verwijderd voor ${speler.naam}.`, "ok");
}

function sluitOpmerkingModal() {
  document.getElementById("opmerking-modal").style.display = "none";
  window._opmerkingSpelerId = null;
}

/* Waarschuwing die verschijnt zodra je in Score invoeren naar een speler met een opmerking
   overschakelt (zie scoreSpelerGewijzigd), zodat je die niet over het hoofd ziet vlak voor je
   zijn score invoert. */
function toonOpmerkingWaarschuwing(naam, tekst) {
  document.getElementById("opmerking-waarschuwing-naam").textContent = naam;
  document.getElementById("opmerking-waarschuwing-tekst").textContent = tekst;
  document.getElementById("opmerking-waarschuwing-modal").style.display = "flex";
}

function sluitOpmerkingWaarschuwing() {
  document.getElementById("opmerking-waarschuwing-modal").style.display = "none";
}

/* ===================== Baantest (spelers zonder HCP) ===================== */
/* Spelers die nog geen handicap index hebben en meespelen om hun baantest te halen. Ze spelen
   buiten de competitie: geen reeks, geen course handicap (dus geen ontvangen slagen), en hun
   score telt niet mee in de ranglijst of het Criterium. Om te slagen wordt enkel naar de AGS
   gekeken (score per hole geplafonneerd op gewoon double bogey, par + 2, want geen slagen
   ontvangen), getoetst aan de norm voor hun geslacht en ronde. Die normen staan in
   STATE.baantestregels en zijn aanpasbaar in Instellingen > Baantest-normen. */
function baantestNorm(geslacht, ronde) {
  return (STATE.baantestregels || DEFAULT_BAANTESTREGELS).find(r => r.geslacht === geslacht && r.ronde === ronde) || null;
}

/* Geeft { status, ags, ingevuld, totaal, norm } terug. status is een van:
   "onvolledig" (nog niet alle holes ingevuld), "geen_norm" (geen regel voor deze combinatie
   geslacht/ronde), "geslaagd" of "niet_geslaagd". */
function baantestResultaat(speler, overrideScoreArr, baan) {
  const data = spelerScoreData(speler, overrideScoreArr, baan);
  const norm = baantestNorm(speler.geslacht, speler.ronde);
  if (!data.compleet) return { status: "onvolledig", ags: data.ags, ingevuld: data.ingevuld, totaal: data.totaal, norm };
  if (!norm) return { status: "geen_norm", ags: data.ags, ingevuld: data.ingevuld, totaal: data.totaal, norm: null };
  return { status: data.ags <= norm.max_ags ? "geslaagd" : "niet_geslaagd", ags: data.ags, ingevuld: data.ingevuld, totaal: data.totaal, norm };
}

/* Slagen per hole verdelen volgens de moeilijkheidsrangorde (SI) van de gespeelde holes.
   Werkt zowel voor 18 als voor 9 holes: de SI-waarden worden eerst herrangschikt
   (1 = moeilijkste hole binnen de ronde, tot N = makkelijkste). */
function slagenPerHole(courseHandicap, holes, geslacht) {
  const siRuw = holes.map(h => geslacht === "M" ? h.si_heren : h.si_dames);
  const gesorteerd = [...siRuw].sort((a, b) => a - b);
  const rang = siRuw.map(si => gesorteerd.indexOf(si) + 1);
  const n = holes.length;
  const strokes = new Array(n).fill(0);
  const ch = courseHandicap;
  if (ch >= 0) {
    const basis = Math.floor(ch / n);
    const extra = ch % n;
    for (let i = 0; i < n; i++) {
      strokes[i] = basis + (rang[i] <= extra ? 1 : 0);
    }
  } else {
    const chAbs = Math.abs(ch);
    const basis = Math.floor(chAbs / n);
    const extra = chAbs % n;
    for (let i = 0; i < n; i++) {
      strokes[i] = -basis - (rang[i] > n - extra ? 1 : 0);
    }
  }
  return strokes;
}

/* AGS = Adjusted Gross Score, ANS = Adjusted Net Score: score per hole geplafonneerd op
   "netto double bogey" (par + 2 + ontvangen slagen op die hole). Dit is de officiële
   correctie uit het World Handicap System, gebruikt door Golf Vlaanderen / KBGF. */
function spelerScoreData(speler, overrideScoreArr, baan) {
  const holes = holesVoorRonde(speler.ronde, baan);
  const strokes = slagenPerHole(speler.courseHandicap, holes, speler.geslacht);
  const scoreArr = overrideScoreArr || (STATE.scores[speler.id] && STATE.scores[speler.id].holes) || [];
  let bruto = 0, netto = 0, ags = 0, stableford = 0, ingevuld = 0, slagenIngevuld = 0;
  holes.forEach((h, i) => {
    const g = scoreArr[i];
    if (g === null || g === undefined) return;
    ingevuld++;
    bruto += g;
    const n = g - strokes[i];
    netto += n;
    const puntenLimiet = Math.max(0, 2 - (n - h.par));
    stableford += puntenLimiet;
    const nettoDoubleBogey = h.par + 2 + strokes[i];
    ags += Math.min(g, Math.max(1, nettoDoubleBogey));
    slagenIngevuld += strokes[i];
  });
  const ans = ags - slagenIngevuld;
  return { holes, strokes, bruto, netto, ags, ans, stableford, ingevuld, totaal: holes.length, compleet: ingevuld === holes.length };
}

/* ANS-som over enkel de laatste n gespeelde holes van de ronde (bv. laatste 9/6/3), gebruikt
   voor countback bij een gelijke stand. Volgt dezelfde par+2+slagen-plafonnering per hole als
   spelerScoreData. Geeft null terug als de ronde korter is dan n, of als niet alle n laatste
   holes al ingevuld zijn (dan is er nog geen zinvolle countback te tonen). */
function ansLaatsteHoles(speler, n, overrideScoreArr, baan) {
  const holes = holesVoorRonde(speler.ronde, baan);
  if (n > holes.length) return null;
  const strokes = slagenPerHole(speler.courseHandicap, holes, speler.geslacht);
  const scoreArr = overrideScoreArr || (STATE.scores[speler.id] && STATE.scores[speler.id].holes) || [];
  const vanaf = holes.length - n;
  let ans = 0;
  for (let i = vanaf; i < holes.length; i++) {
    const g = scoreArr[i];
    if (g === null || g === undefined) return null;
    const nettoDoubleBogey = holes[i].par + 2 + strokes[i];
    const agsHole = Math.min(g, Math.max(1, nettoDoubleBogey));
    ans += agsHole - strokes[i];
  }
  return ans;
}

/* ===================== Quickscore parser ===================== */

/* soepel: bedoeld om live te parsen terwijl iemand nog aan het typen is. Een prefix-teken (* of
   +) op het einde van de tekst zonder (volledige) 2 cijfers erna wordt gewoon nog even
   genegeerd in plaats van een foutmelding te geven, tot de 2 cijfers volledig zijn ingetypt. */
function parseQuickscore(str, aantalHoles) {
  const result = [];
  let i = 0;
  while (i < str.length && result.length < aantalHoles) {
    const c = str[i];
    if (c === "*" || c === "+") {
      const rest = str.slice(i + 1);
      if (rest.length < 2) break;
      const twee = rest.slice(0, 2);
      if (!/^\d{2}$/.test(twee)) {
        throw new Error(`Na "${c}" op positie ${i + 1} verwacht ik 2 cijfers (bv. ${c}10).`);
      }
      const waarde = parseInt(twee, 10);
      if (waarde < 10) throw new Error(`${c}${twee} op positie ${i + 1}: gebruik "${c}" alleen voor scores van 10 of meer.`);
      result.push(waarde);
      i += 3;
    } else if (/[1-9]/.test(c)) {
      result.push(parseInt(c, 10));
      i += 1;
    } else if (c === "0") {
      throw new Error(`0 is geen geldige score (positie ${i + 1}). Gebruik *10 of +10 (of hoger) voor 10 slagen of meer.`);
    } else {
      throw new Error(`Onverwacht teken "${c}" op positie ${i + 1}.`);
    }
  }
  return result;
}

/* ===================== UI: navigatie ===================== */

function toonPaneel(naam) {
  document.querySelectorAll(".paneel").forEach(p => p.classList.remove("actief"));
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("actief"));
  document.getElementById("paneel-" + naam).classList.add("actief");
  document.querySelector(`nav button[data-paneel="${naam}"]`).classList.add("actief");
  if (naam === "spelers") { renderSpelerlijst(); verversBekendeSpelers(); }
  if (naam === "score") {
    // Stond het tabblad nog op een al bevestigde speler (bv. je hebt net bevestigd, even de
    // Ranglijst bekeken, en klikt terug) - spring dan naar de eerstvolgende niet-bevestigde
    // speler, zodat je niet op de al afgewerkte kaart blijft "hangen" maar meteen verder kan met
    // de volgende. Kies je zelf een bevestigde speler via de keuzelijst (bv. om iets na te
    // kijken), dan verandert er niets - dit springt enkel bij het heropenen van dit tabblad.
    const huidigeSpeler = STATE.spelers.find(s => s.id === document.getElementById("score-speler").value);
    const huidigeBevestigd = !!(huidigeSpeler && STATE.scores[huidigeSpeler.id] && STATE.scores[huidigeSpeler.id].bevestigd);
    vulSpelerSelects(huidigeBevestigd ? volgendeOnbevestigdeSpelerId() : undefined);
    scoreSpelerGewijzigd();
  }
  if (naam === "ranglijst") renderRanglijst();
  if (naam === "overzicht") renderWedstrijdOverzicht();
  if (naam === "instellingen") renderInstellingen();
}

function toonMelding(tekst, type) {
  const zone = document.getElementById("melding-zone");
  zone.innerHTML = `<div class="melding ${type === "fout" ? "fout" : "ok"}">${tekst}</div>`;
  setTimeout(() => { zone.innerHTML = ""; }, 4000);
}

/* ===================== UI: spelers ===================== */

/* Naam-suggesties voor het toevoegen van spelers. Bewaard in een aparte ledenlijst
   (spelers.json in de wedstrijdmap), los van elke individuele wedstrijd, zodat een speler
   makkelijk terug te vinden is ook nadat "Nieuwe wedstrijd" de deelnemerslijst wist.
   Onthoudt enkel naam + geslacht, nooit de handicap, want die kan per wedstrijd verschillen. */
window._bekendeSpelersMap = {};
window._teeHandmatigGewijzigd = false;
window._bewerkSpelerId = null; // id van de speler die momenteel via het formulier aangepast wordt, of null bij "nieuwe speler"

const LEDENLIJST_BESTAND = "spelers.json";
const HISTORIEK_BESTAND = "historiek.json";

function vulSpelersuggestiesUI() {
  const datalist = document.getElementById("bekende-spelers-lijst");
  if (datalist) {
    // Spelers die al in deze wedstrijd zitten, hoeven niet meer als naam-suggestie te
    // verschijnen (die kan je toch niet nog eens toevoegen), zelfde vergelijking op naam als
    // overal elders (naam.trim().toLowerCase()).
    const alToegevoegd = new Set((STATE.spelers || []).map(s => s.naam.trim().toLowerCase()));
    datalist.innerHTML = Object.values(window._bekendeSpelersMap)
      .filter(p => !alToegevoegd.has(p.naam.trim().toLowerCase()))
      .map(p => `<option value="${p.naam}"></option>`).join("");
  }
  const n = Object.keys(window._bekendeSpelersMap).length;
  const teller = document.getElementById("ledenlijst-teller");
  if (teller) {
    teller.textContent = n === 0 ? "Nog geen gekende spelers." : `${n} gekende speler${n === 1 ? "" : "s"} beschikbaar voor naam-suggesties.`;
  }
  const toonKnop = document.getElementById("ledenlijst-toon-knop");
  if (toonKnop) toonKnop.style.display = n > 0 ? "inline-block" : "none";
  renderLedenlijstTabel();
}

/* Laat toe om, na "Opnieuw inladen", meteen zelf te controleren of de spelers er echt
   staan: toont/verbergt de volledige naam- en geslachtlijst onder de knoppen. */
function toggleLedenlijstTonen() {
  window._ledenlijstTonen = !window._ledenlijstTonen;
  const knop = document.getElementById("ledenlijst-toon-knop");
  if (knop) knop.textContent = window._ledenlijstTonen ? "Verberg lijst" : "Toon lijst";
  renderLedenlijstTabel();
}

function renderLedenlijstTabel() {
  const zone = document.getElementById("ledenlijst-tabel-zone");
  if (!zone) return;
  if (!window._ledenlijstTonen) { zone.style.display = "none"; return; }
  const spelers = Object.values(window._bekendeSpelersMap).sort((a, b) => a.naam.localeCompare(b.naam));
  window._ledenlijstGesorteerd = spelers;
  if (spelers.length === 0) {
    zone.style.display = "block";
    zone.innerHTML = `<p class="uitleg">Nog geen gekende spelers.</p>`;
    return;
  }
  zone.style.display = "block";
  zone.innerHTML = `
    <table class="lijst">
      <tr><th>Naam</th><th style="width:80px;">Geslacht</th><th style="width:110px;"></th></tr>
      ${spelers.map((p, i) => `<tr><td>${p.naam}</td><td>${p.geslacht === "M" ? "Heer" : "Dame"}</td><td><button class="knop secundair" onclick="openNaamHernoemModal(${i})">Aanpassen</button></td></tr>`).join("")}
    </table>`;
}

async function schrijfLedenlijst(map) {
  const inhoud = {
    opmerking: "Overzicht van gekende spelers (naam + geslacht) voor naam-suggesties bij het toevoegen van een speler. Handicap wordt hier bewust niet bewaard, want die kan per wedstrijd verschillen.",
    spelers: Object.values(window._bekendeSpelersMap)
  };
  const fileHandle = await map.getFileHandle(LEDENLIJST_BESTAND, { create: true });
  const schrijfbaar = await fileHandle.createWritable();
  await schrijfbaar.write(JSON.stringify(inhoud, null, 2));
  await schrijfbaar.close();
}

/* Leest spelers.json. Bestaat dat nog niet (eerste keer na deze update), dan wordt de
   ledenlijst eenmalig opgebouwd uit de spelers in reeds bewaarde wedstrijdbestanden, en
   meteen als spelers.json weggeschreven zodat het daarna niet meer nodig is te scannen. */
async function verversBekendeSpelers() {
  const map = await probeerSeizoenMapStil();
  if (!map) return;
  try {
    const handle = await map.getFileHandle(LEDENLIJST_BESTAND);
    const bestand = await handle.getFile();
    const data = JSON.parse(await bestand.text());
    const lijst = Array.isArray(data) ? data : data.spelers;
    const result = {};
    (lijst || []).forEach(p => {
      const key = (p.naam || "").trim().toLowerCase();
      if (key) result[key] = { naam: p.naam.trim(), geslacht: p.geslacht };
    });
    window._bekendeSpelersMap = result;
    vulSpelersuggestiesUI();
    return;
  } catch (e) {
    /* spelers.json bestaat nog niet of is onleesbaar: bootstrap hieronder */
  }
  try {
    const bestanden = await verzamelWedstrijdData(map);
    const lijst = {};
    bestanden.forEach(({ data }) => {
      (data.spelers || []).forEach(s => {
        const key = (s.naam || "").trim().toLowerCase();
        if (key && !lijst[key]) lijst[key] = { naam: s.naam.trim(), geslacht: s.geslacht };
      });
    });
    window._bekendeSpelersMap = lijst;
    vulSpelersuggestiesUI();
    if (Object.keys(lijst).length > 0) await schrijfLedenlijst(map);
  } catch (e) {
    console.warn("Kon spelerslijst niet laden.", e);
  }
}

/* Voegt 1 speler toe aan de ledenlijst als die er nog niet in staat, en bewaart meteen.
   Wordt los van de wedstrijd zelf bijgehouden, dus overleeft "Nieuwe wedstrijd". */
async function ledenlijstAanvullen(naam, geslacht) {
  const key = naam.trim().toLowerCase();
  if (!key || window._bekendeSpelersMap[key]) return;
  window._bekendeSpelersMap[key] = { naam: naam.trim(), geslacht };
  vulSpelersuggestiesUI();
  const map = await probeerSeizoenMapStil();
  if (!map) return;
  try {
    await schrijfLedenlijst(map);
  } catch (e) {
    console.warn("Kon spelerslijst niet bewaren.", e);
  }
}

function importeerLedenlijst(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);
      const lijst = Array.isArray(data) ? data : data.spelers;
      if (!Array.isArray(lijst)) throw new Error("Verwacht een lijst 'spelers' of een array.");
      const result = {};
      lijst.forEach(p => {
        const key = (p.naam || "").trim().toLowerCase();
        if (key) result[key] = { naam: p.naam.trim(), geslacht: p.geslacht };
      });
      window._bekendeSpelersMap = result;
      vulSpelersuggestiesUI();
      const map = await probeerSeizoenMapStil();
      if (map) await schrijfLedenlijst(map);
      toonMelding(`Spelerslijst geladen (${Object.keys(result).length} spelers) voor seizoen "${STATE.seizoen}".`, "ok");
    } catch (err) {
      toonMelding("Kon het bestand niet lezen: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

/* ===================== Naam van een gekende speler corrigeren ===================== */
/* Verbetert een schrijffout in de naam van een speler, en past die overal aan waar de
   naam voorkomt: de gekende-spelerslijst (spelers.json), de huidige wedstrijd (als deze
   speler daarin meespeelt), historiek.json en alle bewaarde wedstrijdbestanden van het
   huidige seizoen. Nodig omdat een verkeerd gespelde naam anders als een aparte speler
   meetelt in het Criterium (zie berekenCriteriumData: de sleutel is naam+geslacht+reeks). */
window._hernoemOudeNaam = null;
window._hernoemGeslacht = null;

function openNaamHernoemModal(index) {
  const speler = (window._ledenlijstGesorteerd || [])[index];
  if (!speler) return;
  window._hernoemOudeNaam = speler.naam;
  window._hernoemGeslacht = speler.geslacht;
  document.getElementById("naam-hernoem-huidige").textContent = speler.naam;
  document.getElementById("naam-hernoem-input").value = speler.naam;
  document.getElementById("naam-hernoem-formulier").style.display = "block";
  document.getElementById("naam-hernoem-resultaat").style.display = "none";
  document.getElementById("naam-hernoem-modal").style.display = "flex";
}

function sluitNaamHernoemModal() {
  document.getElementById("naam-hernoem-modal").style.display = "none";
  window._hernoemOudeNaam = null;
  window._hernoemGeslacht = null;
}

async function bevestigNaamHernoemen() {
  const oudeNaam = window._hernoemOudeNaam;
  const geslacht = window._hernoemGeslacht;
  if (!oudeNaam) { sluitNaamHernoemModal(); return; }
  const nieuweNaam = document.getElementById("naam-hernoem-input").value.trim();
  if (!nieuweNaam) { toonMelding("Geef een naam op.", "fout"); return; }
  if (nieuweNaam === oudeNaam) { toonMelding("Geen wijziging: de naam is identiek.", "fout"); return; }

  const oudeKey = oudeNaam.trim().toLowerCase();
  const nieuweKey = nieuweNaam.toLowerCase();
  const bestaandeRecord = (nieuweKey !== oudeKey) ? window._bekendeSpelersMap[nieuweKey] : null;
  if (bestaandeRecord) {
    const doorgaan = confirm(`Er bestaat al een gekende speler "${bestaandeRecord.naam}". Als je doorgaat, worden "${oudeNaam}" en "${bestaandeRecord.naam}" overal samengevoegd tot 1 speler onder de naam "${nieuweNaam}". Doorgaan?`);
    if (!doorgaan) return;
  }

  document.getElementById("naam-hernoem-formulier").style.display = "none";
  const resultaatZone = document.getElementById("naam-hernoem-resultaat");
  resultaatZone.style.display = "block";
  resultaatZone.innerHTML = `<p class="uitleg">Bezig met aanpassen...</p>`;

  const overzicht = [];

  // 1. Gekende-spelerslijst (spelers.json), in het geheugen en op de schijf.
  delete window._bekendeSpelersMap[oudeKey];
  window._bekendeSpelersMap[nieuweKey] = { naam: nieuweNaam, geslacht: bestaandeRecord ? bestaandeRecord.geslacht : geslacht };
  vulSpelersuggestiesUI();

  const map = await krijgSeizoenMap();
  if (map) {
    try {
      await schrijfLedenlijst(map);
      overzicht.push("Gekende-spelerslijst (spelers.json) bijgewerkt.");
    } catch (e) {
      overzicht.push("Kon spelers.json niet bewaren: " + e.message);
    }
  } else {
    overzicht.push("Geen wedstrijdmap gekozen: spelers.json op de schijf kon niet aangepast worden (enkel in dit browservenster).");
  }

  // 2. Huidige wedstrijd in het geheugen, als deze speler daarin meespeelt.
  let huidigeCount = 0;
  STATE.spelers.forEach(s => {
    if ((s.naam || "").trim().toLowerCase() === oudeKey) {
      s.naam = nieuweNaam;
      huidigeCount++;
    }
  });
  if (huidigeCount > 0) {
    bewaarStatus();
    renderSpelerlijst();
    renderHoleTabel();
    renderRanglijst();
    renderWedstrijdOverzicht();
    vulSpelerSelects();
  }
  overzicht.push(huidigeCount > 0
    ? `Huidige wedstrijd: ${huidigeCount} speler${huidigeCount === 1 ? "" : "s"} aangepast.`
    : "Huidige wedstrijd: deze speler komt hier niet in voor.");

  // 3. historiek.json van dit seizoen.
  if (map) {
    let historiekCount = 0;
    try {
      const handle = await map.getFileHandle(HISTORIEK_BESTAND);
      const bestand = await handle.getFile();
      const data = JSON.parse(await bestand.text());
      (data.wedstrijden || []).forEach(w => {
        (w.resultaten || []).forEach(r => {
          if ((r.naam || "").trim().toLowerCase() === oudeKey) {
            r.naam = nieuweNaam;
            historiekCount++;
          }
        });
      });
      if (historiekCount > 0) {
        const schrijfbaar = await handle.createWritable();
        await schrijfbaar.write(JSON.stringify(data, null, 2));
        await schrijfbaar.close();
      }
      overzicht.push(historiekCount > 0
        ? `historiek.json: ${historiekCount} resulta${historiekCount === 1 ? "at" : "ten"} aangepast.`
        : "historiek.json: deze speler komt hier niet in voor.");
    } catch (e) {
      overzicht.push("historiek.json bestaat niet of kon niet gelezen worden, overgeslagen.");
    }
  }

  // 4. Alle bewaarde wedstrijdbestanden van dit seizoen.
  if (map) {
    let bestandenCount = 0, spelersInBestanden = 0;
    try {
      const bestanden = await verzamelWedstrijdData(map);
      for (const b of bestanden) {
        let gewijzigd = 0;
        (b.data.spelers || []).forEach(s => {
          if ((s.naam || "").trim().toLowerCase() === oudeKey) {
            s.naam = nieuweNaam;
            gewijzigd++;
          }
        });
        if (gewijzigd > 0) {
          const schrijfbaar = await b.handle.createWritable();
          await schrijfbaar.write(JSON.stringify(b.data, null, 2));
          await schrijfbaar.close();
          bestandenCount++;
          spelersInBestanden += gewijzigd;
        }
      }
      overzicht.push(bestandenCount > 0
        ? `${bestandenCount} bewaard wedstrijdbestand${bestandenCount === 1 ? "" : "en"} aangepast (${spelersInBestanden} keer).`
        : "Geen bewaarde wedstrijdbestanden met deze speler gevonden.");
    } catch (e) {
      overzicht.push("Kon de bewaarde wedstrijdbestanden niet doorlopen: " + e.message);
    }
  }

  renderLedenlijstTabel();
  resultaatZone.innerHTML = `
    <p>"${oudeNaam}" is aangepast naar "<strong>${nieuweNaam}</strong>".</p>
    <ul style="margin:10px 0 0 20px; padding:0;">${overzicht.map(t => `<li>${t}</li>`).join("")}</ul>
    <div class="rij-knoppen" style="margin-top:16px; justify-content:flex-end;">
      <button class="knop" onclick="sluitNaamHernoemModal()">Sluiten</button>
    </div>`;
}

function naamInvoerGewijzigd() {
  const veld = document.getElementById("in-naam");
  const key = veld.value.trim().toLowerCase();
  const gekend = window._bekendeSpelersMap[key];
  if (gekend) {
    document.getElementById("in-geslacht").value = gekend.geslacht;
    updatePreview();
  }
}

function vulTeeSelect() {
  const sel = document.getElementById("in-tee");
  sel.innerHTML = STATE.baan.tees.map(t => `<option value="${t.naam}">${t.naam}</option>`).join("");
}

function updatePreview() {
  const naam = document.getElementById("in-naam").value.trim();
  const geslacht = document.getElementById("in-geslacht").value;
  const baantest = document.getElementById("in-baantest") ? document.getElementById("in-baantest").checked : false;
  const hcp = parseFloat(document.getElementById("in-hcp").value);

  // Reeks-preview naast "Ronde": verschijnt van zodra HCP + geslacht bekend zijn,
  // onafhankelijk van de gekozen tee (die is voor de reeks-indeling niet relevant).
  // Bij "Baantest" is er geen reeks: die speler speelt buiten de competitie.
  const reeksZone = document.getElementById("in-reeks-preview");
  if (reeksZone) {
    if (baantest) {
      reeksZone.innerHTML = `<span class="badge baantest">Baantest (buiten competitie)</span>`;
    } else if (!isNaN(hcp)) {
      const catVoorReeks = categorieVoorSpeler(hcp, geslacht);
      reeksZone.innerHTML = catVoorReeks
        ? `<span class="badge">${catVoorReeks.naam} ${geslacht === "M" ? "Heren" : "Dames"}</span>`
        : `<span style="color:var(--text-muted);">geen reeks gevonden</span>`;
    } else {
      reeksZone.innerHTML = `<span style="color:var(--text-muted);">-</span>`;
    }
  }

  if (!isNaN(hcp) && !window._teeHandmatigGewijzigd) {
    const voorgesteldeTee = bepaalDefaultTee(hcp, geslacht);
    if (voorgesteldeTee) document.getElementById("in-tee").value = voorgesteldeTee;
  }
  const tee = document.getElementById("in-tee").value;
  const ronde = document.getElementById("in-ronde").value;
  const zone = document.getElementById("preview-cat");

  if (baantest) {
    const norm = baantestNorm(geslacht, ronde);
    zone.className = "melding ok";
    zone.style.display = "block";
    zone.innerHTML = norm
      ? `Baantest: speelt zonder handicap index, dus geen course handicap. Slaagt bij een AGS van maximaal <strong>${norm.max_ags}</strong> (${geslacht === "M" ? "heren" : "dames"}, ${rondeLabel(ronde)}).`
      : `Baantest: speelt zonder handicap index. Geen norm gevonden voor ${geslacht === "M" ? "heren" : "dames"} / ${rondeLabel(ronde)} - voeg die toe bij Instellingen &gt; Baantest-normen.`;
    return;
  }

  if (isNaN(hcp) || !tee) { zone.style.display = "none"; return; }
  const ch = berekenCourseHandicap(hcp, tee, geslacht, ronde);
  if (ch === null) {
    zone.className = "melding fout";
    zone.style.display = "block";
    zone.textContent = `Voor tee "${tee}" is geen rating beschikbaar voor ${geslacht === "M" ? "heren" : "dames"}. Kies een andere tee.`;
    return;
  }
  const cat = categorieVoorSpeler(hcp, geslacht);
  const catLabel = cat ? `${cat.naam} ${geslacht === "M" ? "Heren" : "Dames"}` : null;
  zone.className = "melding ok";
  zone.style.display = "block";
  zone.innerHTML = catLabel
    ? `Course HCP: <strong>${ch}</strong>. Speelt in reeks: <span class="badge">${catLabel}</span>`
    : `Course HCP: <strong>${ch}</strong>. Geen reeks gevonden voor deze handicap index, controleer categorieen.json.`;
}

/* Aan/uit-schakelen van "Baantest" bij Speler toevoegen: schakelt het HCP-veld uit (er is
   geen handicap index nodig) en ververst de preview. */
function baantestToggle() {
  const checked = document.getElementById("in-baantest").checked;
  const hcpVeld = document.getElementById("in-hcp");
  hcpVeld.disabled = checked;
  if (checked) {
    hcpVeld.value = "";
    // Baantest-spelers spelen bij deze club altijd van Roze (kortste tee).
    if (STATE.baan.tees.some(t => t.naam === "Roze")) {
      document.getElementById("in-tee").value = "Roze";
      window._teeHandmatigGewijzigd = true;
    }
  }
  updatePreview();
}

function voegSpelerToe() {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, spelers kunnen niet meer toegevoegd of aangepast worden.", "fout"); return; }
  const naam = document.getElementById("in-naam").value.trim();
  const geslacht = document.getElementById("in-geslacht").value;
  const baantest = document.getElementById("in-baantest").checked;
  const hcp = parseFloat(document.getElementById("in-hcp").value);
  const tee = document.getElementById("in-tee").value;
  const ronde = document.getElementById("in-ronde").value;

  if (!naam) { toonMelding("Geef een naam op.", "fout"); return; }

  // Baantest-spelers hebben geen handicap index (dat is net de bedoeling): geen course
  // handicap-berekening, geen reeks. Hun scorekaart wordt met courseHandicap 0 bewaard, zodat
  // spelerScoreData() automatisch de AGS berekent met gewoon double bogey als plafond (geen
  // ontvangen slagen) - exact wat de baantest-norm verwacht.
  let hcpIndex = null, ch = 0, cat = null;
  if (!baantest) {
    if (isNaN(hcp)) { toonMelding("Geef een geldige handicap index op (of vink \"Baantest\" aan).", "fout"); return; }
    ch = berekenCourseHandicap(hcp, tee, geslacht, ronde);
    if (ch === null) { toonMelding(`Geen rating beschikbaar voor deze tee/geslacht combinatie.`, "fout"); return; }
    cat = categorieVoorSpeler(hcp, geslacht);
    hcpIndex = hcp;
  }

  if (window._bewerkSpelerId) {
    // Bestaande speler wijzigen in plaats van een nieuwe toevoegen.
    const speler = STATE.spelers.find(s => s.id === window._bewerkSpelerId);
    if (!speler) { annuleerSpelerBewerken(); return; }
    const rondeGewijzigd = speler.ronde !== ronde;
    speler.naam = naam;
    speler.geslacht = geslacht;
    speler.baantest = baantest;
    speler.hcpIndex = hcpIndex;
    speler.tee = tee;
    speler.ronde = ronde;
    speler.categorieId = baantest ? null : (cat ? cat.id : null);
    speler.courseHandicap = ch;

    const resultaatTekst = baantest ? "(baantest)" : `(Course HCP ${ch})`;
    if (rondeGewijzigd) {
      // Het aantal holes verschilt tussen 9 en 18 holes, dus eerder ingevoerde scores
      // sluiten niet meer aan op de holes. We beginnen dan met een lege scorekaart.
      STATE.scores[speler.id] = { holes: new Array(holesVoorRonde(ronde).length).fill(null), bevestigd: false };
      toonMelding(`${naam} aangepast ${resultaatTekst}. Let op: door de gewijzigde ronde is de scorekaart leeggemaakt.`, "ok");
    } else {
      toonMelding(`${naam} aangepast ${resultaatTekst}.`, "ok");
    }
    bewaarStatus();
    ledenlijstAanvullen(naam, geslacht);
    annuleerSpelerBewerken();
    renderSpelerlijst();
    renderHoleTabel();
    renderRanglijst();
    return;
  }

  const speler = {
    id: "s_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    naam, geslacht, baantest, hcpIndex, tee, ronde,
    categorieId: baantest ? null : (cat ? cat.id : null),
    courseHandicap: ch
  };
  STATE.spelers.push(speler);
  STATE.scores[speler.id] = { holes: new Array(holesVoorRonde(ronde).length).fill(null), bevestigd: false };
  bewaarStatus();
  ledenlijstAanvullen(naam, geslacht);

  document.getElementById("in-naam").value = "";
  document.getElementById("in-hcp").value = "";
  document.getElementById("in-baantest").checked = false;
  document.getElementById("in-hcp").disabled = false;
  document.getElementById("preview-cat").style.display = "none";
  window._teeHandmatigGewijzigd = false;

  renderSpelerlijst();
  toonMelding(baantest ? `${naam} toegevoegd voor de baantest.` : `${naam} toegevoegd (Course HCP ${ch}).`, "ok");
}

/* Vult het formulier bovenaan met de gegevens van een bestaande speler, zodat je een
   foutieve invoer (bv. verkeerde HCP of tee) kan corrigeren zonder de speler te moeten
   verwijderen en opnieuw toe te voegen. */
function bewerkSpeler(id) {
  const speler = STATE.spelers.find(s => s.id === id);
  if (!speler) return;

  window._bewerkSpelerId = id;
  document.getElementById("in-naam").value = speler.naam;
  document.getElementById("in-geslacht").value = speler.geslacht;
  document.getElementById("in-baantest").checked = !!speler.baantest;
  document.getElementById("in-hcp").disabled = !!speler.baantest;
  document.getElementById("in-hcp").value = speler.baantest ? "" : speler.hcpIndex;
  document.getElementById("in-tee").value = speler.tee;
  document.getElementById("in-ronde").value = speler.ronde;
  window._teeHandmatigGewijzigd = true; // tee niet overschrijven met een automatisch voorstel

  document.getElementById("spelerform-titel").textContent = `Speler aanpassen: ${speler.naam}`;
  document.getElementById("spelerform-bewerk-melding").style.display = "block";
  document.getElementById("spelerform-knop").textContent = "Wijzigingen opslaan";
  document.getElementById("spelerform-annuleer").style.display = "inline-block";

  updatePreview();
  document.getElementById("paneel-spelers").scrollIntoView({ behavior: "smooth", block: "start" });
}

function annuleerSpelerBewerken() {
  window._bewerkSpelerId = null;
  window._teeHandmatigGewijzigd = false;
  document.getElementById("in-naam").value = "";
  document.getElementById("in-hcp").value = "";
  document.getElementById("in-baantest").checked = false;
  document.getElementById("in-hcp").disabled = false;
  document.getElementById("preview-cat").style.display = "none";
  document.getElementById("spelerform-titel").textContent = "Nieuwe speler toevoegen";
  document.getElementById("spelerform-bewerk-melding").style.display = "none";
  document.getElementById("spelerform-knop").textContent = "Speler toevoegen";
  document.getElementById("spelerform-annuleer").style.display = "none";
}

function verwijderSpeler(id) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, spelers kunnen niet meer verwijderd worden.", "fout"); return; }
  const speler = STATE.spelers.find(s => s.id === id);
  if (!speler) return;
  if (!confirm(`Weet je zeker dat je ${speler.naam} wil verwijderen? De ingevulde score van deze speler gaat dan ook verloren. Dit kan niet ongedaan gemaakt worden.`)) return;
  if (window._bewerkSpelerId === id) annuleerSpelerBewerken();
  STATE.spelers = STATE.spelers.filter(s => s.id !== id);
  delete STATE.scores[id];
  bewaarStatus();
  renderSpelerlijst();
  renderHoleTabel();
  renderRanglijst();
}

window._spelersGroeperen = false;

/* Zoekterm voor het live filteren van de deelnemerslijst (zie spelerZoekGewijzigd/renderSpelerlijst).
   Enkel een schermweergave-keuze, verandert niets aan de gegevens en wordt niet bewaard. */
window._spelerZoekTerm = "";

/* Wordt aangeroepen bij elke aanpassing van het zoekveld naast "Deelnemers". Filtert de
   getoonde lijst op naam (niet hoofdlettergevoelig), de teller boven de lijst blijft het
   totaal aantal deelnemers tonen. */
function spelerZoekGewijzigd(waarde) {
  window._spelerZoekTerm = waarde;
  renderSpelerlijst();
}

/* Bouwt de markup voor 1 speler-rij, herbruikt in zowel de platte lijst als de gegroepeerde
   weergave (zie renderSpelerlijst). */
function spelerItemHtml(s) {
  // Zolang de wedstrijd afgesloten is, kunnen spelers niet meer aangepast of verwijderd
  // worden: de knoppen daarvoor worden dan niet getoond (de klik op de rij zelf blijft wel
  // werken, dat opent enkel een read-only scorekaart).
  const beheerKnoppenHtml = STATE.afgesloten ? "" : `
          <button class="knop secundair" onclick="event.stopPropagation(); bewerkSpeler('${s.id}')">Aanpassen</button>
          <button class="knop secundair" onclick="event.stopPropagation(); verwijderSpeler('${s.id}')">Verwijderen</button>`;
  if (s.baantest) {
    return `
      <div class="spelerlijst-item" onclick="gaNaarScoreVoorSpeler('${s.id}')" title="Klik om de score van ${s.naam} in te voeren">
        <div>
          <div class="naam">${s.naam}</div>
          <div class="details">${s.geslacht === "M" ? "Heer" : "Dame"} · baantest (zonder HCP) · tee ${s.tee} · ${rondeLabel(s.ronde)}</div>
        </div>
        <div class="rij-knoppen">
          <span class="badge baantest">Baantest</span>
          ${beheerKnoppenHtml}
        </div>
      </div>`;
  }
  const cat = STATE.categorieen.find(c => c.id === s.categorieId);
  const catLabel = cat ? `${cat.naam} ${cat.geslacht === "M" ? "Heren" : "Dames"}` : "geen categorie";
  return `
      <div class="spelerlijst-item" onclick="gaNaarScoreVoorSpeler('${s.id}')" title="Klik om de score van ${s.naam} in te voeren">
        <div>
          <div class="naam">${s.naam}</div>
          <div class="details">${s.geslacht === "M" ? "Heer" : "Dame"} · HCP ${s.hcpIndex} · tee ${s.tee} · ${rondeLabel(s.ronde)} · Course HCP ${s.courseHandicap}</div>
        </div>
        <div class="rij-knoppen">
          <span class="badge">${catLabel}</span>
          ${beheerKnoppenHtml}
        </div>
      </div>`;
}

/* Zet "Groeperen per reeks" aan/uit voor de Spelers-tab. Enkel een schermweergave-keuze,
   verandert niets aan de gegevens zelf en wordt niet bewaard (staat bij elke herlaad weer uit). */
function toggleSpelersGroeperen(aangevinkt) {
  window._spelersGroeperen = aangevinkt;
  renderSpelerlijst();
}

/* Toont de deelnemerslijst. Standaard plat, in de volgorde waarin spelers toegevoegd zijn.
   Met "Groeperen per reeks" aangevinkt: 1 blok per reeks (in de volgorde van STATE.categorieen,
   dus dezelfde volgorde als in Instellingen), spelers zonder (herkende) categorie samen in een
   laatste blok. */
function renderSpelerlijst() {
  // Naam-suggesties opnieuw filteren telkens de spelerslijst verandert (toevoegen, verwijderen,
  // aanpassen, hernoemen, ...), zodat al toegevoegde spelers meteen uit de autocomplete
  // verdwijnen (zie vulSpelersuggestiesUI).
  vulSpelersuggestiesUI();
  const zone = document.getElementById("spelerlijst");
  document.getElementById("aantal-spelers").textContent = STATE.spelers.length;
  if (STATE.spelers.length === 0) {
    zone.innerHTML = `<p class="uitleg">Nog geen spelers toegevoegd.</p>`;
    return;
  }

  const zoekterm = (window._spelerZoekTerm || "").trim().toLowerCase();
  const lijst = zoekterm ? STATE.spelers.filter(s => s.naam.toLowerCase().includes(zoekterm)) : STATE.spelers;

  if (lijst.length === 0) {
    zone.innerHTML = `<p class="uitleg">Geen speler gevonden met die naam.</p>`;
    return;
  }

  if (!window._spelersGroeperen) {
    zone.innerHTML = lijst.map(spelerItemHtml).join("");
    return;
  }

  const groepen = STATE.categorieen
    .map(c => ({ cat: c, spelers: lijst.filter(s => !s.baantest && s.categorieId === c.id) }))
    .filter(g => g.spelers.length > 0);
  const baantestSpelers = lijst.filter(s => s.baantest);
  if (baantestSpelers.length > 0) groepen.push({ cat: null, baantest: true, spelers: baantestSpelers });
  const zonderCat = lijst.filter(s => !s.baantest && !STATE.categorieen.some(c => c.id === s.categorieId));
  if (zonderCat.length > 0) groepen.push({ cat: null, spelers: zonderCat });

  zone.innerHTML = groepen.map(g => `
      <div class="groep-kop">${g.baantest ? "Baantest (buiten competitie)" : (g.cat ? `${g.cat.naam} ${g.cat.geslacht === "M" ? "Heren" : "Dames"}` : "Geen categorie")} <span class="groep-aantal">(${g.spelers.length})</span></div>
      ${g.spelers.map(spelerItemHtml).join("")}`
  ).join("");
}

/* ===================== UI: wedstrijdoverzicht (flight-lijst) ===================== */
/* Overzicht van de volledige wedstrijd, gegroepeerd per flight (in volgorde van flight-nummer,
   en binnen een flight op startuur/naam), met alle info die nodig is om de wedstrijd op de
   baan te laten verlopen: geslacht, HCP, tee, front/back, reeks en startuur. Puur een
   leesoverzicht, geen invoer hier. */
function renderWedstrijdOverzicht() {
  const zone = document.getElementById("overzicht-zone");
  if (!zone) return;
  const spelers = STATE.spelers || [];

  // Selecties van spelers die niet meer bestaan (verwijderd, nieuwe wedstrijd/seizoen) opkuisen.
  const geldigeIds = new Set(spelers.map(s => s.id));
  Array.from(window._overzichtGeselecteerd).forEach(id => { if (!geldigeIds.has(id)) window._overzichtGeselecteerd.delete(id); });

  resetFlightToewijzenDefaults();

  if (spelers.length === 0) {
    zone.innerHTML = `<p class="uitleg">Nog geen spelers toegevoegd.</p>`;
    const sorteerKnopLeeg = document.getElementById("overzicht-sorteer-knop");
    if (sorteerKnopLeeg) sorteerKnopLeeg.disabled = true;
    return;
  }

  const magAanpassen = !STATE.afgesloten;
  const disabledAttr = magAanpassen ? "" : "disabled";

  // Score volledig ingevuld (alle holes hebben een waarde)? Zelfde maatstaf als elders
  // (vulSpelerSelects/volgendeOnbevestigdeSpelerId) - "ingevuld", niet per se "bevestigd".
  const isCompleet = s => spelerScoreData(s).compleet;

  const rijHtml = (s, modus, vergrendeld) => {
    const cat = STATE.categorieen.find(c => c.id === s.categorieId);
    const reeksHtml = s.baantest
      ? `<span class="badge baantest">Baantest</span>`
      : (cat ? `${cat.naam} ${cat.geslacht === "M" ? "Heren" : "Dames"}` : "-");
    const hcpTekst = s.baantest ? "Baantest" : (s.hcpIndex ?? "-");
    const courseHcpTekst = s.baantest ? "-" : (s.courseHandicap ?? "-");
    const opmerkingKnop = magAanpassen
      ? `<button type="button" class="knop-icoon${s.opmerking ? " opmerking-actief" : ""}" title="${s.opmerking ? "Opmerking: " + s.opmerking : "Opmerking toevoegen"}" aria-label="Opmerking" onclick="openOpmerkingModal('${s.id}')">${OPMERKING_ICOON_SVG}</button>`
      : (s.opmerking ? `<span class="badge" title="${s.opmerking}">Opmerking</span>` : "");
    let eersteKolom, extraKolommen;
    if (modus === "flight") {
      // Geen aanvink-checkbox meer hier (had geen echt nut meer sinds "Flight aanpassen" en de
      // ×-knop): toont in de plaats of de score van deze speler al volledig ingevuld is.
      eersteKolom = `<td style="text-align:center;">${isCompleet(s) ? `<span style="color:var(--accent); font-weight:700;" title="Score volledig ingevuld">✓</span>` : `<span style="color:var(--text-muted);">-</span>`}</td>`;
      const magDezeFlightAanpassen = magAanpassen && !vergrendeld;
      extraKolommen = `<td>${s.startuur || "-"}</td><td>${opmerkingKnop}</td><td>${magDezeFlightAanpassen ? `<button type="button" class="knop-icoon" title="Uit deze flight halen" aria-label="Uit deze flight halen" onclick="haalUitFlight('${s.id}')">&times;</button>` : ""}</td>`;
    } else {
      const aangevinkt = window._overzichtGeselecteerd.has(s.id) ? "checked" : "";
      eersteKolom = `<td><input type="checkbox" class="overzicht-check" ${aangevinkt} ${disabledAttr} onchange="overzichtCheckboxGewijzigd('${s.id}', this.checked)"></td>`;
      extraKolommen = `<td>${formatUurVanTijdstip(spelerAangemaaktOp(s))}</td>`;
    }
    return `
      <tr>
        ${eersteKolom}
        <td><span class="naam-klikbaar" onclick="gaNaarScoreVoorSpeler('${s.id}')" title="Klik om de score van ${s.naam} in te voeren">${s.naam}</span></td>
        <td>${s.geslacht === "M" ? "Heer" : "Dame"}</td>
        <td>${hcpTekst}</td>
        <td>${courseHcpTekst}</td>
        <td>${s.tee || "-"}</td>
        <td>${rondeFrontBackLabel(s.ronde)}</td>
        <td>${reeksHtml}</td>
        ${extraKolommen}
      </tr>`;
  };

  const kolomkopBasis = `<th style="width:30px;"></th><th>Naam</th><th style="width:70px;">Geslacht</th><th style="width:70px;">HCP</th><th style="width:80px;">Course HCP</th><th style="width:70px;">Tee</th><th style="width:110px;">Ronde</th><th>Reeks</th>`;

  const sorteerPijl = veld => {
    if (window._zonderFlightSorteerVeld !== veld) return "";
    return window._zonderFlightSorteerRichting === "desc" ? " ▼" : " ▲";
  };
  const zonderFlightKop = `<th style="width:30px;"></th>` +
    `<th style="cursor:pointer;" onclick="wisselZonderFlightSortering('naam')" title="Sorteer op naam">Naam${sorteerPijl("naam")}</th>` +
    `<th style="width:70px;">Geslacht</th>` +
    `<th style="width:70px; cursor:pointer;" onclick="wisselZonderFlightSortering('hcp')" title="Sorteer op handicap">HCP${sorteerPijl("hcp")}</th>` +
    `<th style="width:80px;">Course HCP</th>` +
    `<th style="width:70px;">Tee</th><th style="width:110px;">Ronde</th><th>Reeks</th>` +
    `<th style="width:120px; cursor:pointer;" onclick="wisselZonderFlightSortering('tijdstip')" title="Sorteer op tijdstip van inschrijving">Ingeschreven${sorteerPijl("tijdstip")}</th>`;

  const zonderFlightVergelijk = (a, b) => {
    const veld = window._zonderFlightSorteerVeld;
    let cmp;
    if (veld === "naam") {
      cmp = a.naam.localeCompare(b.naam);
    } else if (veld === "hcp") {
      const ah = a.baantest ? Infinity : (a.hcpIndex ?? Infinity);
      const bh = b.baantest ? Infinity : (b.hcpIndex ?? Infinity);
      cmp = ah - bh;
    } else {
      cmp = spelerAangemaaktOp(a) - spelerAangemaaktOp(b);
    }
    return window._zonderFlightSorteerRichting === "desc" ? -cmp : cmp;
  };

  const zonderFlight = spelers.filter(s => typeof s.flight !== "number" || isNaN(s.flight))
    .slice().sort(zonderFlightVergelijk);

  const perFlight = {};
  spelers.forEach(s => {
    if (typeof s.flight === "number" && !isNaN(s.flight)) (perFlight[s.flight] = perFlight[s.flight] || []).push(s);
  });
  const flightNummers = Object.keys(perFlight).map(Number)
    .sort((a, b) => window._overzichtFlightVolgorde === "desc" ? b - a : a - b);

  const sorteerKnop = document.getElementById("overzicht-sorteer-knop");
  if (sorteerKnop) {
    sorteerKnop.textContent = window._overzichtFlightVolgorde === "desc"
      ? "Flights: hoog naar laag"
      : "Flights: laag naar hoog";
    sorteerKnop.disabled = flightNummers.length < 2;
  }

  let html = `<div class="groep-kop">Nog geen flight <span class="groep-aantal">(${zonderFlight.length} speler${zonderFlight.length === 1 ? "" : "s"})</span></div>`;
  html += zonderFlight.length === 0
    ? `<p class="uitleg">Alle spelers hebben een flight.</p>`
    : `<table class="lijst"><tr>${zonderFlightKop}</tr>${zonderFlight.map(s => rijHtml(s, "zonder")).join("")}</table>`;

  flightNummers.forEach(fl => {
    const groep = perFlight[fl].slice().sort((a, b) =>
      (a.startuur || "").localeCompare(b.startuur || "") || a.naam.localeCompare(b.naam));
    // Een flight is "vergrendeld" zodra iedereen erin zijn score volledig heeft ingevuld: er
    // valt dan niks meer aan te passen (startuur/nummer/front-back/eruit halen), enkel nog om
    // per ongeluk dingen door elkaar te halen. Puur visueel/gedragsmatig - de scores zelf blijven
    // gewoon aanpasbaar via Score invoeren (die heeft haar eigen "bevestigd"-vergrendeling).
    const vergrendeld = isFlightVergrendeld(fl);
    const magDezeFlightAanpassen = magAanpassen && !vergrendeld;
    const kopStijl = vergrendeld
      ? `margin-top:16px; background: var(--accent-bg); border-color: var(--accent); color: var(--accent);`
      : `margin-top:16px;${magDezeFlightAanpassen ? " cursor:pointer;" : ""}`;
    const kopAttr = magDezeFlightAanpassen
      ? ` style="${kopStijl}" onclick="openFlightBewerkenModal(${fl})" title="Klik om deze flight aan te passen (startuur, nummer of front/back)"`
      : ` style="${kopStijl}"`;
    const kopKnop = magDezeFlightAanpassen
      ? ` <button type="button" class="knop-icoon" style="margin-left:6px;" onclick="event.stopPropagation(); openFlightBewerkenModal(${fl})" title="Flight aanpassen" aria-label="Flight aanpassen">${AANPAS_ICOON_SVG}</button>`
      : "";
    const vergrendeldLabel = vergrendeld ? ` <span class="badge" style="background:#fff;">✓ Iedereen ingevuld - vergrendeld</span>` : "";
    html += `
      <div class="groep-kop"${kopAttr}>Flight ${fl} <span class="groep-aantal">(${groep.length} speler${groep.length === 1 ? "" : "s"})</span>${vergrendeldLabel}${kopKnop}</div>
      <table class="lijst">
        <tr>${kolomkopBasis}<th style="width:80px;">Startuur</th><th style="width:40px;"></th><th style="width:40px;"></th></tr>
        ${groep.map(s => rijHtml(s, "flight", vergrendeld)).join("")}
      </table>`;
  });

  zone.innerHTML = html;
}

/* Navigeert naar Score invoeren voor 1 specifieke speler. Gebruikt vanuit de Spelerslijst en
   vanuit de Ranglijst ("aanpassen"). forceerId zorgt dat vulSpelerSelects() die speler toont
   ook al is die bevestigd (anders zou de select-optie er niet meer staan om te selecteren). */
function gaNaarScoreVoorSpeler(spelerId) {
  toonPaneel("score");
  vulSpelerSelects(spelerId);
  const sel = document.getElementById("score-speler");
  sel.value = spelerId;
  scoreSpelerGewijzigd();
}

/* ===================== UI: score invoeren (hole-tabel + quickscore in 1) ===================== */

/* Geeft de speler-id van de eerstvolgende niet-bevestigde speler (onvolledige kaarten eerst,
   dan volledige-maar-nog-niet-bevestigde), in dezelfde volgorde als de keuzelijst hieronder.
   Gebruikt bij het heropenen van "Score invoeren" om niet te blijven hangen op een speler die
   je net al bevestigd hebt (zie toonPaneel). Geeft null als iedereen al bevestigd is. */
function volgendeOnbevestigdeSpelerId() {
  const kandidaten = STATE.spelers
    .filter(s => !(STATE.scores[s.id] && STATE.scores[s.id].bevestigd))
    .map(s => {
      const totaal = holesVoorRonde(s.ronde).length;
      const gevuld = ((STATE.scores[s.id] && STATE.scores[s.id].holes) || []).filter(g => g !== null && g !== undefined).length;
      return { speler: s, compleet: totaal > 0 && gevuld === totaal };
    });
  kandidaten.sort((a, b) => (a.compleet === b.compleet) ? 0 : (a.compleet ? 1 : -1));
  return kandidaten.length > 0 ? kandidaten[0].speler.id : null;
}

/* Bevestigde scorekaarten (zie bevestigScore) verdwijnen standaard uit deze lijst - ze zijn
   "klaar" en staan niet meer in de weg tijdens het invoeren. De op dit moment geselecteerde
   speler (of forceerId, bv. vanuit de Ranglijst) blijft wel zichtbaar ook al is die bevestigd,
   anders zou je hem niet meer kunnen aanpassen zonder eerst iemand anders te kiezen. Zodra je
   naar een andere speler overschakelt, verdwijnt hij effectief uit de lijst. Van de nog te
   tonen spelers blijft de toevoegvolgorde behouden, enkel een volledig (maar nog niet
   bevestigde) ingevulde kaart zakt naar onder. */
function vulSpelerSelects(forceerId) {
  const sel = document.getElementById("score-speler");
  const huidige = sel.value;
  const toonOokId = forceerId || huidige;

  const metStatus = STATE.spelers
    .filter(s => !(STATE.scores[s.id] && STATE.scores[s.id].bevestigd) || s.id === toonOokId)
    .map(s => {
      const totaal = holesVoorRonde(s.ronde).length;
      const scoreData = STATE.scores[s.id] || {};
      const scoreArr = scoreData.holes || [];
      const gevuld = scoreArr.filter(g => g !== null && g !== undefined).length;
      const compleet = totaal > 0 && gevuld === totaal;
      const bevestigd = !!scoreData.bevestigd;
      return { speler: s, compleet, bevestigd };
    });
  metStatus.sort((a, b) => (a.compleet === b.compleet) ? 0 : (a.compleet ? 1 : -1));

  sel.innerHTML = metStatus.map(({ speler, compleet, bevestigd }) => {
    const status = bevestigd ? " (bevestigd)" : (compleet ? " (volledig ingevuld)" : "");
    const baantestLabel = speler.baantest ? " · baantest" : "";
    return `<option value="${speler.id}"${(compleet || bevestigd) ? ' style="color: var(--text-muted);"' : ""}>${speler.naam}${baantestLabel}${status}</option>`;
  }).join("");

  if (metStatus.some(({ speler }) => speler.id === huidige)) sel.value = huidige;
  else if (forceerId && metStatus.some(({ speler }) => speler.id === forceerId)) sel.value = forceerId;
}

function scoreSpelerGewijzigd() {
  document.getElementById("quick-input").value = "";
  document.getElementById("quick-fout").style.display = "none";
  renderHoleTabel();

  const speler = huidigeScoreSpeler();
  if (speler && speler.opmerking) toonOpmerkingWaarschuwing(speler.naam, speler.opmerking);
}

/* Wanneer je op de "Speler"-lijst klikt om iemand te kiezen, springt de selectie voortaan
   steeds naar de bovenste speler in de lijst (dat is, dankzij de sortering in
   vulSpelerSelects(), altijd de eerstvolgende die nog niet compleet/bevestigd is) - zo begin je
   telkens bovenaan zonder in de lijst te moeten scrollen. Enkel als je toevallig al op die
   bovenste speler stond niets doen, anders zou een simpele herklik het quickscore-veld
   onnodig leegmaken (zie scoreSpelerGewijzigd). */
function scoreSpelerFocusEersteBijOpenen() {
  const sel = document.getElementById("score-speler");
  if (sel.options.length === 0 || sel.selectedIndex === 0) return;
  sel.selectedIndex = 0;
  scoreSpelerGewijzigd();
}

function huidigeScoreSpeler() {
  const spelerId = document.getElementById("score-speler").value;
  return STATE.spelers.find(s => s.id === spelerId);
}

function renderSamenvatting(speler, data) {
  const zone = document.getElementById("score-samenvatting-zone");
  if (!speler) { zone.innerHTML = ""; return; }

  // Baantest-spelers krijgen geen Bruto/Netto/ANS/Stableford (niet zinvol zonder handicap),
  // enkel de AGS met of ze daarmee de baantest-norm halen.
  if (speler.baantest) {
    const res = baantestResultaat(speler);
    if (res.status === "onvolledig") {
      zone.innerHTML = `<div class="melding" style="background:var(--bg); color:var(--text-muted);">${res.ingevuld}/${res.totaal} holes ingevuld. AGS wordt pas berekend als de kaart volledig is.</div>`;
      return;
    }
    if (res.status === "geen_norm") {
      zone.innerHTML = `<div class="melding fout">AGS <strong>${res.ags}</strong>. Geen baantest-norm gevonden voor ${speler.geslacht === "M" ? "heren" : "dames"} / ${rondeLabel(speler.ronde)} - voeg die toe bij Instellingen &gt; Baantest-normen.</div>`;
      return;
    }
    const geslaagd = res.status === "geslaagd";
    zone.innerHTML = `
      <div class="melding ${geslaagd ? "ok" : "fout"}" style="display:flex; gap:20px; flex-wrap:wrap; align-items:center;">
        <span><strong>AGS</strong> ${res.ags}</span>
        <span>Norm: maximaal ${res.norm.max_ags}</span>
        <span><strong>${geslaagd ? "Geslaagd voor de baantest" : "Nog niet geslaagd"}</strong></span>
      </div>`;
    return;
  }

  const label = data.compleet ? `volledig (${data.ingevuld}/${data.totaal} holes)` : `${data.ingevuld}/${data.totaal} holes ingevuld`;
  const ans9 = ansLaatsteHoles(speler, 9);
  const ans6 = ansLaatsteHoles(speler, 6);
  const ans3 = ansLaatsteHoles(speler, 3);
  const countbackHtml = [
    ans9 !== null ? `<span><strong>ANS-9</strong> ${ans9}</span>` : "",
    ans6 !== null ? `<span><strong>ANS-6</strong> ${ans6}</span>` : "",
    ans3 !== null ? `<span><strong>ANS-3</strong> ${ans3}</span>` : "",
  ].join("");
  zone.innerHTML = `
    <div class="melding ok" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px;">
      <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:center;">
        <span><strong>Bruto</strong> ${data.bruto}</span>
        <span><strong>AGS</strong> ${data.ags}</span>
        <span><strong>Netto</strong> ${data.netto}</span>
        <span><strong>ANS</strong> ${data.ans}</span>
        <span><strong>Stableford</strong> ${data.stableford}</span>
        <span style="color:var(--text-muted); font-weight:400;">${label}</span>
      </div>
      ${countbackHtml ? `<div style="display:flex; gap:20px; flex-wrap:wrap; align-items:center;">${countbackHtml}</div>` : ""}
    </div>`;
}

function renderSpelerInfo(speler) {
  const zone = document.getElementById("speler-info-zone");
  if (!speler) { zone.innerHTML = ""; return; }
  if (speler.baantest) {
    zone.innerHTML = `
      <div class="melding" style="display:flex; gap:20px; flex-wrap:wrap; align-items:center; background:var(--bg); color:var(--text-muted);">
        <span>${speler.geslacht === "M" ? "Heer" : "Dame"}</span>
        <span><span class="badge baantest">Baantest</span> speelt zonder handicap index</span>
        <span>Tee <strong style="color:var(--text);">${speler.tee}</strong></span>
        ${rondeBadgeHtml(speler.ronde)}
      </div>`;
    return;
  }
  const cat = STATE.categorieen.find(c => c.id === speler.categorieId);
  const reeksLabel = cat ? `${cat.naam} ${speler.geslacht === "M" ? "Heren" : "Dames"}` : "-";
  zone.innerHTML = `
    <div class="melding" style="display:flex; gap:20px; flex-wrap:wrap; align-items:center; background:var(--bg); color:var(--text-muted);">
      <span>${speler.geslacht === "M" ? "Heer" : "Dame"}</span>
      <span>HCP <strong style="color:var(--text);">${speler.hcpIndex}</strong></span>
      <span>Course HCP <strong style="color:var(--text);">${speler.courseHandicap}</strong></span>
      <span>Tee <strong style="color:var(--text);">${speler.tee}</strong></span>
      ${rondeBadgeHtml(speler.ronde)}
      <span>Reeks <strong style="color:var(--text);">${reeksLabel}</strong></span>
    </div>`;
}

function renderHoleTabel() {
  vulSpelerSelects();

  // Duidelijk maken dat er niemand meer te scoren valt, in plaats van gewoon stil de laatst
  // bevestigde speler te blijven tonen (zag er anders uit als een bug: "waarom blijft die
  // speler daar staan?" - zie ook volgendeOnbevestigdeSpelerId() in toonPaneel()).
  const iedereenZone = document.getElementById("iedereen-bevestigd-zone");
  if (iedereenZone) {
    const iedereenBevestigd = STATE.spelers.length > 0 && volgendeOnbevestigdeSpelerId() === null;
    iedereenZone.innerHTML = iedereenBevestigd
      ? `<p class="uitleg">Iedereen heeft al een bevestigde score. Niemand meer om te scoren - bekijk het resultaat bij de Ranglijst.</p>`
      : "";
  }

  const zone = document.getElementById("invoer-hole-zone");
  const speler = huidigeScoreSpeler();
  renderSpelerInfo(speler);
  if (!speler) { zone.innerHTML = `<p class="uitleg">Voeg eerst een speler toe.</p>`; renderSamenvatting(null, null); renderBevestigZone(null, null); return; }
  const holes = holesVoorRonde(speler.ronde);
  const strokes = slagenPerHole(speler.courseHandicap, holes, speler.geslacht);
  const scoreArr = STATE.scores[speler.id].holes;
  const bevestigd = !!STATE.scores[speler.id].bevestigd || STATE.afgesloten;
  const data = spelerScoreData(speler);

  const parTotaal = holes.reduce((sum, h) => sum + h.par, 0);
  const slagTotaal = strokes.reduce((sum, s) => sum + s, 0);

  const th = holes.map(h => `<th>${h.nummer}</th>`).join("") + `<th class="totaal">Totaal</th>`;
  const parRij = holes.map(h => `<td>${h.par}</td>`).join("") + `<td class="totaal">${parTotaal}</td>`;
  const slagRij = strokes.map(st => `<td>${st !== 0 ? st : ""}</td>`).join("") + `<td class="totaal">${slagTotaal}</td>`;
  const scoreRij = holes.map((h, i) => `<td><input type="number" min="1" max="15" value="${scoreArr[i] ?? ""}" data-idx="${i}" ${bevestigd ? "disabled" : ""} onchange="setHoleScore('${speler.id}', ${i}, this.value)"></td>`).join("") + `<td class="totaal">${data.bruto || ""}</td>`;

  const nettoRij = holes.map((h, i) => {
    const g = scoreArr[i];
    return `<td>${g == null ? "" : (g - strokes[i])}</td>`;
  }).join("") + `<td class="totaal">${data.netto || ""}</td>`;

  const stablefordRij = holes.map((h, i) => {
    const g = scoreArr[i];
    if (g == null) return `<td></td>`;
    const n = g - strokes[i];
    return `<td>${Math.max(0, 2 - (n - h.par))}</td>`;
  }).join("") + `<td class="totaal">${data.stableford || ""}</td>`;

  const agsRij = holes.map((h, i) => {
    const g = scoreArr[i];
    if (g == null) return `<td></td>`;
    const cap = Math.max(1, h.par + 2 + strokes[i]);
    return `<td>${Math.min(g, cap)}</td>`;
  }).join("") + `<td class="totaal">${data.ags || ""}</td>`;

  const ansRij = holes.map((h, i) => {
    const g = scoreArr[i];
    if (g == null) return `<td></td>`;
    const cap = Math.max(1, h.par + 2 + strokes[i]);
    return `<td>${Math.min(g, cap) - strokes[i]}</td>`;
  }).join("") + `<td class="totaal">${data.ans || ""}</td>`;

  // Baantest-spelers hebben geen handicap, dus geen ontvangen slagen: Netto/Stableford/ANS
  // zouden hier toch exact gelijk zijn aan Score/AGS. Enkel Par/Score/AGS tonen, dat is ook
  // meteen de norm waarop de baantest beoordeeld wordt.
  zone.innerHTML = speler.baantest ? `
    <table class="scoretabel">
      <tr><th class="label">Hole</th>${th}</tr>
      <tr><td class="label">Par</td>${parRij}</tr>
      <tr><td class="label">Score</td>${scoreRij}</tr>
      <tr><td class="label">AGS</td>${agsRij}</tr>
    </table>` : `
    <table class="scoretabel">
      <tr><th class="label">Hole</th>${th}</tr>
      <tr><td class="label">Par</td>${parRij}</tr>
      <tr><td class="label">Slagen</td>${slagRij}</tr>
      <tr><td class="label">Score</td>${scoreRij}</tr>
      <tr><td class="label">Netto</td>${nettoRij}</tr>
      <tr><td class="label">Stableford</td>${stablefordRij}</tr>
      <tr><td class="label">AGS</td>${agsRij}</tr>
      <tr><td class="label">ANS</td>${ansRij}</tr>
    </table>`;

  const quickVeld = document.getElementById("quick-input");
  if (quickVeld) quickVeld.disabled = bevestigd;

  renderSamenvatting(speler, data);
  renderBevestigZone(speler, data);
}

/* ===================== UI: score bevestigen ===================== */

/* Toont, onder de scoretabel, ofwel de knop "Score bevestigen" (kaart volledig maar nog niet
   bevestigd), een hint dat eerst alle holes ingevuld moeten zijn, of de bevestigd-status met
   een knop om de bevestiging weer in te trekken. */
function renderBevestigZone(speler, data) {
  const zone = document.getElementById("score-bevestig-zone");
  if (!zone) return;
  if (!speler) { zone.innerHTML = ""; return; }
  // Deze zone staat naast Quickscore (zie index.html), op een vaste plek in de layout - de
  // inhoud hier moet daarom altijd ongeveer dezelfde (lage) hoogte hebben, anders springt de
  // scoretabel eronder telkens op en neer bij het bevestigen/intrekken. De volledige uitleg staat
  // daarom als title-tooltip i.p.v. als zichtbare (soms meerdere regels lange) tekst.
  if (STATE.afgesloten) {
    zone.innerHTML = `<span class="melding fout" style="display:inline-flex; align-items:center; margin:0; padding:9px 14px; white-space:nowrap;" title="Deze wedstrijd is afgesloten. De scorekaart van ${speler.naam} kan niet meer aangepast worden.">Wedstrijd afgesloten</span>`;
    return;
  }
  const bevestigd = !!(STATE.scores[speler.id] && STATE.scores[speler.id].bevestigd);
  if (bevestigd) {
    zone.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span class="melding ok" style="display:inline-flex; align-items:center; margin:0; padding:9px 14px; white-space:nowrap;" title="Zodra je een andere speler kiest, verdwijnt ${speler.naam} uit de lijst hierboven; je vindt de kaart dan terug via &quot;Aanpassen&quot; bij de Ranglijst.">✓ Bevestigd</span>
        <button class="knop secundair" onclick="trekBevestigingIn('${speler.id}')">Intrekken</button>
      </div>`;
    return;
  }
  if (data && data.compleet) {
    zone.innerHTML = `<button class="knop" onclick="bevestigScore('${speler.id}')">Score bevestigen</button>`;
  } else {
    // Knop blijft zichtbaar (uitgegrijsd) i.p.v. te verdwijnen, zodat de plek naast Quickscore
    // altijd hetzelfde blijft ogen; de titel-tooltip legt uit waarom hij nog niet klikbaar is.
    zone.innerHTML = `<button class="knop" disabled title="Vul eerst alle holes in om de score te kunnen bevestigen.">Score bevestigen</button>`;
  }
}

/* Sluit de scorekaart van 1 speler af: enkel mogelijk als alle holes ingevuld zijn. Bevestigde
   kaarten verdwijnen uit de "nog in te vullen"-lijst bij Score invoeren (zie vulSpelerSelects)
   en worden read-only getoond, tot je ze intrekt of via de Ranglijst opnieuw opent. */
function bevestigScore(spelerId) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten.", "fout"); return; }
  const data = STATE.scores[spelerId];
  const speler = STATE.spelers.find(s => s.id === spelerId);
  if (!data || !speler) return;
  const totaal = holesVoorRonde(speler.ronde).length;
  const gevuld = data.holes.filter(g => g !== null && g !== undefined).length;
  if (gevuld !== totaal) {
    toonMelding("De scorekaart is nog niet volledig ingevuld, kan nog niet bevestigd worden.", "fout");
    return;
  }
  data.bevestigd = true;
  bewaarStatus();
  // Geen melding bovenaan de pagina meer (die duwde de scoretabel tijdelijk naar beneden): de
  // badge "Bevestigd" die renderHoleTabel() meteen naast de knoppen toont, is zelf al de
  // bevestiging - een extra melding erboven zou dubbel zijn en het scherm doen verspringen.
  renderHoleTabel();
  renderRanglijst();
}

/* Trekt een bevestiging terug, bv. om toch nog iets aan te passen zonder via de Ranglijst te
   moeten gaan. De speler verschijnt dan weer gewoon in de "nog in te vullen"-lijst. */
function trekBevestigingIn(spelerId) {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten.", "fout"); return; }
  const data = STATE.scores[spelerId];
  if (!data) return;
  data.bevestigd = false;
  bewaarStatus();
  renderHoleTabel();
  renderRanglijst();
}

function setHoleScore(spelerId, idx, waarde) {
  if (STATE.afgesloten) return; // read-only, wedstrijd afgesloten
  if (STATE.scores[spelerId] && STATE.scores[spelerId].bevestigd) return; // read-only zolang bevestigd
  const n = waarde === "" ? null : parseInt(waarde, 10);
  STATE.scores[spelerId].holes[idx] = (n === null || isNaN(n)) ? null : n;
  bewaarStatus();
  renderHoleTabel();
}

/* Quickscore-veld staat boven de tabel en vult die live aan terwijl je typt.
   Onvolledige invoer op het einde (bv. net "*1" getypt) geeft geen foutmelding,
   die verschijnt pas bij een echt ongeldig teken. */
function quickInvoerGewijzigd() {
  const speler = huidigeScoreSpeler();
  const foutZone = document.getElementById("quick-fout");
  if (!speler) return;
  if (STATE.afgesloten) return; // read-only, wedstrijd afgesloten
  if (STATE.scores[speler.id] && STATE.scores[speler.id].bevestigd) return; // read-only zolang bevestigd
  const holes = holesVoorRonde(speler.ronde);
  const invoer = document.getElementById("quick-input").value.trim();
  if (!invoer) { foutZone.style.display = "none"; return; }
  try {
    const scores = parseQuickscore(invoer, holes.length);
    foutZone.style.display = "none";
    if (scores.length > 0) {
      const arr = STATE.scores[speler.id].holes.slice();
      scores.forEach((s, i) => arr[i] = s);
      STATE.scores[speler.id].holes = arr;
      bewaarStatus();
      renderHoleTabel();
    }
  } catch (e) {
    foutZone.style.display = "block";
    foutZone.textContent = e.message;
  }
}

/* ===================== UI: ranglijst ===================== */

/* Bouwt de filterknoppen op categorie als CSS-grid, uitgelijnd per reeksnaam over 2 rijen
   (heren boven, dames onder) - zodat "Reeks 1 Heren" en "Reeks 1 Dames" altijd in dezelfde
   kolom staan, ongeacht de volgorde of het aantal reeksen per geslacht. Herbruikt op alle 3
   ranglijst-weergaven (renderRanglijst/"Deze wedstrijd", renderAlleWedstrijdenTabel/"Alle
   wedstrijden", renderCriteriumTabel/"Criterium") zodat ze er overal hetzelfde uitzien.
     - cats: de te tonen categorieën (al gefilterd op "gebruikt")
     - huidige: id van de actief gekozen categorie (of "alle")
     - onclickFn: naam van de JS-functie die bij een klik aangeroepen wordt (bv. "kiesRangCat")
     - opties.toonAlle: true om een "Alle"-knop vooraan (kolom 1) te tonen; weglaten voor geen
       "Alle"-knop (zo gebruikt Criterium dit, dat start altijd op 1 gekozen reeks)
     - opties.alleAantal: optioneel aantal op die "Alle"-knop tonen (enkel als opties.toonAlle);
       weglaten voor een "Alle"-knop zonder "(N)" erbij
     - opties.aantalPerCat(cat): functie die het aantal voor 1 categorie teruggeeft, om een
       "(N)" per knop te tonen; weglaten voor knoppen zonder aantal
     - opties.baantest: { aantal } om een "Baantest"-knop toe te voegen helemaal rechts op rij 2 */
function bouwRangTabsGridHtml(cats, huidige, onclickFn, opties) {
  opties = opties || {};
  const knop = (dataCat, label, aantal, kolom, rij) => {
    const aantalHtml = aantal === undefined ? "" : ` <span class="tab-aantal">(${aantal})</span>`;
    return `<button data-cat="${dataCat}" class="${huidige === dataCat ? "actief" : ""}" style="grid-column:${kolom}; grid-row:${rij};" onclick="${onclickFn}('${dataCat}')">${label}${aantalHtml}</button>`;
  };

  let tabsHtml = "";
  let kolomStart = 1;
  if (opties.toonAlle) {
    tabsHtml += knop("alle", "Alle", opties.alleAantal, 1, 1);
    kolomStart = 2;
  }
  const reeksNamen = [];
  cats.forEach(c => { if (!reeksNamen.includes(c.naam)) reeksNamen.push(c.naam); });
  reeksNamen.forEach((naam, i) => {
    const kolom = kolomStart + i;
    const herenCat = cats.find(c => c.naam === naam && c.geslacht === "M");
    const damesCat = cats.find(c => c.naam === naam && c.geslacht === "V");
    if (herenCat) tabsHtml += knop(herenCat.id, `${herenCat.naam} Heren`, opties.aantalPerCat ? opties.aantalPerCat(herenCat) : undefined, kolom, 1);
    if (damesCat) tabsHtml += knop(damesCat.id, `${damesCat.naam} Dames`, opties.aantalPerCat ? opties.aantalPerCat(damesCat) : undefined, kolom, 2);
  });
  if (opties.baantest) {
    tabsHtml += knop("baantest", "Baantest", opties.baantest.aantal, kolomStart + reeksNamen.length, 2);
  }
  return `<div class="tabs-grid">${tabsHtml}</div>`;
}

function renderRanglijst() {
  const tabsZone = document.getElementById("rang-tabs");
  const gebruikteCats = STATE.categorieen.filter(c => STATE.spelers.some(s => !s.baantest && s.categorieId === c.id));
  const baantestSpelers = STATE.spelers.filter(s => s.baantest);
  const huidige = window._rangActieveCat || "alle";

  // Aantal deelnemers per filterknop tonen (en het totaal bij "Alle"), zodat je in 1 oogopslag
  // ziet hoeveel spelers er in elke reeks zitten zonder elk tabblad apart te moeten openen.
  tabsZone.innerHTML = bouwRangTabsGridHtml(gebruikteCats, huidige, "kiesRangCat", {
    toonAlle: true,
    alleAantal: STATE.spelers.filter(s => !s.baantest).length,
    aantalPerCat: c => STATE.spelers.filter(s => s.categorieId === c.id).length,
    baantest: baantestSpelers.length > 0 ? { aantal: baantestSpelers.length } : null,
  });

  if (huidige === "baantest") { renderBaantestTabel(baantestSpelers); return; }

  const methode = document.getElementById("rang-methode").value;
  // Baantest-spelers spelen buiten de competitie: nooit meetellen in "Alle" of een reeks-tab.
  let spelers = huidige === "alle" ? STATE.spelers.filter(s => !s.baantest) : STATE.spelers.filter(s => s.categorieId === huidige);

  const rijen = spelers.map(s => {
    const d = spelerScoreData(s);
    return {
      speler: s, ...d,
      naam: s.naam, hcpIndex: s.hcpIndex,
      ans9: ansLaatsteHoles(s, 9),
      ans6: ansLaatsteHoles(s, 6),
      ans3: ansLaatsteHoles(s, 3),
      ansLaatsteHole: ansLaatsteHoles(s, 1)
    };
  });

  /* Criteriumpunten voor deze wedstrijd, per reeks (10 voor de beste ANS, aflopend tot 0 - bij
     een gelijke stand wordt er via countback (ANS9/ANS6/ANS3/laatste hole/laagste HCP) verder
     gerangschikt tot elk punt maar 1x toegekend is, zelfde regel als bij de "Criterium"-tab
     (zie puntenVoorReeks/berekenCriteriumData). Enkel volledig ingevulde scorekaarten tellen
     mee. */
  const perReeksVoorPunten = {};
  rijen.filter(r => r.compleet && r.speler.categorieId).forEach(r => {
    (perReeksVoorPunten[r.speler.categorieId] = perReeksVoorPunten[r.speler.categorieId] || []).push(r);
  });
  Object.keys(perReeksVoorPunten).forEach(catId => {
    /* puntenVoorReeks sorteert intern (voor de countback-cascade, zie de definitie verderop in
       dit bestand) en geeft dus NIET meer dezelfde volgorde terug als de invoer - terugkoppelen
       moet daarom via de speler-id, niet via de index. */
    const groep = perReeksVoorPunten[catId];
    const metPunten = puntenVoorReeks(groep);
    const puntenPerSpelerId = {};
    metPunten.forEach(r => { puntenPerSpelerId[r.speler.id] = r.punten; });
    groep.forEach(origineel => { origineel.criteriumPunten = puntenPerSpelerId[origineel.speler.id]; });
  });

  /* Onvolledige scorekaarten staan altijd achteraan, ongeacht rangschikkingsmethode. Binnen de
     volledige scorekaarten: eerst op de gekozen methode, bij een gelijke stand countback op
     ANS van de laatste 9, dan 6, dan 3 holes (laagste wint, standaard countback-regel). */
  rijen.sort((a, b) => {
    if (a.compleet !== b.compleet) return a.compleet ? -1 : 1;
    if (!a.compleet) return 0;
    const verschil = methode === "stableford" ? (b.stableford - a.stableford) : (a[methode] - b[methode]);
    if (verschil !== 0) return verschil;
    const ans9v = (a.ans9 ?? Infinity) - (b.ans9 ?? Infinity);
    if (ans9v !== 0) return ans9v;
    const ans6v = (a.ans6 ?? Infinity) - (b.ans6 ?? Infinity);
    if (ans6v !== 0) return ans6v;
    return (a.ans3 ?? Infinity) - (b.ans3 ?? Infinity);
  });

  const tabelZone = document.getElementById("rang-tabel-zone");
  if (rijen.length === 0) {
    tabelZone.innerHTML = `<p class="uitleg">Geen spelers in deze groep.</p>`;
    return;
  }
  let volgnr = 0;
  const rijenHtml = rijen.map(r => {
    const cat = STATE.categorieen.find(c => c.id === r.speler.categorieId);
    const catLabel = cat ? `${cat.naam} ${cat.geslacht === "M" ? "H" : "D"}` : "-";
    const aanpasKnop = `<button class="knop-icoon" onclick="gaNaarScoreVoorSpeler('${r.speler.id}')" title="Score aanpassen" aria-label="Score aanpassen">${AANPAS_ICOON_SVG}</button>`;
    if (!r.compleet) {
      return `
      <tr style="color: var(--text-muted);">
        <td>-</td>
        <td>${r.speler.naam}</td>
        <td>${catLabel}</td>
        <td class="num">${r.ingevuld}/${r.totaal}</td>
        <td colspan="9"><em>Score nog niet ingediend</em></td>
        <td>${aanpasKnop}</td>
      </tr>`;
    }
    volgnr++;
    return `
      <tr>
        <td>${volgnr}</td>
        <td>${r.speler.naam}</td>
        <td>${catLabel}</td>
        <td class="num">${r.ingevuld}/${r.totaal}</td>
        <td class="num">${r.bruto}</td>
        <td class="num">${r.ags}</td>
        <td class="num">${r.netto}</td>
        <td class="num">${r.ans}</td>
        <td class="num">${r.stableford}</td>
        <td class="num">${r.ans9 ?? "-"}</td>
        <td class="num">${r.ans6 ?? "-"}</td>
        <td class="num">${r.ans3 ?? "-"}</td>
        <td class="num">${r.criteriumPunten ?? "-"}</td>
        <td>${aanpasKnop}</td>
      </tr>`;
  }).join("");

  tabelZone.innerHTML = `
    <table class="lijst">
      <tr>
        <th style="width:28px;">#</th><th>Speler</th><th style="width:75px;">Reeks</th>
        <th class="num" style="width:55px;">Holes</th><th class="num" style="width:55px;">Bruto</th>
        <th class="num" style="width:50px;">AGS</th><th class="num" style="width:55px;">Netto</th>
        <th class="num" style="width:50px;">ANS</th><th class="num" style="width:80px;">Stableford</th>
        <th class="num" style="width:55px;">ANS-9</th><th class="num" style="width:55px;">ANS-6</th><th class="num" style="width:55px;">ANS-3</th>
        <th class="num" style="width:60px;">Crit. pt</th><th style="width:36px;"></th>
      </tr>
      ${rijenHtml}
    </table>
    <p class="uitleg">AGS = aangepaste brutoscore, ANS = aangepaste nettoscore (score per hole geplafonneerd op netto double bogey). ANS-9/ANS-6/ANS-3 = ANS over enkel de laatste 9, 6 of 3 gespeelde holes, gebruikt voor countback bij een gelijke stand (enkel getoond zodra die holes ingevuld zijn). Crit. pt = Criteriumpunten voor deze wedstrijd binnen de reeks van de speler (10 voor de beste ANS, aflopend tot 0; bij een gelijke ANS beslist countback - ANS-9, dan ANS-6, dan ANS-3, dan de laatste hole, dan de laagste handicap index - zodat elk puntencijfer maar 1x toegekend wordt). Spelers met een onvolledige scorekaart staan onderaan met "Score nog niet ingediend" en tellen niet mee voor de Criteriumpunten. Klik op het potlood-icoontje om de scorekaart van die speler te (her)openen in Score invoeren, ook als die al bevestigd is.</p>`;
}

/* Aparte, eenvoudigere tabel voor baantest-spelers: geen rangschikking (ze spelen niet tegen
   elkaar), enkel AGS tegenover de norm voor hun geslacht/ronde en of ze geslaagd zijn. */
function renderBaantestTabel(spelers) {
  const tabelZone = document.getElementById("rang-tabel-zone");
  if (spelers.length === 0) {
    tabelZone.innerHTML = `<p class="uitleg">Geen spelers in deze groep.</p>`;
    return;
  }
  const STATUS_LABEL = {
    onvolledig: "Score nog niet ingediend",
    geen_norm: "Geen norm gevonden",
    geslaagd: "Geslaagd",
    niet_geslaagd: "Nog niet geslaagd"
  };
  const rijenHtml = spelers.map(s => {
    const res = baantestResultaat(s);
    const aanpasKnop = `<button class="knop-icoon" onclick="gaNaarScoreVoorSpeler('${s.id}')" title="Score aanpassen" aria-label="Score aanpassen">${AANPAS_ICOON_SVG}</button>`;
    const statusKleur = res.status === "geslaagd" ? "var(--accent)" : (res.status === "niet_geslaagd" ? "var(--danger)" : "var(--text-muted)");
    return `
      <tr>
        <td>${s.naam}</td>
        <td>${s.geslacht === "M" ? "Heer" : "Dame"}</td>
        <td>${rondeLabel(s.ronde)}</td>
        <td class="num">${res.ingevuld}/${res.totaal}</td>
        <td class="num">${res.status === "onvolledig" ? "-" : res.ags}</td>
        <td class="num">${res.norm ? res.norm.max_ags : "-"}</td>
        <td style="color:${statusKleur}; font-weight:600;">${STATUS_LABEL[res.status]}</td>
        <td>${aanpasKnop}</td>
      </tr>`;
  }).join("");

  tabelZone.innerHTML = `
    <table class="lijst">
      <tr>
        <th>Speler</th><th style="width:70px;">Geslacht</th><th style="width:110px;">Ronde</th>
        <th class="num" style="width:55px;">Holes</th><th class="num" style="width:50px;">AGS</th>
        <th class="num" style="width:50px;">Norm</th><th style="width:150px;">Resultaat</th><th style="width:36px;"></th>
      </tr>
      ${rijenHtml}
    </table>
    <p class="uitleg">Baantest-spelers spelen buiten de competitie: geen reeks, geen ranglijst-positie. Ze slagen als hun AGS (score per hole geplafonneerd op gewoon double bogey, want geen ontvangen slagen) niet hoger is dan de norm voor hun geslacht en ronde. Normen zijn aan te passen bij Instellingen &gt; Baantest-normen. Klik op het potlood-icoontje om de scorekaart aan te passen.</p>`;
}

function kiesRangCat(catId) {
  window._rangActieveCat = catId;
  renderRanglijst();
}

/* ===================== UI: ranglijst over meerdere wedstrijden ===================== */

function kiesRanglijstModus(modus) {
  document.getElementById("rang-modus-huidig").classList.toggle("actief", modus === "huidig");
  document.getElementById("rang-modus-alle").classList.toggle("actief", modus === "alle");
  document.getElementById("rang-modus-criterium").classList.toggle("actief", modus === "criterium");
  document.getElementById("ranglijst-huidige-zone").style.display = modus === "huidig" ? "block" : "none";
  document.getElementById("ranglijst-alle-zone").style.display = modus === "alle" ? "block" : "none";
  document.getElementById("ranglijst-criterium-zone").style.display = modus === "criterium" ? "block" : "none";
  if (modus === "alle") laadAlleWedstrijdenRanglijst();
  if (modus === "criterium") laadCriteriumRanglijst();
}

/* Leest alle bewaarde wedstrijdbestanden uit de gekozen map, telt per speler (herkend op
   naam + geslacht, dus onafhankelijk van een wisselende handicap) de resultaten op over
   alle volledig ingevulde ronden, en toont een gezamenlijk overzicht. */
async function laadAlleWedstrijdenRanglijst() {
  const zone = document.getElementById("ranglijst-alle-zone");
  zone.innerHTML = `<p class="uitleg">Bezig met wedstrijden inladen...</p>`;
  if (!window.showDirectoryPicker) {
    zone.innerHTML = `<p class="uitleg">Je browser ondersteunt geen automatisch overzicht over meerdere wedstrijden.</p>`;
    return;
  }
  try {
    const map = await krijgSeizoenMap();
    if (!map) { zone.innerHTML = `<p class="uitleg">Geen map gekozen.</p>`; return; }
    const bestanden = await verzamelWedstrijdData(map);
    window._alleWedstrijdenData = bestanden;
    if (bestanden.length === 0) {
      zone.innerHTML = `<p class="uitleg">Nog geen bewaarde wedstrijden gevonden in deze map.</p>`;
      return;
    }
    window._geselecteerdeWedstrijden = new Set(bestanden.map(b => b.naam));
    renderAlleWedstrijdenScherm();
  } catch (e) {
    if (e.name === "AbortError") return;
    zone.innerHTML = `<p class="uitleg">Kon de wedstrijden niet inladen: ${e.message}</p>`;
  }
}

function renderAlleWedstrijdenScherm() {
  const zone = document.getElementById("ranglijst-alle-zone");
  const bestanden = window._alleWedstrijdenData || [];

  const keuzeHtml = bestanden.map(b => `
    <label style="display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:0.5px solid var(--border); font-size:13px; cursor:pointer;">
      <input type="checkbox" ${window._geselecteerdeWedstrijden.has(b.naam) ? "checked" : ""} onchange="wijzigWedstrijdSelectie('${b.naam.replace(/'/g, "\\'")}', this.checked)" style="width:auto;">
      <span>${b.naam}</span>
      <span style="color:var(--text-muted); margin-left:auto;">${new Date(b.wijzigdatum).toLocaleDateString("nl-BE")}</span>
    </label>`).join("");

  zone.innerHTML = `
    <div style="background:var(--bg); border:0.5px solid var(--border); border-radius:var(--radius); padding:12px 14px; margin-bottom:14px;">
      <p class="uitleg" id="wedstrijd-keuze-teller" style="margin-top:0;">Kies welke wedstrijden meetellen (${window._geselecteerdeWedstrijden.size} van ${bestanden.length} geselecteerd):</p>
      <div style="display:flex; gap:8px; margin-bottom:10px;">
        <button class="knop secundair" onclick="selecteerAlleWedstrijden(true)">Alles selecteren</button>
        <button class="knop secundair" onclick="selecteerAlleWedstrijden(false)">Alles deselecteren</button>
      </div>
      ${keuzeHtml}
    </div>
    <div id="alle-wedstrijden-resultaat-zone"></div>`;

  renderAlleWedstrijdenTabel();
}

function wijzigWedstrijdSelectie(naam, aangevinkt) {
  if (aangevinkt) window._geselecteerdeWedstrijden.add(naam);
  else window._geselecteerdeWedstrijden.delete(naam);
  const teller = document.getElementById("wedstrijd-keuze-teller");
  if (teller) teller.textContent = `Kies welke wedstrijden meetellen (${window._geselecteerdeWedstrijden.size} van ${(window._alleWedstrijdenData || []).length} geselecteerd):`;
  renderAlleWedstrijdenTabel();
}

function selecteerAlleWedstrijden(alles) {
  const bestanden = window._alleWedstrijdenData || [];
  window._geselecteerdeWedstrijden = alles ? new Set(bestanden.map(b => b.naam)) : new Set();
  renderAlleWedstrijdenScherm();
}

function renderAlleWedstrijdenTabel() {
  const zone = document.getElementById("alle-wedstrijden-resultaat-zone");
  const alleBestanden = window._alleWedstrijdenData || [];
  const bestanden = alleBestanden.filter(b => window._geselecteerdeWedstrijden.has(b.naam));
  const bestaandeSelect = document.getElementById("rang-alle-methode");
  const methode = bestaandeSelect ? bestaandeSelect.value : "netto";

  if (bestanden.length === 0) {
    zone.innerHTML = `<p class="uitleg">Geen wedstrijden geselecteerd hierboven.</p>`;
    return;
  }

  /* bestanden staat van nieuw naar oud (zie verzamelWedstrijdData). Bij de eerste keer dat
     we een speler tegenkomen, is dat dus zijn/haar recentste wedstrijd binnen de selectie -
     die reeks gebruiken we om op te filteren, ook al kan de reeks intussen gewijzigd zijn. */
  const aggregatie = {};
  bestanden.forEach(({ data }) => {
    (data.spelers || []).forEach(speler => {
      const scoreArr = (data.scores[speler.id] && data.scores[speler.id].holes) || [];
      const event = spelerScoreData(speler, scoreArr, data.baan);
      if (!event.compleet) return;
      const key = speler.naam.trim().toLowerCase() + "|" + speler.geslacht;
      if (!aggregatie[key]) {
        aggregatie[key] = {
          naam: speler.naam.trim(), geslacht: speler.geslacht, categorieId: speler.categorieId,
          wedstrijden: 0, bruto: 0, ags: 0, netto: 0, ans: 0, stableford: 0
        };
      }
      const r = aggregatie[key];
      r.wedstrijden++;
      r.bruto += event.bruto;
      r.ags += event.ags;
      r.netto += event.netto;
      r.ans += event.ans;
      r.stableford += event.stableford;
    });
  });

  const alleRijen = Object.values(aggregatie);

  const huidigeCat = window._rangAlleActieveCat || "alle";
  const gebruikteCats = STATE.categorieen.filter(c => alleRijen.some(r => r.categorieId === c.id));
  const tabsHtml = bouwRangTabsGridHtml(gebruikteCats, huidigeCat, "kiesRangAlleCat", { toonAlle: true });

  const rijen = huidigeCat === "alle" ? alleRijen : alleRijen.filter(r => r.categorieId === huidigeCat);

  /* Zelfde rangschikkingsopties als bij "deze wedstrijd", maar dan als totaal over de
     geselecteerde wedstrijden: Stableford hoogste eerst, de rest laagste eerst. */
  rijen.sort((a, b) => methode === "stableford" ? (b.stableford - a.stableford) : (a[methode] - b[methode]));

  if (rijen.length === 0) {
    zone.innerHTML = `
      ${tabsHtml}
      <p class="uitleg">Geen enkele volledig ingevulde ronde gevonden in de ${bestanden.length} geselecteerde wedstrijd(en) voor deze reeks.</p>`;
    return;
  }

  const rijenHtml = rijen.map((r, i) => {
    const cat = STATE.categorieen.find(c => c.id === r.categorieId);
    const catLabel = cat ? `${cat.naam} ${cat.geslacht === "M" ? "H" : "D"}` : "-";
    return `
    <tr>
      <td>${i + 1}</td>
      <td>${r.naam}</td>
      <td>${catLabel}</td>
      <td class="num">${r.wedstrijden}</td>
      <td class="num">${r.bruto}</td>
      <td class="num">${r.ags}</td>
      <td class="num">${r.netto}</td>
      <td class="num">${r.ans}</td>
      <td class="num">${r.stableford}</td>
    </tr>`;
  }).join("");

  zone.innerHTML = `
    <div class="veldgroep">
      <div>
        <label for="rang-alle-methode">Rangschikken op</label>
        <select id="rang-alle-methode" onchange="renderAlleWedstrijdenTabel()">
          <option value="netto" ${methode === "netto" ? "selected" : ""}>Netto slagen (stroke play)</option>
          <option value="stableford" ${methode === "stableford" ? "selected" : ""}>Stableford punten</option>
          <option value="ags" ${methode === "ags" ? "selected" : ""}>AGS (aangepaste brutoscore)</option>
          <option value="ans" ${methode === "ans" ? "selected" : ""}>ANS (aangepaste nettoscore)</option>
          <option value="bruto" ${methode === "bruto" ? "selected" : ""}>Bruto slagen</option>
        </select>
      </div>
    </div>
    ${tabsHtml}
    <table class="lijst">
      <tr>
        <th style="width:28px;">#</th><th>Speler</th><th style="width:70px;">Reeks</th>
        <th class="num" style="width:65px;">Wedstr.</th><th class="num" style="width:60px;">Bruto</th>
        <th class="num" style="width:55px;">AGS</th><th class="num" style="width:60px;">Netto</th>
        <th class="num" style="width:55px;">ANS</th><th class="num" style="width:85px;">Stableford</th>
      </tr>
      ${rijenHtml}
    </table>
    <p class="uitleg">Totalen over ${bestanden.length} geselecteerde wedstrijd(en) van de ${alleBestanden.length} bewaarde. Enkel volledig ingevulde ronden tellen mee. Spelers worden herkend op naam en geslacht (handicap mag per wedstrijd verschillen), reeks is die van hun recentste wedstrijd binnen de selectie.</p>`;
}

function kiesRangAlleCat(catId) {
  window._rangAlleActieveCat = catId;
  renderAlleWedstrijdenTabel();
}

/* ===================== UI: ranglijst Criterium (puntenklassement) ===================== */
/* Puntensysteem per reeks per wedstrijd: winnaar 10 punten, 2e 9, ... aflopend tot 0.
   Combineert 2 bronnen: historiek.json (oude wedstrijden van voor deze app, punten liggen
   daar al vast, geen countback mogelijk want er is geen hole-per-hole data van) en de gewone
   wedstrijdbestanden (punten worden hier berekend op basis van de rangschikking binnen elke
   reeks, zie hieronder). */

/* Rangschikt 2 spelers binnen dezelfde reeks/wedstrijd bij het toekennen van Criteriumpunten:
   eerst op ANS (laagste wint), bij een gelijke stand op countback (ANS van de laatste 9, dan
   6, dan 3 holes, dan de allerlaatste hole - telkens laagste wint), en is het dan nog gelijk
   op de laagste handicap index. Nog altijd een gelijke stand (kan in theorie na dit alles nog
   voorkomen)? Dan alfabetisch op naam, puur om een volledige rangorde te garanderen: elk
   puntencijfer mag maar 1x toegekend worden, er zijn dus geen gedeelde punten meer. */
function vergelijkVoorCriteriumRang(a, b) {
  if (a.ans !== b.ans) return a.ans - b.ans;
  const negen = (a.ans9 ?? Infinity) - (b.ans9 ?? Infinity);
  if (negen !== 0) return negen;
  const zes = (a.ans6 ?? Infinity) - (b.ans6 ?? Infinity);
  if (zes !== 0) return zes;
  const drie = (a.ans3 ?? Infinity) - (b.ans3 ?? Infinity);
  if (drie !== 0) return drie;
  const laatsteHole = (a.ansLaatsteHole ?? Infinity) - (b.ansLaatsteHole ?? Infinity);
  if (laatsteHole !== 0) return laatsteHole;
  const hcp = (a.hcpIndex ?? Infinity) - (b.hcpIndex ?? Infinity);
  if (hcp !== 0) return hcp;
  return (a.naam || "").localeCompare(b.naam || "");
}

function puntenVoorReeks(rijen) {
  const gesorteerd = rijen.slice().sort(vergelijkVoorCriteriumRang);
  return gesorteerd.map((r, i) => ({ ...r, punten: Math.max(0, 10 - i) }));
}

async function laadHistoriekBestand(map) {
  try {
    const handle = await map.getFileHandle(HISTORIEK_BESTAND);
    const bestand = await handle.getFile();
    const data = JSON.parse(await bestand.text());
    return Array.isArray(data.wedstrijden) ? data.wedstrijden : [];
  } catch (e) {
    return []; // geen historiek.json in deze map, geen probleem
  }
}

function berekenCriteriumData(bestanden, historiek) {
  const aggregatie = {};
  function voegToe(naam, geslacht, categorieId, punten, datum, ans, bron) {
    if (!categorieId) return;
    const key = naam.trim().toLowerCase() + "|" + geslacht + "|" + categorieId;
    if (!aggregatie[key]) {
      aggregatie[key] = { key, naam: naam.trim(), geslacht, categorieId, punten: 0, wedstrijden: 0, detail: [] };
    }
    aggregatie[key].punten += punten;
    aggregatie[key].wedstrijden += 1;
    aggregatie[key].detail.push({ datum, ans, punten, bron });
  }

  (historiek || []).forEach(w => {
    (w.resultaten || []).forEach(r => voegToe(r.naam, r.geslacht, r.categorieId, r.punten || 0, w.datum, r.ans, "historiek"));
  });

  bestanden.forEach(({ data }) => {
    const perReeks = {};
    (data.spelers || []).forEach(speler => {
      if (!speler.categorieId) return;
      const scoreArr = (data.scores[speler.id] && data.scores[speler.id].holes) || [];
      const event = spelerScoreData(speler, scoreArr, data.baan);
      if (!event.compleet) return;
      (perReeks[speler.categorieId] = perReeks[speler.categorieId] || []).push({
        naam: speler.naam, geslacht: speler.geslacht, ans: event.ans,
        ans9: ansLaatsteHoles(speler, 9, scoreArr, data.baan),
        ans6: ansLaatsteHoles(speler, 6, scoreArr, data.baan),
        ans3: ansLaatsteHoles(speler, 3, scoreArr, data.baan),
        ansLaatsteHole: ansLaatsteHoles(speler, 1, scoreArr, data.baan),
        hcpIndex: speler.hcpIndex
      });
    });
    Object.keys(perReeks).forEach(catId => {
      puntenVoorReeks(perReeks[catId]).forEach(r =>
        voegToe(r.naam, r.geslacht, catId, r.punten, data.wedstrijddatum, r.ans, "app"));
    });
  });

  Object.values(aggregatie).forEach(r => r.detail.sort((a, b) => (a.datum || "").localeCompare(b.datum || "")));
  return Object.values(aggregatie);
}

async function laadCriteriumRanglijst() {
  const zone = document.getElementById("criterium-tabel-zone");
  const tabsZone = document.getElementById("criterium-tabs");
  zone.innerHTML = `<p class="uitleg">Bezig met laden...</p>`;
  tabsZone.innerHTML = "";
  if (!window.showDirectoryPicker) {
    zone.innerHTML = `<p class="uitleg">Je browser ondersteunt geen automatisch Criterium-overzicht.</p>`;
    return;
  }
  try {
    const map = await krijgSeizoenMap();
    if (!map) { zone.innerHTML = `<p class="uitleg">Geen map gekozen.</p>`; return; }
    const [bestanden, historiek] = await Promise.all([verzamelWedstrijdData(map), laadHistoriekBestand(map)]);
    window._criteriumData = berekenCriteriumData(bestanden, historiek);
    renderCriteriumTabel();
  } catch (e) {
    if (e.name === "AbortError") return;
    zone.innerHTML = `<p class="uitleg">Kon het Criterium niet laden: ${e.message}</p>`;
  }
}

const CRITERIUM_MAANDNAMEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

/* "Hele seizoen" (= alles, huidig gedrag) of 1 specifieke maand "JJJJ-MM", op basis van de
   maanden die effectief voorkomen in de detail-lijst (historiek + live wedstrijden samen). */
function beschikbareCriteriumPerioden(alleRijen) {
  const maanden = new Set();
  alleRijen.forEach(r => r.detail.forEach(d => { if (d.datum) maanden.add(d.datum.slice(0, 7)); }));
  return [...maanden].sort().reverse();
}

function criteriumMaandLabel(jjjjMm) {
  const [jaar, maand] = jjjjMm.split("-").map(Number);
  return `${CRITERIUM_MAANDNAMEN[maand - 1]} ${jaar}`;
}

/* Punten en aantal wedstrijden voor 1 speler binnen de gekozen periode. "alle" gebruikt de
   al opgetelde totalen; een specifieke maand telt enkel de bijpassende detail-regels. */
function criteriumVoorPeriode(r, periode) {
  if (periode === "alle") return { punten: r.punten, wedstrijden: r.wedstrijden, detail: r.detail };
  const subset = r.detail.filter(d => d.datum && d.datum.slice(0, 7) === periode);
  return { punten: subset.reduce((s, d) => s + d.punten, 0), wedstrijden: subset.length, detail: subset };
}

function renderCriteriumTabel() {
  const alleRijen = window._criteriumData || [];
  const tabsZone = document.getElementById("criterium-tabs");
  const periodeZone = document.getElementById("criterium-periode-zone");
  const zone = document.getElementById("criterium-tabel-zone");

  const gebruikteCats = STATE.categorieen.filter(c => alleRijen.some(r => r.categorieId === c.id));
  if (gebruikteCats.length === 0) {
    tabsZone.innerHTML = "";
    periodeZone.innerHTML = "";
    zone.innerHTML = `<p class="uitleg">Geen Criterium-gegevens gevonden (nog geen historiek.json of volledig ingevulde wedstrijden in deze map).</p>`;
    return;
  }
  if (!window._criteriumActieveCat || !gebruikteCats.some(c => c.id === window._criteriumActieveCat)) {
    window._criteriumActieveCat = gebruikteCats[0].id;
  }
  const huidige = window._criteriumActieveCat;

  tabsZone.innerHTML = bouwRangTabsGridHtml(gebruikteCats, huidige, "kiesCriteriumCat", {});

  const perioden = beschikbareCriteriumPerioden(alleRijen);
  if (!window._criteriumPeriode || (window._criteriumPeriode !== "alle" && !perioden.includes(window._criteriumPeriode))) {
    window._criteriumPeriode = "alle";
  }
  const periode = window._criteriumPeriode;
  periodeZone.innerHTML = `
    <label for="criterium-periode" style="display:block; margin-bottom:4px;">Periode</label>
    <select id="criterium-periode" onchange="kiesCriteriumPeriode(this.value)">
      <option value="alle" ${periode === "alle" ? "selected" : ""}>Hele seizoen</option>
      ${perioden.map(p => `<option value="${p}" ${periode === p ? "selected" : ""}>${criteriumMaandLabel(p)}</option>`).join("")}
    </select>`;

  const rijen = alleRijen
    .filter(r => r.categorieId === huidige)
    .map(r => ({ ...r, periodeData: criteriumVoorPeriode(r, periode) }))
    .filter(r => r.periodeData.wedstrijden > 0)
    .sort((a, b) => b.periodeData.punten - a.periodeData.punten);
  const opengeklapt = window._criteriumOpenKey;

  if (rijen.length === 0) {
    zone.innerHTML = `<p class="uitleg">Geen wedstrijden in deze reeks voor ${periode === "alle" ? "het hele seizoen" : criteriumMaandLabel(periode)}.</p>`;
    return;
  }

  const rijenHtml = rijen.map((r, i) => {
    const basisRij = `
    <tr class="klikbare-rij" style="cursor:pointer;" onclick="kiesCriteriumDetail('${r.key.replace(/'/g, "\\'")}')">
      <td>${i + 1}</td>
      <td>${r.naam} ${opengeklapt === r.key ? "&#9650;" : "&#9660;"}</td>
      <td class="num">${r.periodeData.wedstrijden}</td>
      <td class="num">${r.periodeData.punten}</td>
    </tr>`;
    if (opengeklapt !== r.key) return basisRij;
    const detailHtml = r.periodeData.detail.map(d => `
      <tr style="background:var(--bg);">
        <td></td>
        <td colspan="2" style="color:var(--text-muted);">${d.datum ? new Date(d.datum + "T00:00:00").toLocaleDateString("nl-BE") : "-"} &middot; ANS ${d.ans ?? "-"} ${d.bron === "historiek" ? "(historiek)" : ""}</td>
        <td class="num">${d.punten}</td>
      </tr>`).join("");
    return basisRij + detailHtml;
  }).join("");

  zone.innerHTML = `
    <table class="lijst">
      <tr><th style="width:28px;">#</th><th>Speler</th><th class="num" style="width:75px;">Wedstr.</th><th class="num" style="width:70px;">Punten</th></tr>
      ${rijenHtml}
    </table>
    <p class="uitleg">Punten per wedstrijd binnen deze reeks: 10 voor de winnaar, aflopend tot 0. Combineert de geimporteerde historiek (voor deze app) met wedstrijden die volledig via de app gespeeld zijn. Kies hierboven een maand om enkel die periode te zien, of "Hele seizoen" voor het totaal. Klik op een speler om de ANS-score per wedstrijd te zien.</p>`;
}

function kiesCriteriumCat(catId) {
  window._criteriumActieveCat = catId;
  window._criteriumOpenKey = null;
  renderCriteriumTabel();
}

function kiesCriteriumPeriode(periode) {
  window._criteriumPeriode = periode;
  window._criteriumOpenKey = null;
  renderCriteriumTabel();
}

function kiesCriteriumDetail(key) {
  window._criteriumOpenKey = (window._criteriumOpenKey === key) ? null : key;
  renderCriteriumTabel();
}

/* Alternatief voor wie het mapvenster niet krijgt (bv. omdat de browser al stilzwijgend
   een andere, eerder gekozen map onthoudt): historiek.json rechtstreeks als bestand kiezen
   via een gewone open-bestand-dialoog, die altijd verschijnt. Live wedstrijdbestanden uit
   de eerder gekozen map worden er, indien beschikbaar, gewoon bij opgeteld. */
function importeerHistoriekDirect(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);
      const historiek = Array.isArray(data.wedstrijden) ? data.wedstrijden : [];
      let bestanden = [];
      try {
        const map = await probeerSeizoenMapStil();
        if (map) bestanden = await verzamelWedstrijdData(map);
      } catch (err) { /* geen (toegankelijke) map, we tonen dan enkel de historiek */ }
      window._criteriumData = berekenCriteriumData(bestanden, historiek);
      window._criteriumOpenKey = null;
      renderCriteriumTabel();
      toonMelding("Historiek geladen vanuit gekozen bestand.", "ok");
    } catch (err) {
      toonMelding("Kon dit bestand niet lezen als historiek.json: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

/* ===================== UI: instellingen ===================== */

function renderInstellingen() {
  toonHuidigeMap();
  toonHuidigeSeizoen();
  renderCategorieTabel();
  renderTeeregelsTabel();
  renderBaantestregelsTabel();
  renderOpmerkingenTabel();
  vulSpelersuggestiesUI();

  const baanZone = document.getElementById("baan-tabel-zone");
  const holes = STATE.baan.holes;
  baanZone.innerHTML = `
    <p class="uitleg">${STATE.baan.naam}</p>
    <table class="scoretabel">
      <tr><th class="label">Hole</th>${holes.map(h => `<th>${h.nummer}</th>`).join("")}</tr>
      <tr><td class="label">Par</td>${holes.map(h => `<td>${h.par}</td>`).join("")}</tr>
      <tr><td class="label">SI heren</td>${holes.map(h => `<td>${h.si_heren}</td>`).join("")}</tr>
      <tr><td class="label">SI dames</td>${holes.map(h => `<td>${h.si_dames}</td>`).join("")}</tr>
    </table>`;
}

function renderCategorieTabel() {
  const zone = document.getElementById("categorie-tabel-zone");
  const rijenHtml = STATE.categorieen.map((c, i) => `
    <tr>
      <td><input type="text" value="${c.naam}" data-idx="${i}" data-veld="naam" onchange="wijzigCategorieVeld(this)"></td>
      <td>
        <select data-idx="${i}" data-veld="geslacht" onchange="wijzigCategorieVeld(this)">
          <option value="M" ${c.geslacht === "M" ? "selected" : ""}>Heren</option>
          <option value="V" ${c.geslacht === "V" ? "selected" : ""}>Dames</option>
        </select>
      </td>
      <td><input type="number" step="0.1" value="${c.hcp_min}" data-idx="${i}" data-veld="hcp_min" onchange="wijzigCategorieVeld(this)" style="width:80px;"></td>
      <td><input type="number" step="0.1" value="${c.hcp_max}" data-idx="${i}" data-veld="hcp_max" onchange="wijzigCategorieVeld(this)" style="width:80px;"></td>
      <td><button class="knop secundair" onclick="verwijderCategorie(${i})">Verwijderen</button></td>
    </tr>`).join("");

  zone.innerHTML = `
    <table class="form-tabel">
      <tr><th>Naam</th><th>Geslacht</th><th>Van</th><th>Tot</th><th></th></tr>
      ${rijenHtml}
    </table>
    <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
      <button class="knop secundair" onclick="voegCategorieToe()">Reeks toevoegen</button>
      <button class="knop" onclick="bewaarCategorieen()">Categorieën bewaren</button>
    </div>`;
}

function wijzigCategorieVeld(el) {
  const idx = parseInt(el.dataset.idx, 10);
  const veld = el.dataset.veld;
  let waarde = el.value;
  if (veld === "hcp_min" || veld === "hcp_max") waarde = parseFloat(waarde) || 0;
  STATE.categorieen[idx][veld] = waarde;
}

function voegCategorieToe() {
  STATE.categorieen.push({ id: "reeks_" + Date.now(), naam: "Nieuwe reeks", geslacht: "M", hcp_min: 0, hcp_max: 0 });
  renderCategorieTabel();
}

function verwijderCategorie(idx) {
  STATE.categorieen.splice(idx, 1);
  renderCategorieTabel();
}

async function bewaarCategorieen() {
  bewaarStatus();
  renderSpelerlijst();

  const inhoud = {
    opmerking: "Deze lijst bepaalt hoe spelers automatisch in een reeks worden ingedeeld op basis van hun handicap index.",
    reeksen: STATE.categorieen
  };
  const bestandsnaam = "categorieen.json";

  if (!window.showDirectoryPicker) {
    const blob = new Blob([JSON.stringify(inhoud, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bestandsnaam;
    a.click();
    URL.revokeObjectURL(url);
    toonMelding(`Categorieën gedownload als ${bestandsnaam} (je browser ondersteunt geen rechtstreekse opslag).`, "ok");
    return;
  }
  try {
    const map = await krijgWedstrijdMap();
    if (!map) return;
    const fileHandle = await map.getFileHandle(bestandsnaam, { create: true });
    const schrijfbaar = await fileHandle.createWritable();
    await schrijfbaar.write(JSON.stringify(inhoud, null, 2));
    await schrijfbaar.close();
    toonMelding("Categorieën bewaard in categorieen.json.", "ok");
  } catch (e) {
    if (e.name === "AbortError") return;
    toonMelding("Kon categorieën niet bewaren: " + e.message, "fout");
  }
}

function importeerCategorieen(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const lijst = Array.isArray(data) ? data : data.reeksen;
      if (!Array.isArray(lijst)) throw new Error("Verwacht een lijst 'reeksen' of een array.");
      STATE.categorieen = lijst;
      bewaarStatus();
      renderInstellingen();
      toonMelding("Categorieën geladen.", "ok");
    } catch (err) {
      toonMelding("Kon het bestand niet lezen: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

/* ===================== UI: tee-regels (standaard tee per handicap) ===================== */

/* Regels worden van hoge naar lage ondergrens doorlopen; de eerste regel waarvoor de
   handicap index boven de ondergrens ligt, levert de tee. Geeft null als geen enkele
   regel van toepassing is (bv. lege lijst). */
function bepaalDefaultTee(hcpIndex, geslacht) {
  if (isNaN(hcpIndex)) return null;
  const regels = [...(STATE.teeregels || [])].sort((a, b) => b.ondergrens_hcp - a.ondergrens_hcp);
  for (const r of regels) {
    if (hcpIndex > r.ondergrens_hcp) {
      return geslacht === "M" ? r.tee_heren : r.tee_dames;
    }
  }
  return null;
}

function renderTeeregelsTabel() {
  const zone = document.getElementById("teeregels-tabel-zone");
  if (!zone) return;
  const teeOpties = STATE.baan.tees.map(t => t.naam);

  const rijenHtml = STATE.teeregels.map((r, i) => `
    <tr>
      <td>Boven <input type="number" step="0.1" value="${r.ondergrens_hcp}" data-idx="${i}" data-veld="ondergrens_hcp" onchange="wijzigTeeregelVeld(this)" style="width:70px;"> HCP</td>
      <td>
        <select data-idx="${i}" data-veld="tee_dames" onchange="wijzigTeeregelVeld(this)">
          ${teeOpties.map(t => `<option value="${t}" ${r.tee_dames === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </td>
      <td>
        <select data-idx="${i}" data-veld="tee_heren" onchange="wijzigTeeregelVeld(this)">
          ${teeOpties.map(t => `<option value="${t}" ${r.tee_heren === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </td>
      <td><button class="knop secundair" onclick="verwijderTeeregel(${i})">Verwijderen</button></td>
    </tr>`).join("");

  zone.innerHTML = `
    <table class="form-tabel">
      <tr><th>Handicap</th><th>Tee dames</th><th>Tee heren</th><th></th></tr>
      ${rijenHtml}
    </table>
    <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
      <button class="knop secundair" onclick="voegTeeregelToe()">Regel toevoegen</button>
      <button class="knop" onclick="bewaarTeeregels()">Tee-regels bewaren</button>
    </div>`;
}

function wijzigTeeregelVeld(el) {
  const idx = parseInt(el.dataset.idx, 10);
  const veld = el.dataset.veld;
  let waarde = el.value;
  if (veld === "ondergrens_hcp") waarde = parseFloat(waarde) || 0;
  STATE.teeregels[idx][veld] = waarde;
}

function voegTeeregelToe() {
  STATE.teeregels.push({ id: "teeregel_" + Date.now(), ondergrens_hcp: 0, tee_dames: STATE.baan.tees[0].naam, tee_heren: STATE.baan.tees[0].naam });
  renderTeeregelsTabel();
}

function verwijderTeeregel(idx) {
  STATE.teeregels.splice(idx, 1);
  renderTeeregelsTabel();
}

async function bewaarTeeregels() {
  bewaarStatus();

  const inhoud = {
    opmerking: "Standaard tee per handicapband. Van hoog naar laag doorlopen: de eerste regel waarvoor de handicap index boven de ondergrens ligt, bepaalt de tee.",
    regels: STATE.teeregels
  };
  const bestandsnaam = "teeregels.json";

  if (!window.showDirectoryPicker) {
    const blob = new Blob([JSON.stringify(inhoud, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bestandsnaam;
    a.click();
    URL.revokeObjectURL(url);
    toonMelding(`Tee-regels gedownload als ${bestandsnaam} (je browser ondersteunt geen rechtstreekse opslag).`, "ok");
    return;
  }
  try {
    const map = await krijgWedstrijdMap();
    if (!map) return;
    const fileHandle = await map.getFileHandle(bestandsnaam, { create: true });
    const schrijfbaar = await fileHandle.createWritable();
    await schrijfbaar.write(JSON.stringify(inhoud, null, 2));
    await schrijfbaar.close();
    toonMelding("Tee-regels bewaard in teeregels.json.", "ok");
  } catch (e) {
    if (e.name === "AbortError") return;
    toonMelding("Kon tee-regels niet bewaren: " + e.message, "fout");
  }
}

function importeerTeeregelen(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const lijst = Array.isArray(data) ? data : data.regels;
      if (!Array.isArray(lijst)) throw new Error("Verwacht een lijst 'regels' of een array.");
      STATE.teeregels = lijst;
      bewaarStatus();
      renderInstellingen();
      toonMelding("Tee-regels geladen.", "ok");
    } catch (err) {
      toonMelding("Kon het bestand niet lezen: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

/* ===================== UI: baantest-normen ===================== */

function renderBaantestregelsTabel() {
  const zone = document.getElementById("baantestregels-tabel-zone");
  if (!zone) return;
  const regels = STATE.baantestregels || DEFAULT_BAANTESTREGELS;

  const rijenHtml = regels.map((r, i) => `
    <tr>
      <td>
        <select data-idx="${i}" data-veld="geslacht" onchange="wijzigBaantestregelVeld(this)">
          <option value="M" ${r.geslacht === "M" ? "selected" : ""}>Heren</option>
          <option value="V" ${r.geslacht === "V" ? "selected" : ""}>Dames</option>
        </select>
      </td>
      <td>
        <select data-idx="${i}" data-veld="ronde" onchange="wijzigBaantestregelVeld(this)">
          <option value="uit" ${r.ronde === "uit" ? "selected" : ""}>9 holes - uit</option>
          <option value="in" ${r.ronde === "in" ? "selected" : ""}>9 holes - in</option>
          <option value="18" ${r.ronde === "18" ? "selected" : ""}>18 holes</option>
        </select>
      </td>
      <td><input type="number" step="1" value="${r.max_ags}" data-idx="${i}" data-veld="max_ags" onchange="wijzigBaantestregelVeld(this)" style="width:80px;"></td>
      <td><button class="knop secundair" onclick="verwijderBaantestregel(${i})">Verwijderen</button></td>
    </tr>`).join("");

  zone.innerHTML = `
    <table class="form-tabel">
      <tr><th>Geslacht</th><th>Ronde</th><th>Max. AGS</th><th></th></tr>
      ${rijenHtml}
    </table>
    <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
      <button class="knop secundair" onclick="voegBaantestregelToe()">Norm toevoegen</button>
      <button class="knop" onclick="bewaarBaantestregels()">Baantest-normen bewaren</button>
    </div>`;
}

function wijzigBaantestregelVeld(el) {
  const idx = parseInt(el.dataset.idx, 10);
  const veld = el.dataset.veld;
  let waarde = el.value;
  if (veld === "max_ags") waarde = parseFloat(waarde) || 0;
  STATE.baantestregels[idx][veld] = waarde;
}

function voegBaantestregelToe() {
  STATE.baantestregels.push({ id: "baantest_" + Date.now(), geslacht: "M", ronde: "uit", max_ags: 54 });
  renderBaantestregelsTabel();
}

function verwijderBaantestregel(idx) {
  STATE.baantestregels.splice(idx, 1);
  renderBaantestregelsTabel();
}

async function bewaarBaantestregels() {
  bewaarStatus();
  renderRanglijst();

  const inhoud = {
    opmerking: "Normen om te slagen voor de baantest. Enkel de AGS telt (score per hole geplafonneerd op gewoon double bogey, want geen ontvangen slagen zonder handicap index): geslaagd als de AGS niet hoger is dan max_ags voor dat geslacht/die ronde.",
    regels: STATE.baantestregels
  };
  const bestandsnaam = "baantestregels.json";

  if (!window.showDirectoryPicker) {
    const blob = new Blob([JSON.stringify(inhoud, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bestandsnaam;
    a.click();
    URL.revokeObjectURL(url);
    toonMelding(`Baantest-normen gedownload als ${bestandsnaam} (je browser ondersteunt geen rechtstreekse opslag).`, "ok");
    return;
  }
  try {
    const map = await krijgWedstrijdMap();
    if (!map) return;
    const fileHandle = await map.getFileHandle(bestandsnaam, { create: true });
    const schrijfbaar = await fileHandle.createWritable();
    await schrijfbaar.write(JSON.stringify(inhoud, null, 2));
    await schrijfbaar.close();
    toonMelding("Baantest-normen bewaard in baantestregels.json.", "ok");
  } catch (e) {
    if (e.name === "AbortError") return;
    toonMelding("Kon baantest-normen niet bewaren: " + e.message, "fout");
  }
}

function importeerBaantestregelen(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const lijst = Array.isArray(data) ? data : data.regels;
      if (!Array.isArray(lijst)) throw new Error("Verwacht een lijst 'regels' of een array.");
      STATE.baantestregels = lijst;
      bewaarStatus();
      renderInstellingen();
      toonMelding("Baantest-normen geladen.", "ok");
    } catch (err) {
      toonMelding("Kon het bestand niet lezen: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

/* ===================== UI: opmerkingen (vooraf ingestelde keuzes) ===================== */
/* De lijst met opmerkingen die je per speler kan kiezen in Wedstrijdoverzicht (zie
   openOpmerkingModal). "Andere..." staat daar altijd apart bij als vaste keuze. */

function renderOpmerkingenTabel() {
  const zone = document.getElementById("opmerkingen-tabel-zone");
  if (!zone) return;
  const lijst = STATE.opmerkingenLijst || DEFAULT_OPMERKINGEN;

  const rijenHtml = lijst.map((tekst, i) => `
    <tr>
      <td><input type="text" value="${tekst}" data-idx="${i}" onchange="wijzigOpmerkingTekst(this)"></td>
      <td><button class="knop secundair" onclick="verwijderOpmerkingRij(${i})">Verwijderen</button></td>
    </tr>`).join("");

  zone.innerHTML = `
    <table class="form-tabel">
      <tr><th>Opmerking</th><th></th></tr>
      ${rijenHtml}
    </table>
    <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
      <button class="knop secundair" onclick="voegOpmerkingRijToe()">Opmerking toevoegen</button>
      <button class="knop" onclick="bewaarOpmerkingenlijst()">Opmerkingen bewaren</button>
    </div>`;
}

function wijzigOpmerkingTekst(el) {
  const idx = parseInt(el.dataset.idx, 10);
  STATE.opmerkingenLijst[idx] = el.value;
}

function voegOpmerkingRijToe() {
  STATE.opmerkingenLijst.push("Nieuwe opmerking");
  renderOpmerkingenTabel();
}

function verwijderOpmerkingRij(idx) {
  STATE.opmerkingenLijst.splice(idx, 1);
  renderOpmerkingenTabel();
}

async function bewaarOpmerkingenlijst() {
  bewaarStatus();

  const inhoud = {
    opmerking: "Vooraf ingestelde opmerkingen die je per speler kan kiezen in Wedstrijdoverzicht. 'Andere...' staat daar altijd apart bij als vaste keuze en hoeft hier niet in te staan.",
    lijst: STATE.opmerkingenLijst
  };
  const bestandsnaam = "opmerkingen.json";

  if (!window.showDirectoryPicker) {
    const blob = new Blob([JSON.stringify(inhoud, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bestandsnaam;
    a.click();
    URL.revokeObjectURL(url);
    toonMelding(`Opmerkingen gedownload als ${bestandsnaam} (je browser ondersteunt geen rechtstreekse opslag).`, "ok");
    return;
  }
  try {
    const map = await krijgWedstrijdMap();
    if (!map) return;
    const fileHandle = await map.getFileHandle(bestandsnaam, { create: true });
    const schrijfbaar = await fileHandle.createWritable();
    await schrijfbaar.write(JSON.stringify(inhoud, null, 2));
    await schrijfbaar.close();
    toonMelding("Opmerkingen bewaard in opmerkingen.json.", "ok");
  } catch (e) {
    if (e.name === "AbortError") return;
    toonMelding("Kon opmerkingen niet bewaren: " + e.message, "fout");
  }
}

function importeerOpmerkingen(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const lijst = Array.isArray(data) ? data : data.lijst;
      if (!Array.isArray(lijst)) throw new Error("Verwacht een lijst 'lijst' of een array.");
      STATE.opmerkingenLijst = lijst;
      bewaarStatus();
      renderInstellingen();
      toonMelding("Opmerkingen geladen.", "ok");
    } catch (err) {
      toonMelding("Kon het bestand niet lezen: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

function importeerBaan(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.holes || !data.tees) throw new Error("Bestand mist 'holes' of 'tees'.");
      STATE.baan = data;
      bewaarStatus();
      document.getElementById("baannaamLabel").textContent = STATE.baan.naam;
      vulTeeSelect();
      renderInstellingen();
      toonMelding("Baangegevens geladen.", "ok");
    } catch (err) {
      toonMelding("Kon het bestand niet lezen: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

function wisWedstrijd() {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, spelers en scores kunnen niet meer gewist worden.", "fout"); return; }
  if (!confirm("Alle spelers en scores verwijderen? Dit kan niet ongedaan gemaakt worden.")) return;
  STATE.spelers = [];
  STATE.scores = {};
  annuleerSpelerBewerken();
  bewaarStatus();
  renderSpelerlijst();
  toonMelding("Wedstrijd gewist.", "ok");
}

/* Snelle reset voor een nieuwe ronde met dezelfde vaste groep spelers (bv. de wekelijkse
   midweek-competitie): enkel de scores gaan weg, de spelerslijst (naam, HCP, tee, reeks)
   blijft staan. De datum springt naar vandaag zodat "Bewaar wedstrijd" niet per ongeluk
   het bestand van vorige keer overschrijft. */
/* Start een lege wedstrijd: spelers en scores van de huidige wedstrijd gaan weg, de datum
   springt naar vandaag. De gekende-spelerslijst (spelers.json, voor naam-suggesties) blijft
   apart bewaard, dus regelmatige deelnemers snel opnieuw toevoegen blijft eenvoudig. */
async function nieuweWedstrijd() {
  const suggestie = `midweek_${vandaagISO()}`;
  const naam = prompt("Naam van de nieuwe wedstrijd?", suggestie);
  if (naam === null) return; // geannuleerd, huidige wedstrijd blijft ongewijzigd

  STATE.spelers = [];
  STATE.scores = {};
  STATE.afgesloten = false;
  annuleerSpelerBewerken();
  STATE.wedstrijdnaam = naam.trim() || suggestie;
  STATE.wedstrijddatum = vandaagISO();
  bewaarStatus();
  vulWedstrijdVelden();
  renderSpelerlijst();
  renderHoleTabel();
  renderRanglijst();
  await bewaarWedstrijd();
  toonMelding("Nieuwe wedstrijd gestart en bewaard.", "ok");
}

/* Start een nieuw seizoen: eigen submap voor wedstrijdbestanden/spelers.json/historiek.json
   (zie "Seizoenen" hierboven), zodat "Alle wedstrijden" en het Criterium opnieuw bij 0
   beginnen. Vraagt expliciet of de huidige gekende-spelerslijst meegenomen moet worden, want
   dat is niet in elk geval gewenst (bv. bij een volledig hernieuwde deelnemerslijst is
   opnieuw importeren via Instellingen > Gekende spelers meestal properder). */
async function nieuwSeizoenStarten() {
  const suggestieSeizoen = seizoenSuggestie();
  const seizoenInvoer = prompt("Naam van het nieuwe seizoen (bijvoorbeeld het jaartal)?", suggestieSeizoen);
  if (seizoenInvoer === null) return; // geannuleerd, huidig seizoen blijft ongewijzigd
  const nieuwSeizoen = seizoenInvoer.trim() || suggestieSeizoen;

  const aantalGekend = Object.keys(window._bekendeSpelersMap).length;
  const hergebruikSpelers = confirm(
    `De huidige gekende-spelerslijst (${aantalGekend} speler${aantalGekend === 1 ? "" : "s"}) meenemen naar seizoen "${nieuwSeizoen}"?\n\n` +
    `OK = automatisch overnemen.\nAnnuleren = leeg beginnen; je kan zelf een spelerslijst importeren via Instellingen > Gekende spelers.`
  );
  const overTeNemenSpelers = hergebruikSpelers ? { ...window._bekendeSpelersMap } : null;

  const suggestieWedstrijd = `midweek_${vandaagISO()}`;
  const wedstrijdInvoer = prompt("Naam van de eerste wedstrijd van dit seizoen?", suggestieWedstrijd);
  if (wedstrijdInvoer === null) return; // geannuleerd, huidig seizoen blijft ongewijzigd

  STATE.seizoen = nieuwSeizoen;
  STATE.spelers = [];
  STATE.scores = {};
  STATE.afgesloten = false;
  annuleerSpelerBewerken();
  STATE.wedstrijdnaam = wedstrijdInvoer.trim() || suggestieWedstrijd;
  STATE.wedstrijddatum = vandaagISO();
  bewaarStatus();
  vulWedstrijdVelden();
  renderSpelerlijst();
  renderHoleTabel();
  renderRanglijst();
  renderInstellingen();

  if (overTeNemenSpelers) {
    window._bekendeSpelersMap = overTeNemenSpelers;
    const map = await probeerSeizoenMapStil();
    if (map) await schrijfLedenlijst(map);
    vulSpelersuggestiesUI();
  } else {
    window._bekendeSpelersMap = {};
    await verversBekendeSpelers();
  }

  await bewaarWedstrijd();
  toonMelding(`Nieuw seizoen "${STATE.seizoen}" gestart en eerste wedstrijd bewaard.`, "ok");
}

/* Overschakelen naar een ander (bestaand) seizoen, bijvoorbeeld om de ranglijsten of het
   Criterium van een vorig seizoen te bekijken. Wist de speler/scores in beeld (niet de
   bewaarde bestanden van dat seizoen zelf), net zoals "Nieuwe wedstrijd" dat doet, en laadt
   de gekende-spelerslijst van dat seizoen in. */
async function wisselVanSeizoen(seizoenNaam) {
  if (!confirm(`Overschakelen naar seizoen "${seizoenNaam}"? Niet-bewaarde spelers/scores van de huidige wedstrijd in beeld gaan dan verloren.`)) return;
  const suggestie = `midweek_${vandaagISO()}`;
  const wedstrijdInvoer = prompt("Naam van de wedstrijd om mee te starten in dit seizoen?", suggestie);
  if (wedstrijdInvoer === null) return;

  STATE.seizoen = seizoenNaam;
  STATE.spelers = [];
  STATE.scores = {};
  STATE.afgesloten = false;
  annuleerSpelerBewerken();
  STATE.wedstrijdnaam = wedstrijdInvoer.trim() || suggestie;
  STATE.wedstrijddatum = vandaagISO();
  bewaarStatus();
  vulWedstrijdVelden();
  renderSpelerlijst();
  renderHoleTabel();
  renderRanglijst();
  renderInstellingen();
  await verversBekendeSpelers();
  toonMelding(`Overgeschakeld naar seizoen "${seizoenNaam}". Gebruik "Laad wedstrijd" om een bewaarde wedstrijd van dit seizoen te openen.`, "ok");
}

/* Toont in Instellingen de submappen die al bestaan in de wedstrijdmap (= de seizoenen die
   ooit gestart zijn), zodat je terug kan wisselen naar een vorig seizoen zonder de naam
   exact te moeten onthouden. Enkel op vraag opgehaald (knop), niet automatisch, want dit kan
   een mapkeuze-venster tonen. */
async function toonBeschikbareSeizoenen() {
  const zone = document.getElementById("seizoen-lijst-zone");
  if (!zone) return;
  if (!window.showDirectoryPicker) {
    zone.innerHTML = `<p class="uitleg">Je browser ondersteunt geen rechtstreekse mapkeuze.</p>`;
    return;
  }
  zone.innerHTML = `<p class="uitleg">Bezig met zoeken...</p>`;
  try {
    const basis = await krijgWedstrijdMap();
    if (!basis) { zone.innerHTML = ""; return; }
    const namen = [];
    for await (const [naam, handle] of basis.entries()) {
      if (handle.kind === "directory") namen.push(naam);
    }
    namen.sort().reverse();
    if (namen.length === 0) {
      zone.innerHTML = `<p class="uitleg">Nog geen andere seizoenen gevonden in deze map.</p>`;
      return;
    }
    zone.innerHTML = namen.map(n => `
      <div class="spelerlijst-item" onclick="wisselVanSeizoen('${n.replace(/'/g, "\\'")}')">
        <div class="naam">${n}${n === STATE.seizoen ? " (huidig)" : ""}</div>
      </div>`).join("");
  } catch (e) {
    if (e.name === "AbortError") { zone.innerHTML = ""; return; }
    zone.innerHTML = `<p class="uitleg">Kon de seizoenen niet ophalen: ${e.message}</p>`;
  }
}

/* Toont het huidige seizoen bovenaan de Instellingen-kaart "Seizoen". */
function toonHuidigeSeizoen() {
  const zone = document.getElementById("seizoen-huidig-zone");
  if (!zone) return;
  zone.innerHTML = `<p class="uitleg">Huidig seizoen: <strong>${STATE.seizoen || seizoenSuggestie()}</strong> (submap in de wedstrijdmap).</p>`;
}

/* ===================== Bewaren / laden op schijf ===================== */
/* Gebruikt de File System Access API (Chrome/Edge) om echt op te slaan in een map die je
   1 keer kiest, in plaats van telkens te downloaden. De map wordt onthouden in IndexedDB.
   Als de browser dit niet ondersteunt, valt de app terug op downloaden/een bestand kiezen. */

const INDEXEDDB_NAAM = "golfwedstrijd_db";
const INDEXEDDB_STORE = "handles";

function openHandleDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(INDEXEDDB_NAAM, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(INDEXEDDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function bewaarMapHandle(handle) {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INDEXEDDB_STORE, "readwrite");
    tx.objectStore(INDEXEDDB_STORE).put(handle, "wedstrijdmap");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function haalMapHandle() {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INDEXEDDB_STORE, "readonly");
    const req = tx.objectStore(INDEXEDDB_STORE).get("wedstrijdmap");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function krijgWedstrijdMap() {
  if (!window.showDirectoryPicker) return null;
  try {
    const bestaand = await haalMapHandle();
    if (bestaand) {
      let toestemming = await bestaand.queryPermission({ mode: "readwrite" });
      if (toestemming !== "granted") toestemming = await bestaand.requestPermission({ mode: "readwrite" });
      if (toestemming === "granted") return bestaand;
    }
  } catch (e) {
    console.warn("Bestaande map niet meer bruikbaar, vraag een nieuwe.", e);
  }
  const nieuw = await window.showDirectoryPicker({ mode: "readwrite" });
  await bewaarMapHandle(nieuw);
  return nieuw;
}

/* Zelfde als krijgWedstrijdMap(), maar vraagt NOOIT een popup: geeft enkel de map terug
   als daar al toestemming voor is. Gebruikt voor stille achtergrondacties (naam-suggesties
   ophalen) die de gebruiker niet mogen storen met een onverwacht mapkeuze-venster. */
async function probeerWedstrijdMapStil() {
  if (!window.showDirectoryPicker) return null;
  try {
    const bestaand = await haalMapHandle();
    if (!bestaand) return null;
    const toestemming = await bestaand.queryPermission({ mode: "readwrite" });
    return toestemming === "granted" ? bestaand : null;
  } catch (e) {
    return null;
  }
}

/* ===================== Seizoenen ===================== */
/* De app wordt per speelseizoen gebruikt. Wedstrijdbestanden, de gekende-spelerslijst
   (spelers.json) en historiek.json horen bij 1 seizoen, en zitten daarom in een eigen submap
   van de gekozen wedstrijdmap, genoemd naar STATE.seizoen (bv. "2026"). Zo tellen "Alle
   wedstrijden" en het Criterium enkel het huidige seizoen mee, en blijven oude seizoenen
   netjes in hun eigen map staan i.p.v. alles in 1 grote map te mengen. Baan, categorieën,
   tee-regels en baantest-normen blijven op het hoogste niveau van de wedstrijdmap staan: die
   veranderen zelden, en worden toch al per wedstrijd bewaard als snapshot (zie hierboven). */

function veiligeSeizoenNaam(tekst) {
  return (tekst || "").trim().replace(/[^a-zA-Z0-9_\-]+/g, "_") || seizoenSuggestie();
}

/* Zelfde als krijgWedstrijdMap(), maar geeft de submap van het huidige seizoen terug (aangemaakt
   indien nog niet aanwezig). Alle wedstrijdbestanden, spelers.json en historiek.json van het
   huidige seizoen leven hier. */
async function krijgSeizoenMap() {
  const basis = await krijgWedstrijdMap();
  if (!basis) return null;
  return await basis.getDirectoryHandle(veiligeSeizoenNaam(STATE.seizoen), { create: true });
}

/* Zelfde als probeerWedstrijdMapStil(), maar dan de submap van het huidige seizoen, en zonder
   ooit een mapkeuze-venster te tonen. */
async function probeerSeizoenMapStil() {
  const basis = await probeerWedstrijdMapStil();
  if (!basis) return null;
  try {
    return await basis.getDirectoryHandle(veiligeSeizoenNaam(STATE.seizoen), { create: true });
  } catch (e) {
    return null;
  }
}

/* ===================== UI: Instellingen - bewaarmap ===================== */
/* Toont in Instellingen welke map momenteel onthouden is in DEZE browser (IndexedDB),
   los van of er nu nog toestemming voor is. Zo kan je op elk moment controleren/wijzigen
   waar wedstrijden, spelerslijst en instellingen bewaard/geladen worden, in plaats van
   dat enkel te ontdekken bij de eerste "Bewaren"/"Laden"-actie. */
async function toonHuidigeMap() {
  const zone = document.getElementById("map-instelling-zone");
  if (!zone) return;
  if (!window.showDirectoryPicker) {
    zone.innerHTML = `<p class="uitleg">Je browser ondersteunt geen rechtstreekse mapkeuze (enkel Chrome/Edge). Bestanden worden per actie gedownload of gekozen.</p>`;
    return;
  }
  try {
    const handle = await haalMapHandle();
    if (!handle) {
      zone.innerHTML = `<p class="uitleg">Nog geen map gekozen in deze browser.</p>`;
      return;
    }
    const toestemming = await handle.queryPermission({ mode: "readwrite" });
    const statusTekst = toestemming === "granted"
      ? ""
      : ` <span style="color:var(--danger);">(toestemming verlopen, klik "Map kiezen / wijzigen" om opnieuw te bevestigen)</span>`;
    zone.innerHTML = `<p class="uitleg">Huidige map: <strong>${handle.name}</strong>${statusTekst}</p>`;
  } catch (e) {
    zone.innerHTML = `<p class="uitleg">Kon de huidige map niet ophalen: ${e.message}</p>`;
  }
}

/* Laat toe om vanuit Instellingen expliciet een (andere) map te kiezen, los van een
   bewaar/laad-actie. Wordt in IndexedDB onthouden voor deze browser/dit toestel tot je
   hier opnieuw een map kiest (overschrijft dan gewoon de vorige keuze). Let op: dit is
   per browser/laptop, dus op een ander toestel moet je dezelfde (gesynchroniseerde) map
   apart kiezen. */
async function kiesWedstrijdMapHandmatig() {
  if (!window.showDirectoryPicker) {
    toonMelding("Je browser ondersteunt geen rechtstreekse mapkeuze.", "fout");
    return;
  }
  try {
    const nieuw = await window.showDirectoryPicker({ mode: "readwrite" });
    await bewaarMapHandle(nieuw);
    await toonHuidigeMap();
    await verversBekendeSpelers();
    toonMelding(`Map "${nieuw.name}" gekozen en onthouden voor deze browser.`, "ok");
  } catch (e) {
    if (e.name === "AbortError") return;
    toonMelding("Kon geen map kiezen: " + e.message, "fout");
  }
}

function isWedstrijdData(data) {
  return !!(data && Array.isArray(data.spelers) && data.scores && typeof data.scores === "object");
}

/* Leest alle .json-bestanden in de map, negeert baan.json/categorieen.json/teeregels.json/baantestregels.json/spelers.json en alles wat
   geen wedstrijdbestand (spelers + scores) blijkt te zijn. Geeft de volledige, ingelezen
   inhoud terug (niet enkel de bestandsnaam), zodat de resultaten meteen herbruikt kunnen
   worden voor zowel de laadlijst als een overzicht over meerdere wedstrijden. */
async function verzamelWedstrijdData(map) {
  const resultaten = [];
  for await (const [naam, handle] of map.entries()) {
    if (handle.kind !== "file" || !naam.toLowerCase().endsWith(".json")) continue;
    if (naam === "baan.json" || naam === "categorieen.json" || naam === "teeregels.json" || naam === "baantestregels.json" || naam === LEDENLIJST_BESTAND || naam === HISTORIEK_BESTAND) continue;
    try {
      const bestand = await handle.getFile();
      const tekst = await bestand.text();
      const data = JSON.parse(tekst);
      if (isWedstrijdData(data)) {
        resultaten.push({ naam, handle, data, wijzigdatum: bestand.lastModified });
      }
    } catch (e) { /* geen leesbaar of geen wedstrijdbestand, overslaan */ }
  }
  resultaten.sort((a, b) => b.wijzigdatum - a.wijzigdatum);
  return resultaten;
}

function veiligeBestandsnaam(tekst) {
  return tekst.trim().replace(/[^a-zA-Z0-9_\-]+/g, "_") || "wedstrijd";
}

function bestandsnaamWedstrijd() {
  return `${veiligeBestandsnaam(STATE.wedstrijdnaam)}_${STATE.wedstrijddatum || vandaagISO()}.json`;
}

/* Toont de naam en datum van de huidige wedstrijd bovenaan (naast de baannaam). Er is geen
   invoerveld meer voor: de naam wordt eenmalig gevraagd bij "Nieuwe wedstrijd". */
function vulWedstrijdVelden() {
  const naam = STATE.wedstrijdnaam || "midweek";
  const datum = STATE.wedstrijddatum || vandaagISO();
  const datumNL = new Date(datum + "T00:00:00").toLocaleDateString("nl-BE");
  document.getElementById("huidige-wedstrijd-label").textContent = `Wedstrijd: ${naam} - ${datumNL}${STATE.afgesloten ? " (afgesloten)" : ""} - seizoen ${STATE.seizoen || seizoenSuggestie()}`;
  const datumKnop = document.getElementById("wijzig-datum-knop");
  if (datumKnop) datumKnop.innerHTML = AANPAS_ICOON_SVG;
  toonAfgeslotenStatus();
}

/* Laat de datum van de huidige wedstrijd expliciet corrigeren, los van "vandaag" bij het
   starten via "Nieuwe wedstrijd". Nodig omdat STATE.wedstrijddatum daar altijd op de dag van
   het starten blijft staan, ook als je scores achteraf voor een eerdere speeldatum invoert -
   en de ranglijsten "Alle wedstrijden" en "Criterium" precies dat veld gebruiken (niet de
   bestandsnaam) om wedstrijden te herkennen en te sorteren. */
function wijzigWedstrijdDatum() {
  if (STATE.afgesloten) { toonMelding("Deze wedstrijd is afgesloten, de datum kan niet meer aangepast worden.", "fout"); return; }
  const huidig = STATE.wedstrijddatum || vandaagISO();
  const invoer = prompt("Datum van deze wedstrijd (JJJJ-MM-DD):", huidig);
  if (invoer === null) return; // geannuleerd
  const trimmed = invoer.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || isNaN(new Date(trimmed + "T00:00:00").getTime())) {
    toonMelding("Ongeldige datum. Gebruik het formaat JJJJ-MM-DD, bijvoorbeeld 2026-08-12.", "fout");
    return;
  }
  const oudeBestandsnaam = bestandsnaamWedstrijd();
  STATE.wedstrijddatum = trimmed;
  bewaarStatus();
  vulWedstrijdVelden();
  const nieuweBestandsnaam = bestandsnaamWedstrijd();
  const waarschuwing = (oudeBestandsnaam !== nieuweBestandsnaam)
    ? ` Let op: bij het volgende "Bewaar wedstrijd" ontstaat een nieuw bestand (${nieuweBestandsnaam}). Verwijder zelf het oude bestand (${oudeBestandsnaam}) uit de wedstrijdmap als dat niet meer nodig is.`
    : "";
  toonMelding(`Datum van de wedstrijd aangepast naar ${new Date(trimmed + "T00:00:00").toLocaleDateString("nl-BE")}.${waarschuwing}`, "ok");
}

/* ===================== Wedstrijd afsluiten (alles op slot) ===================== */

/* Verbergt/ontzegt alle manieren om spelers of scores in DEZE wedstrijd aan te passen zodra
   STATE.afgesloten aan staat: het "Speler toevoegen"-formulier, de knop zelf, en toont een
   duidelijke banner bovenaan. Instellingen (categorieën, tee-regels, baantest-normen,
   bewaarmap) blijven wel altijd aanpasbaar, dat zijn geen wedstrijdgegevens. De eigenlijke
   blokkade van acties zit in de functies zelf (voegSpelerToe, verwijderSpeler, setHoleScore,
   quickInvoerGewijzigd, bevestigScore, trekBevestigingIn) zodat dit ook afgedwongen wordt als
   deze functie om een of andere reden niet (opnieuw) aangeroepen werd. */
function toonAfgeslotenStatus() {
  const banner = document.getElementById("wedstrijd-afgesloten-melding");
  if (banner) banner.style.display = STATE.afgesloten ? "block" : "none";

  const afsluitKnop = document.getElementById("afsluit-knop");
  if (afsluitKnop) afsluitKnop.disabled = STATE.afgesloten;
  const wisKnop = document.getElementById("wis-wedstrijd-knop");
  if (wisKnop) wisKnop.disabled = STATE.afgesloten;

  ["in-naam", "in-geslacht", "in-baantest", "in-hcp", "in-tee", "in-ronde", "spelerform-knop", "spelerform-annuleer", "wijzig-datum-knop", "in-nieuwe-flight-min", "in-nieuwe-flight-plus", "in-nieuwe-flight-startuur", "in-nieuwe-flight-startuur-min10", "in-nieuwe-flight-startuur-min", "in-nieuwe-flight-startuur-plus", "in-nieuwe-flight-startuur-plus10", "overzicht-toewijs-knop"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = STATE.afgesloten;
  });
}

async function sluitWedstrijdAf() {
  if (STATE.afgesloten) return;
  const bevestigd = confirm(`Wedstrijd "${STATE.wedstrijdnaam}" afsluiten?\n\nEr kan dan niets meer aangepast worden aan spelers of scores in deze wedstrijd, tot je een nieuwe wedstrijd start of deze (of een andere) wedstrijd opnieuw laadt.`);
  if (!bevestigd) return;
  STATE.afgesloten = true;
  annuleerSpelerBewerken();
  bewaarStatus();
  vulWedstrijdVelden();
  renderSpelerlijst();
  renderHoleTabel();
  renderRanglijst();
  await bewaarWedstrijd();
  toonMelding("Wedstrijd afgesloten en bewaard. Niets kan nog aangepast worden tot je een nieuwe wedstrijd start of deze wedstrijd opnieuw laadt.", "ok");
}

async function bewaarWedstrijd() {
  const bestandsnaam = bestandsnaamWedstrijd();
  if (!window.showDirectoryPicker) {
    const blob = new Blob([JSON.stringify(STATE, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bestandsnaam;
    a.click();
    URL.revokeObjectURL(url);
    toonMelding(`Gedownload als ${bestandsnaam} (je browser ondersteunt geen rechtstreekse opslag).`, "ok");
    return;
  }
  try {
    const map = await krijgSeizoenMap();
    if (!map) return;
    const fileHandle = await map.getFileHandle(bestandsnaam, { create: true });
    const schrijfbaar = await fileHandle.createWritable();
    await schrijfbaar.write(JSON.stringify(STATE, null, 2));
    await schrijfbaar.close();
    toonMelding(`Wedstrijd bewaard als ${bestandsnaam}.`, "ok");
    verversBekendeSpelers();
  } catch (e) {
    if (e.name === "AbortError") return;
    toonMelding("Kon niet bewaren: " + e.message, "fout");
  }
}

async function opentLaadPopup() {
  document.getElementById("laad-modal").style.display = "flex";
  const zone = document.getElementById("laad-lijst-zone");
  zone.innerHTML = `<p class="uitleg">Bezig met laden...</p>`;
  if (!window.showDirectoryPicker) {
    zone.innerHTML = `<p class="uitleg">Je browser ondersteunt geen automatische lijst met bewaarde wedstrijden. Kies hieronder een bestand.</p>`;
    return;
  }
  try {
    const map = await krijgSeizoenMap();
    if (!map) { zone.innerHTML = `<p class="uitleg">Geen map gekozen.</p>`; return; }
    const bestanden = await verzamelWedstrijdData(map);
    window._laadBestanden = bestanden;
    if (bestanden.length === 0) {
      zone.innerHTML = `<p class="uitleg">Nog geen bewaarde wedstrijden gevonden in deze map.</p>`;
      return;
    }
    zone.innerHTML = bestanden.map((b, i) => `
      <div class="spelerlijst-item" onclick="laadWedstrijdBestand(${i})">
        <div>
          <div class="naam">${b.naam}</div>
          <div class="details">Laatst bewaard: ${new Date(b.wijzigdatum).toLocaleString("nl-BE")}</div>
        </div>
      </div>`).join("");
  } catch (e) {
    if (e.name === "AbortError") { sluitLaadPopup(); return; }
    zone.innerHTML = `<p class="uitleg">Kon de map niet lezen: ${e.message}</p>`;
  }
}

function sluitLaadPopup() {
  document.getElementById("laad-modal").style.display = "none";
}

function laadWedstrijdBestand(index) {
  const item = (window._laadBestanden || [])[index];
  if (!item) return;
  try {
    pasStatusToe(item.data);
    sluitLaadPopup();
    toonMelding(`"${item.naam}" geladen.`, "ok");
  } catch (e) {
    toonMelding("Kon bestand niet lezen: " + e.message, "fout");
  }
}

function pasStatusToe(data) {
  annuleerSpelerBewerken();
  STATE = {
    baan: data.baan || STATE.baan,
    categorieen: data.categorieen || STATE.categorieen,
    teeregels: data.teeregels || STATE.teeregels,
    baantestregels: data.baantestregels || STATE.baantestregels,
    opmerkingenLijst: data.opmerkingenLijst || STATE.opmerkingenLijst,
    spelers: data.spelers || [],
    scores: data.scores || {},
    wedstrijdnaam: data.wedstrijdnaam || STATE.wedstrijdnaam,
    wedstrijddatum: data.wedstrijddatum || STATE.wedstrijddatum,
    // Het seizoen van het geladen bestand overnemen (belangrijk als je via "Kies een bestand
    // van je computer" een wedstrijd van een ander seizoen dan het huidige inlaadt), zodat een
    // volgende "Bewaar wedstrijd" in de juiste seizoensmap terechtkomt.
    seizoen: data.seizoen || STATE.seizoen || seizoenSuggestie(),
    // Een (opnieuw) geladen wedstrijd is altijd bewerkbaar, ook als ze bij het bewaren
    // afgesloten was. Dat is net de bedoeling: "afsluiten" beschermt tegen per ongeluk
    // aanpassen tijdens de lopende sessie, maar bewust opnieuw laden geeft toegang terug.
    afgesloten: false
  };
  bewaarStatus();
  document.getElementById("baannaamLabel").textContent = STATE.baan.naam;
  vulTeeSelect();
  vulWedstrijdVelden();
  renderSpelerlijst();
}

function importeerAlles(event) {
  const bestand = event.target.files[0];
  if (!bestand) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      pasStatusToe(JSON.parse(e.target.result));
      sluitLaadPopup();
      toonMelding("Wedstrijd geladen.", "ok");
    } catch (err) {
      toonMelding("Kon het bestand niet lezen: " + err.message, "fout");
    }
  };
  reader.readAsText(bestand);
}

/* ===================== Init ===================== */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("versieLabel").textContent = APP_VERSIE;
  document.getElementById("baannaamLabel").textContent = STATE.baan.naam;
  vulWedstrijdVelden();
  vulTeeSelect();
  ["in-hcp", "in-geslacht", "in-ronde"].forEach(id => {
    document.getElementById(id).addEventListener("input", updatePreview);
    document.getElementById(id).addEventListener("change", updatePreview);
  });
  /* Aparte listener voor de tee: enkel als de gebruiker zelf een tee kiest, onthouden we
     dat als "handmatig", zodat de automatische tee-suggestie die daarna niet overschrijft. */
  document.getElementById("in-tee").addEventListener("change", () => {
    window._teeHandmatigGewijzigd = true;
    updatePreview();
  });
  document.getElementById("in-naam").addEventListener("input", naamInvoerGewijzigd);
  renderSpelerlijst();
  verversBekendeSpelers();
});
