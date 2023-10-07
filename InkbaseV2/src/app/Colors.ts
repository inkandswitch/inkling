const COLORS: Record<string, string> = {};

let colors = [
  'GREY_DARK',
  'GREY_LESS_DARK',
  'GREY_MID',
  'GREY_LIGHT',
  'GREY_BRIGHT',
  'WHITE',
  'BLUE',
  'INK',
];

// Grab the above listed colors from the stylesheet.
// This is a temporary measure. Ultimately, we shouldn't be setting colors via JS.
for (const color in colors) {
  let cssName = color.toLowerCase().replace('_', '-');
  COLORS[color] = window
    .getComputedStyle(document.body)
    .getPropertyValue(`--${cssName}-color`);
}

export default COLORS;
