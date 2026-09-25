/**
 * Zombie-NSC-Statblocks ("Ashford Adventures – Zombie-Gegner", Stand 2026-09-25). Reine Rohdaten --
 * scripts/generate-pack-sources.mjs baut daraus vollständige Creature-Actors mit eingebetteten
 * Talent-Items (Kraft/Athletik/Waffenloser Kampf) und einem Waffen-Item für die natürliche Waffe
 * (Biss/Kratzen), exakt nach demselben Kraft/Athletik-Ableitungsschema wie bei Spielercharakteren
 * (module/rules/derived.mjs) -- NUR das HP-Maximum ist bei mehreren Typen ein bewusster manueller
 * Wert unterhalb der PC-Formel-Untergrenze (siehe Dokument), kein automatisch abgeleiteter.
 *
 * Sondermechaniken (Ausdauerläufer, Sofortiger Alarmruf, Getrieben vom Hunger, Wall aus totem
 * Fleisch, Sporenplatzer) sind bewusst NICHT automatisiert -- gleiche Tiefe wie
 * module/rules/conditions.mjs: nur "Wall aus totem Fleisch" (Tank) ist ein reiner Zahlenwert und
 * wird als eingebettetes Rüstungs-Item ohne Körper-Slot modelliert (armor.blunt=3, immer equipped),
 * das dadurch ganz normal in AshfordCreature#prepareDerivedData mit aufsummiert wird. Alle anderen
 * bleiben Beschreibungstext, den der Spielleiter manuell am Tisch auflöst.
 *
 * @typedef {object} CreatureEntry
 * @property {string} name
 * @property {string} tier
 * @property {boolean} infectious
 * @property {number} healthMax - manueller Wert (siehe oben), NICHT aus kraftMod abgeleitet
 * @property {number} kraftMod - Stärken - Schwächen auf Kraft (-2..+3)
 * @property {number} athletikMod - Stärken - Schwächen auf Athletik (-2..+3)
 * @property {number} unarmedLevel - Stärken - Schwächen auf Waffenloser Kampf (-2..+3)
 * @property {string} naturalWeaponName
 * @property {string} naturalWeaponFormula - Basis-Schadensformel VOR dem Kraft-Mod (der wird beim
 *   Wurf automatisch von AshfordActor#rollWeaponDamage addiert, siehe dort)
 * @property {{blunt?:number}} [innateArmor] - nur Tank: "Wall aus totem Fleisch"
 * @property {{name:string, description:string}} [specialAbility]
 * @property {string} biography - HTML, Fließtext + GM-Hinweis + Punkte-Äquivalent
 */

/** @type {CreatureEntry[]} */
export const CREATURES = [
  {
    name: "Newbie",
    tier: "Horde",
    infectious: true,
    healthMax: 20,
    kraftMod: -1,
    athletikMod: -2,
    unarmedLevel: 0,
    naturalWeaponName: "Biss/Kratzen",
    naturalWeaponFormula: "1d4+1",
    biography:
      "<p>Kürzlich Verwandelte – Menschen, die erst vor Kurzem der überall in der Luft liegenden Sporenlast erlegen sind, nicht Überreste der ursprünglichen Verwandlungswelle vom Tag des Falls. Der Grund, warum niemand in Ashford allein zur Tür hinausgeht: kein besonderer Zombie, keine Geschichte, kein Wiedererkennungswert – einfach kürzlich draufgegangenes, noch nicht lange totes Fleisch in Mengen. Gedacht für Szenen, in denen die schiere Zahl die Bedrohung ist, nicht der einzelne Gegner.</p>" +
      "<p><strong>GM-Hinweis:</strong> Für Massenszenen mit rund 10 gleichzeitigen Gegnern gedacht, z. B. wenn eine Palisaden-Lücke überrannt wird. Ein einzelner Treffer reicht meist, um einen von ihnen zu erledigen.</p>" +
      "<p><strong>Punkte-Äquivalent:</strong> +8 (deutlich unter PC-Niveau, absichtlich schwach)</p>"
  },
  {
    name: "Runner",
    tier: "Streuner",
    infectious: true,
    healthMax: 25,
    kraftMod: -1,
    athletikMod: 3,
    unarmedLevel: 0,
    naturalWeaponName: "Biss/Kratzen",
    naturalWeaponFormula: "1d4+1",
    specialAbility: {
      name: "Ausdauerläufer",
      description:
        "<p>Das System hat aktuell keine eigene Bewegungsraten- oder Verfolgungsmechanik, daher vorerst rein narrativ zu handhaben: Dieser Typ ermüdet praktisch nicht und kann eine Gruppe über extrem lange Strecken verfolgen, ohne langsamer zu werden. Zu Fuß wegrennen funktioniert gegen ihn nicht zuverlässig – ein Fahrzeug, eine verschlossene Tür, ein Höhenunterschied oder eine gezielte Ablenkung schon.</p>"
    },
    biography:
      "<p>Ein Typ, der nicht schlurft. Ob es an einer noch nicht vollständig verfallenen Muskulatur liegt oder etwas anderem, weiß niemand in Ashford genau – nur, dass man ihm nicht einfach davonlaufen kann. Runner sind im direkten Kampf kaum gefährlicher als ein Newbie, aber sie geben nicht auf und werden nicht langsamer.</p>" +
      "<p><strong>GM-Hinweis:</strong> Weniger als Kampf-, mehr als Verfolgungsgegner gedacht – gut geeignet, um eine Flucht spannend statt trivial zu machen, ohne im direkten Schlagabtausch überzogen tödlich zu sein.</p>" +
      "<p><strong>Punkte-Äquivalent:</strong> −2 (leicht über der Basis, die Stärke liegt in der Sondermechanik, nicht im Kampfwert)</p>"
  },
  {
    name: "Walker",
    tier: "Streuner",
    infectious: true,
    healthMax: 45,
    kraftMod: 1,
    athletikMod: 0,
    unarmedLevel: 0,
    naturalWeaponName: "Biss/Kratzen",
    naturalWeaponFormula: "1d6+2",
    biography:
      "<p>Der Standard-Zombie ohne Schnickschnack: kein Sonderfall, keine Story, kein Gimmick – einfach ein durchschnittlich kräftiger, durchschnittlich schneller Untoter. Sein Ausweichen von 10 ist genau der „Standard-Verteidiger“, gegen den im Kernmechanik-Dokument alle Trefferwahrscheinlichkeiten durchgerechnet wurden – dieser Typ ist im wörtlichen Sinn der Maßstab.</p>" +
      "<p><strong>GM-Hinweis:</strong> Der Typ für „einfach ein Zombie“ – etwas härter als die beiden vorigen Typen, aber ohne Überraschungen. Gut geeignet, um eine Horde aus Newbies mit ein paar Walkern durchzumischen und die Bedrohung graduell zu steigern.</p>" +
      "<p><strong>Punkte-Äquivalent:</strong> −2 (leicht über Basis, spürbar robuster als Newbie und Runner)</p>"
  },
  {
    name: "Screamer",
    tier: "Streuner",
    infectious: true,
    healthMax: 10,
    kraftMod: -2,
    athletikMod: 1,
    unarmedLevel: -1,
    naturalWeaponName: "Biss/Kratzen",
    naturalWeaponFormula: "1d4+1",
    specialAbility: {
      name: "Sofortiger Alarmruf",
      description:
        "<p>Es ist <strong>keine Wahrnehmungsprobe nötig</strong>. Sobald der Screamer von den Charakteren entdeckt wird oder selbst Sichtkontakt zur Gruppe bekommt, schreit er noch in derselben Runde, sofort und ohne Verzögerung. Der Spielleiter würfelt danach wie gewohnt für die nächsten 1W6 Runden zusätzliche Zombies (Newbies, Walker, was passt) in die Szene, sofern welche in der Umgebung plausibel sind. Wegen seiner extrem niedrigen HP ist der Screamer oft schon tot, bevor die herbeigerufene Horde überhaupt eintrifft – der Schrei lässt sich aber nicht zurücknehmen, sobald er raus ist. Wer die Horde verhindern will, muss den Screamer erledigen, bevor er entdeckt wird oder selbst entdeckt – nicht danach.</p>"
    },
    biography:
      "<p>Ein seltener, unangenehmer Sonderfall: ein Zombie mit einem dauerhaft übererregten Nervensystem, der bei jeder Wahrnehmung von Beute reflexartig losschreit – so unkontrolliert und sofort, dass er selbst kaum zum eigentlichen Kämpfen kommt. Körperlich ist er dabei erschreckend zerbrechlich.</p>" +
      "<p><strong>GM-Hinweis:</strong> Eher seltener Sonderfall als Standard-Gegner. Besonders fies in Kombination mit Heimlichkeits-lastigen Spielgruppen: Ein einziger Fehltritt kann die Horde auslösen, bevor überhaupt gekämpft wird.</p>" +
      "<p><strong>Punkte-Äquivalent:</strong> +3 (schwächster Nahkämpfer der Liste nach dem Newbie, die Gefahr liegt vollständig im Schrei)</p>"
  },
  {
    name: "Berserker",
    tier: "Mutation",
    infectious: true,
    healthMax: 55,
    kraftMod: 3,
    athletikMod: 1,
    unarmedLevel: 2,
    naturalWeaponName: "Biss/Kratzen",
    naturalWeaponFormula: "1d10+4",
    specialAbility: {
      name: "Getrieben vom Hunger",
      description:
        "<p>Jahre der Unterversorgung haben aus diesem Zombie ein reines Hunger-Wesen gemacht. Trifft er auf mehrere potenzielle Ziele gleichzeitig – Charaktere, andere NPCs, aber auch offen daliegende Nahrung, Aas oder frisches Fleisch –, stürzt er sich immer zuerst auf das nächstgelegene oder am leichtesten erreichbare „Essbare“, unabhängig davon, wie gefährlich es für ihn selbst ist oder wie sinnvoll es taktisch wäre, zuerst die größte Bedrohung anzugreifen. Spielercharaktere können das gezielt ausnutzen: rohes Fleisch, ein Kadaver oder sogar ein bewusst geopfertes NPC in Wurfweite lenkt ihn zuverlässig ab, bevor er die eigentliche Gruppe überhaupt bemerkt.</p>"
    },
    biography:
      "<p>Einer der ältesten noch aktiven Zombies um Ashford – ein Übriggebliebener der ursprünglichen Verwandlungswelle vom Tag des Falls, seit Jahren in einem ausgezehrten Streifgebiet unterwegs, in dem kaum noch etwas Lebendiges übrig ist. Der Körper ist bis auf Muskeln und Sehnen abgemagert, aber genau das macht ihn nicht schwach, sondern gefährlich: jede Bewegung ist von roher, unstillbarer Gier getrieben. Enorm aggressiv, enorm stark – aber auch berechenbar genug, um ihn gezielt auszutricksen.</p>" +
      "<p><strong>GM-Hinweis:</strong> Höchster Einzeltreffer-Schaden im gesamten Dokument (1W10+7, Schnitt ca. 12,5 pro Treffer plus mögliche Explosionen) und die zweithöchste HP nach Tank – ein Gegner, den man ernst nehmen muss, gegen den es aber dank des Hunger-Triebs echte, planbare Gegenstrategien gibt statt reinem Würfelglück.</p>" +
      "<p><strong>Punkte-Äquivalent:</strong> −14 (über PC-Budget, bewusst überdurchschnittlich gefährlich)</p>"
  },
  {
    name: "Tank",
    tier: "Mutation",
    infectious: true,
    healthMax: 55,
    kraftMod: 3,
    athletikMod: -1,
    unarmedLevel: 1,
    naturalWeaponName: "Biss/Kratzen bzw. Packen",
    naturalWeaponFormula: "1d8+4",
    innateArmor: { blunt: 3 },
    specialAbility: {
      name: "Wall aus totem Fleisch",
      description:
        "<p>Ignoriert die ersten 3 Punkte Schaden aus jedem Treffer mit einer Schlagwaffe (dicke, vernarbte Muskelmasse dämpft stumpfe Wucht) – analog zur Rüstungsmechanik aus <code>ausruestung-und-waffen.md</code>. Bereits als Rüstungswert (Blunt 3) auf diesem Bogen hinterlegt. Gegen Hieb-, Stich- und Schusswaffen gilt der volle Schaden.</p>"
    },
    biography:
      "<p>Ein Zombie, der zu Lebzeiten Bodybuilder, Türsteher oder Profisportler gewesen sein könnte – die Statur ist selbst nach Jahren des Verfalls unübersehbar. Langsam, aber wenn dieser Griff einmal zupackt, ist es fast egal, was man trägt.</p>" +
      "<p><strong>GM-Hinweis:</strong> Der Gegenpol zum Berserker – ähnlich viel HP, aber langsamer, dafür mit eingebauter Schadensreduktion statt eines ausnutzbaren Verhaltensmusters. Guter „Wall“, den die Gruppe entweder umgehen oder mit vereinten Kräften niederringen muss.</p>" +
      "<p><strong>Punkte-Äquivalent:</strong> −7 (innerhalb des PC-Budgets, guter Elite-Einzelgegner)</p>"
  },
  {
    name: "Boomer",
    tier: "Mutation",
    infectious: true,
    healthMax: 35,
    kraftMod: -1,
    athletikMod: -2,
    unarmedLevel: 0,
    naturalWeaponName: "Biss/Kratzen",
    naturalWeaponFormula: "1d6+2",
    specialAbility: {
      name: "Sporenplatzer",
      description:
        "<p>Wird der Boomer getötet (0 HP oder weniger) oder erleidet er in einem einzelnen Treffer mindestens 15 Punkte Schaden, platzt sein aufgeblähter Körper und setzt in einem Radius von etwa 3 Metern eine dichte Sporenwolke frei. Jeder Charakter in der Wolke ohne Gasmaske (siehe <code>ausruestung-und-waffen.md</code>, Gift-/Sporen-Immunität) sieht sich laut Weltenbau schlagartig einer massiv erhöhten Sporendosis ausgesetzt. Bis eine eigene Infektionsmechanik existiert, am einfachsten so zu handhaben: eine schwere Medizin- oder Natur-Probe (Zielwert 16); bei Misserfolg beginnt beim betroffenen Charakter in den kommenden Tagen das erste bekannte Symptomstadium (gerötete, schmerzende Augen, siehe Zeitstrahl-Dokument). Fernkämpfer sollten diesen Typ bevorzugt auf Distanz ausschalten statt im Nahkampf zu riskieren.</p>"
    },
    biography:
      "<p>Ein extremer Einzelfall statt eines häufigen Gegnertyps: ein Körper, bei dem sich über die Jahre eine ungewöhnlich dichte innere Sporenmasse angesammelt hat, sichtbar aufgebläht und straff. Langsam, meist harmlos wirkend im Nahkampf – bis er stirbt.</p>" +
      "<p><strong>Punkte-Äquivalent:</strong> +6 (schwacher Nahkämpfer, die eigentliche Gefahr liegt im Tod selbst)</p>"
  }
];
