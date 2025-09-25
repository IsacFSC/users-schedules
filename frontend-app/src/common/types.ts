export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
}

export enum TaskStatus {
  APROVADO = 'APROVADO',
  NAO_APROVADO = 'NAO_APROVADO',
  PENDING = 'PENDING',
}

export interface Task {
  id: number;
  name: string;
  description: string;
  status: TaskStatus;
  createdAt: string; // Assuming it's a string from the backend
  userId?: number;
  user?: {
    id: number;
    name: string;
  };
}

export interface Skill {
  id: number;
  name: string;
}

export interface ScheduleTask {
  scheduleId: number;
  taskId: number;
  task: Task; // Include the full Task object
}

export interface ScheduleUser {
  scheduleId: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  }; // Include relevant User details
  userSkills: UserSkill[];
}

export interface UserSkill {
  id: number;
  scheduleId: number;
  userId: number;
  skillId: number;
  skill: Skill; // Include the full Skill object
}

export interface Schedule {
  id: number;
  title: string;
  description: string;
  startDate: string; // Assuming ISO string format
  endDate: string;   // Assuming ISO string format
  startTime: string; // Assuming ISO string format
  endTime: string;   // Assuming ISO string format
  createdAt: string;
  scheduleTasks: ScheduleTask[];
  scheduleUsers: ScheduleUser[];
}
