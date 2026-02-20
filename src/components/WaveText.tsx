"use client";

interface WaveTextProps {
  text: string;
  className?: string;
}

export default function WaveText({ text, className }: WaveTextProps) {
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="wave-char"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
