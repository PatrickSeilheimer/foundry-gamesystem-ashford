const { HTMLField } = foundry.data.fields;

/** Common schema shared by every Item type in Ashford. */
export default class AshfordItemBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new HTMLField({ required: false, blank: true })
    };
  }
}
