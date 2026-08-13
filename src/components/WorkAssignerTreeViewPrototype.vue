<template>
  <div class="card">
    <TreeTable :value="projects" :expanded-keys="expandedKeys" @on-toggle="onToggle">
      <!-- Columns for the top level -->
      <Column field="name" header="Project" expander />
      <Column field="size" header="Size" />
      <Column field="type" header="Type" />

      <!-- Slot for custom rendering of tree node -->
      <template #body="slotProps">
        <tr
          :class="{
            'p-treetable-row': true,
            'p-treetable-row-level-0': slotProps.level === 0,
            'p-treetable-row-level-1': slotProps.level === 1,
            'p-treetable-row-level-2': slotProps.level === 2,
            'p-treetable-row-level-3': slotProps.level === 3,
          }"
          @click="onRowClick(slotProps.node)"
        >
          <!-- Columns for the first and second levels -->
          <td v-for="(col, index) in 3" :key="index" class="p-treetable-col">
            <div class="p-cell-data">{{ getCellData(slotProps.node, index) }}</div>
          </td>
        </tr>
      </template>
    </TreeTable>
  </div>
</template>

<script>
  export default {
    components: {
      TreeTable,
      Column,
    },
    data() {
      return {
        projects: [
          {
            key: 'Project A',
            data: { name: 'Billboard', size: '', type: '' },
            children: [
              {
                key: 'Worktype A1',
                data: { name: 'Cabinets', size: '', type: '' },
                children: [
                  {
                    key: 'Unit A1.1',
                    data: {
                      name: 'Building: 0, Level: 3, Unit: 301, Area: 0, Unit Type: J3, Qty: 14',
                      size: '',
                      type: '',
                    },
                    children: [
                      {
                        key: 'Assignment A1.1.1',
                        data: { role: 'Operator', name: 'Josh Stevens' },
                      },
                      {
                        key: 'Assignment A1.1.2',
                        data: { role: 'Assembler', name: 'Franz Franzerson' },
                      },
                      {
                        key: 'Assignment A1.1.3',
                        data: { role: 'Installer', name: 'Sarah Sarrington' },
                      },
                    ],
                  },
                  {
                    key: 'Unit A1.2',
                    data: {
                      name: 'Building: 0, Level: 3, Unit: 302, Area: 0, Unit Type: J5, Qty: 14',
                      size: '',
                      type: '',
                    },
                    children: [
                      { key: 'Assignment A1.2.1', data: { role: 'Operator', name: 'John Doe' } },
                      { key: 'Assignment A1.2.2', data: { role: 'Assembler', name: 'Jane Smith' } },
                      {
                        key: 'Assignment A1.2.3',
                        data: { role: 'Installer', name: 'Michael Johnson' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        expandedKeys: [],
      };
    },
    methods: {
      onToggle(event) {
        this.expandedKeys = event.value;
      },
      getCellData(node, index) {
        // Return the appropriate data based on the node level
        switch (node.level) {
          case 0:
            return node.data.name;
          case 1:
            return node.data.size;
          case 2:
            return node.data.type;
          case 3:
            return node.data[index]; // Assuming the data at third level is an array with two elements
          default:
            return '';
        }
      },
      onRowClick(node) {
        // Handle row click event
        console.log('Clicked row:', node);
      },
    },
  };
</script>
