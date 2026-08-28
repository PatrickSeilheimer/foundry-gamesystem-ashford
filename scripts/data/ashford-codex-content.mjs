import { idFor } from "../ids.mjs";

/**
 * Faithful transcription of the source lore document ("Lagerakte – Ashford",
 * lagerakte_turmheim.html) into plain data for the pack-source generator
 * (scripts/generate-pack-sources.mjs) to turn into Foundry documents.
 *
 * Object keys, German text, tiers/badges, facts, stories and mission details
 * are carried over essentially verbatim from the source. The one systematic
 * change: every inline `<a class="link-btn" onclick="showPersonDetail('xyz')">Label</a>`
 * reference inside a `story`/`facts` HTML string has been converted to a
 * Foundry content link `@UUID[Actor.<id>]{Label}`, where `<id>` is computed
 * with the exact same `idFor('npc-xyz')` scheme the generator uses for that
 * person's own Actor document — so every link resolves to the right Actor
 * once the compendium is built.
 *
 * Note on `persons.boone`/`persons.doyle`: the source's internal object keys
 * and the persons' displayed `name` fields are intentionally mismatched
 * (`persons.boone.name === "Ron Doyle"`, `persons.doyle.name === "Arthur Boone"`).
 * This is kept as-is — the key is only an internal id, never displayed.
 */

/** @UUID content link pointing at the Actor generated for persons[key]. */
function personLink(key, label) {
  return `@UUID[Actor.${idFor(`npc-${key}`)}]{${label}}`;
}

export const buildings = [
  {
    id: "wasserturm",
    name: "Der Wasserturm",
    badge: "H2O · WASSER",
    tier: "Faktisch Stufe 2 (Zisterne) – der Turm bot die Speicherkapazität schon, ohne dass die Siedlung sie bauen musste",
    desc: "Ashford ist buchstäblich um einen noch stehenden alten Wasserturm herum entstanden. Ein einfaches Leitungsnetz verteilt sein Wasser, ergänzt durch zahllose Regenfässer und -tonnen zwischen den Gebäuden. Kein Filter, keine Aufbereitung, nur Schwerkraft, Rost und Glück.",
    npc: null,
    npcNote: "Kein fester Verantwortlicher – gilt als Gemeinschaftsgut."
  },
  {
    id: "wohnbloecke",
    name: "Wohnblock & Läden",
    badge: "HAB · UNTERKUNFT/LAGER",
    tier: "Stufe 1–2 (instand gesetzte Bestandsgebäude, kein Neubau)",
    desc: "Ashford existierte schon vor der Apokalypse als Ort. Die überlebenden, abgeranzten Wohnhäuser und ehemaligen Ladenflächen wurden notdürftig instand gesetzt und dienen heute sowohl als Unterkünfte als auch als Lagerraum für die spärlichen Vorräte der Siedlung.",
    npc: "whitfield",
    npcNote: null
  },
  {
    id: "palisaden",
    name: "Die Palisaden",
    badge: "DEF · VERTEIDIGUNG",
    tier: "Stufe 1 – Palisade ohne Wachtürme",
    desc: "Aus mittelmäßigem Holz errichtete Palisaden umschließen die Siedlung, allerdings ohne Wachtürme und mit zwei ungesicherten Öffnungen an gegenüberliegenden Seiten. Ein ständiges Sorgenkind.",
    npc: "ashworth",
    npcNote: null
  },
  {
    id: "huehnerstall",
    name: "Der Hühnerstall",
    badge: "FOOD · NAHRUNG",
    tier: "Kein echter Ausbau, rein informell",
    desc: "Rund zehn Hühner liefern Eier, mehr Nahrungsproduktion existiert nicht. Der Speiseplan der Siedlung hängt fast vollständig von fast täglichen Beschaffungsmissionen ab, das größte ungelöste Problem von Ashford.",
    npc: null,
    npcNote: "Kein fester Verantwortlicher – wird von wechselnden Freiwilligen versorgt."
  },
  {
    id: "lazarett",
    name: "Das Lazarett",
    badge: "MED · MEDIZIN",
    tier: "Stufe 1 – Verbandsmaterial, kaum mehr",
    desc: "Ein kleiner Raum mit Verbandsmaterial und den einfachsten Mitteln. Für alles, was darüber hinausgeht, fehlen sowohl Ausstattung als auch tiefergehendes Wissen.",
    npc: "pham",
    npcNote: null
  },
  {
    id: "werkstatt",
    name: "Die Werkstatt",
    badge: "WRK · HANDWERK",
    tier: "Stufe 1–2 – Holzverarbeitung",
    desc: "Hier entstehen die Holzarbeiten der Siedlung: Bauholz aus dem nahen Wald, reparierte Hausteile, die Palisaden selbst und einfache Ausrüstung wie ein simpler Bogen.",
    npc: "sokolov",
    npcNote: null
  },
  {
    id: "armory",
    name: "Die Armory",
    badge: "GUN · BEWAFFNUNG",
    tier: "Stufe 1 – schlecht ausgestattet",
    desc: "Ein paar Handfeuerwaffen, kaum Munition. Trotzdem der Ort, an dem die Verteidigung der Siedlung im Ernstfall überhaupt erst kampffähig wird.",
    npc: "boone",
    npcNote: null
  },
  {
    id: "garage",
    name: "Die Garage",
    badge: "KFZ · FAHRZEUGE",
    tier: "Stufe 1 – funktionslos",
    desc: "Ein einzelner, nicht fahrtüchtiger PKW steht hier, ganz ohne Treibstoff. Mehr Hoffnung als Werkstatt, aber ein Symbol dafür, dass Ashford eines Tages wieder mobil werden könnte.",
    npc: "vogler",
    npcNote: null
  }
];

export const persons = {
  vance: {
    name: "Elias Vance",
    role: "Anführer von Ashford",
    building: null,
    buildingName: null,
    initials: "EV",
    imagePrompt: "Photorealistic cinematic portrait of a 46-year-old white American man with an athletic build, calm and authoritative presence, clean-shaven jawline, short greying dark hair neatly kept, piercing steady dark eyes, wearing a patched but carefully maintained canvas jacket over a collared shirt, standing confidently in a sunlit overgrown small-town street with cracked asphalt and creeping vegetation, post-apocalyptic setting, warm late-afternoon light, sharp facial detail, weathered but composed expression, ultra-detailed, 8k",
    meta: { gender: "m", age: 46, relationship: "Verwitwet", workplace: "Führung (kein Gebäude)", nationality: "USA" },
    facts: {
      Alter: "46",
      "Vor der Apokalypse": "Versicherungsvertreter; Jahre zuvor kurzzeitig Verhandlungsführer bei einer Polizeieinheit, bevor er den Dienst quittierte",
      Familie: "Ehefrau während des Falls gestorben, keine Kinder",
      Aussehen: "Gepflegt trotz der Umstände, glattrasiert, saubere, geflickte Kleidung, ruhige, tiefe Stimme, die selten lauter wird, durchdringender Blick"
    },
    note: "Kein festes Gebäude – ständig in der ganzen Siedlung unterwegs, Ansprechpartner für alle Belange.",
    story: 'Vor dem Fall war Elias ein unauffälliger Versicherungsvertreter, Jahre zuvor hatte er kurz als Verhandlungsführer bei einer Polizeieinheit gearbeitet, bevor ihn der Job emotional aufgerieben hat und er den Dienst quittierte. Genau diese Kombination aus rhetorischem Talent und der Fähigkeit, unter extremem Druck kühl zu kalkulieren, machte ihn in den chaotischen ersten Monaten nach dem Fall zur natürlichen Führungsfigur einer wachsenden Gruppe Überlebender, aus der später Ashford wurde. Seine Frau starb während des Falls, seither hat er keine eigene Familie mehr, was manche als Grund dafür sehen, warum er sich so bedingungslos der gesamten Siedlung verschrieben hat, als wäre sie sein Ersatz dafür. Er betreut bewusst kein einzelnes Gebäude, sondern bewegt sich ständig durch die ganze Siedlung, kennt jeden beim Namen, hört sich jedes Problem an und wirkt dabei aufrichtig interessiert, was er in den meisten Fällen auch ist. Doch wenn es hart auf hart kommt, wenn Ressourcen zu knapp werden oder jemand die Sicherheit von Ashford gefährdet, trifft er ohne sichtbares Zögern Entscheidungen, die manche als notwendig und andere als grausam bezeichnen würden, eine Kälte, die im deutlichen Kontrast zu seiner sonstigen Warmherzigkeit steht und ihn zu einer Figur macht, die ebenso verehrt wie insgeheim gefürchtet wird.'
  },
  whitfield: {
    name: 'Eleanor "Nell" Whitfield',
    role: "Die gute Seele der Siedlung",
    building: "wohnbloecke",
    buildingName: "Wohnblock & Läden",
    initials: "EW",
    imagePrompt: "Photorealistic portrait of a 57-year-old American woman, short grey hair, round warm weathered face with kind wrinkles around the eyes, gentle smile, wearing an old worn shopkeeper apron over patched practical clothing, standing among overgrown wooden buildings in a small post-apocalyptic settlement, soft diffused daylight, ultra-detailed, 8k",
    meta: { gender: "w", age: 57, relationship: "Verwitwet", workplace: "Wohnblock & Läden", nationality: "USA" },
    facts: {
      Alter: "57",
      "Vor der Apokalypse": "Betrieb jahrzehntelang gemeinsam mit ihrem Mann ein Elektro- und Haushaltswarengeschäft in einer Stadt einige Kilometer von Ashford entfernt, die beim Fall vollständig überrannt wurde",
      Familie: "Ehemann starb bereits kurz vor dem Fall an einer der vielen Ascheerkrankungen; erwachsene Tochter lebte schon lange vor dem Ausbruch in einem anderen Bundesstaat, seit dem Fall kein Kontakt mehr",
      Aussehen: "Kurz geschnittenes graues Haar, warmes, rundliches Gesicht, trägt oft noch eine alte Schürze aus dem gemeinsamen Laden, hat für jeden ein offenes Ohr"
    },
    story: "Nell und ihr Mann führten jahrzehntelang gemeinsam ein kleines Elektro- und Haushaltswarengeschäft in einer Stadt einige Kilometer von Ashford entfernt, eine Stadt, die während des Falls vollständig überrannt wurde und heute nicht mehr existiert. Ihr Mann starb bereits kurz davor an einer der vielen Ascheerkrankungen, sie musste seinen Verlust also schon verarbeiten, bevor die eigentliche Katastrophe überhaupt begann. Ihre erwachsene Tochter war schon lange vorher in einen anderen Bundesstaat gezogen, ein eigenes Leben, von dem Nell seit dem Ausbruch nichts mehr weiß, nicht einmal, ob ihre Tochter überhaupt noch lebt. Diese doppelte Leere füllt sie, indem sie sich um praktisch jeden in Ashford kümmert, als wäre die ganze Siedlung ihre Familie, sie sieht in jedem Menschen zuerst das Gute, teilt was sie hat, auch wenn es kaum etwas ist, und ist trotz allem, was sie verloren hat, auffallend oft die Einzige, die in der Siedlung noch lacht."
  },
  ashworth: {
    name: "Henry Ashworth",
    role: "Chef der Verteidigung",
    building: "palisaden",
    buildingName: "Die Palisaden",
    initials: "HA",
    imagePrompt: "Photorealistic portrait of a 42-year-old tall muscular British man, short beard with grey flecks, remnants of a private security uniform including a tactical vest, faint dry smirk, standing near a rough wooden palisade wall in a post-apocalyptic settlement, overcast diffused daylight, weathered skin, ultra-detailed, 8k",
    meta: { gender: "m", age: 42, relationship: "Ledig", workplace: "Palisaden", nationality: "Vereinigtes Königreich" },
    facts: {
      Alter: "42",
      "Vor der Apokalypse": "Brite, ehemaliger Soldat der British Army, arbeitete zuletzt als privater Sicherheitsberater in den USA",
      Aussehen: "Hochgewachsen, durchtrainiert, trägt Reste einer alten Sicherheitsdienst-Uniform, kurzer, grau durchsetzter Bart, immer eine Spur trockener Humor im Gesicht"
    },
    story: "Henry war für einen befristeten Auftrag als Sicherheitsberater in den USA, als der Meteorit einschlug, und saß seither auf dem falschen Kontinent fest, weit weg von Zuhause, aber ohne jede Verpflichtung, die ihn dorthin zurückzieht. Seine Ausbildung bei der British Army macht ihn zur naheliegenden Wahl als Chef der Verteidigung von Ashford, auch wenn ihn der Zustand der Palisaden, löchrig, ohne Wachtürme, nachts wachhält. Seinen trockenen britischen Humor hat er sich trotz allem bewahrt, meist auf eigene Kosten, was ihn unter den Wachposten beliebt macht."
  },
  pham: {
    name: "Dr. Yvette Pham",
    role: "Chefärztin (Lazarett)",
    building: "lazarett",
    buildingName: "Das Lazarett",
    initials: "YP",
    imagePrompt: "Photorealistic portrait of a slender 33-year-old Vietnamese-American woman, dark hair tightly pulled into a bun, sharp precise features, focused calm expression, wearing an improvised medical coat over practical clothing with old surgical gloves tucked in a pocket, standing in a dim improvised infirmary room with shelves of sparse medical supplies, soft warm lantern light, ultra-detailed, 8k",
    meta: { gender: "w", age: 33, relationship: "Ledig", workplace: "Lazarett", nationality: "USA" },
    facts: {
      Alter: "33",
      "Vor der Apokalypse": "Assistenzärztin für Chirurgie in einem US-Krankenhaus, in den USA geboren, Kind vietnamesischer Einwanderer",
      Familie: "Eltern seit dem Fall ohne Kontakt, Verbleib unbekannt; ein jüngerer Bruder, von dem sie seit der Zerstreuung nichts mehr gehört hat",
      Aussehen: "Schlank, auffallend präzise und aufgeräumte Erscheinung selbst unter widrigen Umständen, dunkles Haar streng zum Zopf gebunden, trägt noch alte OP-Handschuhe als improvisiertes Werkzeug, wenn nötig"
    },
    story: "Yvette war mitten in ihrer chirurgischen Ausbildung, als der Fall alles beendete. Als Tochter vietnamesischer Einwanderer in den USA aufgewachsen, hat sie sich ihre Position immer hart erarbeiten müssen, eine Härte, die ihr heute in Ashford zugutekommt. Tatsächliche chirurgische Erfahrung zu haben ist in dieser Welt beinahe ein Luxus, ihr Problem ist nicht mangelndes Wissen, sondern die erbärmliche Ausstattung des Lazaretts, kaum mehr als Verbandsmaterial für jemanden, der eigentlich operieren könnte. Von ihren Eltern und ihrem jüngeren Bruder hat sie seit der Zerstreuung nichts mehr gehört, ein Umstand, den sie mit derselben disziplinierten Konzentration verdrängt, mit der sie auch jeden Patienten angeht."
  },
  sokolov: {
    name: "Viktor Sokolov",
    role: "Chef Werker (Werkstatt)",
    building: "werkstatt",
    buildingName: "Die Werkstatt",
    initials: "VS",
    imagePrompt: "Photorealistic portrait of a stocky muscular 42-year-old Russian man, tattooed forearms, an unlit cigarette tucked behind one ear, gruff weathered face, wearing an oil-stained work apron over a flannel shirt, standing in a cluttered wooden workshop full of tools and scrap, warm lantern light, ultra-detailed, 8k",
    meta: { gender: "m", age: 42, relationship: "Geschieden", workplace: "Werkstatt", nationality: "Russland" },
    facts: {
      Alter: "42",
      "Vor der Apokalypse": "Russischer Ingenieur und Mechaniker, war für ein Industrieprojekt in den USA, als der Einschlag geschah",
      Familie: "Geschieden; erwachsener Sohn in Russland, kein Kontakt seit dem Fall",
      Aussehen: "Kräftig, tätowierte Unterarme von Jahrzehnten Werkstattarbeit, immer eine unangezündete Zigarette hinter dem Ohr, weil Tabak zu wertvoll zum Rauchen ist"
    },
    story: "Viktor arbeitete als Ingenieur an einem befristeten Industrieprojekt in den USA, als der Meteorit einschlug, und saß seither auf dem falschen Kontinent fest, getrennt von seinem erwachsenen Sohn in Russland, zu dem seit dem Fall jeder Kontakt abgerissen ist. Aufgewachsen mit einer Mentalität, in der Mangel und Improvisation Alltag waren, hat er sich in Ashford den fast legendären Ruf erarbeitet, aus praktisch jedem Schrotthaufen etwas Funktionierendes zu bauen, eine Fähigkeit, die er mit sichtlichem Vergnügen auch auf die Schnapsbrennerei überträgt. Wortkarg und trocken-zynisch, aber verlässlich bis in die letzte Schraube, ist er die Sorte Handwerker, die eine Siedlung wie Ashford buchstäblich zusammenhält, und an ruhigen Abenden gerne mal ein selbstgebranntes Glas mit den anderen teilt."
  },
  boone: {
    name: "Ron Doyle",
    role: 'Waffenmeister ("Gunfreak", Armory)',
    building: "armory",
    buildingName: "Die Armory",
    initials: "RD",
    imagePrompt: "Photorealistic portrait of a stocky 47-year-old American man, permanently expressionless face, thick bushy mustache, wearing a worn tactical vest over a flannel shirt, standing in front of a sparse gun rack in a dim armory room, dim indoor lighting, ultra-detailed, 8k",
    meta: { gender: "m", age: 47, relationship: "Geschieden", workplace: "Armory", nationality: "USA" },
    facts: {
      Alter: "47",
      "Vor der Apokalypse": "Inhaber eines Waffen- und Jagdausrüstungsladens, ehemals bei der National Guard",
      Familie: "Geschieden; ein Bruder, dessen Verbleib in den am schwersten getroffenen Landesteilen unbekannt ist",
      Aussehen: "Stämmig, permanent ausdrucksloses Gesicht, dichter Schnauzer, wirkt auf den ersten Blick unnahbar und unbeeindruckbar"
    },
    story: "Ron führte vor dem Fall einen kleinen Waffen- und Jagdausrüstungsladen und diente davor bei der National Guard, eine Kombination, die ihn in Ashford praktisch zur Selbstverständlichkeit als Waffenmeister machte. Sein Gesicht verrät so gut wie nie eine Regung, aber anders als sein Auftreten vermuten lässt, ist er alles andere als wortkarg, er redet ausgesprochen viel, nur eben mit bitterbösem, bodenlos trockenem Humor, den er mit derselben Miene serviert wie eine Wettervorhersage. Von seinem Bruder, der irgendwo in den am schwersten verwüsteten Regionen des Landes lebte, hat er seit dem Fall nichts mehr gehört, worüber er lieber makabere Witze reißt, als offen davon zu sprechen. Trotz der schlecht ausgestatteten Armory, ein paar Handfeuerwaffen, kaum Munition, ist er derjenige, der aus dem wenigen Vorhandenen tatsächlich das Bestmögliche macht."
  },
  vogler: {
    name: "Sebastian Vogler",
    role: "KFZ-Verantwortlicher (Garage)",
    building: "garage",
    buildingName: "Die Garage",
    initials: "SV",
    imagePrompt: "Photorealistic portrait of a neat 36-year-old German man, short tidy hair, clean-shaven, wearing a stained but carefully maintained mechanic jumpsuit, holding a wrench, standing beside a rusted old car inside a dusty garage, dusty light beams cutting through the air, ultra-detailed, 8k",
    meta: { gender: "m", age: 36, relationship: "Verheiratet", workplace: "Garage", nationality: "Deutschland" },
    facts: {
      Alter: "36",
      "Vor der Apokalypse": "Deutscher KFZ-Meister, zog Jahre vor dem Einschlag beruflich in die USA und blieb dort",
      Familie: `Ehefrau ${personLink("maria", "Maria")} (39) und Adoptivtochter ${personLink("ella", "Ella")} (11) leben mit ihm gemeinsam in Ashford`,
      Aussehen: "Ordentlich und auffallend um Sauberkeit bemüht selbst unter widrigen Umständen, akkurat sortierte improvisierte Werkzeugkiste, spricht mit deutlichem deutschen Akzent"
    },
    story: "Sebastian zog schon Jahre vor dem Einschlag beruflich als KFZ-Meister in die USA, wo er Maria kennenlernte, blieb, heiratete und ihre Tochter Ella adoptierte. Als eine der wenigen intakten Familien in Ashford sind die drei so etwas wie ein stilles Versprechen, dass nicht alles verloren ist, was Sebastian jeden Tag aufs Neue antreibt. Als ausgebildeter KFZ-Meister ist er die naheliegende Wahl für die Garage, auch wenn ihn der Zustand dort, ein einziger nicht fahrtüchtiger Wagen ohne Treibstoff, fast körperlich schmerzt. Seine akribische, aufgeräumte Art wirkt manchmal fehl am Platz in einer Welt aus Rost und Verfall, ist aber genau das, was er braucht, um seiner Familie ein Stück Normalität zu bewahren."
  },
  maria: {
    name: "Maria Delgado",
    role: "Sebastians Frau, ehemalige Grundschullehrerin",
    building: "garage",
    buildingName: "Die Garage",
    initials: "MD",
    imagePrompt: "Photorealistic portrait of a 39-year-old Mexican woman, dark hair tied back, warm alert eyes, wearing practical clothing covered in hand-sewn patches, standing near an open garage door, soft natural daylight, ultra-detailed, 8k",
    meta: { gender: "w", age: 39, relationship: "Verheiratet", workplace: "Außentrupp", nationality: "Mexiko" },
    facts: {
      Alter: "39",
      "Vor der Apokalypse": "Grundschullehrerin, ursprünglich aus Mexiko-Stadt, zog als junge Frau in die USA",
      Familie: `Tochter ${personLink("ella", "Ella")} (11) aus einer früheren Beziehung; Ehemann ${personLink("vogler", "Sebastian Vogler")}, den sie in den USA kennenlernte`,
      Aussehen: "Dunkles, meist zum Zopf gebundenes Haar, warme, wache Augen, praktische Kleidung mit unzähligen selbstgenähten Flicken"
    },
    story: "Maria unterrichtete in den USA Grundschulkinder, lange nachdem sie als junge Frau aus Mexiko-Stadt ausgewandert war, und lernte dort Sebastian kennen, mit dem sie eine gemeinsame Familie aufbaute. Ihre Tochter Ella stammt aus einer früheren Beziehung, Sebastian hat sie mit Herz adoptiert, als die beiden heirateten. Dass ihre kleine Familie den Fall gemeinsam und unversehrt überstanden hat, macht sie zu einer der wenigen in Ashford, die noch etwas zu verlieren haben, was sie zugleich warmherzig und im Zweifel erstaunlich resolut macht, wenn es um den Schutz ihrer Tochter geht."
  },
  ella: {
    name: "Ella Delgado",
    role: "Sebastians Adoptivtochter",
    building: "garage",
    buildingName: "Die Garage",
    initials: "ED",
    imagePrompt: "Photorealistic portrait of an 11-year-old Mexican-American girl, tousled dark hair, dirty knees, holding a small handmade toy, curious expression, standing in a dusty overgrown settlement street, soft natural daylight, ultra-detailed, 8k",
    meta: { gender: "w", age: 11, relationship: "Kind", workplace: "Kind", nationality: "Mexiko" },
    facts: {
      Alter: "11",
      "Vor der Apokalypse": "War etwa vier Jahre alt, als der Fall geschah, kaum eigene Erinnerung an die alte Welt",
      Familie: `Mutter ${personLink("maria", "Maria Delgado")}, Adoptivvater ${personLink("vogler", "Sebastian Vogler")}`,
      Aussehen: "Meist zerzauste Haare, ständig schmutzige Knie, trägt oft ein kleines, selbstgebasteltes Spielzeug in der Tasche"
    },
    story: "Ella kennt die alte Welt nur noch aus vagen, fast traumhaften Erinnerungsfetzen, für sie ist Ashford einfach die Welt, wie sie ist. Weil sie mit beiden Elternteilen aufwächst, eine Seltenheit in der Siedlung, gilt sie unter den wenigen anderen Kindern fast als privilegiert. Neugierig und altersuntypisch pragmatisch, wie es Kinder werden, die in einer solchen Welt großwerden, schleicht sie sich trotzdem gerne dorthin, wo sie eigentlich nicht hin soll, sehr zum Leidwesen ihrer Eltern."
  },
  higgins: {
    name: 'Walter "Sparks" Higgins',
    role: 'Der "Funker" – bastelt an einer eigenen Radiostation',
    building: null,
    buildingName: null,
    initials: "WH",
    imagePrompt: "Photorealistic portrait of a 71-year-old American man, wild unkempt white beard, unplugged headphones draped around his neck, fingers stained with solder, tinkering with an improvised radio antenna at the edge of a settlement, eccentric excited expression, golden hour light, ultra-detailed, 8k",
    meta: { gender: "m", age: 71, relationship: "Verwitwet", workplace: "Kein fester Posten", nationality: "USA" },
    facts: {
      Alter: "71",
      "Vor der Apokalypse": "Pensionierter Elektriker und begeisterter Amateurfunker",
      Familie: "Frau und beide erwachsenen Kinder während des Falls verloren",
      Aussehen: 'Zerzauster weißer Bart, Finger dauerhaft nach Lötzinn riechend, trägt oft nicht angeschlossene Kopfhörer, weil er glaubt, so besser zu "empfangen"'
    },
    note: "Bastelt unermüdlich an einer eigenen kleinen Funkstation am Rand der Siedlung, offiziell gehört sie zu keiner Institution.",
    story: 'Walter war schon vor dem Fall pensionierter Elektriker und begeisterter Amateurfunker, doch seit er beim Fall seine Frau und beide erwachsenen Kinder verlor, hat sich seine alte Leidenschaft in etwas verwandelt, das die Siedlung mit einer Mischung aus Zuneigung und Kopfschütteln beobachtet. Ständig schraubt er an einer improvisierten Funkstation herum und erzählt jedem, der zuhört, und auch vielen, die es nicht wollen, von mysteriösen Signalen, die er angeblich empfängt, von Außerirdischen, geheimen Botschaften und Warnungen aus dem All. Niemand weiß wirklich, wie viel davon er selbst glaubt und wie viel einfach seine Art ist, mit dem Verlust seiner Familie umzugehen, aber sein gutes Herz und seine Hilfsbereitschaft stehen außer Frage, weshalb ihn in Ashford trotz allem jeder irgendwie liebgewonnen hat.'
  },
  doyle: {
    name: "Arthur Boone",
    role: "Einzelgänger-Veteran mit seinem Hund Diesel",
    building: null,
    buildingName: null,
    initials: "AB",
    imagePrompt: "Photorealistic portrait of a weathered 61-year-old American veteran, deeply lined face, patched old field jacket, standing beside a scruffy loyal dog, watchful distant gaze, dusty overgrown wasteland backdrop, natural overcast light, ultra-detailed, 8k",
    meta: { gender: "m", age: 61, relationship: "Ledig", workplace: "Außentrupp", nationality: "USA" },
    facts: {
      Alter: "61",
      "Vor der Apokalypse": "Berufssoldat mit mehreren Auslandseinsätzen",
      Familie: "Keine bekannte; lebt nur mit seinem Hund Diesel",
      Aussehen: "Wettergegerbtes Gesicht, geflickte alte Feldjacke, weicht kaum von der Seite seines Hundes"
    },
    note: "Lebt zurückgezogen am Rand der Siedlung, kein offizieller Posten, hilft aber informell bei der Verteidigung.",
    story: "Arthur diente lange vor dem Fall als Berufssoldat in mehreren Auslandseinsätzen, eine Erfahrung, die ihn misstrauisch gegenüber nahezu jedem Menschen gemacht hat, den er trifft. Sein Hund Diesel, den er kurz nach dem Fall aufgenommen hat, ist die einzige Verbindung, der er vorbehaltlos vertraut. Er hält sich meist abseits, hilft aber zuverlässig aus, wenn es um die Sicherheit von Ashford geht, auch wenn er sich keiner festen Struktur unterordnen will."
  },
  cole: {
    name: "Cole",
    role: "Ehemaliger Häftling, verlässlich, aber verschlossen",
    building: null,
    buildingName: null,
    initials: "C",
    imagePrompt: "Photorealistic portrait of a rugged 39-year-old American man, angular face, faded prison tattoos on his forearms, calm watchful eyes, simple worn clothing, standing in shadow near a wooden fence, moody low-key lighting, ultra-detailed, 8k",
    meta: { gender: "m", age: 39, relationship: "Ledig", workplace: "Außentrupp", nationality: "USA" },
    facts: {
      Alter: "39",
      "Vor der Apokalypse": "Saß im Gefängnis, worüber er nie spricht, und niemand in Ashford fragt",
      Verbindung: `Untrennbar verbunden mit ${personLink("nolan", "Gary Nolan")}, dem ehemaligen Wärter, der ihn beim Ausbruch befreite`,
      Aussehen: "Kantiges Gesicht, alte Tätowierungen an den Unterarmen, wacher, ruhiger Blick"
    },
    note: "Kein offizieller Posten, aber eine feste Größe im Alltag der Siedlung.",
    story: "Jeder in Ashford weiß, dass Cole gesessen hat, aber niemand weiß wofür, und in all den Jahren in der Siedlung hat er sich nie das Geringste zuschulden kommen lassen. Als der Fall über das Gefängnis hereinbrach, in dem er einsaß, ignorierte der Wärter Gary Nolan die Anweisung, sämtliche Häftlinge zurückzulassen, und befreite ihn. Auf der gemeinsamen Flucht durch das Chaos retteten sie sich mehrfach gegenseitig das Leben, ein Bund, der bis heute unzertrennlich ist. Cole redet wenig über sich selbst, aber wer ihn kennt, weiß, dass er zuverlässiger ist als die meisten, die viel mehr reden."
  },
  nolan: {
    name: "Gary Nolan",
    role: "Ehemaliger Gefängniswärter, Coles engster Verbündeter",
    building: null,
    buildingName: null,
    initials: "GN",
    imagePrompt: "Photorealistic portrait of a 38-year-old American man, close-cropped greying hair, wearing a faded former prison guard jacket, an old keyring clipped to his belt, steady serious expression, standing near a wooden settlement gate, overcast diffused light, ultra-detailed, 8k",
    meta: { gender: "m", age: 38, relationship: "Ledig", workplace: "Außentrupp", nationality: "USA" },
    facts: {
      Alter: "38",
      "Vor der Apokalypse": "Wärter in dem Gefängnis, in dem Cole einsaß",
      Verbindung: `Untrennbar verbunden mit ${personLink("cole", "Cole")}, den er beim Ausbruch befreite`,
      Aussehen: "Kurzgeschorenes graues Haar, trägt noch immer den alten Schlüsselbund seines Dienstes als eine Art Andenken"
    },
    note: "Kein offizieller Posten, aber eine feste Größe im Alltag der Siedlung.",
    story: "Gary war Wärter in dem Gefängnis, in dem Cole einsaß, und stand am Tag des Falls vor der Anweisung, sämtliche Häftlinge einfach zurückzulassen. Er warf sämtliche Protokolle über den Haufen und befreite so viele Insassen wie möglich, Cole darunter. Auf der gemeinsamen Flucht retteten die beiden sich mehrfach gegenseitig das Leben, ein Erlebnis, das eine Verbindung geschaffen hat, die enger ist als die meisten Familienbande in Ashford. Gary trägt bis heute seinen alten Schlüsselbund bei sich, nicht aus Nostalgie für den alten Job, sondern als Erinnerung daran, dass er die eine Entscheidung getroffen hat, auf die er wirklich stolz ist."
  },
  finn: {
    name: "Finn",
    role: "Waisenjunge mit künstlerischer Begabung",
    building: null,
    buildingName: null,
    initials: "F",
    imagePrompt: "Photorealistic portrait of a 13-year-old American boy, paint-stained fingers, holding a handmade sketchbook made of found paper, curious wide eyes, tousled hair, sitting on a fallen log at the edge of an overgrown forest, soft natural light, ultra-detailed, 8k",
    meta: { gender: "m", age: 13, relationship: "Kind", workplace: "Kind", nationality: "USA" },
    facts: {
      Alter: "13",
      "Vor der Apokalypse": "Verlor seine Eltern im ersten harten Jahr nach dem Fall, kaum eigene Erinnerung an sie",
      Familie: "Keine leiblichen Angehörigen mehr; wächst informell in der Obhut der Siedlung auf",
      Aussehen: "Farbverschmierte Finger, trägt immer ein selbstgebundenes Skizzenbuch aus Fundpapier bei sich"
    },
    note: "Kind der Siedlung, kein offizieller Posten, wird von mehreren Erwachsenen mit umsorgt.",
    story: "Finn verlor seine Eltern noch im chaotischen ersten Jahr nach dem Fall und ist seither ohne engste Familie in Ashford aufgewachsen, informell von mehreren Erwachsenen der Siedlung mit umsorgt. Sein Talent fürs Zeichnen zeigte sich früh, mit Kohle, Naturfarben und jedem Fetzen Papier, den er finden kann, hält er die Welt um sich herum fest. Problematisch wird es, wenn seine Neugier ihn zu nah an die eigentliche Gefahr der Welt heranzieht, er ist dafür bekannt, sich gefährlich nah an Zombies heranzuwagen, nur um sie in Ruhe skizzieren zu können."
  },
  grace: {
    name: "Grace Mercer",
    role: "Verlobte, seit dem Fall in Ashford zusammen",
    building: null,
    buildingName: null,
    initials: "GM",
    imagePrompt: "Photorealistic portrait of a 30-year-old American woman, short practical haircut, sturdy build, wearing a ring made of welded scrap metal, dressed in practical worn medical-adjacent clothing, warm confident smile, standing near an infirmary tent, warm golden light, ultra-detailed, 8k",
    meta: { gender: "w", age: 30, relationship: "Verlobt", workplace: "Außentrupp", nationality: "USA" },
    facts: {
      Alter: "30",
      "Vor der Apokalypse": "Rettungssanitäterin, ausgebildet im Umgang mit Notfällen und Verletzungen",
      Verbindung: `Verlobt mit ${personLink("phil", "Phil")}`,
      Aussehen: "Kurze Haare, kräftige Statur, trägt einen Ring aus zusammengeschweißtem Schrott, hilft gelegentlich im Lazarett aus"
    },
    note: "Kein offizieller Posten, eines der wenigen fröhlichen Gesichter der Siedlung.",
    story: `Grace arbeitete vor dem Fall als Rettungssanitäterin, eine Erfahrung, die ihr in Ashford gelegentlich zugutekommt, wenn im Lazarett zusätzliche Hände gebraucht werden. Sie kam erst nach dem Fall nach Ashford und lernte Phil kennen, als beide gemeinsam bei der Verteilung besonders knapper Rationen aushalfen, eine unspektakuläre Begegnung, aus der sich über die folgenden Monate eine feste Beziehung entwickelte. Ihre bevorstehende Hochzeit gilt in der Siedlung als eines der wenigen wirklich fröhlichen Ereignisse der letzten Jahre. Ihre Ringe sind aus zusammengeschweißtem Schrott gefertigt, mit tatkräftiger Hilfe von ${personLink("sokolov", "Viktor")} in der Werkstatt, ein unscheinbares, aber vielsagendes Symbol dafür, dass sich selbst in dieser Welt noch etwas Neues und Gutes aufbauen lässt.`
  },
  phil: {
    name: "Phil Anders",
    role: "Verlobter, seit dem Fall in Ashford zusammen",
    building: null,
    buildingName: null,
    initials: "PA",
    imagePrompt: "Photorealistic portrait of a slender 31-year-old American man, improvised glasses with a taped bridge, holding a worn ledger notebook, calm focused expression, standing among stacked supply crates in a dim storeroom, soft indoor light, ultra-detailed, 8k",
    meta: { gender: "m", age: 31, relationship: "Verlobt", workplace: "Außentrupp", nationality: "USA" },
    facts: {
      Alter: "31",
      "Vor der Apokalypse": "Buchhalter, gewissenhaft und genau im Umgang mit Zahlen",
      Verbindung: `Verlobt mit ${personLink("grace", "Grace")}`,
      Aussehen: "Schmale Statur, trägt eine improvisierte Brille mit notdürftig geflicktem Bügel, führt akribisch Buch über die Vorräte der Siedlung"
    },
    note: "Kein offizieller Posten, eines der wenigen fröhlichen Gesichter der Siedlung.",
    story: "Phil war vor dem Fall Buchhalter, eine eher unauffällige Existenz, die sich in Ashford überraschend nützlich gemacht hat, er ist derjenige, der so etwas wie eine inoffizielle Bestandsaufnahme über die knappen Vorräte der Siedlung führt, obwohl es dafür gar keine offizielle Institution gibt. Er lernte Grace kennen, als beide gemeinsam eine besonders angespannte Rationsverteilung organisieren mussten, und war von ihrer ruhigen, praktischen Art rasch angetan. Aus der anfänglichen Zusammenarbeit wurde in den folgenden Monaten mehr, und ihre gemeinsame Verlobung, mit Ringen aus zusammengeschweißtem Schrott, ist für viele in Ashford ein kleines Zeichen der Hoffnung."
  },
  hargrove: {
    name: "Otto Hargrove",
    role: "Der Mann, der dem Tod immer wieder von der Schippe springt",
    building: null,
    buildingName: null,
    initials: "OH",
    imagePrompt: "Photorealistic portrait of a gaunt 68-year-old Canadian man, deep facial wrinkles, faint grin despite a persistent cough, wearing loose patched clothing, standing in a hazy dust-lit street of a small settlement, muted overcast light, ultra-detailed, 8k",
    meta: { gender: "m", age: 68, relationship: "Ledig", workplace: "Kein fester Posten", nationality: "Kanada" },
    facts: {
      Alter: "68",
      "Vor der Apokalypse": "Unauffälliges Leben, an das sich kaum noch jemand erinnert, am wenigsten er selbst",
      Familie: "Keine bekannte",
      Aussehen: "Hager, tiefe Falten im Gesicht, hustet oft, aber meist mit einem Grinsen dabei"
    },
    note: "Kein offizieller Posten, aber ein medizinisches Rätsel, das die ganze Siedlung kennt.",
    story: `Otto hustet nun schon seit Jahren, ein anhaltendes, manchmal beängstigend klingendes Symptom, das eigentlich der Anfang vom Ende sein sollte. Mehr als einmal hat die ganze Siedlung schon erwartet, dass er sich verwandelt, doch Otto ist dem Tod bislang jedes Mal von der Schippe gesprungen, ohne dass irgendjemand, ${personLink("pham", "Dr. Pham")} eingeschlossen, wirklich erklären könnte, warum. Er selbst nimmt es mit trockenem Galgenhumor, witzelt offen über sein eigenes baldiges Ende und lebt dabei gelassener als die meisten Gesunden in Ashford. Für Yvette ist sein Fall ein medizinisches Rätsel, das sie nicht loslässt.`
  },
  rourke: {
    name: "Silas Rourke",
    role: "Der Fallensteller, lebt lieber im Wald",
    building: null,
    buildingName: null,
    initials: "SR",
    imagePrompt: "Photorealistic portrait of a lean weathered 35-year-old American man, sun-worn skin, quiet watchful eyes, wearing forest-ranger-inspired hunting gear with fur trim, standing in a dense misty forest holding a handmade trap, soft diffused forest light, ultra-detailed, 8k",
    meta: { gender: "m", age: 35, relationship: "Ledig", workplace: "Außentrupp", nationality: "USA" },
    facts: {
      Alter: "35",
      "Vor der Apokalypse": "Arbeitete bereits als Wildhüter beziehungsweise Förster",
      Familie: "Keine bekannte in Ashford",
      Aussehen: "Sehnig, wettergegerbt, spricht wenig, wachsamer Blick"
    },
    note: "Offizielles Mitglied der Siedlung mit festem Platz, lebt aber freiwillig etwas außerhalb im Wald.",
    story: `Silas ist offiziell Mitglied von Ashford und hat dort jederzeit einen Platz, zieht es aber vor, etwas abseits im Wald zu leben. Regelmäßig bringt er erlegtes Wild in die Siedlung, mehr, als er selbst je verbrauchen würde, und verschwindet nach dem gemeinsamen Essen meist wieder in den Wald. Nur wenn er verletzt ist, gönnt er sich eine Nacht im Lazarett bei ${personLink("pham", "Dr. Yvette Pham")}, der einzigen, mit der er wirklich offen redet. Insgeheim hegt er schüchterne Gefühle für sie, ohne dass er sich je trauen würde, auch nur andeutungsweise etwas in diese Richtung zu zeigen, für Yvette ist er dagegen einfach ein weiteres Mitglied der Siedlung. Er schätzt es sichtlich, dass er in Ashford immer willkommen ist, auch wenn ihm der Dank, den man ihm für das Fleisch entgegenbringt, grundsätzlich unangenehm ist.`
  },
  daniel: {
    name: "Daniel Ford",
    role: "Vater der Zwillinge Iris und Hazel",
    building: null,
    buildingName: null,
    initials: "DF",
    imagePrompt: "Photorealistic portrait of a tired but gentle-looking 34-year-old American man, holding a small child on his hip, soft exhausted eyes, simple patched clothing, standing in a quiet corner of a small settlement, warm dusk light, ultra-detailed, 8k",
    meta: { gender: "m", age: 34, relationship: "Verwitwet", workplace: "Außentrupp", nationality: "USA" },
    facts: {
      Alter: "34",
      "Vor der Apokalypse": "Unauffälliges Leben vor dem Fall",
      Familie: `Töchter ${personLink("iris", "Iris")} und ${personLink("hazel", "Hazel")} (beide 7); Ehefrau starb bei ihrer Geburt kurz nach dem Fall`,
      Aussehen: "Müde, aber liebevolle Augen, meist mit einem Kind auf dem Arm oder an der Hand"
    },
    note: "Familie in der Siedlung, kein offizieller Posten.",
    story: "Daniels Frau war hochschwanger, als der Fall über die Welt hereinbrach, und brachte die Zwillinge Iris und Hazel mitten im Chaos der ersten Wochen danach zur Welt, unter Bedingungen, die alles andere als sicher waren. Sie überlebte die Geburt nicht, medizinische Hilfe, wie sie nötig gewesen wäre, gab es zu dieser Zeit schlicht nirgends. Seither zieht Daniel die beiden Mädchen allein groß, mit tatkräftiger, informeller Unterstützung aus der ganzen Siedlung, die die kleine Familie fest ins Herz geschlossen hat."
  },
  iris: {
    name: "Iris Ford",
    role: "Daniels Zwillingstochter",
    building: null,
    buildingName: null,
    initials: "IF",
    imagePrompt: "Photorealistic portrait of a quiet 7-year-old American girl, calm observant eyes, neat braided hair, simple patched dress, sitting quietly at the edge of a small settlement scene, soft natural light, ultra-detailed, 8k",
    meta: { gender: "w", age: 7, relationship: "Kind", workplace: "Kind", nationality: "USA" },
    facts: {
      Alter: "7",
      "Vor der Apokalypse": "Geboren erst kurz nach dem Fall, keinerlei eigene Erinnerung an die alte Welt",
      Familie: `Vater ${personLink("daniel", "Daniel Ford")}, Zwillingsschwester ${personLink("hazel", "Hazel")}`,
      Aussehen: "Ruhig, aufmerksame Augen, meist etwas im Hintergrund"
    },
    note: "Kind der Siedlung, kein offizieller Posten.",
    story: "Iris ist die ruhigere und nachdenklichere der beiden Zwillinge, sitzt gerne still neben ihrem Vater oder beobachtet die Erwachsenen bei der Arbeit, statt selbst mittendrin zu sein. Sie und ihre Schwester Hazel sind untrennbar, auch wenn sie kaum unterschiedlicher sein könnten."
  },
  hazel: {
    name: "Hazel Ford",
    role: "Daniels Zwillingstochter",
    building: null,
    buildingName: null,
    initials: "HF",
    imagePrompt: "Photorealistic portrait of an energetic 7-year-old American girl, wildly tousled hair, dirt-smudged hands and face, caught mid-motion running, bright mischievous eyes, simple patched clothing, dynamic natural light, ultra-detailed, 8k",
    meta: { gender: "w", age: 7, relationship: "Kind", workplace: "Kind", nationality: "USA" },
    facts: {
      Alter: "7",
      "Vor der Apokalypse": "Geboren erst kurz nach dem Fall, keinerlei eigene Erinnerung an die alte Welt",
      Familie: `Vater ${personLink("daniel", "Daniel Ford")}, Zwillingsschwester ${personLink("iris", "Iris")}`,
      Aussehen: "Wild zerzaustes Haar, ständig schmutzige Hände, immer in Bewegung"
    },
    note: "Kind der Siedlung, kein offizieller Posten.",
    story: "Hazel ist die wildere der beiden Zwillinge, ständig unterwegs, ständig neugierig, und hat ihrem Vater Daniel schon mehr graue Haare beschert, als ihm lieb ist. Ohne ihre ruhigere Schwester Iris an ihrer Seite wäre sie vermutlich schon in ernsthaften Schwierigkeiten gelandet."
  }
};

export const missions = [
  {
    id: "vorrat",
    title: "Der Vorrat wird knapp",
    auftraggeber: "Elias Vance",
    auftraggeberId: "vance",
    grobesZiel: "Nahrungsbeschaffung – die Vorräte reichen nicht mehr bis zur nächsten Woche.",
    exaktesZiel: "Ein nahegelegener, bislang ungeplünderter Supermarkt oder ein Lagerhaus muss ausfindig gemacht und geplündert werden, bevor es jemand anderes tut.",
    ereignisse: [
      "Eine Horde Zombies hat sich zwischen den Regalen verirrt",
      "Ein rivalisierender Trupp aus einer anderen Enklave ist bereits vor Ort oder trifft während der Plünderung ein",
      "Teile des Gebäudes sind eingestürzt und versperren den direkten Weg zu den wertvollsten Vorräten",
      "Verdorbene oder kontaminierte Ware, die auf den ersten Blick brauchbar wirkt"
    ],
    sonstiges: "Direkt verknüpft mit dem größten ungelösten Problem der Siedlung, siehe Hühnerstall. Ein guter Wiederkehr-Auftrag, der sich beliebig oft in leicht abgewandelter Form wiederholen lässt."
  },
  {
    id: "aerzteschuppen",
    title: "Frisches Werkzeug für den Ärzteschuppen",
    auftraggeber: "Dr. Yvette Pham",
    auftraggeberId: "pham",
    grobesZiel: "Ausbau der medizinischen Versorgung von Stufe 1 (Lazarett) zu Stufe 2 (Ärzteschuppen).",
    exaktesZiel: "Eine nahegelegene Arztpraxis, Tierarztpraxis oder ein kleines Krankenhaus muss nach chirurgischem Werkzeug, Nähmaterial und im besten Fall Antimykotika durchsucht werden.",
    ereignisse: [
      "Das Gebäude ist ein bekannter, bereits mehrfach geplünderter Ort, an dem sich gerne andere Gruppen aufhalten",
      "Medizinischer Abfall und biologisches Risiko in alten Quarantäneräumen",
      "Ein oder mehrere frisch verwandelte Patienten liegen noch in Betten oder Behandlungsräumen",
      "Ein verschlossener Medikamentenschrank muss aufgebrochen werden"
    ],
    sonstiges: 'Bei Erfolg denkbarer Auslöser für den Sprung von Stufe 1 zu Stufe 2 laut Institutionen-Katalog. Lässt sich gut mit der Mission "Ottos Rätsel" verknüpfen.'
  },
  {
    id: "munition",
    title: "Munition zählen",
    auftraggeber: "Ron Doyle",
    auftraggeberId: "boone",
    grobesZiel: "Aufwertung der Bewaffnung – die Armory hat kaum noch Munition übrig.",
    exaktesZiel: "Eine Polizeistation, ein Waffengeschäft oder ein verlassenes Nationalgarde-Depot in der Umgebung muss nach Munition und idealerweise weiteren Schusswaffen durchsucht werden.",
    ereignisse: [
      "Der Ort ist stark von Zombies frequentiert, darunter ehemalige Officer oder Insassen, die sich dort verwandelt haben",
      "Ein Waffenschrank ist verschlossen und braucht einen Dietrich oder Sprengstoff",
      "Eine rivalisierende, schlecht bewaffnete Gruppe versucht, der Truppe die Beute streitig zu machen",
      "Ein Teil der gefundenen Munition passt gar nicht zu den Waffen der Armory"
    ],
    sonstiges: "Ron kommentiert die Mission bei der Rückkehr garantiert mit bitterbösem Humor, unabhängig vom Ausgang."
  },
  {
    id: "wagen",
    title: "Der Wagen soll wieder laufen",
    auftraggeber: "Sebastian Vogler",
    auftraggeberId: "vogler",
    grobesZiel: "Fahrzeuge von funktionslos zu einsatzbereit bringen.",
    exaktesZiel: "Eine Autobatterie, Treibstoff und fehlende Ersatzteile für den einzigen Wagen der Garage müssen beschafft werden, am besten von einer nahegelegenen Tankstelle oder einem Autohändler.",
    ereignisse: [
      "Die Tankstelle liegt in einem stark verseuchten Gebiet",
      "Treibstoff ist größtenteils verdunstet oder unbrauchbar, nur wenige Kanister sind noch verwertbar",
      "Andere abgestellte Fahrzeuge müssen für Ersatzteile ausgeschlachtet werden, was Lärm macht und Zombies anlockt",
      "Eine alte Falle oder ein verwilderter Wachhund des früheren Besitzers"
    ],
    sonstiges: "Sebastian ist bei jedem noch so kleinen Erfolg unverhältnismäßig glücklich, was sich spürbar positiv auf die Stimmung der Siedlung auswirkt."
  },
  {
    id: "wasser",
    title: "Sauberes Wasser",
    auftraggeber: "Elias Vance",
    auftraggeberId: "vance",
    grobesZiel: "Wasserversorgung von der improvisierten Turm-Lösung zu einer echten Aufbereitungsanlage ausbauen.",
    exaktesZiel: "Ein altes, aus der Ferne noch stehend erkennbares Wasserwerk oder eine Kläranlage muss erkundet und für die Siedlung gesichert werden.",
    ereignisse: [
      "Die Anlage ist teilweise geflutet oder eingestürzt",
      "Giftige Chemikalien oder Reste alter Aufbereitungsmittel",
      "Eine andere Splittergruppe hat sich bereits dort eingenistet und beansprucht die Anlage für sich",
      "Komplexe, kaputte Technik, die ohne Fachwissen kaum zu verstehen ist"
    ],
    sonstiges: "Eine der wenigen Missionen mit echtem Langzeit-Wert für die gesamte Siedlung. Eignet sich gut, um sich über mehrere Sessions zu erstrecken: erst Erkundung, dann Sicherung, dann Wiederinbetriebnahme."
  },
  {
    id: "palisaden_mission",
    title: "Palisaden dichtmachen",
    auftraggeber: "Henry Ashworth",
    auftraggeberId: "ashworth",
    grobesZiel: "Verteidigung von Stufe 1 (löchrige Palisade) Richtung Stufe 2 (Wachtürme, feste Tore) ausbauen.",
    exaktesZiel: "Baumaterial von einer nahegelegenen Baustelle, einem Sägewerk oder Baumarkt muss beschafft werden, um die beiden offenen Lücken in der Palisade endlich zu schließen.",
    ereignisse: [
      "Eine Zombiehorde nutzt genau eine der beiden offenen Lücken, während die Truppe unterwegs ist",
      "Instabile Gerüste oder Regale drohen einzustürzen",
      "Das Material ist schwer und sperrig, was den Rückzug bei Gefahr erschwert",
      "Ein Späher entdeckt, dass eine andere Gruppe dasselbe Depot ins Auge gefasst hat"
    ],
    sonstiges: "Gute Mission, um den Spielern die Konsequenzen einer schlecht gesicherten Heimatbasis konkret vor Augen zu führen, etwa durch einen kleinen Zwischenfall in Ashford während ihrer Abwesenheit."
  },
  {
    id: "sendung",
    title: "Sendung, die niemand erwartet",
    auftraggeber: 'Schwarzes Brett, ursprünglich aufgefallen durch Walter „Sparks" Higgins',
    auftraggeberId: "higgins",
    grobesZiel: "Erkundung eines unklaren Funksignals, das Walter seit Tagen empfängt und ihm niemand so recht glauben will.",
    exaktesZiel: "Die vermutete Quelle des Signals, ein Lieferwagen, ein automatisierter Sendemast oder eine kleine Station, muss lokalisiert und untersucht werden.",
    ereignisse: [
      "Das Signal stammt tatsächlich von einer noch aktiven, automatisierten Notfall-Sendestation",
      "Die Spieler stoßen auf Hinweise einer bislang unbekannten Enklave oder Fraktion",
      "Eine Falle, die von einer feindseligen Gruppe absichtlich als Köder ausgesendet wird",
      "Unerwarteter Kontakt mit freundlichen oder auch nicht so freundlichen Überlebenden"
    ],
    sonstiges: "Perfekte Gelegenheit, Walters bislang belächelte Theorien mit echtem Spannungsgewinn zu belohnen, unabhängig davon, ob am Ende wirklich etwas Außerirdisches dahintersteckt."
  },
  {
    id: "otto",
    title: "Ottos Rätsel",
    auftraggeber: "Dr. Yvette Pham",
    auftraggeberId: "pham",
    grobesZiel: "Medizinische Forschung – verstehen, warum Otto Hargrove trotz jahrelangem chronischen Husten nicht stirbt oder sich verwandelt.",
    exaktesZiel: "Ein nahegelegenes Krankenhaus, eine Universitätsklinik oder ein improvisiertes Forschungslabor muss nach altem Datenmaterial, Laborausrüstung oder Blutproben-Kits durchsucht werden, um Ottos Fall wissenschaftlich zu untersuchen.",
    ereignisse: [
      "Verlassene, halb zerstörte Laborräume voller zerbrochener Proben",
      'Ein anderer, deutlich weniger glücklicher „Langzeitfall" wird als mumifizierte oder zombifizierte Leiche entdeckt',
      "Hinweise auf eine der verstreuten Wissenschaftler-Enklaven, die sich ebenfalls für solche Fälle interessieren könnte",
      "Ethisch unangenehme Entscheidung, ob eine Blutprobe von Otto selbst nötig ist und was das für ihn bedeutet"
    ],
    sonstiges: "Eröffnet eine mögliche Anknüpfung an größere Kampagnen-Handlungsstränge rund um Sporenforschung und andere Enklaven, siehe Institutionen-Katalog Prio D, Forschung."
  },
  {
    id: "schwarzesbrett",
    title: "Das Schwarze Brett",
    auftraggeber: "Verschiedene – ein tatsächliches schwarzes Brett am zentralen Platz von Ashford, an dem jeder Siedler kleine Zettel mit Bitten anheften kann",
    auftraggeberId: null,
    grobesZiel: "Diverses – eine Sammlung kleinerer, unabhängiger Gefallen statt einer einzelnen großen Mission.",
    exaktesZiel: "Die Gruppe wählt einen oder mehrere Zettel aus, zum Beispiel: ein verlorenes Erbstück aus einem alten Zuhause holen, ein streunendes, gefährliches Tier jagen, das nahe der Palisade gesichtet wurde, jemanden zu einem entfernten, isolierten Verwandten begleiten, oder schlicht Feuerholz für den Winter sammeln.",
    ereignisse: [
      "Variiert stark je nach gewähltem Zettel",
      "Gut geeignet für kurze Lückenfüller-Sessions",
      "Idealer, niedrigschwelliger Einstieg für neue Spielercharaktere"
    ],
    sonstiges: "Als Spielleiter kannst du das Brett jederzeit mit neuen, situativ passenden Zetteln befüllen, es ist der ideale Ort für Missionen, die keinem der Haupt-NPCs direkt zugeordnet sind."
  },
  {
    id: "hochzeit",
    title: "Hochzeitsvorbereitung",
    auftraggeber: "Grace Mercer & Phil Anders",
    auftraggeberId: "grace",
    grobesZiel: "Gemeinschaft und Moral – der Siedlung zuliebe soll die bevorstehende Hochzeit der beiden zu einem echten Fest werden.",
    exaktesZiel: "Passende Kleidung, Dekoration und etwas Besonderes zu essen oder zu trinken (Viktors Selbstgebranntes zählt) müssen aus einem nahegelegenen Brautgeschäft, einer Kirche oder einem gut sortierten Haushalt beschafft werden.",
    ereignisse: [
      "Ein emotional aufgeladener Fund persönlicher Gegenstände der ursprünglichen Besitzer",
      "Eine kleine Zombiehorde ausgerechnet im Brautgeschäft",
      "Eine andere Gruppe durchsucht dieselben Räumlichkeiten nach etwas völlig anderem",
      "Die Zeit drängt, da die Hochzeit bereits für ein festes Datum geplant ist"
    ],
    sonstiges: "Eine der wenigen bewusst unbeschwerten, hoffnungsvollen Missionen der Liste, eignet sich gut als Kontrastmoment zwischen düstereren Aufträgen."
  },
  {
    id: "gefaengnis",
    title: "Spuren aus dem Gefängnis",
    auftraggeber: "Gary Nolan, mit stillschweigender Zustimmung von Cole",
    auftraggeberId: "nolan",
    grobesZiel: "Vergangenheitsbewältigung und Erkundung – Rückkehr zu dem Gefängnis, aus dem Gary und Cole einst geflohen sind.",
    exaktesZiel: "Im Gefängnis sollen persönliche Gegenstände, alte Akten oder möglicherweise noch überlebende, eingeschlossene Häftlinge gefunden werden.",
    ereignisse: [
      "Verriegelte Zellentrakte mit noch immer eingesperrten, längst verwandelten Insassen",
      "Hinweise, die endlich Licht auf Coles nie besprochene Vorgeschichte werfen könnten",
      "Ein versteckter Waffen- oder Ausrüstungscache der ehemaligen Wachmannschaft",
      "Ein moralisches Dilemma, falls tatsächlich noch lebende, eingesperrte Menschen gefunden werden"
    ],
    sonstiges: "Starkes Potenzial für Charakterentwicklung bei Cole und Gary, gut geeignet als emotional aufgeladener Höhepunkt einer Session, unabhängig davon, ob Coles Geheimnis am Ende wirklich aufgedeckt wird."
  },
  {
    id: "handelsweg",
    title: "Handelsweg",
    auftraggeber: "Elias Vance, unterstützt von Phil Anders' Bestandsaufzeichnungen",
    auftraggeberId: "vance",
    grobesZiel: "Handel und Diplomatie – einen verlässlichen Kontakt und im besten Fall eine Route zu einer anderen Enklave aufbauen.",
    exaktesZiel: "Eine aus der Ferne vermutete, andere befestigte Siedlung soll aufgespürt und vorsichtig kontaktiert werden, ohne die eigene Position von Ashford preiszugeben.",
    ereignisse: [
      "Die andere Siedlung ist misstrauisch oder offen feindselig gegenüber Fremden",
      "Auf dem Weg dorthin liegt umkämpftes oder von einer dritten Fraktion kontrolliertes Gebiet",
      "Die Gruppe entdeckt, dass die andere Enklave etwas besitzt, das Ashford dringend braucht, zum Beispiel Antimykotika",
      "Ein Verräter oder Spitzel innerhalb der fremden Siedlung"
    ],
    sonstiges: "Kann der Auftakt zu einer langfristigen Handels- oder Bündnisbeziehung werden und eröffnet die Möglichkeit, weitere Siedlungen als wiederkehrende Handlungsorte einzuführen."
  }
];
