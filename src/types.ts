export type UserRole = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIInteraction {
  id: string;
  userId: string;
  prompt: string;
  response: string;
  type: 'suggestion' | 'automation' | 'summary';
  createdAt: string;
}
