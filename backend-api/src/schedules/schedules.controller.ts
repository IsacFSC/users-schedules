import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/common/role.enum';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@UseGuards(AuthTokenGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  create(@Body() createScheduleDto: CreateScheduleDto) {
    console.log('[CREATE SCHEDULE] Body recebido:', createScheduleDto);
    try {
      return this.schedulesService.create(createScheduleDto);
    } catch (error) {
      console.error('[CREATE SCHEDULE] Erro:', error);
      throw error;
    }
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.schedulesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }

  // Skill management endpoints
  @Post(':scheduleId/users/:userId/skills/:skillId')
  addSkillToScheduleUser(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skillId', ParseIntPipe) skillId: number,
  ) {
    return this.schedulesService.addSkillToScheduleUser(scheduleId, userId, skillId);
  }

  @Delete(':scheduleId/users/:userId/skills/:skillId')
  removeSkillFromScheduleUser(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skillId', ParseIntPipe) skillId: number,
  ) {
    return this.schedulesService.removeSkillFromScheduleUser(scheduleId, userId, skillId);
  }

  @Post('skills')
  createSkill(@Body('name') name: string) {
    return this.schedulesService.createSkill(name);
  }

  @Get('skills')
  findAllSkills() {
    return this.schedulesService.findAllSkills();
  }

  @Get('skills/:id')
  findSkillById(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.findSkillById(id);
  }

  @Delete('skills/:id')
  deleteSkill(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.deleteSkill(id);
  }
}
