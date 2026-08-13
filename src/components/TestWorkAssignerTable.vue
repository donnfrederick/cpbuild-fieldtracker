<template>
  <div class="container">
    <!-- Placeholder alert for editing role assignment -->
    <div v-if="showAlert" class="alert alert-warning" role="alert">
      Placeholder alert for editing role assignment.
    </div>

    <div class="input-group mb-3">
      <input
        v-model="filterText"
        type="text"
        placeholder="Filter Projects by name or work type"
        class="form-control"
      />
      <button
        v-show="filterText"
        class="btn btn-outline-secondary"
        type="button"
        @click="clearFilter"
      >
        &#x2715;
      </button>
    </div>

    <div v-for="project in filteredAndSortedProjects" :key="project.id" class="card mb-3">
      <div class="card-header project-name-row" @click="toggleProject(project)">
        {{ project.projectName }}
      </div>
      <div v-if="project.expanded">
        <div v-for="workType in project.workTypes" :key="workType" class="card-body">
          <div class="card-title work-type-row" @click="toggleWorkType(project, workType)">
            {{ workType }}
          </div>
          <div v-if="project.expandedWorkType === workType">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col" class="building-column">Building</th>
                  <th scope="col">Level</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Unit Type</th>
                  <th scope="col">Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="unit in filteredUnits(project.units[workType])"
                  :key="unit.id"
                  @click="toggleNestedTable(unit)"
                >
                  <td>
                    {{ unit.building }}
                    <table v-if="unit.showNestedTable" class="table role-assignments">
                      <tbody>
                        <tr v-for="role in unit.roles" :key="role.id">
                          <td>{{ role.role }}</td>
                          <td>
                            <button class="btn btn-primary btn-sm" @click="handleEditClick($event)">
                              Edit
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td>{{ unit.level }}</td>
                  <td>{{ unit.unit }}</td>
                  <td>{{ unit.unitType }}</td>
                  <td>{{ unit.quantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
                  { id: 1, role: 'Operator', assigned: 'unassigned' },
                  { id: 2, role: 'Assembler', assigned: 'unassigned' },
                  { id: 3, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 4, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 5, role: 'Operator', assigned: 'unassigned' },
                  { id: 6, role: 'Assembler', assigned: 'unassigned' },
                  { id: 7, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 8, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 9, role: 'Operator', assigned: 'unassigned' },
                  { id: 10, role: 'Assembler', assigned: 'unassigned' },
                  { id: 11, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 12, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 13, role: 'Operator', assigned: 'unassigned' },
                  { id: 14, role: 'Assembler', assigned: 'unassigned' },
                  { id: 15, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 16, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 17, role: 'Operator', assigned: 'unassigned' },
                  { id: 18, role: 'Assembler', assigned: 'unassigned' },
                  { id: 19, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 20, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 21, role: 'Operator', assigned: 'unassigned' },
                  { id: 22, role: 'Assembler', assigned: 'unassigned' },
                  { id: 23, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 24, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 25, role: 'Operator', assigned: 'unassigned' },
                  { id: 26, role: 'Assembler', assigned: 'unassigned' },
                  { id: 27, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 28, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 29, role: 'Operator', assigned: 'unassigned' },
                  { id: 30, role: 'Assembler', assigned: 'unassigned' },
                  { id: 31, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 32, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 33, role: 'Operator', assigned: 'unassigned' },
                  { id: 34, role: 'Assembler', assigned: 'unassigned' },
                  { id: 35, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 36, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 37, role: 'Operator', assigned: 'unassigned' },
                  { id: 38, role: 'Assembler', assigned: 'unassigned' },
                  { id: 39, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 40, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 41, role: 'Operator', assigned: 'unassigned' },
                  { id: 42, role: 'Assembler', assigned: 'unassigned' },
                  { id: 43, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 44, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 45, role: 'Operator', assigned: 'unassigned' },
                  { id: 46, role: 'Assembler', assigned: 'unassigned' },
                  { id: 47, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 48, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 49, role: 'Operator', assigned: 'unassigned' },
                  { id: 50, role: 'Assembler', assigned: 'unassigned' },
                  { id: 51, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 52, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 53, role: 'Operator', assigned: 'unassigned' },
                  { id: 54, role: 'Assembler', assigned: 'unassigned' },
                  { id: 55, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 56, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 57, role: 'Operator', assigned: 'unassigned' },
                  { id: 58, role: 'Assembler', assigned: 'unassigned' },
                  { id: 59, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 60, role: 'Installer', assigned: 'unassigned' },
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
                  { id: 61, role: 'Operator', assigned: 'unassigned' },
                  { id: 62, role: 'Assembler', assigned: 'unassigned' },
                  { id: 63, role: 'Assembler-in-training', assigned: 'unassigned' },
                  { id: 64, role: 'Installer', assigned: 'unassigned' },
                ],
              },
            ],
          },
        },
      ]);

      const filterText = ref('');
      const sortKey = ref('');
      const sortOrder = ref(1); // 1 for ascending, -1 for descending

      const unitFilters = ref({
        building: '',
        level: '',
        unit: '',
        area: '',
        unitType: '',
        quantity: '',
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

      const filteredUnits = computed(() => {
        return (units) => {
          return units.filter((unit) => {
            return Object.keys(unitFilters.value).every((key) => {
              if (!unitFilters.value[key]) return true;
              return unit[key].toLowerCase().includes(unitFilters.value[key].toLowerCase());
            });
          });
        };
      });

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
        unit.showNestedTable = !unit.showNestedTable;
      }

      function toggleNestedTable(unit) {
        unit.showNestedTable = !unit.showNestedTable;
      }

      function clearFilter() {
        filterText.value = '';
      }

      function handleEditClick(event) {
        // Check if the clicked element is the button
        if (event.target.tagName.toLowerCase() === 'button') {
          // Stop event propagation only for the edit button
          event.stopPropagation();
          // Call showAlertPlaceholder or any other actions you need
          showAlertPlaceholder();
        }
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
        toggleNestedTable,
        showAlert,
        showAlertPlaceholder,
        handleEditClick,
      };
    },
  };
</script>

<style scoped>
  .project-breakdown-list {
    max-width: 800px;
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
  .unit-details {
    margin-left: 20px;
  }
  .unit-info {
    display: flex;
    justify-content: space-between;
  }
  .unit-data {
    flex: 1; /* Equal width for all columns */
    min-width: 100px; /* Set minimum width for each column */
  }
  .roles {
    margin-left: 20px; /* Indentation for nested appearance */
  }
  .role {
    display: flex; /* Use flexbox */
    padding: 5px 0; /* Adjust padding as needed */
  }

  .role:not(:last-child) {
    border-bottom: 1px solid #eaeaea; /* Visual separation between role rows */
  }

  .role div {
    flex: 1; /* Equal width for all columns */
    text-align: left; /* Left-align text within divs */
  }
  .unit-divider {
    margin: 10px 0; /* Adjust the margin as needed */
    border: none;
    border-top: 1px solid #636363; /* Horizontal line */
  }

  .row.heading {
    display: flex;
    background: #f6ffff;
  }

  .row.heading .col {
    flex: 1;
    font-weight: bold;
    min-width: 0; /* Ensure headings can shrink if needed */
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

  .row.heading {
    min-width: 170px;
  }

  .card {
    min-width: 405px;
  }

  .role-assignments {
    margin-top: 10px;
  }

  .role-assignments {
    position: absolute;
    left: 5px;
    right: 0;
    width: 80%;
    background: white;
    z-index: 10;
    outline: auto;
  }

  .table-row {
    position: relative;
  }
</style>
