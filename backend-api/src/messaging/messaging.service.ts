import { Injectable, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(conversationId: number, file: Express.Multer.File, user: any) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new HttpException('Conversa não encontrada!', HttpStatus.NOT_FOUND);
    }

    const isParticipant = conversation.participants.some((participant) => participant.id === user.id);
    if (!isParticipant) {
      throw new ForbiddenException('Você não tem permissão para enviar arquivos nesta conversa!');
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = join(process.cwd(), 'files', fileName);

    try {
      writeFileSync(filePath, file.buffer);
    } catch (error) {
      throw new HttpException(
        'Falha ao salvar o arquivo!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const newMessage = await this.prisma.message.create({
      data: {
        content: file.originalname, // Or some other content
        authorId: user.id,
        conversationId: conversationId,
        file: fileName,
        fileMimeType: file.mimetype,
      },
    });

    return newMessage;
  }
}
