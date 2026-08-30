/** Small comparison/logic helpers our .hbs templates rely on. */
export default function registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("ne", (a, b) => a !== b);
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("and", (...args) => args.slice(0, -1).every(Boolean));
  Handlebars.registerHelper("gte", (a, b) => a >= b);
  Handlebars.registerHelper("lte", (a, b) => a <= b);
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("lt", (a, b) => a < b);
  Handlebars.registerHelper("add", (a, b) => Number(a) + Number(b));
  Handlebars.registerHelper("signed", n => (Number(n) >= 0 ? `+${n}` : `${n}`));
}
