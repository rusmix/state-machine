import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { IToggle } from '../toggles/toggles.model';
import { createCanvas } from 'canvas';

@Injectable()
export class DrawerService {
  constructor() {}

  public drawToggles(toggles: IToggle[], filename: string) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';

    const toggleRadius = 30;
    const startX = 100;
    const startY = 100;
    const gapX = 150;
    const gapY = 150;

    const positions = {};

    // Расчет позиций
    toggles.forEach((toggle, idx) => {
      const x = startX + (idx % 3) * gapX;
      const y = startY + Math.floor(idx / 3) * gapY;
      positions[toggle.id] = { x, y };

      // Нарисовать узел (toggle)
      ctx.beginPath();
      ctx.arc(x, y, toggleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = toggle.data_type === 'discrete' ? '#4caf50' : '#2196f3';
      ctx.fill();

      // Отображение идентификатора
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(toggle.local_id), x, y);

      // Добавить текущее значение
      const valueText =
        toggle.data_type === 'discrete'
          ? toggle.discrete_value
          : toggle.analog_value;
      ctx.font = '10px Arial';
      ctx.fillStyle = '#000'; // Черный текст для значений
      ctx.fillText(`Value: ${valueText}`, x, y + 20);
    });

    // Нарисовать зависимости (стрелки)
    ctx.strokeStyle = '#000';
    toggles.forEach((toggle) => {
      const fromPos = positions[toggle.id];
      toggle.dependency_toggles.forEach((depId) => {
        const toPos = positions[depId];
        if (toPos) {
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.stroke();

          // Нарисовать наконечник стрелки
          const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
          const arrowSize = 8;
          ctx.beginPath();
          ctx.moveTo(toPos.x, toPos.y);
          ctx.lineTo(
            toPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
            toPos.y - arrowSize * Math.sin(angle - Math.PI / 6),
          );
          ctx.lineTo(
            toPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
            toPos.y - arrowSize * Math.sin(angle + Math.PI / 6),
          );
          ctx.closePath();
          ctx.fillStyle = '#000';
          ctx.fill();
        }
      });
    });

    // Сохранить в файл
    const out = fs.createWriteStream(`./images/${filename}.jpg`);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => console.log(`Файл создан: ${filename}`));
  }
}
