export function suggestGoogleFontCss(fontName: string): {
  cssImport: string;
  fontFamily: string;
} {
  const family = fontName.trim();
  const query = family.replace(/\s+/g, "+");
  return {
    cssImport: `<link href="https://fonts.googleapis.com/css2?family=${query}:wght@400;600;700&display=swap" rel="stylesheet">`,
    fontFamily: `'${family}', sans-serif`,
  };
}
