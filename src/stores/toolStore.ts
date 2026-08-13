import { defineStore } from 'pinia';
import type { RouteLocationNormalized } from 'vue-router';

import { apiService } from '@/services/apiService';
import { useAuthStore } from '@/stores/useAuthStore';

import type { ProjectData, FieldTrackerProjectsResponse } from '@/interfaces/fieldTracker';

import { FieldTrackerServiceProxy } from '@/shared/service-proxies/service-proxies';

const fieldTrackerService = new FieldTrackerServiceProxy();

interface NavigationDetails {
  to: RouteLocationNormalized;
  from: RouteLocationNormalized;
  next: (to?: any) => void;
}

export const useToolStore = defineStore('tool', {
  state: () => ({
    isToolOpen: false,
    showConfirmModal: false,
    currentProjectInfo: null as ProjectData | null,
    navigationDetails: null as NavigationDetails | null,
    isProjectOpen: false,
    authStore: useAuthStore(),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
    fieldTrackerActiveProjectsData: null as any | null,
    fieldTrackerCompletedProjectsData: null as any | null,
    fieldTrackerDeletedProjectsData: null as any | null,
    fieldTrackerAllProjectsData: null as any | null,
    activeFieldTrackerTab: localStorage.getItem('activeFieldTrackerTab') || 'active', // Default tab with active being the default
    tools: [
      { key: 'field-tracker', label: 'Field Tracker' },
      { key: 'install-tracker', label: 'Install Tracker' },
      { key: 'labor-manager', label: 'Labor Manager' },
      { key: 'workforce', label: 'Workforce' },
      { key: 'inspection-tracker', label: 'Inspection Tracker' },
      { key: 'install-teams', label: 'Install Teams' },
      { key: 'project-assigner', label: 'Project Assigner' },
      { key: 'data-dictionary', label: 'Data Dictionary' },
    ],
  }),

  actions: {
    openTool() {
      this.isToolOpen = true;
    },
    closeTool() {
      this.isToolOpen = false;
      this.showConfirmModal = false;
    },
    closeProject() {
      this.isProjectOpen = false;
      this.showConfirmModal = false;
    },
    setShowConfirmModal(value: boolean) {
      this.showConfirmModal = value;
    },
    resetConfirmmodal() {
      this.showConfirmModal = false;
    },
    setCurrentProjectInfo(project: ProjectData) {
      this.currentProjectInfo = project;
    },
    getCurrentProjectInfo(): ProjectData | null {
      return this.currentProjectInfo;
    },
    setNavigationDetails(details: NavigationDetails) {
      this.navigationDetails = details;
    },
    getNavigationDetails(): NavigationDetails | null {
      return this.navigationDetails;
    },
    async setFieldTrackerProjectsData(
      projectStatus: string
    ): Promise<FieldTrackerProjectsResponse> {
      // First, validate project status type
      const validStatusTypes = ['active', 'completed', 'deleted', 'all'];

      if (!validStatusTypes.includes(projectStatus)) {
        console.error('Invalid project status type. Please try again.');
        return {
          data: null,
          error: true,
          message: 'Invalid project status type. Please try again.',
        };
      }

      if (!this.authStore.userInfo) {
        await this.authStore.fetchAndSetUserInfo();
      }

      try {
        const response = await fieldTrackerService.getProjectsByStatus(projectStatus);

        const reformattedProjectsData: ProjectData[] = await Promise.all(
          (Array.isArray(response) ? response : []).map(async (project: any) => ({
            ftProjectId: project.ftProjectId,
            rootProjectId: project.rootProjectId,
            projectName: project.projectName,
            salesforceId: project.salesforceId,
            projectManagerName: project.projectManagerName,
            projectManagerId: project.projectManagerId,
            installManagerName: project.installManagerName,
            installManagerId: project.installManagerId,
            stateName: project.stateName,
            stateCode: project.stateCode,
            stateId: project.stateId,
            siteLocStreetAddress: project.siteLocStreetAddress,
            siteLocCity: project.siteLocCity,
            siteLocPostalCode: project.siteLocPostalCode,
            expectedStartDate: project.expectedStartDate,
            createdAt: await apiService.reformatDate(project.createdAt),
            createdByName: project.createdByName || '',
            createdById: project.createdById,
            updatedAt: project.updatedAt ? await apiService.reformatDate(project.updatedAt) : '',
            updatedById: project.updatedById,
            updatedByName: project.updatedByName || '',
          }))
        );

        if (projectStatus === 'active')
          this.fieldTrackerActiveProjectsData = reformattedProjectsData;
        if (projectStatus === 'completed')
          this.fieldTrackerCompletedProjectsData = reformattedProjectsData;
        if (projectStatus === 'deleted')
          this.fieldTrackerDeletedProjectsData = reformattedProjectsData;
        if (projectStatus === 'all') this.fieldTrackerAllProjectsData = reformattedProjectsData;

        return { data: reformattedProjectsData, error: false };
      } catch (error: any) {
        console.log('Error fetching active projects:', error);
        console.error('Error fetching active projects:', error.response);
        if (error.response.status !== 404) {
          return {
            data: null,
            error: true,
            message:
              'Error fetching active Field Tracker projects data. Please close the tool and try again. If the problem persists, please contact support.',
          };
        } else {
          return { data: [], error: false };
        }
      }
    },
    async getFieldTrackerProjectsData(statusType: string): Promise<FieldTrackerProjectsResponse> {
      if (statusType === 'active') {
        return { data: this.fieldTrackerActiveProjectsData, error: false };
      } else if (statusType === 'completed') {
        return { data: this.fieldTrackerCompletedProjectsData, error: false };
      } else if (statusType === 'deleted') {
        return { data: this.fieldTrackerDeletedProjectsData, error: false };
      } else if (statusType === 'all') {
        return { data: this.fieldTrackerAllProjectsData, error: false };
      }
      return { data: null, error: true, message: 'Invalid project status type. Please try again.' };
    },
    setActiveFieldTrackerTab(tab: string) {
      this.activeFieldTrackerTab = tab;
    },
  },
});
