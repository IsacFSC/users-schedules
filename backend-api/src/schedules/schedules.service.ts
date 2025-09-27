import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Skill } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

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
        await this.prisma.usersOnSchedules.createMany({
          data: userIds.map(userId => ({
            userId,
            scheduleId: newSchedule.id,
          })),
        });
      }

      // Vincula tarefas à escala
      if (taskIds?.length) {
        await this.prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { scheduleId: newSchedule.id },
        });
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
        scheduleTasks: { include: { task: true } },
        scheduleUsers: { include: { user: true, userSkills: { include: { skill: true } } } },
      },
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        scheduleTasks: { include: { task: true } },
        scheduleUsers: { include: { user: true, userSkills: { include: { skill: true } } } },
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
        await this.prisma.usersOnSchedules.deleteMany({ where: { scheduleId: id } });
        // Adiciona os novos vínculos
        if (userIds.length) {
          await this.prisma.usersOnSchedules.createMany({
            data: userIds.map(userId => ({ userId, scheduleId: id })),
          });
        }
      }

      // Atualiza tarefas vinculadas à escala
      if (taskIds) {
        // Remove vínculo de todas as tarefas antigas
        await this.prisma.task.updateMany({ where: { scheduleId: id }, data: { scheduleId: null } });
        // Adiciona vínculo às novas tarefas
        if (taskIds.length) {
          await this.prisma.task.updateMany({ where: { id: { in: taskIds } }, data: { scheduleId: id } });
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

  // Skill management for ScheduleUser
  async addSkillToScheduleUser(scheduleId: number, userId: number, skillId: number) {
    const scheduleUser = await this.prisma.scheduleUser.findUnique({
      where: { scheduleId_userId: { scheduleId, userId } },
    });

    if (!scheduleUser) {
      throw new HttpException('Usuário não atribuído a esta escala!', HttpStatus.NOT_FOUND);
    }

    try {
      const userSkill = await this.prisma.userSkill.create({
        data: {
          scheduleId,
          userId,
          skillId,
        },
      });
      return userSkill;
    } catch (error) {
      throw new HttpException(
        'Falha ao adicionar habilidade ao usuário na escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async removeSkillFromScheduleUser(scheduleId: number, userId: number, skillId: number) {
    const scheduleUser = await this.prisma.scheduleUser.findUnique({
      where: { scheduleId_userId: { scheduleId, userId } },
    });

    if (!scheduleUser) {
      throw new HttpException('Usuário não atribuído a esta escala!', HttpStatus.NOT_FOUND);
    }

    try {
      await this.prisma.userSkill.delete({
        where: { scheduleId_userId_skillId: { scheduleId, userId, skillId } },
      });
      return { message: 'Habilidade removida do usuário na escala com sucesso!' };
    } catch (error) {
      throw new HttpException(
        'Falha ao remover habilidade do usuário na escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createSkill(name: string): Promise<Skill> {
    try {
      const skill = await this.prisma.skill.create({
        data: { name },
      });
      return skill;
    } catch (error) {
      throw new HttpException(
        'Falha ao criar habilidade!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAllSkills(): Promise<Skill[]> {
    return this.prisma.skill.findMany();
  }

  async findSkillById(id: number): Promise<Skill> {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new HttpException('Habilidade não encontrada!', HttpStatus.NOT_FOUND);
    }
    return skill;
  }

  async deleteSkill(id: number) {
    try {
      const skill = await this.prisma.skill.findUnique({ where: { id } });
      if (!skill) {
        throw new HttpException('Habilidade não encontrada!', HttpStatus.NOT_FOUND);
      }
      await this.prisma.skill.delete({ where: { id } });
      return { message: 'Habilidade deletada com sucesso!' };
    } catch (error) {
      throw new HttpException(
        'Falha ao deletar habilidade!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
