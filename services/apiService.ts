import { ProjectListItem, ProjectData } from '../types';

// This is a mock API service that uses localStorage.
// It's designed to be easily replaced with a real API service later.

const PROJECTS_LIST_KEY = 'projects_list';
const PROJECT_DATA_PREFIX = 'project_data_';

// Simulate network latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const apiService = {
  async getProjectsList(): Promise<ProjectListItem[]> {
    await delay(50); // Simulate API call
    const data = localStorage.getItem(PROJECTS_LIST_KEY);
    return data ? JSON.parse(data) : [];
  },

  async getProjectData(id: string): Promise<ProjectData | null> {
    await delay(50);
    const data = localStorage.getItem(`${PROJECT_DATA_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  },
  
  async saveProjectData(id: string, data: ProjectData): Promise<ProjectData> {
      await delay(50);
      localStorage.setItem(`${PROJECT_DATA_PREFIX}${id}`, JSON.stringify(data));
      
      const projectsList = await this.getProjectsList();
      const projectInList = projectsList.find(p => p.id === id);
      if (projectInList && projectInList.name !== data.project.projectName) {
          const updatedList = projectsList.map(p => 
              p.id === id ? { ...p, name: data.project.projectName } : p
          );
          localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(updatedList));
      }
      
      return data;
  },

  async createNewProject(data: ProjectData): Promise<ProjectListItem> {
    await delay(50);
    const newId = `proj_${Date.now()}`;
    const newItem: ProjectListItem = { id: newId, name: data.project.projectName };
    
    localStorage.setItem(`${PROJECT_DATA_PREFIX}${newId}`, JSON.stringify(data));

    const projectsList = await this.getProjectsList();
    const updatedList = [...projectsList, newItem];
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(updatedList));

    return newItem;
  },

  async deleteProject(id: string): Promise<void> {
    await delay(50);
    localStorage.removeItem(`${PROJECT_DATA_PREFIX}${id}`);
    
    const projectsList = await this.getProjectsList();
    const updatedList = projectsList.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(updatedList));
  },
};
