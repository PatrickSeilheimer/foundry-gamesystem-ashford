import {
  CONDITIONS,
  CONDITION_CATEGORIES,
  CONDITION_SEVERITIES,
  CONDITION_DURATION_TYPES,
  conditionByKey
} from "../rules/conditions.mjs";

const { DialogV2 } = foundry.applications.api;

/** DialogV2 with a search box + category chips wired up client-side after render (no re-render round-trip needed). */
class AshfordConditionPickerDialog extends DialogV2 {
  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;
    const search = root.querySelector('[name="cp-search"]');
    const chips = root.querySelectorAll(".cp-chip");
    const rows = root.querySelectorAll(".cp-condition-row");
    const hiddenKeyInput = root.querySelector('[name="conditionKey"]');

    const applyFilter = () => {
      const query = (search?.value ?? "").trim().toLowerCase();
      const activeCategory = root.querySelector(".cp-chip.active")?.dataset.category ?? "all";
      rows.forEach(row => {
        const matchesText = !query || row.dataset.name.includes(query);
        const matchesCategory = activeCategory === "all" || row.dataset.category === activeCategory;
        row.hidden = !(matchesText && matchesCategory);
      });
    };

    search?.addEventListener("input", applyFilter);
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        applyFilter();
      });
    });
    const selectedHint = root.querySelector(".cp-selected-hint");
    rows.forEach(row => {
      row.addEventListener("click", () => {
        rows.forEach(r => r.classList.remove("selected"));
        row.classList.add("selected");
        if (hiddenKeyInput) hiddenKeyInput.value = row.dataset.key;
        const severitySelect = root.querySelector('[name="severity"]');
        if (severitySelect && row.dataset.severity) severitySelect.value = row.dataset.severity;
        if (selectedHint) selectedHint.innerHTML = `<strong>${row.dataset.name}</strong> — ${row.dataset.description}`;
      });
    });
  }
}

/** Lets a player/GM search the Zustände catalog, tweak severity/duration/note and add it as an embedded condition Item. */
export default class AshfordConditionPicker {
  static async prompt(actor) {
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/ashford/templates/apps/condition-picker.hbs",
      {
        categories: CONDITION_CATEGORIES,
        conditions: CONDITIONS,
        severities: CONDITION_SEVERITIES,
        durationTypes: CONDITION_DURATION_TYPES
      }
    );

    const result = await AshfordConditionPickerDialog.wait({
      window: { title: "Zustand hinzufügen" },
      content,
      classes: ["ashford-condition-picker"],
      position: { width: 560, height: 700 },
      buttons: [
        {
          action: "add",
          label: "Hinzufügen",
          default: true,
          callback: (event, button) => {
            const form = button.form;
            return {
              key: form.querySelector('[name="conditionKey"]')?.value ?? "",
              severity: form.querySelector('[name="severity"]')?.value,
              durationType: form.querySelector('[name="durationType"]')?.value,
              durationValue: Number(form.querySelector('[name="durationValue"]')?.value ?? 0),
              eventLabel: form.querySelector('[name="eventLabel"]')?.value ?? "",
              source: form.querySelector('[name="source"]')?.value ?? "",
              note: form.querySelector('[name="note"]')?.value ?? ""
            };
          }
        },
        { action: "cancel", label: "Abbrechen" }
      ]
    });

    if (!result?.key) {
      if (result) ui.notifications?.warn("Kein Zustand ausgewählt — nichts hinzugefügt.");
      return null;
    }

    const catalogEntry = conditionByKey(result.key);
    if (!catalogEntry) return null;

    return actor.createEmbeddedDocuments("Item", [
      {
        name: catalogEntry.name,
        type: "condition",
        img: "icons/svg/skull.svg",
        system: {
          conditionKey: catalogEntry.key,
          category: catalogEntry.category,
          severity: result.severity || catalogEntry.severity,
          active: true,
          source: result.source,
          note: result.note,
          duration: {
            type: result.durationType || catalogEntry.defaultDuration.type,
            value: result.durationValue || catalogEntry.defaultDuration.value || 0,
            eventLabel: result.eventLabel || catalogEntry.defaultDuration.eventLabel || ""
          },
          effects: catalogEntry.effects,
          description: `<p>${catalogEntry.description}</p>`
        }
      }
    ]);
  }
}
