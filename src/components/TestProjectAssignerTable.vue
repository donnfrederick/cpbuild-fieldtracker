<template>
  <div class="project-breakdown-list">
    <div class="input-group mb-3">
      <input
        v-model="filterText"
        type="text"
        placeholder="Filter by project, work type, or team lead..."
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
    <table class="table table-bordered">
      <thead>
        <tr>
          <th class="first-column" @click="sortTable('projectName')">Project Name</th>
          <th class="second-column">Work Types and Assignments</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="project in filteredAndSortedProjects" :key="project.id">
          <td>{{ project.projectName }}</td>
          <td>
            <button class="btn link-type-button" @click="project.expanded = !project.expanded">
              {{ project.expanded ? '- Hide' : '+ Expand' }}
            </button>
            <div v-if="project.expanded">
              <table class="table mt-2">
                <thead>
                  <tr>
                    <th>Work Type</th>
                    <th>Team Lead</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in project.tasks" :key="task.id">
                    <td>{{ task.type }}</td>
                    <td>{{ task.teamLead || 'Unassigned' }}</td>
                    <td>
                      <button class="link-type-button" @click="showAlertMessage">
                        edit assignment
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
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
        },
        {
          id: 2,
          projectName: 'Avanterra Black Forest',
          tasks: [{ id: 21, type: 'Doors', teamLead: 'Bob' }],
          expanded: false,
        },
        {
          id: 3,
          projectName: 'Avondale',
          tasks: [
            { id: 31, type: 'Cabinets', teamLead: '' },
            { id: 32, type: 'Tile', teamLead: 'Eve' },
          ],
          expanded: false,
        },
        {
          id: 4,
          projectName: 'Ballantyne',
          tasks: [{ id: 42, type: 'Tile', teamLead: 'Frank' }],
          expanded: false,
        },
        {
          id: 5,
          projectName: 'Billboard',
          tasks: [
            { id: 51, type: 'Cabinets', teamLead: 'Ivy' },
            { id: 52, type: 'Doors', teamLead: 'John' },
          ],
          expanded: false,
        },
      ]);
      const filterText = ref('');
      const sortKey = ref('');
      const sortOrder = ref(1); // 1 for ascending, -1 for descending

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
            return projectNameMatch || tasksMatch;
          })
          .sort((a, b) =>
            a[sortKey.value] > b[sortKey.value] ? sortOrder.value : -1 * sortOrder.value
          );
      });

      function sortTable(key) {
        sortKey.value = key;
        sortOrder.value = sortKey.value === key && sortOrder.value === 1 ? -1 : 1;
      }

      function showAlertMessage() {
        alert(
          'this is where a dropdown of active team leads will appear for editing the assignment'
        );
      }

      function clearFilter() {
        filterText.value = '';
      }

      return {
        projects,
        filterText,
        filteredAndSortedProjects,
        sortTable,
        showAlertMessage,
        clearFilter,
      };
    },
  };
</script>

<style scoped>
  .project-breakdown-list {
    max-width: 800px;
    padding-bottom: 200px;
    padding-left: 25px;
  }

  input {
    width: calc(100% - 45px); /* Adjust input width to account for the button */
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

  .input-group {
    width: 350px;
  }

  th {
    font-weight: bold;
  }

  .second-column {
    width: 580px;
  }
</style>
