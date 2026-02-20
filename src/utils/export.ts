import Konva from 'konva';

export function exportToPng(stage: Konva.Stage, filename = 'garden-plan.png') {
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
