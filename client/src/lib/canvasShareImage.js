import { downloadCsvBlob } from "./downloadCsv";

export const downloadStatsCardImage = ({ title, subtitle, lines, filename }) => {
  const width = 720;
  const height = 960;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0b0714");
  gradient.addColorStop(1, "#1a0f2e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#f97316";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(subtitle, 48, 90);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 44px system-ui, sans-serif";
  ctx.fillText(title, 48, 150);

  let y = 240;
  lines.forEach(({ label, value }) => {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "400 18px system-ui, sans-serif";
    ctx.fillText(label, 48, y);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 32px system-ui, sans-serif";
    ctx.fillText(String(value), 48, y + 38);

    y += 96;
  });

  ctx.fillStyle = "#6b7280";
  ctx.font = "400 16px system-ui, sans-serif";
  ctx.fillText("MovieTix Wrapped", 48, height - 40);

  canvas.toBlob((blob) => {
    if (blob) downloadCsvBlob(blob, filename);
  }, "image/png");
};
