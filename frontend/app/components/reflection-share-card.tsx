"use client";

import { useRef, useState } from "react";
import { Icon } from "./ui-icon";

export function downloadReflectionImage(text: string, label: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  const scale = 2;
  const width = 1080;
  const height = 720;
  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);
  context.fillStyle = "#fbf6e5";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#0c6b04";
  context.font = "700 22px Manrope, Arial, sans-serif";
  context.fillText("MINDSUPPORT · REFLECTIONS", 84, 106);
  context.fillStyle = "#253122";
  const words = text.trim().split(/\s+/);
  const maxLines = 6;
  let fontSize = 38;
  let lines: string[] = [];
  while (fontSize >= 27) {
    context.font = `500 ${fontSize}px Manrope, Arial, sans-serif`;
    lines = [];
    let line = "“";
    for (const word of words) {
      const next = `${line}${line === "“" ? "" : " "}${word}`;
      if (context.measureText(`${next}”`).width > width - 168) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(`${line}”`);
    if (lines.length <= maxLines) break;
    fontSize -= 2;
  }
  context.font = `500 ${fontSize}px Manrope, Arial, sans-serif`;
  const startY = 245 - Math.max(0, lines.length - 4) * 20;
  const lineHeight = Math.min(58, 345 / lines.length);
  lines.slice(0, maxLines).forEach((line, index) => context.fillText(line, 84, startY + index * lineHeight, width - 168));
  context.strokeStyle = "#d9d7c4";
  context.beginPath();
  context.moveTo(84, 610);
  context.lineTo(width - 84, 610);
  context.stroke();
  context.fillStyle = "#667060";
  context.font = "500 20px Manrope, Arial, sans-serif";
  context.fillText("Shared with care", 84, 660);
  context.fillStyle = "#0c6b04";
  context.font = "700 24px Manrope, Arial, sans-serif";
  context.fillText("mindsupport", width - 260, 660);
  const link = document.createElement("a");
  link.download = `mindsupport-reflection-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function ReflectionShareCard({ text, label }: { text: string; label: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("");

  async function download() {
    const card = cardRef.current;
    if (!card) return;
    try {
      downloadReflectionImage(text, label);
      setNotice("Reflection card downloaded.");
    } catch {
      setNotice("The preview could not create this image. Please try again.");
    }
  }

  return <div className="reflection-share-tools"><div className="reflection-share-card" ref={cardRef}><span className="section-label">MINDSUPPORT · REFLECTIONS</span><p>“{text}”</p><div><span>Shared with care</span><b>mindsupport</b></div></div><button type="button" className="manager-action manager-action-secondary" onClick={() => void download()}><Icon name="spark" size={15}/> Download share card</button>{notice && <small role="status">{notice}</small>}</div>;
}
