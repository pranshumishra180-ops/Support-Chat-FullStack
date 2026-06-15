import { useEffect, useMemo, useState } from "react";

const DEFAULT_EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "🙏", "🎉", "😍", "😎", "🤝", "✅", "💯"];

function EmojiPicker({ onSelect, onClose }) {
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentEmojis") || "[]");
    } catch {
      return [];
    }
  });

  const emojis = useMemo(() => {
    const unique = [...new Set([...recentEmojis, ...DEFAULT_EMOJIS])];
    return unique.slice(0, 24);
  }, [recentEmojis]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const selectEmoji = (emoji) => {
    const updatedRecent = [emoji, ...recentEmojis.filter((item) => item !== emoji)].slice(0, 8);
    setRecentEmojis(updatedRecent);
    localStorage.setItem("recentEmojis", JSON.stringify(updatedRecent));
    onSelect(emoji);
  };

  return (
    <div className="emoji-picker-panel" role="dialog" aria-label="Emoji picker">
      <div className="emoji-picker-header">
        <strong>Emoji</strong>
        <button type="button" onClick={onClose} aria-label="Close emoji picker">
          ✕
        </button>
      </div>
      <div className="emoji-picker-grid">
        {emojis.map((emoji) => (
          <button key={emoji} type="button" onClick={() => selectEmoji(emoji)} className="emoji-button">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
