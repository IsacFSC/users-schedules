import PDFDocument from 'pdfkit';
import { Schedule } from '@prisma/client';

export function generateSchedulePDF(schedule: any): Buffer {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  doc.fontSize(20).text(`Escala: ${schedule.name}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Descrição: ${schedule.description}`);
  doc.text(`Data: ${new Date(schedule.startTime).toLocaleString()} - ${new Date(schedule.endTime).toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(16).text('Usuários nesta escala:');
  schedule.users?.forEach((u: any) => {
    doc.fontSize(12).text(`- ${u.user.name}`);
  });
  doc.moveDown();

  doc.fontSize(16).text('Tarefas nesta escala:');
  schedule.tasks?.forEach((t: any) => {
    doc.fontSize(13).text(`${t.name}`);
    t.description?.split('\n').forEach((line: string) => {
      if (line.startsWith('http')) {
        doc.fillColor('blue').text(line, { link: line, underline: true });
        doc.fillColor('black');
      } else {
        doc.text(line);
      }
    });
    doc.text(`Status: ${t.status}`);
    doc.moveDown(0.5);
  });

  doc.end();
  return Buffer.concat(buffers);
}
