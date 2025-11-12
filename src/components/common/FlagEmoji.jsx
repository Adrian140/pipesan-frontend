export default function FlagEmoji({ code, className = "" }) {
  const cc = (code || "").toUpperCase();
  const ok = /^[A-Z]{2}$/.test(cc);
  const toFlag = (iso2) => String.fromCodePoint(
    ...[...iso2].map(ch => 0x1f1e6 + (ch.charCodeAt(0) - 65))
  );
  const glyph = ok ? toFlag(cc) : "🌐";
  const style = {
    fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Twemoji Mozilla','EmojiOne Color',system-ui,sans-serif",
    lineHeight: 1,
  };
  return <span className={`text-lg ${className}`} style={style} aria-hidden>{glyph}</span>;
}
