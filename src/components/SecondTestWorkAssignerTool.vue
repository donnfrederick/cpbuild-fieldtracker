<script>
  import { ref, computed } from 'vue';

  export default {
    setup() {
      const projects = ref([
        {
          id: 1,
          projectName: 'Agave House',
          tasks: [
            { id: 11, type: 'Cabinets', teamLead: 'John' },
            { id: 12, type: 'Tile', teamLead: 'Frank' },
          ],
          expanded: false,
          expandedWorkType: null,
          workTypes: ['Cabinets', 'Tile'],
          units: {
            Cabinets: [
              {
                id: 101,
                building: 'Building A',
                level: '1',
                unit: '101',
                area: '100 sqft',
                unitType: 'Kitchen',
                quantity: 5,
                roles: [
                  { id: 1, role: 'Operator', assigned: 'Peter Griffin' },
                  { id: 2, role: 'Stager', assigned: 'Steve' },
                  { id: 3, role: 'Assembler', assigned: 'John' },
                  { id: 4, role: 'Assembler-in-training', assigned: 'N/A' },
                  { id: 5, role: 'Installer', assigned: 'Mary' },
                  { id: 6, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 102,
                building: 'Building B',
                level: '2',
                unit: '202',
                area: '150 sqft',
                unitType: 'Closet',
                quantity: 3,
                roles: [
                  { id: 7, role: 'Operator', assigned: 'unassigned' },
                  { id: 8, role: 'Stager', assigned: 'unassigned' },
                  { id: 9, role: 'Assembler', assigned: 'unassigned' },
                  { id: 10, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 11, role: 'Installer', assigned: 'unassigned' },
                  { id: 12, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
            Tile: [
              {
                id: 201,
                building: 'Building C',
                level: '3',
                unit: '303',
                area: '120 sqft',
                unitType: 'Bathroom',
                quantity: 4,
                roles: [
                  { id: 13, role: 'Operator', assigned: 'unassigned' },
                  { id: 14, role: 'Stager', assigned: 'unassigned' },
                  { id: 15, role: 'Assembler', assigned: 'unassigned' },
                  { id: 16, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 17, role: 'Installer', assigned: 'unassigned' },
                  { id: 18, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 202,
                building: 'Building D',
                level: '4',
                unit: '404',
                area: '200 sqft',
                unitType: 'Kitchen',
                quantity: 6,
                roles: [
                  { id: 19, role: 'Operator', assigned: 'unassigned' },
                  { id: 20, role: 'Stager', assigned: 'unassigned' },
                  { id: 21, role: 'Assembler', assigned: 'unassigned' },
                  { id: 22, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 23, role: 'Installer', assigned: 'unassigned' },
                  { id: 24, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
          },
        },
        {
          id: 2,
          projectName: 'Avanterra Black Forest',
          tasks: [{ id: 21, type: 'Doors', teamLead: 'Bob' }],
          expanded: false,
          expandedWorkType: null,
          workTypes: ['Doors'],
          units: {
            Doors: [
              {
                id: 301,
                building: 'Building E',
                level: '5',
                unit: '505',
                area: '80 sqft',
                unitType: 'Main Entrance',
                quantity: 2,
                roles: [
                  { id: 25, role: 'Operator', assigned: 'unassigned' },
                  { id: 26, role: 'Stager', assigned: 'unassigned' },
                  { id: 27, role: 'Assembler', assigned: 'unassigned' },
                  { id: 28, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 29, role: 'Installer', assigned: 'unassigned' },
                  { id: 30, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 302,
                building: 'Building F',
                level: '6',
                unit: '606',
                area: '100 sqft',
                unitType: 'Balcony',
                quantity: 3,
                roles: [
                  { id: 31, role: 'Operator', assigned: 'unassigned' },
                  { id: 32, role: 'Stager', assigned: 'unassigned' },
                  { id: 33, role: 'Assembler', assigned: 'unassigned' },
                  { id: 34, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 35, role: 'Installer', assigned: 'unassigned' },
                  { id: 36, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
          },
        },
        {
          id: 3,
          projectName: 'Avondale',
          tasks: [
            { id: 31, type: 'Cabinets', teamLead: '' },
            { id: 32, type: 'Tile', teamLead: 'Eve' },
          ],
          expanded: false,
          expandedWorkType: null,
          workTypes: ['Cabinets', 'Tile'],
          units: {
            Cabinets: [
              {
                id: 103,
                building: 'Building G',
                level: '7',
                unit: '707',
                area: '180 sqft',
                unitType: 'Kitchen',
                quantity: 4,
                roles: [
                  { id: 37, role: 'Operator', assigned: 'unassigned' },
                  { id: 38, role: 'Stager', assigned: 'unassigned' },
                  { id: 39, role: 'Assembler', assigned: 'unassigned' },
                  { id: 40, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 41, role: 'Installer', assigned: 'unassigned' },
                  { id: 42, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 104,
                building: 'Building H',
                level: '8',
                unit: '808',
                area: '200 sqft',
                unitType: 'Closet',
                quantity: 5,
                roles: [
                  { id: 43, role: 'Operator', assigned: 'unassigned' },
                  { id: 44, role: 'Stager', assigned: 'unassigned' },
                  { id: 45, role: 'Assembler', assigned: 'unassigned' },
                  { id: 46, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 47, role: 'Installer', assigned: 'unassigned' },
                  { id: 48, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
            Tile: [
              {
                id: 203,
                building: 'Building I',
                level: '9',
                unit: '909',
                area: '150 sqft',
                unitType: 'Bathroom',
                quantity: 3,
                roles: [
                  { id: 49, role: 'Operator', assigned: 'unassigned' },
                  { id: 50, role: 'Stager', assigned: 'unassigned' },
                  { id: 51, role: 'Assembler', assigned: 'unassigned' },
                  { id: 52, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 53, role: 'Installer', assigned: 'unassigned' },
                  { id: 54, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 204,
                building: 'Building J',
                level: '13',
                unit: '1010',
                area: '180 sqft',
                unitType: 'Kitchen',
                quantity: 4,
                roles: [
                  { id: 55, role: 'Operator', assigned: 'unassigned' },
                  { id: 56, role: 'Stager', assigned: 'unassigned' },
                  { id: 57, role: 'Assembler', assigned: 'unassigned' },
                  { id: 58, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 59, role: 'Installer', assigned: 'unassigned' },
                  { id: 60, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
          },
        },
        {
          id: 4,
          projectName: 'Ballantyne',
          tasks: [{ id: 41, type: 'Cabinets', teamLead: 'Alex' }],
          expanded: false,
          expandedWorkType: null,
          workTypes: ['Cabinets'],
          units: {
            Cabinets: [
              {
                id: 401,
                building: 'Building K',
                level: '11',
                unit: '1111',
                area: '120 sqft',
                unitType: 'Kitchen',
                quantity: 3,
                roles: [
                  { id: 61, role: 'Operator', assigned: 'unassigned' },
                  { id: 62, role: 'Stager', assigned: 'unassigned' },
                  { id: 63, role: 'Assembler', assigned: 'unassigned' },
                  { id: 64, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 65, role: 'Installer', assigned: 'unassigned' },
                  { id: 66, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 402,
                building: 'Building L',
                level: '12',
                unit: '1212',
                area: '140 sqft',
                unitType: 'Closet',
                quantity: 2,
                roles: [
                  { id: 67, role: 'Operator', assigned: 'unassigned' },
                  { id: 68, role: 'Stager', assigned: 'unassigned' },
                  { id: 69, role: 'Assembler', assigned: 'unassigned' },
                  { id: 70, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 71, role: 'Installer', assigned: 'unassigned' },
                  { id: 72, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
          },
        },
        {
          id: 5,
          projectName: 'Billboard',
          tasks: [
            { id: 51, type: 'Cabinets', teamLead: 'Ivy' },
            { id: 52, type: 'Doors', teamLead: 'John' },
          ],
          expanded: false,
          expandedWorkType: null,
          workTypes: ['Cabinets', 'Doors'],
          units: {
            Cabinets: [
              {
                id: 501,
                building: 'Building M',
                level: '13',
                unit: '1313',
                area: '160 sqft',
                unitType: 'Kitchen',
                quantity: 4,
                roles: [
                  { id: 73, role: 'Operator', assigned: 'unassigned' },
                  { id: 74, role: 'Stager', assigned: 'unassigned' },
                  { id: 75, role: 'Assembler', assigned: 'unassigned' },
                  { id: 76, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 77, role: 'Installer', assigned: 'unassigned' },
                  { id: 78, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 502,
                building: 'Building N',
                level: '14',
                unit: '1414',
                area: '180 sqft',
                unitType: 'Closet',
                quantity: 3,
                roles: [
                  { id: 79, role: 'Operator', assigned: 'unassigned' },
                  { id: 80, role: 'Stager', assigned: 'unassigned' },
                  { id: 81, role: 'Assembler', assigned: 'unassigned' },
                  { id: 82, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 83, role: 'Installer', assigned: 'unassigned' },
                  { id: 84, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
            Doors: [
              {
                id: 601,
                building: 'Building O',
                level: '15',
                unit: '1515',
                area: '90 sqft',
                unitType: 'Main Entrance',
                quantity: 2,
                roles: [
                  { id: 85, role: 'Operator', assigned: 'unassigned' },
                  { id: 86, role: 'Stager', assigned: 'unassigned' },
                  { id: 87, role: 'Assembler', assigned: 'unassigned' },
                  { id: 88, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 89, role: 'Installer', assigned: 'unassigned' },
                  { id: 90, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
              {
                id: 602,
                building: 'Building P',
                level: '16',
                unit: '1616',
                area: '100 sqft',
                unitType: 'Balcony',
                quantity: 3,
                roles: [
                  { id: 91, role: 'Operator', assigned: 'unassigned' },
                  { id: 92, role: 'Stager', assigned: 'unassigned' },
                  { id: 93, role: 'Assembler', assigned: 'unassigned' },
                  { id: 94, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 95, role: 'Installer', assigned: 'unassigned' },
                  { id: 96, role: 'Installer-in-training', assigned: 'N/A' },
                ],
              },
            ],
          },
        },
      ]);

      const filterText = ref('');
      const sortKey = ref('');
      const sortOrder = ref(1); // 1 for ascending, -1 for descending

      const unitFilters = ref({});

      // Initialize unitFilters for each work type dynamically
      projects.value.forEach((project) => {
        project.workTypes.forEach((workType) => {
          unitFilters.value[`${project.id}-${workType}`] = '';
        });
      });

      const filteredAndSortedProjects = computed(() => {
        return projects.value
          .filter((project) => {
            const projectNameMatch = project.projectName
              .toLowerCase()
              .includes(filterText.value.toLowerCase());
            const tasksMatch = project.tasks.some(
              (task) =>
                task.type.toLowerCase().includes(filterText.value.toLowerCase()) ||
                (task.teamLead || 'unassigned')
                  .toLowerCase()
                  .includes(filterText.value.toLowerCase())
            );
            const workTypeMatch = project.workTypes.some((workType) => {
              const workTypeMatch = workType.toLowerCase().includes(filterText.value.toLowerCase());
              const unitsMatch = project.units[workType].some((unit) =>
                Object.values(unit).some(
                  (value) =>
                    typeof value === 'string' &&
                    value.toLowerCase().includes(filterText.value.toLowerCase())
                )
              );
              return workTypeMatch || unitsMatch;
            });
            return projectNameMatch || tasksMatch || workTypeMatch;
          })
          .sort((a, b) =>
            a[sortKey.value] > b[sortKey.value] ? sortOrder.value : -1 * sortOrder.value
          );
      });

      const filteredUnits = (units, filterKey) => {
        const filterText = unitFilters.value[filterKey].toLowerCase();
        return units.filter((unit) => {
          return (
            Object.values(unit).some(
              (value) => typeof value === 'string' && value.toLowerCase().includes(filterText)
            ) ||
            unit.roles.some(
              (role) =>
                role.role.toLowerCase().includes(filterText) ||
                (role.assigned || '').toLowerCase().includes(filterText)
            )
          );
        });
      };

      const showAlert = ref(false);

      function showAlertPlaceholder() {
        console.log('inside showAlertPlaceholder');
        showAlert.value = true;
        setTimeout(() => {
          showAlert.value = false;
        }, 2000); // Hide the alert after 2 seconds
      }

      function toggleProject(project) {
        project.expanded = !project.expanded;
      }

      function toggleWorkType(project, workType) {
        project.expandedWorkType = project.expandedWorkType === workType ? null : workType;
      }

      function toggleUnit(unit) {
        unit.expanded = !unit.expanded;
      }

      function clearFilter() {
        filterText.value = '';
      }

      function handleEditClick(event) {
        // Example of directly using browser alert to notify about the edit action
        alert('Edit button clicked for role: ' + event.target.getAttribute('data-role'));
      }

      return {
        projects,
        filterText,
        filteredAndSortedProjects,
        toggleProject,
        toggleWorkType,
        clearFilter,
        unitFilters,
        filteredUnits,
        toggleUnit,
        showAlert,
        showAlertPlaceholder,
        handleEditClick,
      };
    },
  };
</script>

<template>
  <div class="project-breakdown-list">
    <div v-for="project in projects" :key="project.id" class="project">
      <div class="project-name-row" @click="toggleProject(project)">
        {{ project.projectName }}
      </div>
      <div v-if="project.expanded" class="project-details">
        <div v-for="workType in project.workTypes" :key="workType" class="work-type">
          <div class="work-type-row" @click="toggleWorkType(project, workType)">
            {{ workType }}
          </div>
          <input
            v-if="project.expandedWorkType === workType"
            v-model="unitFilters[`${project.id}-${workType}`]"
            type="text"
            placeholder="Filter by unit info or worker name"
            class="form-control mb-2"
          />
          <div v-if="project.expandedWorkType === workType" class="units">
            <div class="row heading text-left">
              <div class="col">Building</div>
              <div class="col">Level</div>
              <div class="col">Unit</div>
              <div class="col">Unit Type</div>
              <div class="col">Quantity</div>
            </div>
            <div
              v-for="unit in filteredUnits(project.units[workType], `${project.id}-${workType}`)"
              :key="unit.id"
              class="unit-details row unit"
              @click="toggleUnit(unit)"
            >
              <div class="unit-info text-left">
                <div class="unit-data">{{ unit.building }}</div>
                <div class="unit-data">{{ unit.level }}</div>
                <div class="unit-data">{{ unit.unit }}</div>
                <div class="unit-data">{{ unit.unitType }}</div>
                <div class="unit-data">{{ unit.quantity }}</div>
              </div>
              <div v-if="unit.expanded" class="roles">
                <div v-for="role in unit.roles" :key="role.id" class="role">
                  <div>{{ role.role }}</div>
                  <div>{{ role.assigned }}</div>
                  <!-- Edit button at the far right of each role row -->
                  <button class="btn btn-link" @click.stop="handleEditClick($event)">
                    {{ 'Edit' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .project-breakdown-list {
    max-width: 400px;
    min-width: 390px;
    padding-bottom: 200px;
    padding-left: 25px;
    color: black;
  }

  .input-group {
    margin-bottom: 15px;
  }

  .input-group input {
    width: calc(100% - 45px);
  }

  .link-type-button,
  .input-group button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }

  .input-group button {
    cursor: pointer;
    border: 0;
    background: transparent;
    color: #ccc;
    text-align: center;
    font-size: 1.5rem;
  }

  .input-group button:hover {
    color: #888;
  }

  .project-name-row,
  .work-type-row {
    cursor: pointer;
    font-weight: bold;
  }

  .project-name-row:hover,
  .work-type-row:hover {
    color: #0d6efd;
  }

  .project {
    margin-bottom: 10px;
  }
  .project-name-row,
  .work-type-row,
  .unit {
    cursor: pointer;
  }
  .project-details,
  .work-type,
  .units,
  .role {
    margin-left: 5px;
  }
  .unit-info {
    display: flex;
    justify-content: space-between;
  }
  .unit-data {
    flex: 1; /* Equal width for all columns */
    min-width: 100px; /* Set minimum width for each column */
  }

  .role {
    display: flex; /* Use flexbox */
    background: #fbfbfb; /* Light gray background */
    margin-left: 10px;
    max-width: 600px;
    min-width: 390px;
  }

  .role:not(:last-child) {
    border-bottom: 1px solid #eaeaea; /* Visual separation between role rows */
  }

  .role div {
    flex: 1; /* Equal width for all columns */
    text-align: left; /* Left-align text within divs */
    /* padding: 0 5px; */
  }
  .role button {
    padding: 0 !important;
    font-size: small;
  }
  .unit-divider {
    margin: 10px 0; /* Adjust the margin as needed */
    border: none;
    border-top: 1px solid #636363; /* Horizontal line */
  }

  .row.heading {
    display: flex;
    background: #f6ffff;
    font-size: small;
    min-width: 390px;
    max-width: 400px;
  }

  .row.heading .col {
    flex: 1;
    font-weight: bold;
    /* min-width: 0;  */
  }

  .row.unit {
    display: flex;
  }

  .row.unit .col {
    flex: 1;
  }

  .units-table {
    font-size: small;
  }

  .unit {
    min-width: 390px;
    max-width: 400px;
    font-size: small;
  }
</style>
