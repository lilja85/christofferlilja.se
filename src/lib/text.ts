// Textfiler med uttrycklig teckenkodning. Annars gissar webbläsaren på Latin-1 och å/ä/ö blir fel.
export const textResponse = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
