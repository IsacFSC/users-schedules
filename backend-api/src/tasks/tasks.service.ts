import {
  HttpException,
  HttpStatus,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Task, User } from '../../generated/prisma';
import { Role } from 'src/auth/common/role.enum';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(paginationDto?: PaginationDto, search?: string) {
    const { limit = 10, offset = 0 } = paginationDto || {};

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where: whereClause,
        take: Number(limit),
        skip: Number(offset),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.task.count({ where: whereClause }),
    ]);

    return { tasks, total };
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: id,
      },
    });
    if (task?.name) return task;
    throw new HttpException('Tarefa não encontrada', HttpStatus.NOT_FOUND);
  }

  async create(createTaskDto: CreateTaskDto, user: User) {
    try {
      const newTask = await this.prisma.task.create({
        data: {
          name: createTaskDto.name,
          description: createTaskDto.description,
          status: createTaskDto.status || TaskStatus.PENDING,
          userId: user.id,
        },
      });
      console.log(newTask);
      return newTask;
    } catch (err) {
      console.log('erro aqui', err);
      throw new HttpException(
        'Falha ao cadastrar tarefa!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: User) {
    const findTask = await this.prisma.task.findFirst({
      where: {
        id: id,
      },
    });
    if (!findTask) {
      throw new HttpException('Essa tarefa não existe!', HttpStatus.NOT_FOUND);
    }

    if (user.role !== Role.ADMIN && findTask.userId !== user.id) {
      throw new ForbiddenException(
        'Você não tem permissão para editar essa tarefa!',
      );
    }

    const task = await this.prisma.task.update({
      where: {
        id: findTask.id,
      },
      data: {
        name: updateTaskDto?.name ? updateTaskDto.name : findTask.name,
        description: updateTaskDto?.description
          ? updateTaskDto.description
          : findTask.description,
        status: updateTaskDto?.status
          ? updateTaskDto.status
          : findTask.status,
      },
    });
    return task;
  }

  async remove(id: number, user: User) {
    try {
      const findTask = await this.prisma.task.findFirst({
        where: {
          id: id,
        },
      });
      if (!findTask) {
        throw new HttpException(
          'Essa tarefa não existe!',
          HttpStatus.NOT_FOUND,
        );
      }
      if (user.role !== Role.ADMIN && findTask.userId !== user.id) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar essa tarefa!',
        );
      }
      await this.prisma.task.delete({
        where: {
          id: findTask.id,
        },
      });
      return { message: 'Tarefa deletada com sucesso!' };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Erro ao deletar a tarefa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
