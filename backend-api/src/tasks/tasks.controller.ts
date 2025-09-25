import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/common/role.enum';
import { ActiveUser } from '../auth/param/active-user.decorator';
import { User } from '../../generated/prisma';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('tasks')
//@UseInterceptors(LoggerInterceptor)
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @Get('/All')
  findAllTasks(@Query() paginationDto: PaginationDto, @Query('search') search?: string) {
    return this.taskService.findAll(paginationDto, search);
  }

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @Get(':id')
  findOneTask(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto, @ActiveUser() user: User) {
    return this.taskService.create(createTaskDto, user);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @ActiveUser() user: User,
  ) {
    return this.taskService.update(id, updateTaskDto, user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  removeTask(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: User) {
    return this.taskService.remove(id, user);
  }
}
