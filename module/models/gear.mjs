import AshfordItemBase from "./base-item.mjs";
import { WEAPON_TALENT_KEYS, RANGED_WEAPON_TALENT_KEYS } from "../rules/talents.mjs";
import { CONDITION_CATEGORIES, CONDITION_SEVERITIES } from "../rules/conditions.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * The 5 wearable body-equipment slots. Weapons are equipped independently of these (a held
 * weapon does NOT compete with the "hands" slot — that's for gloves; you can wear gloves and
 * hold a weapon at the same time).
 */
export const EQUIP_SLOTS = ["head", "chest", "hands", "legs", "feet"];

/** The 6 fully separate damage types armor protects against. */
export const ARMOR_TYPES = ["ballistic", "pierce", "blunt", "slash", "explosion", "fire"];

/** Display label + emoji per damage type — reused on chat cards (module/documents/actor.mjs) and
 * anywhere else a damage/armor type needs a human-readable tag outside the sheet's own localized titles. */
export const ARMOR_TYPE_LABELS = {
  ballistic: "Ballistic 🔫",
  pierce: "Pierce 🗡️",
  blunt: "Blunt 🔨",
  slash: "Slash ⚔️",
  explosion: "Explosion 💥",
  fire: "Feuer 🔥"
};

/** Munitionsarten — teilen sich Waffen (AshfordWeapon#ammoType), lose Munition (AshfordAmmo) und
 * Magazine (AshfordMagazine), damit Nachladen/Auffüllen per Schlüssel zueinander passen. */
export const AMMO_TYPES = ["9mm", "magnum", "5.56mm", "7.62mm", "schrot", "pfeil"];

export const AMMO_TYPE_LABELS = {
  "9mm": "9mm",
  magnum: "Magnum Rounds",
  "5.56mm": "5.56mm",
  "7.62mm": "7.62mm",
  schrot: "Schrot",
  pfeil: "Pfeil"
};

/** Wie eine Waffe an ihre Munition kommt (AshfordWeapon#feedType): "magazine" lädt aus einem
 * separaten, wechselbaren AshfordMagazine-Item (AshfordActor#reloadWeapon), "internal" lädt lose
 * Munition direkt in die Waffe (Schrotrohr/Trommel/Bogensehne, eigene Kapazität pro Waffe), "none"
 * verbraucht gar keine Munition (Nahkampf). */
export const FEED_TYPES = ["none", "magazine", "internal"];

export const FEED_TYPE_LABELS = {
  none: "Keine",
  magazine: "Magazin",
  internal: "Intern (lose Munition)"
};

/** Free-item categories used for inventory search/filter (weapon/armor already imply their own category via item.type). */
export const ITEM_CATEGORIES = ["medizin", "nahrung", "munition", "werkzeug", "material", "sonstiges"];

export const ITEM_CATEGORY_LABELS = {
  medizin: "Medizin",
  nahrung: "Nahrung",
  munition: "Munition",
  werkzeug: "Werkzeug",
  material: "Material",
  sonstiges: "Sonstiges"
};

class AshfordPhysicalItem extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      quantity: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      weight: new NumberField({ required: true, initial: 0, min: 0 })
    };
  }
}

export class AshfordWeapon extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Fest zugeordnetes Waffentalent (Abschnitt 6): keine Wahl zwischen zwei Skills für dieselbe Waffe.
      weaponSkill: new StringField({ required: false, blank: true, choices: WEAPON_TALENT_KEYS }),
      // Absoluter Würfelausdruck (Foundry-Syntax, z.B. "2d6+7") — kein einzelner fester Wert mehr.
      // Bei Nahkampfwaffen kommt beim tatsächlichen Schadenswurf zusätzlich der charaktereigene
      // Nahkampfschaden-Bonus obendrauf (AshfordActor#rollWeaponDamage), bei Fernkampfwaffen nicht.
      damageFormula: new StringField({ required: true, blank: true, initial: "1d6" }),
      // Treffer-Bonus/-Malus dieser konkreten Waffe, zusätzlich zu Reichweitenklassen-Modifikatoren bei Fernkampfwaffen.
      accuracyBonus: new NumberField({ required: true, integer: true, initial: 0 }),
      // Manche Waffen sind schneller/langsamer zu führen als der reine Athletik-Wert.
      initiativeMod: new NumberField({ required: true, integer: true, initial: 0 }),
      equipped: new BooleanField({ required: true, initial: false }), // unabhängig von den 5 Körper-Slots
      // Welcher der 6 Rüstungswerte (ARMOR_TYPES) beim automatischen Schadenswurf gegengerechnet wird
      // (AshfordActor#rollWeaponDamage) — ohne diesen Wert wäre die ganze Rüstungswerte-Anzeige rein
      // informativ, ohne dass sie beim Würfeln je tatsächlich etwas abzieht.
      damageType: new StringField({ required: true, blank: false, initial: "blunt", choices: ARMOR_TYPES }),
      // Welche Munitionsart diese Waffe braucht — leer = verbraucht keine Munition (Nahkampfwaffen).
      ammoType: new StringField({ required: false, blank: true, choices: AMMO_TYPES }),
      feedType: new StringField({ required: true, blank: false, initial: "none", choices: FEED_TYPES }),
      // NUR bei feedType "internal" die Quelle der Wahrheit (aktuell geladene lose Schuss, gedeckelt
      // von `capacity`) — bei "magazine" bleibt dieses Feld ungenutzt bei 0, der tatsächliche
      // Munitionsstand lebt stattdessen auf dem eingelegten AshfordMagazine-Item (`loadedMagazineId`
      // -> #loadedMagazine -> system.roundsLoaded). Bei "none" bedeutungslos. Kein Zwei-Felder-Rätsel
      // pro Waffe: welches der beiden Felder gilt, ergibt sich rein aus feedType.
      ammoRemaining: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      // Max. lose Munition direkt in der Waffe (Schrotrohr/Trommel/Bogensehne) — nur bei feedType "internal".
      capacity: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      // Welches eingebettete "magazine"-Item aktuell geladen ist — nur bei feedType "magazine", leer
      // = kein Magazin eingelegt. Wird ausschließlich von AshfordActor#reloadWeapon geschrieben (kein
      // eigenes Eingabefeld im Item-Sheet), das ist zugleich die einzige Exklusivitäts-Garantie:
      // ein Magazin kann so nie versehentlich in zwei Waffen gleichzeitig stecken.
      loadedMagazineId: new StringField({ required: false, blank: true })
    };
  }

  /** True for the 4 Fernkampf-Waffentalente (Pistolen/Gewehre/Schrotflinten/Bögen) — has a range-band table. */
  get isRanged() {
    return RANGED_WEAPON_TALENT_KEYS.includes(this.weaponSkill);
  }

  /** The embedded AshfordMagazine currently racked, or null — only meaningful when feedType === "magazine". */
  get loadedMagazine() {
    if (this.feedType !== "magazine" || !this.loadedMagazineId) return null;
    return this.parent?.actor?.items.get(this.loadedMagazineId) ?? null;
  }
}

/** Lose, stapelbare Munition (z.B. "9mm-Patronen", quantity = Stückzahl) — wird beim Nachladen
 * (feedType "internal") oder Magazin-Auffüllen von AshfordActor#_consumeLooseAmmo verbraucht. */
export class AshfordAmmo extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ammoType: new StringField({ required: true, blank: false, initial: "9mm", choices: AMMO_TYPES })
    };
  }
}

/**
 * Ein einzelnes, physisches Magazin mit eigenem Füllstand (roundsLoaded, gedeckelt von capacity) —
 * für Waffen mit feedType "magazine" (AshfordActor#reloadWeapon lädt eins davon in eine Waffe,
 * #refillMagazine füllt es aus loser Munition wieder auf). Jedes Magazin-Item ist EIN physisches
 * Exemplar: wer mehrere gleichartige Ersatzmagazine besitzt, legt mehrere Items mit quantity 1 an
 * statt die quantity eines einzigen Items hochzuzählen — sonst ließe sich roundsLoaded nicht mehr
 * eindeutig einem einzelnen Magazin zuordnen (genau wie quantity>1 bei Waffen schon heute nicht
 * mehrere unabhängig ladbare Exemplare bedeutet).
 */
export class AshfordMagazine extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ammoType: new StringField({ required: true, blank: false, initial: "9mm", choices: AMMO_TYPES }),
      capacity: new NumberField({ required: true, integer: true, initial: 10, min: 1 }),
      roundsLoaded: new NumberField({ required: true, integer: true, initial: 0, min: 0 })
    };
  }
}

export class AshfordArmor extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Vier vollständig getrennte Rüstungswerte statt eines einzelnen Schutzwerts.
      armor: new SchemaField({
        ballistic: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        pierce: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        blunt: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        slash: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        explosion: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        fire: new NumberField({ required: true, integer: true, initial: 0, min: 0 })
      }),
      slot: new StringField({ required: false, blank: true, choices: EQUIP_SLOTS }),
      equipped: new BooleanField({ required: true, initial: false }),
      // Manche Ausrüstung bremst oder beschleunigt (z.B. schwere Panzerung vs. leichte Schuhe).
      initiativeMod: new NumberField({ required: true, integer: true, initial: 0 }),
      // Flacher Bonus auf den Nahkampfschaden-Wert (z.B. Schlagring) — kommt additiv zum Kraft-Bonus dazu.
      meleeDamageBonus: new NumberField({ required: true, integer: true, initial: 0 }),
      // Flacher Bonus/Malus aufs ERGEBNIS eines Talentwurfs (nicht auf den Würfelpool!) — angelegte
      // Ausrüstung addiert sich auf die Würfelsumme, statt zusätzliche Würfel zu geben.
      talentBonuses: new ArrayField(
        new SchemaField({
          talentKey: new StringField({ required: false, blank: true }),
          value: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        { required: false }
      )
    };
  }
}

export class AshfordEquipment extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: new StringField({ required: false, blank: true, initial: "sonstiges", choices: ITEM_CATEGORIES }),
      // Manche Ausrüstung (z.B. Taschenlampe) lässt sich an-/ausschalten und wirft dabei einen ECHTEN
      // Lichtkegel vom Token aus (Foundry TokenDocument#light, siehe AshfordActor#refreshLightSources).
      // `enabled` markiert die Fähigkeit selbst (nur die Taschenlampe hat sie), `active` den aktuellen
      // Schalterzustand. Ein Winkel < 360° dreht sich in Foundry automatisch mit der Token-Blickrichtung
      // mit — dafür ist kein eigener Code zur Blickrichtungs-Verfolgung nötig.
      lightSource: new SchemaField({
        enabled: new BooleanField({ required: true, initial: false }),
        active: new BooleanField({ required: true, initial: false }),
        dim: new NumberField({ required: true, initial: 12, min: 0 }),
        bright: new NumberField({ required: true, initial: 6, min: 0 }),
        angle: new NumberField({ required: true, initial: 70, min: 1, max: 360 }),
        color: new StringField({ required: false, blank: true, initial: "#f6e6b8" })
      })
    };
  }
}

export class AshfordConsumable extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: new StringField({ required: false, blank: true, initial: "sonstiges", choices: ITEM_CATEGORIES }),
      usesRemaining: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      // z.B. "Essen", "Trinken", "Anwenden" statt des generischen "Benutzen" — beschriftet den Aktions-Button im Rucksack.
      actionLabel: new StringField({ required: false, blank: true, initial: "Benutzen" }),
      // Combi-Item (z.B. Erste-Hilfe-Kasten): beim Benutzen werden diese Einträge als neue
      // Consumables im Inventar des Nutzers erzeugt, und DIESES Item wird komplett gelöscht statt
      // nur runtergezählt (siehe AshfordItem#useConsumable). Leer = normales Einzel-Item.
      comboItems: new ArrayField(
        new SchemaField({
          name: new StringField({ required: true, blank: false }),
          quantity: new NumberField({ required: true, integer: true, initial: 1, min: 1 })
        }),
        { required: false }
      ),
      // Verschiebt beim Benutzen den (für Spieler unsichtbaren) Infektionswert direkt — z.B. Antimykotikum/
      // Desinfektionsmittel setzen ihn mit einem großen negativen Wert auf 0 (geclamped in base-actor.mjs),
      // ohne dass der Spielleiter eingreifen muss. 0 = kein Effekt (Normalfall für alle anderen Items).
      infectionDelta: new NumberField({ required: true, integer: true, initial: 0 }),
      // Falls gefüllt (z.B. Adrenalin-Spritze: "3d6"): eigener Würfel-Button im Rucksack würfelt diese
      // Formel und addiert das Ergebnis auf die Gesundheit des Ziels (AshfordActor#rollConsumableHeal).
      healFormula: new StringField({ required: false, blank: true }),
      // Einmaliges "Entzünden" statt An/Aus-Schalter (siehe AshfordEquipment#lightSource) — z.B.
      // Streichhölzer: leuchtet für durationSeconds, dann fällt das Token-Licht automatisch zurück
      // auf das, was aus aktiver Ausrüstung folgt (AshfordActor#igniteConsumableLight).
      lightSource: new SchemaField({
        enabled: new BooleanField({ required: true, initial: false }),
        dim: new NumberField({ required: true, initial: 2, min: 0 }),
        bright: new NumberField({ required: true, initial: 0, min: 0 }),
        angle: new NumberField({ required: true, initial: 360, min: 1, max: 360 }),
        color: new StringField({ required: false, blank: true, initial: "#f6b23a" }),
        durationSeconds: new NumberField({ required: true, integer: true, initial: 60, min: 1 })
      })
    };
  }
}

/**
 * An active (or archived) status condition on an actor. Can be seeded from the
 * module/rules/conditions.mjs catalog (via `conditionKey`) or created as a GM homebrew
 * one-off (blank `conditionKey`). Mechanical effects are intentionally shallow — see the
 * doc comment in conditions.mjs for why "note"-mode effects stay descriptive-only.
 */
export class AshfordCondition extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      conditionKey: new StringField({ required: false, blank: true }), // Katalog-Schlüssel, leer = Homebrew
      category: new StringField({
        required: false,
        blank: true,
        initial: "sonstiges",
        choices: CONDITION_CATEGORIES.map(c => c.key)
      }),
      severity: new StringField({ required: false, blank: true, initial: "gering", choices: CONDITION_SEVERITIES }),
      active: new BooleanField({ required: true, initial: true }), // false = beendet/archiviert, aber nicht gelöscht
      source: new StringField({ required: false, blank: true }), // z.B. "Zombie-Biss", "Sturz von der Mauer"
      note: new StringField({ required: false, blank: true }),
      duration: new SchemaField({
        type: new StringField({
          required: true,
          initial: "permanent",
          choices: ["permanent", "rounds", "minutes", "hours", "days", "event"]
        }),
        value: new NumberField({ required: false, integer: true, min: 0 }),
        eventLabel: new StringField({ required: false, blank: true })
      }),
      effects: new ArrayField(
        new SchemaField({
          mode: new StringField({ required: true, initial: "note", choices: ["talentMod", "derivedMod", "note"] }),
          // talentMod: Talent-Key (module/rules/talents.mjs). derivedMod: "ausweichen"|"initiativeMod"|"nahkampfschaden"|"healthMax".
          key: new StringField({ required: false, blank: true }),
          value: new NumberField({ required: false, integer: true, initial: 0 }),
          label: new StringField({ required: false, blank: true })
        }),
        { required: false }
      )
    };
  }
}
