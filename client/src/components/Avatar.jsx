const FALLBACK_COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a"];

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "?";
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function getColorFromName(name = "") {
  const seed = name.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  return FALLBACK_COLORS[seed % FALLBACK_COLORS.length];
}

function Avatar({ name = "", src = "", size = 40, className = "" }) {
  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: backgroundColor,
        color: "white",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default Avatar;
