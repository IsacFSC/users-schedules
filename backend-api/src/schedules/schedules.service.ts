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
      const newSchedule = await this.prisma.schedule.create({
        data: {
          ...scheduleData,
          scheduleTasks: {
            create: taskIds?.map((taskId) => ({ taskId })),
          },
          scheduleUsers: {
            create: userIds?.map((userId) => ({ userId })),
          },
        },
        include: {
          scheduleTasks: true,
          scheduleUsers: true,
        },
      });
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

    const existingSchedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        scheduleTasks: true,
        scheduleUsers: true,
      },
    });

    if (!existingSchedule) {
      throw new HttpException('Escala não encontrada!', HttpStatus.NOT_FOUND);
    }

    // Handle tasks update
    const currentTaskIds = existingSchedule.scheduleTasks.map((st) => st.taskId);
    const tasksToConnect = taskIds?.filter((taskId) => !currentTaskIds.includes(taskId)) || [];
    const tasksToDisconnect = currentTaskIds.filter((taskId) => !taskIds?.includes(taskId)) || [];

    // Handle users update
    const currentUserIds = existingSchedule.scheduleUsers.map((su) => su.userId);
    const usersToConnect = userIds?.filter((userId) => !currentUserIds.includes(userId)) || [];
    const usersToDisconnect = currentUserIds.filter((userId) => !userIds?.includes(userId)) || [];

    try {
      const updatedSchedule = await this.prisma.schedule.update({
        where: { id },
        data: {
          ...scheduleData,
          scheduleTasks: {
            deleteMany: { taskId: { in: tasksToDisconnect } },
            create: tasksToConnect.map((taskId) => ({ taskId })),
          },
          scheduleUsers: {
            deleteMany: { userId: { in: usersToDisconnect } },
            create: usersToConnect.map((userId) => ({ userId })),
          },
        },
        include: {
          scheduleTasks: true,
          scheduleUsers: true,
        },
      });
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
