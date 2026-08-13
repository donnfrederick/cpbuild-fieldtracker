<script setup lang="ts">
  import axios from 'axios';
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import type { CellComponent } from 'tabulator-tables';
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
  import { useMaskingStore } from '@/stores/useMaskingStore';
  import { storeToRefs } from 'pinia';
  import 'vue-select/dist/vue-select.css';
  import TopNavBar from '@/components/TopNavBar.vue';
  import type { ProjectAssinmentData, Tasks } from '@/interfaces/project';
  import MaskingIndicator from '@/components/MaskingIndicator.vue';

  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const maskingStore = useMaskingStore();
  const { isMasking } = storeToRefs(maskingStore);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const isLoading = ref(false);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');

  let table: any = ref(null);
  let tabulator: any = ref(null);

  const workHoursSubmitted: any = ref({});

  const selectedIds = ref<number[]>([]);
  const showingVisibleRows = ref<boolean>(false);

  const isTeamLead = ref<boolean>(false);

  const statuses = [
    {
      id: 1,
      name: 'Submitted',
    },
    {
      id: 2,
      name: 'Approved',
    },
    {
      id: 3,
      name: 'Rejected',
    },
    {
      id: 4,
      name: 'Deleted',
    },
  ];

  onBeforeRouteLeave((to, from, next) => {
    if (isMasking.value && !maskingStore.allowedRoutes.includes(to.name as string)) {
      const answer = window.confirm('Are you sure you want to exit masking mode?');
      if (answer) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });

  window.addEventListener('beforeunload', function (event) {
    if (isMasking.value) {
      event.preventDefault();
      event.returnValue = ' '; // This triggers the native browser prompt
    }
  });

  watch(
    () => authStore.tdUserId,
    (newVal) => {
      userId.value = newVal !== null ? newVal : 0;
    },
    { immediate: true }
  );

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
  });

  const breadCrumbDetails: any = ref([]);

  const showToast = ref(false);
  const toastMessage = ref('');

  const teamLeadId: any = ref(0);
  const ihiProject = ref<ProjectAssinmentData | null>(null);
  const tasks = ref<Tasks[]>([]);

  async function getTeamLeads() {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/project-assigner/team-leads/active/list`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      // Find the team lead where `tl.userId` matches `userId.value`
      const matchingTeamLead = response.data.find((tl: any) => tl.userId === userId.value);

      // If a match is found, set `teamLeadId.value` to `tl.id`
      if (matchingTeamLead) {
        teamLeadId.value = matchingTeamLead.id;
      } else {
        console.error('No matching team lead found for the current user.');
        teamLeadId.value = 0; // Reset teamLeadId to 0 if no match is found
      }
    } catch (error) {
      console.error('Error fetching team leads:', error);
    }
  }

  async function getIHIProjects() {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/labor-manager/team-leads/${teamLeadId.value}/active-ihi-projects`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      ihiProject.value = data.projectAssignment.find((proj: any) =>
        proj.tasks.some((task: any) => task.id == route.params.id)
      );

      if (ihiProject.value != null) {
        tasks.value = ihiProject.value.tasks.filter((task: any) => task.id == route.params.id);

        console.log(tasks.value);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getWorkHourSubmitted = async () => {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/work-hour-submissions/${route.params.id}/list`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      console.log('data is set to:', data);

      if (data[0].teamLeadUserId == userId.value) isTeamLead.value = true;

      breadCrumbDetails.value = [data[0].dboProjectName, data[0].scopeTypeName];

      // Process each row to split hoursOverride into hours and minutes
      workHoursSubmitted.value = data.map((entry: any) => {
        const { hoursOverride } = entry;
        let calculatedHours = null;
        let calculatedMinutes = null;

        if (hoursOverride !== null && hoursOverride !== undefined) {
          calculatedHours = Math.floor(hoursOverride); // Whole number hours
          calculatedMinutes = Math.round((hoursOverride - calculatedHours) * 60); // Convert decimal to minutes
        }

        return {
          ...entry,
          hoursOverride: calculatedHours, // Update with extracted hours
          minutesOverride: calculatedMinutes, // Add extracted minutes
          submissionDate: parseDate(entry.submissionDate),
          unitDetails: `Building: ${entry.building}, Level: ${entry.level}, Unit: ${entry.unit}, Area: ${entry.area}`,
          currentPayPeriod: isCurrentPayPeriod(entry.submissionDate),
        };
      });
    } catch (error) {
      console.log(error);
    }
  };

  const initializeTabulator = () => {
    tabulator.value?.destroy();

    tabulator.value = new Tabulator(table.value, {
      height: `calc(100vh - 300px)`,
      history: true,
      index: 'id',
      selectableRange: false,
      selectableRowsPersistence: false,
      data: workHoursSubmitted.value,
      reactiveData: true,
      layout: 'fitDataTable',
      clipboard: true,
      initialSort: [{ column: 'id', dir: 'asc' }],
      columns: [
        {
          title: '',
          field: 'id',
          headerSort: false,
          formatter: function (cell) {
            const id = cell.getValue();
            const checked = selectedIds.value.includes(id) ? 'checked' : '';
            return `<input class="work-hour check-${id}" type="checkbox" ${checked} />`;
          },
          cellClick: (e, cell) => {
            const checkbox = e.target as HTMLInputElement;
            const id = cell.getValue();

            if (checkbox.tagName === 'INPUT' && checkbox.type === 'checkbox') {
              if (checkbox.checked) {
                // Add ID to selectedIds if checked
                if (!selectedIds.value.includes(id)) selectedIds.value.push(id);
              } else {
                // Remove ID if unchecked
                selectedIds.value = selectedIds.value.filter((val) => val !== id);
              }
            }
          },
        },
        {
          title: '',
          columns: [
            {
              title: 'Worker',
              field: 'workerName',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Worker',
            },
            {
              title: 'Project',
              field: 'dboProjectName',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Project',
            },
            {
              title: 'Unit',
              field: 'unitDetails',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Unit',
            },
            {
              title: 'Scope',
              field: 'scopeTypeName',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Scope',
            },
            {
              title: 'Phase',
              field: 'unitPhasesByScopeName',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Phase',
              formatter: displayNAFormatter,
            },
            {
              title: 'Task',
              field: 'taskTypeName',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Task',
              formatter: displayNAFormatter,
            },
            {
              title: 'Submit Type',
              field: 'workHourSubmissionTypeName',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Submit Type',
            },
            {
              title: 'Status',
              field: 'workHourSubmissionStatusTypeName',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Status',
              editable: true,
            },
            {
              title: 'Hours',
              field: 'hours',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Hours',
              formatter: hoursFormatter,
              editor: 'input',
              editable: false,
            },
          ],
        },
        {
          title: 'Time Overrides (separated)',
          columns: [
            {
              title: 'Hrs. Override',
              field: 'hoursOverride', // Field for hours
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Hrs.',
              editor: 'number', // Simple number input for hours
              editorParams: {
                min: 0,
                max: 23,
              },
              editable: function (_cell: CellComponent) {
                if (isTeamLead.value) return true;
                else return false;
              },
            },
            {
              title: 'Min. Override',
              field: 'minutesOverride', // Field for minutes
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Min.',
              editor: function (cell, onRendered, success, cancel) {
                // Create minutes dropdown
                const input = document.createElement('select');
                input.style.width = '100%';

                // Add options for minutes in increments of 5
                const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                minuteOptions.forEach((minute) => {
                  const option = document.createElement('option');
                  option.value = minute.toString();
                  option.text = minute.toString().padStart(2, '0');
                  input.appendChild(option);
                });

                // Set the current value
                input.value = cell.getValue() || '0';

                // Focus on render
                onRendered(() => {
                  input.focus();
                  input.style.height = '100%';
                });

                // Handle value change
                input.addEventListener('change', () => {
                  success(parseInt(input.value, 10)); // Pass updated value back
                });

                // Cancel on blur
                input.addEventListener('blur', () => cancel(cell.getValue()));

                return input;
              },
              editable: function (_cell: CellComponent) {
                if (isTeamLead.value) return true;
                else return false;
              },
            },
          ],
        },
        {
          title: '',
          columns: [
            {
              title: 'Qty.',
              field: 'quantity',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Qty.',
              formatter: displayNAFormatter,
              editor: 'input',
              editable: false,
            },
            {
              title: 'Qty. Override',
              field: 'quantityOverride',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Qty. Override',
              editor: 'number',
              editable: function (_cell: CellComponent) {
                if (isTeamLead.value) return true;
                else return false;
              },
            },
            {
              title: 'Submit Date',
              field: 'submissionDate',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Submit Date',
            },
            {
              title: 'Current Pay Period?',
              field: 'currentPayPeriod',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Current Pay Period?',
            },
            {
              title: 'Submission Notes',
              field: 'submissionNotes',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Submission Notes',
              editor: 'input',
              editable: false,
              width: 250,
              formatter: function (cell: CellComponent) {
                const cellElement = cell.getElement();
                cellElement.style.whiteSpace = 'normal';
                cellElement.style.wordBreak = 'break-word';

                return cell.getValue();
              },
            },
            {
              title: 'Manager Notes',
              field: 'managerNotes',
              headerFilter: 'input',
              headerFilterPlaceholder: 'Filter by Manager Notes',
              editor: 'input',
              editable: function (_cell: CellComponent) {
                if (isTeamLead.value) return true;
                else return false;
              },
              width: 250,
              formatter: function (cell: CellComponent) {
                const cellElement = cell.getElement();
                cellElement.style.whiteSpace = 'normal';
                cellElement.style.wordBreak = 'break-word';

                return cell.getValue();
              },
            },
          ],
        },
      ],
    });

    tabulator.value.on('cellEdited', async function (cell: CellComponent) {
      const fieldName = cell.getColumn().getField();
      const rowData = cell.getRow().getData();
      console.log('rowData.id', rowData.id);
      let updateData: any = {
        id: rowData.id,
        updatedBy: userId.value,
        userRoles: userRoleString.value,
        targetUrl: `${apiBaseUrl}/work-hour-submissions/update`,
        targetMethodType: 'PATCH',
      };

      if (fieldName === 'hoursOverride' || fieldName === 'minutesOverride') {
        // Convert hours + minutes into decimal value
        const hours = rowData.hoursOverride || 0;
        const minutes = rowData.minutesOverride || 0;
        updateData.hoursOverride = hours + minutes / 60;
        console.log(
          `Updated Hrs: ${hours}, Min: ${minutes} → Decimal: ${updateData.hoursOverride}`
        );
      } else if (fieldName === 'quantityOverride') {
        updateData.quantityOverride = rowData.quantityOverride || 0;
        console.log(`Updated Qty Override for ID ${rowData.id} to ${updateData.quantityOverride}`);
      } else if (fieldName === 'managerNotes') {
        updateData.managerNotes = rowData.managerNotes || '';
        console.log(`Updated Manager Notes for ID ${rowData.id}: ${updateData.managerNotes}`);
      } else {
        return; // If it's not one of the handled fields, exit
      }

      // Send update via API
      await updateWorkHourSubmission(updateData);
    });
  };

  onMounted(async () => {
    isLoading.value = true;

    const userRoles = authStore.userInfo?.clientPrincipal.allowedRoles || [];
    const allowedRoles = (route.meta.allowedRoles as string[]) || [];

    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAllowedRole) {
      router.push({ name: 'dashboard' });
      localStorage.setItem('redirectMsg', 'You do not have permission to access this tool.');
      return;
    }

    await getTeamLeads();
    await getIHIProjects();
    await getWorkHourSubmitted();
    initializeTabulator();

    isLoading.value = false;
  });

  const updateWorkHourSubmission = async (payload: any) => {
    console.log(`Updating Work Hour Submission ID ${payload.id}...`, payload);
    try {
      await axios.post(`${apiBaseUrl}/api-proxy`, payload, { timeout: 10000 });

      console.log(`Successfully updated Work Hour Submission ID ${payload.id}`, payload);
    } catch (error) {
      console.error(`Error updating work hour submission for ID ${payload.id}:`, error);
    }
  };

  const closeProject = () => {
    router.push({ name: 'labor-manager-project-scope', params: { id: route.params.id } });
  };

  const hoursFormatter = (cell: CellComponent) => {
    console.log('cell', cell.getValue());
    const [hours, minutes] = parseHoursAndMinutes(cell.getValue());

    console.log('hours', hours, 'minutes', minutes);

    return `${hours} hrs ${minutes} min`;
  };

  const parseHoursAndMinutes = (value: number | null): [number | null, number | null] => {
    if (value === null || isNaN(value)) {
      return [null, null];
    }

    const hours = Math.floor(value); // Extract hours
    const minutes = Math.round((value - hours) * 60); // Extract minutes
    return [hours, minutes];
  };

  const displayNAFormatter = (cell: CellComponent) => {
    const value = cell.getValue();
    return value ?? 'N/A';
  };

  const approveSelected = async () => {
    console.log(selectedIds.value);
    const confirmX = confirm('Are you sure?');
    if (confirmX && userId.value) {
      isLoading.value = true;

      let processedData = 0;

      for (const id of selectedIds.value) {
        const approvePayloadData = {
          id,
          updatedBy: userId.value,
          statusId: 2,
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/work-hour-submissions/update`,
          targetMethodType: 'PATCH',
        };

        try {
          await axios.post(`${apiBaseUrl}/api-proxy`, approvePayloadData, { timeout: 10000 });
          processedData = processedData + 1;

          const entry = workHoursSubmitted.value.find((workHour: any) => workHour.id == id);

          entry.workHourSubmissionStatusTypeName = statuses.find(
            (status: any) => status.id == 2
          )?.name;
          tabulator.value.updateData([entry]);
        } catch (error) {
          console.error('Error updating the status:', error);
        }
      }

      if (processedData == selectedIds.value.length) {
        setTimeout(() => {
          selectedIds.value = [];
        }, 500);

        isLoading.value = false;
        toastMessage.value = 'Approved successfully';
        showToast.value = true;

        setTimeout(() => {
          showToast.value = false;
        }, 5000);

        uncheckAllCheckboxes();
      } else {
        console.log('An error occured on one of the selcted rows');
      }
    }
  };

  const rejectSelected = async () => {
    const confirmX = confirm('Are you sure?');
    if (confirmX && userId.value) {
      isLoading.value = true;

      let processedData = 0;

      for (const id of selectedIds.value) {
        const approvePayloadData = {
          id,
          updatedBy: userId.value,
          statusId: 3,
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/work-hour-submissions/update`,
          targetMethodType: 'PATCH',
        };

        try {
          await axios.post(`${apiBaseUrl}/api-proxy`, approvePayloadData, { timeout: 10000 });
          processedData = processedData + 1;

          const entry = workHoursSubmitted.value.find((workHour: any) => workHour.id == id);

          entry.workHourSubmissionStatusTypeName = statuses.find(
            (status: any) => status.id == 3
          )?.name;
          tabulator.value.updateData([entry]);
        } catch (error) {
          console.error('Error updating the status:', error);
        }
      }

      if (processedData == selectedIds.value.length) {
        setTimeout(() => {
          selectedIds.value = [];
        }, 500);

        isLoading.value = false;
        toastMessage.value = 'Rejected successfully';
        showToast.value = true;

        setTimeout(() => {
          showToast.value = false;
        }, 5000);

        uncheckAllCheckboxes();
      } else {
        console.log('An error occured on one of the selcted rows');
      }
    }
  };

  const submitSelected = async () => {
    const confirmX = confirm('Are you sure?');
    if (confirmX && userId.value) {
      isLoading.value = true;

      let processedData = 0;

      for (const id of selectedIds.value) {
        const approvePayloadData = {
          id,
          updatedBy: userId.value,
          statusId: 1,
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/work-hour-submissions/update`,
          targetMethodType: 'PATCH',
        };

        try {
          await axios.post(`${apiBaseUrl}/api-proxy`, approvePayloadData, { timeout: 10000 });
          processedData = processedData + 1;

          const entry = workHoursSubmitted.value.find((workHour: any) => workHour.id == id);

          entry.workHourSubmissionStatusTypeName = statuses.find(
            (status: any) => status.id == 1
          )?.name;
          tabulator.value.updateData([entry]);
        } catch (error) {
          console.error('Error updating the status:', error);
        }
      }

      if (processedData == selectedIds.value.length) {
        setTimeout(() => {
          selectedIds.value = [];
        }, 500);

        isLoading.value = false;
        toastMessage.value = 'Marked as submitted successfully';
        showToast.value = true;

        setTimeout(() => {
          showToast.value = false;
        }, 5000);

        uncheckAllCheckboxes();
      } else {
        console.log('An error occured on one of the selcted rows');
      }
    }
  };

  const deleteSelected = async () => {
    const confirmX = confirm('Are you sure?');
    if (confirmX && userId.value) {
      isLoading.value = true;

      let processedData = 0;

      for (const id of selectedIds.value) {
        const approvePayloadData = {
          id,
          updatedBy: userId.value,
          statusId: 4,
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/work-hour-submissions/update`,
          targetMethodType: 'PATCH',
        };

        try {
          await axios.post(`${apiBaseUrl}/api-proxy`, approvePayloadData, { timeout: 10000 });
          processedData = processedData + 1;

          const entry = workHoursSubmitted.value.find((workHour: any) => workHour.id == id);

          entry.workHourSubmissionStatusTypeName = statuses.find(
            (status: any) => status.id == 4
          )?.name;
          tabulator.value.updateData([entry]);
        } catch (error) {
          console.error('Error deleting:', error);
        }
      }

      if (processedData == selectedIds.value.length) {
        setTimeout(() => {
          selectedIds.value = [];
        }, 500);

        isLoading.value = false;
        toastMessage.value = 'Deleted successfully';
        showToast.value = true;

        setTimeout(() => {
          showToast.value = false;
        }, 5000);

        uncheckAllCheckboxes();
      } else {
        console.log('An error occured on one of the selcted rows');
      }
    }
  };

  const parseDate = (dataVal: Date) => {
    const date = new Date(dataVal);

    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 because months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
  };

  // function getCurrentWeekDates() {
  //   const today = new Date();
  //   const dayOfWeek = today.getDay();

  //   const monday = new Date(today);
  //   monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  //   const friday = new Date(monday);
  //   friday.setDate(monday.getDate() + 4);

  //   const formatDate = (date: Date) => {
  //     const year = date.getFullYear();
  //     const month = String(date.getMonth() + 1).padStart(2, '0');
  //     const day = String(date.getDate()).padStart(2, '0');
  //     return `${year}-${month}-${day}`;
  //   };

  //   return {
  //     monday: formatDate(monday),
  //     friday: formatDate(friday),
  //   };
  // }

  const selectVisibleRows = () => {
    selectedIds.value = [];
    showingVisibleRows.value = !showingVisibleRows.value;

    if (showingVisibleRows.value && tabulator.value) {
      const visibleData = tabulator.value.getData('active');

      visibleData.forEach((entry: any) => {
        const checkbox = document.querySelector(
          `input[type="checkbox"].check-${entry.id}`
        ) as HTMLInputElement | null;
        if (checkbox) {
          checkbox.checked = true;
        }
        selectedIds.value.push(entry.id);
      });
    } else {
      uncheckAllCheckboxes();
    }
  };

  const uncheckAllCheckboxes = () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"].work-hour');

    checkboxes.forEach((checkbox) => {
      const inputCheckbox = checkbox as HTMLInputElement;
      inputCheckbox.checked = false;
    });

    selectedIds.value = [];
  };

  const isCurrentPayPeriod = (submissionDate: Date) => {
    console.log('submissionDate', submissionDate);
    // const weekDates = getCurrentWeekDates();

    // const customDate = new Date(submissionDate);
    // const mondayDate = new Date(weekDates.monday);
    // const fridayDate = new Date(weekDates.friday);

    // mondayDate.setHours(0, 0, 0, 0);
    // fridayDate.setHours(23, 59, 59, 999);

    // if (customDate >= mondayDate && customDate <= fridayDate) return 'YES';
    // else return 'NO';

    // For now we will always assume it's the current pay period and we can refine this later
    return 'YES';
  };
</script>
<template>
  <div class="top-nav-bar">
    <TopNavBar />
  </div>

  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <div v-if="showToast" class="toast-message">
    {{ toastMessage }}
    <button @click="showToast = false">Close</button>
  </div>

  <div class="body-content ft-project-viewer">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav"
            ><router-link to="/dashboard" class="breadcrumb-link">Dashboard</router-link> / IHI
            Tools / Labor Manager / {{ ihiProject?.projectName }} ({{ tasks[0]?.scopeTypeName }}) /
            Hours Submitted</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeProject">
            Go Back<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <MaskingIndicator v-if="isMasking" />

    <hr />

    <div class="tabulator-options">
      <button class="select-all" @click="selectVisibleRows">
        {{ showingVisibleRows ? 'Deselect All Rows' : 'Select All Visible Rows' }}
      </button>
    </div>
    <div class="tabulator-title">
      <h1>Work Hour Submissions</h1>
    </div>
    <div ref="table" class="table-container"></div>
    <div class="tabulator-footer">
      <button class="actions" @click="approveSelected">
        <i class="bi bi-hand-thumbs-up"></i> Approve
      </button>
      <button class="actions" @click="rejectSelected">
        <i class="bi bi-hand-thumbs-down"></i> Reject
      </button>
      <button class="actions" @click="submitSelected">
        <i class="bi bi-flag"></i> Mark as Submitted
      </button>
      <button class="actions" @click="deleteSelected"><i class="bi bi-trash"></i> Delete</button>
    </div>
  </div>
</template>
<style scoped>
  ::v-deep(
      input[type='number']::-webkit-inner-spin-button,
      input[type='number']::-webkit-outer-spin-button
    ) {
    -webkit-appearance: none;
    margin: 0;
  }
  ::v-deep(.hrs_override) {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  ::v-deep(.hrs_override input) {
    width: 35%;
    text-align: center;
    border: 1px solid #a9a9a9;
    border-radius: 3px;
  }
  ::v-deep(.qty_override) {
    display: flex;
    justify-content: center;
  }
  ::v-deep(.qty_override input) {
    width: 65%;
    text-align: center;
    border: 1px solid #a9a9a9;
    border-radius: 3px;
  }
  input[type='checkbox'] {
    cursor: pointer;
  }
  .tabulator-options {
    width: 95%;
    margin: auto;
    padding: 0.5rem 1rem;
  }
  .tabulator-options button {
    background: transparent;
    border: none;
    outline: none;
    color: #74b3f8;
    margin-bottom: 1rem;
  }
  .tabulator-title {
    width: 95%;
    background: #f1fafa;
    margin: auto;
    padding: 0.5rem 1rem;
  }
  .tabulator-title h1 {
    font-size: 110%;
    color: #3c3c3c;
    margin-bottom: 0;
  }
  .table-container.tabulator {
    margin: 0 auto;
  }
  .tabulator-footer {
    width: 95%;
    margin: auto;
    display: flex;
  }
  .tabulator-footer button {
    background: transparent;
    outline: none;
    border: none;
    margin-right: 0.5rem;
    color: #74b3f8;
  }
  ::v-deep(.tabulator .tabulator-header) {
    background-color: #f1fafa;
  }
  ::v-deep(.tabulator .tabulator-header .tabulator-col) {
    background-color: #f1fafa;
  }

  .expand-button {
    background: transparent;
    outline: none;
    border: none;
    font-size: 100%;
    color: #dc3545;
  }
  .action-box {
    background: #fff8f8;
    border-radius: 3px;
    padding: 0.5rem;
  }
  .action-box h6 {
    color: #212121;
    list-style: none;
    padding-left: 1rem;
  }
  .action-box .hours-needing-review {
    padding: 0 1rem;
    margin: 0;
  }
  .action-box .hours-needing-review li {
    color: #212121;
    list-style: none;
  }
  .action-box .hours-needing-review li span {
    color: #dc3545;
    font-weight: bold;
  }
  .action-box .review-hours-btn {
    color: #fff;
    background: #19a7af;
    padding: 0.1rem 1.2rem;
    border-radius: 3px;
    border: none;
    outline: none;
    margin-top: 0.5rem;
    margin-left: 1rem;
  }
  .top-nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
  }

  .ft-project-viewer {
    overflow-y: auto; /* Enables vertical scrolling if content overflows */
    height: 100vh; /* Optional: Adjust if you want a specific height */
    margin-top: 62px;
  }

  .sub-header-content {
    color: #19a7af;
    padding: 10px 30px;
  }

  .bi-plus-circle {
    margin-right: 5px;
    color: #7a7a7a;
  }

  .btn-new-project {
    background: none;
    border: none;
    color: #19a7af;
    cursor: pointer;
    padding-left: 5px;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1070; /* Ensure it's above other content including modals */
  }

  .header-body {
    width: 100%;
    padding: 10px 30px;
    min-width: 350px;
  }

  .breadcrumb-nav {
    font-size: 16px;
    font-weight: 200;
  }

  .breadcrumb-link {
    color: #19a7af;
    text-decoration: none;
  }

  i {
    margin-right: 5px;
    color: #7a7a7a;
  }

  .bi-x-circle {
    margin-left: 5px;
  }

  .project-actions {
    margin: 10px 30px;
    width: inherit;
    /* color: #19A7AF; */
  }

  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }

  .project-rows-count {
    margin: 0 30px;
    width: inherit;
    color: #19a7af;
  }

  .bi-plus-circle,
  .bi-table,
  .bi-trash3,
  .bi-clipboard {
    margin-right: 5px;
    color: #7a7a7a;
  }

  .btn-new-row,
  .btn-add-multiple-rows,
  .btn-delete-rows,
  .btn-copy-selected-rows {
    background: none;
    border: none;
    color: #19a7af;
    cursor: pointer;
    padding-left: 5px;
  }

  .btn-delete-rows {
    color: #dc3545;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    border: none;
    margin-left: 5px;
  }

  .modal-title {
    color: #19a7af;
  }

  .modal label {
    color: #3c3c3c;
    padding-bottom: 8px;
  }

  .modal .row {
    padding-bottom: 15px;
  }

  .mb-2 {
    margin-bottom: 0px !important;
  }

  input::placeholder {
    color: #d9d9d9;
  }

  hr {
    margin: 0 15px;
    color: #7a7a7a;
  }

  .error-message {
    color: #dc3545;
    padding: 10px 30px;
    text-align: center;
    width: 100%;
    background-color: #f8d7da;
  }

  .toast-message {
    background-color: #19a7af !important;
    /* color: #19A7AF !important; */
    font-weight: bold;
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    z-index: 1031;
  }

  .toast-message button {
    border: none;
    background: none;
    color: white;
    font-size: 1.2em;
    cursor: pointer;
  }

  :deep(.tabulator-row.highlight-new-row) {
    background-color: #ffff99; /* Light yellow background */
    transition: background-color 0.5s ease-in;
  }

  :deep(.tabulator-row.fade-highlight) {
    transition: background-color 0.5s ease-out;
    background-color: transparent;
  }

  :deep(span) {
    color: rgb(60, 60, 60);
  }

  .table-container {
    min-height: 300px;
    max-height: 70vh;
    overflow-y: auto;
    width: 95%;
    margin: 1rem auto;
  }

  .dropdown-container .form-control {
    padding: 0;
    border: none;
  }

  :deep(.calculated-field) {
    background-color: rgba(237, 237, 237, 0.6);
  }

  :deep(.vs__dropdown-toggle) {
    border: none;
  }

  :deep(.qty-override) {
    border: none;
  }

  :deep(
      .tabulator .tabulator-header .tabulator-col-group[aria-title='Time Overrides (separated)']
    ) {
    background-color: #f1fafa;
    border-right: 1px solid #b0b0b0;
    border-left: 1px solid #b0b0b0;
  }
  :deep(.tabulator .tabulator-header .tabulator-col-group[aria-title='']) {
    background-color: white;
  }

  :deep(.tabulator-header) {
    color: #3c3c3c;
    font-weight: 700;
  }

  :deep(.tabulator) {
    /* font-size: 14px; */
    color: rgb(60, 60, 60);
    font-size: 13.5px;
    display: block;
  }

  :deep(.tabulator-row .tabulator-cell) {
    overflow: hidden;
    border-right: 1px solid #dee2e6;
  }

  :deep(.tabulator .tabulator-header .tabulator-col) {
    border-right: 1px solid #dee2e6;
  }

  :deep(.tabulator .tabulator-header .tabulator-col[tabulator-field='unit']) {
    border-right: 2px solid #dee2e6;
  }

  :deep(.tabulator-row.tabulator-calcs .tabulator-cell) {
    height: 40px !important;
    text-align: center;
  }

  :deep(.tabulator-header .tabulator-calcs-holder) {
    border-top: none;
  }

  @media (max-width: 526px) {
    .ft-project-viewer {
      margin-top: 103px;
    }
  }

  .cursor-pointer {
    cursor: pointer;
  }
</style>
