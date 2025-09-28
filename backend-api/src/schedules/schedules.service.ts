import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Skill } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async addUser(scheduleId: number, userId: number, skill: Skill) {
    return this.prisma.usersOnSchedules.create({
      data: {
        scheduleId,
        userId,
        skill,
      },
    });
  }

  async removeUser(scheduleId: number, userId: number) {
    return this.prisma.usersOnSchedules.delete({
      where: {
        userId_scheduleId: {
          userId,
          scheduleId,
        },
      },
    });
  }

  async uploadFile(scheduleId: number, file: Express.Multer.File) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new HttpException('Escala não encontrada!', HttpStatus.NOT_FOUND);
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

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { file: fileName },
    });

    return updatedSchedule;
  }

  async findSchedulesByUser(userId: number) {
    // Busca escalas onde o usuário está vinculado
    return this.prisma.schedule.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });
  }

  async create(createScheduleDto: CreateScheduleDto) {
    const { taskIds, userIds, ...scheduleData } = createScheduleDto;
    try {
      // Cria a escala
      const newSchedule = await this.prisma.schedule.create({
        data: {
          name: scheduleData.name,
          description: scheduleData.description,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
        },
      });

      // Vincula usuários à escala
      if (userIds?.length) {
          await this.prisma.$executeRaw`DELETE FROM UsersOnSchedules WHERE scheduleId = ${newSchedule.id}`;
          for (const userId of userIds) {
            await this.prisma.$executeRaw`INSERT INTO UsersOnSchedules (userId, scheduleId) VALUES (${userId}, ${newSchedule.id})`;
          }
      }

      // Vincula tarefas à escala
      if (taskIds?.length) {
          await this.prisma.$executeRaw`UPDATE Task SET scheduleId = ${newSchedule.id} WHERE id IN (${taskIds.join(',')})`;
      }

      return newSchedule;
    } catch (error) {
      throw new HttpException(
        'Falha ao criar escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.prisma.schedule.findMany({
      take: Number(limit),
      skip: Number(offset),
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });
    if (!schedule) {
      throw new HttpException('Escala não encontrada!', HttpStatus.NOT_FOUND);
    }
    return schedule;
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto) {
    const { taskIds, userIds, ...scheduleData } = updateScheduleDto;
    try {
      // Atualiza dados da escala
      const updatedSchedule = await this.prisma.schedule.update({
        where: { id },
        data: {
          name: scheduleData.name,
          description: scheduleData.description,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
        },
      });

      // Atualiza usuários vinculados à escala
      if (userIds) {
        // Remove todos os vínculos antigos
          await this.prisma.$executeRaw`DELETE FROM UsersOnSchedules WHERE scheduleId = ${id}`;
          for (const userId of userIds) {
            await this.prisma.$executeRaw`INSERT INTO UsersOnSchedules (userId, scheduleId) VALUES (${userId}, ${id})`;
          }
      }

      // Atualiza tarefas vinculadas à escala
      if (taskIds) {
        // Remove vínculo de todas as tarefas antigas
          await this.prisma.$executeRaw`UPDATE Task SET scheduleId = NULL WHERE scheduleId = ${id}`;
          for (const taskId of taskIds) {
            await this.prisma.$executeRaw`UPDATE Task SET scheduleId = ${id} WHERE id = ${taskId}`;
          }
      }

      return updatedSchedule;
    } catch (error) {
      throw new HttpException(
        'Falha ao atualizar escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: number) {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
      });
      if (!schedule) {
        throw new HttpException('Escala não encontrada!', HttpStatus.NOT_FOUND);
      }
      await this.prisma.schedule.delete({
        where: { id },
      });
      return { message: 'Escala deletada com sucesso!' };
    } catch (error) {
      throw new HttpException(
        'Falha ao deletar escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
