<script setup lang="ts">
  import TopNavBar from '@/components/TopNavBar.vue';
  import { computed, ref, onMounted, watchEffect } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import type { ColumnDefinition, CellComponent, RowComponent } from 'tabulator-tables';
  import { TabulatorFull as Tabulator } from 'tabulator-tables';
  import axios from 'axios';
  import 'tabulator-tables/dist/css/tabulator_bootstrap5.min.css';
  import 'vue-select/dist/vue-select.css';

  import { useAuthStore } from '@/stores/useAuthStore';
  import type {
    ScopeDetail,
    ScopeOverrideChanges,
    TabulatorRowData,
  } from '@/interfaces/fieldTracker';

  declare module 'tabulator-tables' {
    interface Options {
      // Add your custom properties here, for example:
      selectableRange?: boolean;
      selectableRangeColumns?: boolean;
      selectableRowsRangeMode?: 'click' | 'drag';
      selectableRows?: boolean;
      selectableRowsPersistence?: boolean;
      rowHeight?: number;
    }
  }

  // Variable Initializations
  const authStore = useAuthStore();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  const router = useRouter();
  const route = useRoute();

  // Role-based access control
  const isControlsManagerOrAbove = computed(
    () => authStore.hasControlsManagerRole || authStore.hasAdminRole
  );

  // Change tracking
  let changesTrackerScopeEditor: { [scopeOverrideId: number]: Partial<ScopeOverrideChanges> } = {};
  let lastFocusedRow: any | null = null;
  const allowedRowUpdateProperties = [
    'manHoursQuantityOverride',
    'installFactorOverride',
    'overrideChangedAt',
    'overrideChangedById',
    'scopeOverrideId',
    'ftProjectId',
  ];

  // Reactive properties
  const isLoading = ref<boolean>(false);
  const storedProjectName = ref<string | undefined>();
  const storedFtProjectId = ref<string | undefined>();
  const storedProjectViewerRoute = ref();
  const apiErrorMessage = ref<string | undefined>('');
  const hasApiError = ref<boolean>(false);
  const showToast = ref<boolean>(false);
  const showErrorToast = ref<boolean>(false);
  const toastMessage = ref<string | undefined>('');
  const toastErrorMessage = ref<string | undefined>('');
  const userRoleString = ref<string>('');
  const userId = ref<number | null>(0);
  const projectScopeDetailsList = ref<ScopeDetail[]>([]);

  let table: any = ref(null);
  let tabulator: any = ref(null);
  let isTableReady = ref(false);

  (() => {
    const storedProjectData = JSON.parse(localStorage.getItem('currentProjectInfo') || '{}');

    storedFtProjectId.value = storedProjectData.ftProjectId;
    storedProjectName.value = storedProjectData.projectName;
    storedProjectViewerRoute.value = `/field-tracker/project-viewer/${route.params.id}/edit`;
  })();

  const closeScopeEditor = () => {
    router.push({
      name: 'field-tracker-project-viewer',
      params: { id: route.params.id, mode: 'edit' },
    });
  };

  const clearOverridesFormatter = (cell: any, _formatterParams: any, _onRendered: any) => {
    // Dynamically determine if the overrides exist for the current row
    const rowData = cell.getRow().getData();
    const hasOverrideEntry = rowData.scopeOverrideId !== undefined;
    const hasActiveOverrides =
      hasOverrideEntry &&
      (rowData.manHoursQuantityOverride !== null || rowData.installFactorOverride !== null);

    if (hasActiveOverrides) {
      const clearOverridesButton = document.createElement('button');
      // Create a span for the red "x"
      const redX = document.createElement('span');
      redX.innerHTML = 'x';
      redX.style.color = '#DC3545'; // Red color
      redX.style.marginRight = '5px';
      redX.style.fontSize = '1.2em';

      clearOverridesButton.appendChild(redX);
      clearOverridesButton.innerHTML += 'Clear Overrides';
      clearOverridesButton.classList.add('btn', 'btn-primary', 'btn-sm');
      clearOverridesButton.style.background = 'white';
      clearOverridesButton.style.border = 'none';
      clearOverridesButton.style.color = '#DC3545';
      clearOverridesButton.style.cursor = 'pointer';
      clearOverridesButton.style.paddingLeft = '5px';
      clearOverridesButton.style.fontSize = '0.9em';
      clearOverridesButton.style.marginTop = '-4px';
      clearOverridesButton.type = 'button';

      clearOverridesButton.onclick = async () => {
        const row = cell.getRow();
        const rowData = row.getData();
        const scopeOverrideId = rowData.scopeOverrideId;

        interface OverrideUpdateData {
          manHoursQuantityOverride: number | null;
          installFactorOverride: number | null;
          clearOverrideButton?: any;
          updatedAt: string;
          updatedBy: number | null;
        }

        if (scopeOverrideId) {
          // Prepare the data for the update
          const updateData: OverrideUpdateData = {
            manHoursQuantityOverride: null,
            installFactorOverride: null,
            updatedAt: new Date().toISOString(),
            updatedBy: userId.value || null,
          };

          try {
            // Call the update endpoint with axios
            const response = await axios.post(
              `${apiBaseUrl}/api-proxy`,
              {
                userRoles: userRoleString.value,
                targetUrl: `${apiBaseUrl}/field-tracker/project/${rowData.scopeOverrideFtProjectId}/scope-overrides/update`,
                targetMethodType: 'PATCH',
                data: [
                  {
                    scopeOverrideId: scopeOverrideId,
                    ftProjectId: rowData.scopeOverrideFtProjectId,
                    changes: updateData,
                  },
                ],
              },
              {
                timeout: 10000,
              }
            );

            // Check if the response is successful
            if (response.status === 200) {
              updateData.clearOverrideButton = '';
              // Update the row data to reflect the changes in the UI
              row.update(updateData);
              await recalculateFields(rowData, row);

              // Show toast message
              showToast.value = true;
              toastMessage.value = 'Overrides cleared successfully.';

              // Optionally, hide the toast after a few seconds
              setTimeout(() => {
                showToast.value = false;
              }, 5000);
            } else {
              // Handle unsuccessful update attempts
              console.error('Failed to clear overrides:', response.data);
              // Show error toast message
              showErrorToast.value = true;
              toastErrorMessage.value = 'Failed to clear overrides. Please try again.';
            }
          } catch (error) {
            console.error('Error clearing overrides:', error);
            // Show error toast message
            showErrorToast.value = true;
            toastErrorMessage.value =
              'An error occurred while clearing overrides. Please try again.';
          }
        }
      };

      return clearOverridesButton;
    }
    // Return an empty element or null if no overrides to ensure consistent return type
    return document.createElement('span');
  };

  const fetchProjectScopeDetailsData = async () => {
    isLoading.value = true;
    hasApiError.value = false;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: userRoleString.value,
          targetUrl: `${apiBaseUrl}/field-tracker/project/${route.params.id}/scopes/list`,
          targetMethodType: 'GET',
        },
        {
          timeout: 10000,
        }
      );

      const reformattedProjectScopeDetailsData = await Promise.all(
        response.data.map(async (scopeDetail: ScopeDetail) => {
          return await reformatProjectScopeDetailsData(scopeDetail);
        })
      );

      projectScopeDetailsList.value = reformattedProjectScopeDetailsData;
    } catch (error) {
      console.error('Error fetching project scope details data', error);
      hasApiError.value = true;
      apiErrorMessage.value = 'Error fetching project scope details data';
    } finally {
      isLoading.value = false;
    }
  };

  function calculateInverse(value: number) {
    try {
      // Attempt to calculate the reciprocal of the input value and round it to 4 decimal places
      let result = 1 / value;
      // Ensure the operation doesn't result in Infinity (which is a division by zero in this context)
      if (value !== 0) {
        return parseFloat(result.toFixed(4));
      } else {
        // If result is Infinity (division by zero), return 0
        return 0;
      }
    } catch (error) {
      console.log('Error calculating inverse:', error);
      // If any error occurs, return 0
      return 0;
    }
  }

  async function reformatProjectScopeDetailsData(scopeDetail: ScopeDetail) {
    const hasScopeOverride = scopeDetail.scopeOverrideId !== null;
    let quantityPerHour: number | null | undefined = null;
    let proposedManHoursQuantity: number | null | undefined = null;
    let proposedQuantityPerHour: number | null | undefined = null;

    if (hasScopeOverride && scopeDetail.scopeOverride) {
      if (
        scopeDetail.scopeOverride.manHoursQuantityOverride !== null &&
        scopeDetail.scopeOverride.manHoursQuantityOverride !== undefined
      ) {
        quantityPerHour = calculateInverse(scopeDetail.scopeOverride.manHoursQuantityOverride);
        if (
          scopeDetail.scopeOverride.installFactorOverride !== null &&
          scopeDetail.scopeOverride.installFactorOverride !== undefined
        ) {
          proposedManHoursQuantity = parseFloat(
            (
              scopeDetail.scopeOverride.manHoursQuantityOverride /
              scopeDetail.scopeOverride.installFactorOverride
            ).toFixed(4)
          );
        } else {
          proposedManHoursQuantity = parseFloat(
            (
              scopeDetail.scopeOverride.manHoursQuantityOverride / scopeDetail.defaultInstallFactor
            ).toFixed(4)
          );
        }
      } else {
        quantityPerHour = calculateInverse(scopeDetail.defaultManHoursQuantity);
        if (
          scopeDetail.scopeOverride?.installFactorOverride !== null &&
          scopeDetail.scopeOverride?.installFactorOverride !== undefined
        ) {
          proposedManHoursQuantity = parseFloat(
            (
              scopeDetail.defaultManHoursQuantity / scopeDetail.scopeOverride.installFactorOverride
            ).toFixed(4)
          );
        } else {
          proposedManHoursQuantity = parseFloat(
            (scopeDetail.defaultManHoursQuantity / scopeDetail.defaultInstallFactor).toFixed(4)
          );
        }
      }
    } else {
      quantityPerHour = calculateInverse(scopeDetail.defaultManHoursQuantity);
      proposedManHoursQuantity = parseFloat(
        (scopeDetail.defaultManHoursQuantity / scopeDetail.defaultInstallFactor).toFixed(4)
      );
    }

    if (quantityPerHour !== null && quantityPerHour !== undefined) {
      if (hasScopeOverride && scopeDetail.scopeOverride) {
        if (
          scopeDetail.scopeOverride.installFactorOverride !== null &&
          scopeDetail.scopeOverride.installFactorOverride !== undefined
        ) {
          proposedQuantityPerHour = parseFloat(
            (quantityPerHour / scopeDetail.scopeOverride.installFactorOverride).toFixed(4)
          );
        } else {
          proposedQuantityPerHour = parseFloat(
            (quantityPerHour / scopeDetail.defaultInstallFactor).toFixed(4)
          );
        }
      } else {
        proposedQuantityPerHour = parseFloat(
          (quantityPerHour / scopeDetail.defaultInstallFactor).toFixed(4)
        );
      }
    }

    return {
      scopeDetailId: scopeDetail.scopeDetailId,
      scopeDetailCode: scopeDetail.scopeDetailCode,
      scopeDetailDescription: scopeDetail.description,
      isActive: scopeDetail.isActive,
      primeCodeId: scopeDetail.primeCode.id,
      primeCode: scopeDetail.primeCode.primeCode,
      primeCodeDescription: scopeDetail.primeCode.description,
      subPrimeCodeId: scopeDetail.subPrimeCode.id,
      subPrimeCode: scopeDetail.subPrimeCode.subPrimeCode,
      subPrimeCodeDescription: scopeDetail.subPrimeCode.description,
      uomTypeId: scopeDetail.uomType.id,
      uomType: scopeDetail.uomType.uomName,
      uomTypeDescription: scopeDetail.uomType.description ? scopeDetail.uomType.description : '',
      defaultManHoursQuantity: scopeDetail.defaultManHoursQuantity,
      quantityPerHour: quantityPerHour,
      defaultInstallFactor: scopeDetail.defaultInstallFactor,
      scopeOverrideId: scopeDetail.scopeOverride?.id,
      scopeOverrideFtProjectId: scopeDetail.scopeOverride?.ftProjectId,
      scopeOverrideScopeDetailId: scopeDetail.scopeOverride?.scopeDetailId,
      manHoursQuantityOverride: scopeDetail.scopeOverride?.manHoursQuantityOverride,
      installFactorOverride: scopeDetail.scopeOverride?.installFactorOverride,
      proposedManHoursQuantity: proposedManHoursQuantity,
      proposedQuantityPerHour: proposedQuantityPerHour,
      overrideCreatedAt: scopeDetail.scopeOverride?.createdAt,
      overrideCreatedById: scopeDetail.scopeOverride?.createdById,
      overrideCreatedByName: scopeDetail.scopeOverride?.createdByName,
      overrideUpdatedAt: scopeDetail.scopeOverride?.updatedAt,
      overrideUpdatedById: scopeDetail.scopeOverride?.updatedById,
      overrideUpdatedByName: scopeDetail.scopeOverride?.updatedByName,
      overrideDeletedAt: scopeDetail.scopeOverride?.deletedAt,
      overrideDeletedById: scopeDetail.scopeOverride?.deletedById,
      overrideDeletedByName: scopeDetail.scopeOverride?.deletedByName,
    } as TabulatorRowData;
  }

  function numberEditor(cell: CellComponent, onRendered: any, success: any, cancel: any) {
    // Create an input element
    const editor = document.createElement('input');
    editor.setAttribute('type', 'number');
    editor.style.paddingLeft = '25px'; // Make space for the clear button

    // Adjusted originalValue calculation to handle null and undefined values safely
    let cellValue = cell.getValue();
    let originalValue = '';
    if (cellValue !== null && cellValue !== undefined) {
      originalValue = cellValue.toString();
    }
    // Set the current cell value
    editor.value = originalValue;

    // Style and set up the input element (optional)
    editor.style.width = '100%';
    editor.style.height = '100%';
    editor.style.boxSizing = 'border-box';
    editor.style.border = '1px solid #80bdff'; // Subtle border
    editor.style.borderRadius = '4px'; // Rounded corners for modern look
    editor.style.backgroundColor = '#fff'; // White background
    editor.style.boxShadow = 'inset 0 0 5px rgba(0,0,0,0.1)'; // Inner shadow for depth
    editor.style.fontFamily = 'inherit'; // Ensure font consistency
    editor.style.fontSize = 'inherit'; // Match table's font size
    editor.style.color = '#555'; // Text color for readability

    function isValidNumberOrEmpty(value: string) {
      // Allow the value to be an empty string or match the number regex
      return value === '' || /^\d*(\.\d{0,4})?$/.test(value);
    }

    function onChange() {
      // If the editor's value is an empty string, set the success argument to null.
      if (editor.value === '') {
        success(null);
      } else if (isValidNumberOrEmpty(editor.value)) {
        let valueToSubmit = parseFloat(editor.value);
        if (!isNaN(valueToSubmit)) {
          // Check to prevent submitting NaN values.
          success(valueToSubmit);
        } else {
          cancel();
        }
      } else {
        cancel();
      }
    }

    // Create and append a clear button to the editor
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'x';
    clearBtn.style.position = 'absolute';
    clearBtn.style.left = '3px';
    clearBtn.style.top = '22%';
    clearBtn.style.background = 'transparent';
    clearBtn.style.border = 'none';
    clearBtn.style.cursor = 'pointer';
    clearBtn.style.color = '#DC3545';
    clearBtn.style.fontWeight = 'bold';
    clearBtn.style.display = originalValue ? 'block' : 'none'; // Only show if there's an initial value

    // Append the clear button directly to the cell's container if `parentNode` exists
    onRendered(() => {
      const parentElement = editor.parentNode as HTMLElement; // Assert parentNode as HTMLElement
      if (parentElement) {
        parentElement.style.position = 'relative'; // Ensure the container can hold absolute elements
        parentElement.appendChild(clearBtn);
      }
    });

    // Event listeners for editor actions
    editor.addEventListener('input', () => {
      // Update clear button visibility based on editor value
      clearBtn.style.display = editor.value ? 'block' : 'none';
    });
    editor.addEventListener('blur', onChange);
    editor.addEventListener('keydown', (e) => {
      if (e.keyCode === 13 || e.keyCode === 27) onChange();
    });

    // Clear button action
    clearBtn.addEventListener('click', () => {
      editor.value = '';
      onChange(); // Explicitly call onChange to process the empty value
    });

    return editor;
  }

  function calculatedFieldFormatter(cell: CellComponent, _formatterParams: any, _onRendered: any) {
    // Obtain the cell element
    const cellEl = cell.getElement();

    // Add your custom class
    cellEl.classList.add('calculated-field');

    // Return the cell value, so the cell displays normally
    return cell.getValue();
  }

  async function updateRowsInBackend(updatesPayload: ScopeOverrideChanges[]): Promise<void> {
    try {
      // Prepare an array to hold all promises for the updates
      const updatePromises = updatesPayload.map(async (change) => {
        let response;

        if (change.scopeOverrideId === null || change.scopeOverrideId === undefined) {
          // If scopeOverrideId is null, it indicates a new scope override needs to be created.
          response = await axios.post(
            `${apiBaseUrl}/api-proxy`,
            {
              userRoles: userRoleString.value,
              targetUrl: `${apiBaseUrl}/field-tracker/project/${change.ftProjectId}/scope/${change.scopeDetailId}/override/create`,
              targetMethodType: 'POST',
              data: [change],
            },
            {
              timeout: 10000,
            }
          );
        } else {
          // For existing scope overrides, an update is needed.
          response = await axios.post(
            `${apiBaseUrl}/api-proxy`,
            {
              userRoles: userRoleString.value,
              targetUrl: `${apiBaseUrl}/field-tracker/project/${change.ftProjectId}/scope-overrides/update`,
              targetMethodType: 'PATCH',
              data: [change],
            },
            {
              timeout: 10000,
            }
          );
        }

        return response.data;
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating project scope overrides data', error);
      hasApiError.value = true;
      apiErrorMessage.value =
        'Error updating project scope overrides data. Select and then deselect any row to try again.';
    }
  }

  async function synchronizeChangesWithLocalStorage() {
    const storedChanges = localStorage.getItem('changesTrackerScopeEditor');

    if (storedChanges && storedChanges !== '{}') {
      const storedChangesObj = JSON.parse(storedChanges);
      changesTrackerScopeEditor = storedChangesObj;

      // Attempt to save the changes
      await saveRowUpdateChanges()
        .then(() => {
          console.log('Unsaved changes from previous session successfully saved.');
        })
        .catch((error) => {
          console.error('Error saving changes from previous session:', error);
          hasApiError.value = true;
          apiErrorMessage.value =
            'Error saving changes from previous session. Please close and reopen the tool to retry.';
        });
    }
  }

  const processChangesForEndpoint = (changesTrackerScopeEditor: {
    [scopeDetailId: string]: Partial<ScopeOverrideChanges>;
  }) => {
    const updates = Object.entries(changesTrackerScopeEditor).flatMap(([rowId, entry]) => {
      // Assuming actual changes are nested under a 'changes' property
      const changes: Partial<ScopeOverrideChanges> = entry.changes || {};

      // Filter and reduce the changes to only allowed properties
      const filteredChanges = Object.keys(changes)
        .filter((key) => allowedRowUpdateProperties.includes(key))
        .reduce((obj: ScopeOverrideChanges, key) => {
          // Use 'any' for simplicity here
          obj[key] = changes[key];
          return obj;
        }, {} as ScopeOverrideChanges);

      // Check if there are valid override changes for creation
      const hasValidOverrides = ['manHoursQuantityOverride', 'installFactorOverride'].some(
        (key) =>
          filteredChanges[key] !== null &&
          filteredChanges[key] !== undefined &&
          !Number.isNaN(filteredChanges[key])
      );

      if (entry.scopeOverrideId === null || entry.scopeOverrideId === undefined) {
        if (hasValidOverrides) {
          // For creation, prepare the payload with relevant properties
          const creationPayload = {
            ...filteredChanges,
            ftProjectId: entry.ftProjectId,
            scopeDetailId: +rowId,
            createdBy: userId.value, // Assuming 'createdBy' value is directly available
          };
          return creationPayload;
        }
        // If no valid overrides, skip creation for this entry
        return [];
      } else {
        // For updates, ensure correct structuring of the payload
        const updatePayload = {
          scopeOverrideId: entry.scopeOverrideId,
          ftProjectId: entry.ftProjectId,
          changes: {
            ...filteredChanges,
            updatedAt: new Date().toISOString(), // Use current date-time as 'updatedAt'
            updatedBy: userId.value, // Assuming 'updatedBy' value is directly available
          },
        };
        return updatePayload;
      }
    });

    // Filter out any null entries
    return updates.filter((update) => update !== null);
  };

  async function saveRowUpdateChanges() {
    // Save the current state of changesTrackerScopeEditor to localStorage before attempting to save
    localStorage.setItem('changesTrackerScopeEditor', JSON.stringify(changesTrackerScopeEditor));

    const updates = processChangesForEndpoint(changesTrackerScopeEditor) as ScopeOverrideChanges[];

    if (updates.length > 0) {
      try {
        // Save all changes to the backend
        await updateRowsInBackend(updates);
        localStorage.removeItem('changesTrackerScopeEditor'); // Clear localStorage after successful updates
        const numberOfChanges = changesTrackerScopeEditor
          ? Object.keys(changesTrackerScopeEditor).length
          : 0;
        changesTrackerScopeEditor = {}; // Clear the changesTrackerScopeEditor after successful updates

        toastMessage.value = `Changes to ${numberOfChanges} row(s) have been saved!`;
        showToast.value = true;

        // Automatically hide the toast after 5 seconds
        setTimeout(() => {
          showToast.value = false;
        }, 5000);
      } catch (error) {
        console.error('Error saving changes to backend:', error);
        hasApiError.value = true;
        apiErrorMessage.value =
          'Error updating project rows data. Select and then deselect any row to try again.';
        // Note: Do not clear localStorage or changesTrackerScopeEditor here, as the data is still unsaved
      }
    }
  }

  async function handleRowChange(newRow: RowComponent) {
    if (newRow !== lastFocusedRow) {
      if (lastFocusedRow !== null) {
        await saveRowUpdateChanges()
          .then(() => {
            changesTrackerScopeEditor = {}; // Clear the changesTrackerScopeEditor after successful save
          })
          .catch((error: Error) => {
            console.error('Error saving changes:', error);
            hasApiError.value = true;
            apiErrorMessage.value =
              'Error saving changes. Please select a randow row and then deselect it to try again.';
          });
      }

      if (lastFocusedRow !== null) {
        tabulator.value.deselectRow(lastFocusedRow);
      }
      lastFocusedRow = newRow;
    }
  }

  async function recalculateFields(rowData: TabulatorRowData, row: RowComponent) {
    const hasScopeOverride =
      rowData.scopeOverrideId !== null && rowData.scopeOverrideId !== undefined;
    const hasManHoursOverride =
      rowData.manHoursQuantityOverride !== null &&
      rowData.manHoursQuantityOverride !== undefined &&
      !Number.isNaN(rowData.manHoursQuantityOverride);
    const hasInstallFactorOverride =
      rowData.installFactorOverride !== null &&
      rowData.installFactorOverride !== undefined &&
      !Number.isNaN(rowData.installFactorOverride);

    if (hasScopeOverride) {
      if (hasManHoursOverride) {
        rowData.quantityPerHour = calculateInverse(rowData.manHoursQuantityOverride);
        if (hasInstallFactorOverride) {
          rowData.proposedManHoursQuantity = parseFloat(
            (rowData.manHoursQuantityOverride / rowData.installFactorOverride).toFixed(4)
          );
        } else {
          rowData.proposedManHoursQuantity = parseFloat(
            (rowData.manHoursQuantityOverride / rowData.defaultInstallFactor).toFixed(4)
          );
        }
      } else {
        rowData.quantityPerHour = calculateInverse(rowData.defaultManHoursQuantity);
        if (hasInstallFactorOverride) {
          rowData.proposedManHoursQuantity = parseFloat(
            (rowData.defaultManHoursQuantity / rowData.installFactorOverride).toFixed(4)
          );
        } else {
          rowData.proposedManHoursQuantity = parseFloat(
            (rowData.defaultManHoursQuantity / rowData.defaultInstallFactor).toFixed(4)
          );
        }
      }
    } else {
      rowData.quantityPerHour = calculateInverse(rowData.defaultManHoursQuantity);
      rowData.proposedManHoursQuantity = parseFloat(
        (rowData.defaultManHoursQuantity / rowData.defaultInstallFactor).toFixed(4)
      );
    }

    if (rowData.quantityPerHour !== null && rowData.quantityPerHour !== undefined) {
      if (hasScopeOverride) {
        if (hasInstallFactorOverride) {
          rowData.proposedQuantityPerHour = parseFloat(
            (rowData.quantityPerHour / rowData.installFactorOverride).toFixed(4)
          );
        } else {
          rowData.proposedQuantityPerHour = parseFloat(
            (rowData.quantityPerHour / rowData.defaultInstallFactor).toFixed(4)
          );
        }
      } else {
        rowData.proposedQuantityPerHour = parseFloat(
          (rowData.quantityPerHour / rowData.defaultInstallFactor).toFixed(4)
        );
      }
    }

    if (
      rowData.scopeOverrideId &&
      (rowData.installFactorOverride !== null || rowData.manHoursQuantityOverride !== null) &&
      rowData.clearOverrideButton === undefined
    ) {
      rowData.clearOverrideButton = clearOverridesFormatter;
    }
    row.update(rowData);
  }

  // Method to call when table is built
  function onTableBuilt() {
    isTableReady.value = true;
  }

  function attachHeaderInputListeners() {
    const headerInputs = document.querySelectorAll('.tabulator-header-filter input');
    headerInputs.forEach((input) => {
      input.addEventListener('click', async function (e: Event) {
        // Prevent event from bubbling up to headerClick
        e.stopPropagation();

        await saveRowUpdateChanges()
          .then(() => {
            changesTrackerScopeEditor = {}; // Clear the changesTrackerScopeEditor after successful save
          })
          .catch((error) => {
            console.error('Error saving changes:', error);
            hasApiError.value = true;
            apiErrorMessage.value =
              'Error saving changes. Please select a random row and then deselect it to try again.';
          });
      });
    });
  }

  const getTableColumns = (): ColumnDefinition[] => {
    let columns: ColumnDefinition[] = [
      {
        title: '',
        field: 'clearOverrideButton',
        formatter: clearOverridesFormatter,
        headerSort: false,
        width: 134,
        frozen: true,
      },
      {
        title: 'Prime',
        columns: [
          {
            title: 'Code',
            field: 'primeCode',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
          {
            title: 'Description',
            field: 'primeCodeDescription',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
        ],
      },
      {
        title: 'Sub-Prime',
        columns: [
          {
            title: 'Code',
            field: 'subPrimeCode',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
          {
            title: 'Description',
            field: 'subPrimeCodeDescription',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
        ],
      },
      {
        title: 'Detail',
        columns: [
          {
            title: 'Code',
            field: 'scopeDetailCode',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
          {
            title: 'Description',
            field: 'scopeDetailDescription',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
        ],
      },
      {
        title: 'Unit of Measure',
        columns: [
          {
            title: 'UOM Type',
            field: 'uomType',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
        ],
      },
      {
        title: 'Base Installation Rates',
        columns: [
          {
            title: 'MH/QTY Default',
            field: 'defaultManHoursQuantity',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
          {
            title: 'MH/QTY Override',
            field: 'manHoursQuantityOverride',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
            editor: isControlsManagerOrAbove.value ? numberEditor : undefined,
          },
          {
            title: 'Qty/Hour',
            field: 'quantityPerHour',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
            formatter: calculatedFieldFormatter,
          },
        ],
      },
      {
        title: 'Install Factor',
        columns: [
          {
            title: 'Default',
            field: 'defaultInstallFactor',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
          {
            title: 'Override',
            field: 'installFactorOverride',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
            editor: isControlsManagerOrAbove.value ? numberEditor : undefined,
          },
        ],
      },
      {
        title: 'Proposed Installation Rates',
        columns: [
          {
            title: 'Man Hours Quantity',
            field: 'proposedManHoursQuantity',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
          {
            title: 'Qty/Hour',
            field: 'proposedQuantityPerHour',
            headerFilter: 'input',
            headerFilterPlaceholder: 'Filter by Value',
          },
        ],
      },
    ];

    return columns;
  };

  const initializeTabulator = () => {
    // First destroy any instance of Tabulator if exists
    if (tabulator.value) {
      tabulator.value.destroy();
    }

    tabulator.value = new Tabulator(table.value, {
      height: `calc(100vh - 200px)`,
      rowHeight: 45,
      history: true,
      index: 'scopeDetailId',
      selectableRows: true,
      selectableRowsRangeMode: 'click',
      selectableRowsPersistence: false,
      data: projectScopeDetailsList.value,
      reactiveData: true,
      layout: 'fitDataTable',
      initialSort: [{ column: 'scopeDetailCode', dir: 'asc' }],
      columns: getTableColumns(),
    });

    tabulator.value.on('tableBuilt', onTableBuilt);

    tabulator.value.on('cellEdited', async function (cell: CellComponent) {
      const rowData: any = cell.getRow().getData();
      const rowId = rowData.scopeDetailId;
      const overrideId = rowData.scopeOverrideId ? rowData.scopeOverrideId : null;
      const field = cell.getField();
      let newValue = cell.getValue();
      const currentProjectId = route.params.id;

      if (field === 'manHoursQuantityOverride' || field === 'installFactorOverride') {
        newValue = parseFloat(newValue);
      }

      // Ensure rowData is updated with the new value
      rowData[field] = newValue;
      rowData._isDirty = true;

      // Determine changes based on overrideId existence
      let currentChanges = {
        ...(overrideId === null
          ? {
              createdAt: new Date().toISOString(),
              createdBy: userId.value || null,
              [field]: newValue,
            }
          : {
              updatedAt: new Date().toISOString(),
              updatedBy: userId.value || null,
              [field]: newValue,
            }),
      };

      // Initialize or update the changesTrackerScopeEditor for this row
      if (!changesTrackerScopeEditor[rowId]) {
        changesTrackerScopeEditor[rowId] = {
          scopeOverrideId: overrideId,
          ftProjectId: +currentProjectId,
          changes: {},
        };
      }

      // Merge currentChanges into changesTrackerScopeEditor[rowId].changes
      changesTrackerScopeEditor[rowId].changes = {
        ...changesTrackerScopeEditor[rowId].changes,
        ...currentChanges,
        [field]: newValue, // Now safely set the field value
      } as any;

      // Save the current state of changesTrackerScopeEditor to localStorage
      localStorage.setItem('changesTrackerScopeEditor', JSON.stringify(changesTrackerScopeEditor));

      recalculateFields(rowData, cell.getRow());

      const rowIndex = projectScopeDetailsList.value.findIndex((r) => {
        return r.scopeDetailId === rowId;
      });
      if (rowIndex !== -1) {
        projectScopeDetailsList.value[rowIndex] = {
          ...projectScopeDetailsList.value[rowIndex],
          ...rowData,
        };
        projectScopeDetailsList.value[rowIndex]._isDirty = true;
      }

      // Now we can update the database with any changes from the edited cell
      await saveRowUpdateChanges()
        .then(() => {
          changesTrackerScopeEditor = {}; // Clear the changesTrackerScopeEditor after successful save
        })
        .catch((error: Error) => {
          console.error('Error saving changes:', error);
          hasApiError.value = true;
          apiErrorMessage.value =
            'Error saving changes. Please select a randow row and then deselect it to try again.';
        });
    });

    tabulator.value.on('rowDeselected', (_row: RowComponent) => {
      // No action needed; handler can be removed or left empty if required for future use
    });

    tabulator.value.on('cellEditing', (cell: CellComponent) => {
      const currentRow = cell.getRow();
      handleRowChange(currentRow);
    });

    // Ensure Tabulator is initialized before attaching event listeners
    if (tabulator.value) {
      const tabulatorElement = document.querySelector('.table-container') as HTMLElement; // Replace with your Tabulator container selector

      tabulatorElement.addEventListener('click', async function (e: Event) {
        // Check if the click is inside a row cell
        const isRowCell = (e.target as HTMLElement).closest('.tabulator-row .tabulator-cell');

        // If the click is not on a row cell and either on tabulatorElement or header input, then save changes
        if (!isRowCell) {
          await saveRowUpdateChanges()
            .then(() => {
              changesTrackerScopeEditor = {}; // Clear the changesTrackerScopeEditor after successful save
            })
            .catch((error) => {
              console.error('Error saving changes:', error);
              hasApiError.value = true;
              apiErrorMessage.value =
                'Error saving changes. Please select a random row and then deselect it to try again.';
            });
        }
      });

      // Re-attach listeners if the table is redrawn or columns are updated
      tabulator.value.on('tableBuilt', attachHeaderInputListeners);
    } else {
      console.error('Tabulator instance is not available.');
      hasApiError.value = true;
      apiErrorMessage.value =
        'The project rows table is not available. Please close tool and try again.';
    }
  };

  watchEffect(() => {
    userRoleString.value = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';
    userId.value = authStore.tdUserId !== null ? authStore.tdUserId : 0;
  });

  onMounted(async () => {
    // Synchronize changesTrackerScopeEditor with localStorage
    await synchronizeChangesWithLocalStorage();

    await fetchProjectScopeDetailsData();
    await initializeTabulator();
  });
</script>

<template>
  <div class="top-nav-bar">
    <TopNavBar />
  </div>

  <div class="body-content ft-scope-editor">
    <!-- Tool Header -->
    <div class="header-body container-fluid">
      <div class="row">
        <div class="col-lg-8 col-md-8 col-sm-12 col-12">
          <span class="breadcrumb-nav">
            <router-link to="/field-tracker" class="breadcrumb-link">Field Tracker</router-link> /
            <router-link :to="storedProjectViewerRoute" class="breadcrumb-link">{{
              storedProjectName
            }}</router-link>
            / Scope Editor</span
          >
        </div>
        <div
          class="col-lg-4 col-md-4 col-sm-12 col-12 mt-lg-0 mt-md-0 mt-sm-2 mt-2 text-lg-end text-md-end text-sm-start text-start"
        >
          <button class="btn-close-ft-project link-type-button" @click="closeScopeEditor">
            Close Scope Editor<i class="bi-x-circle" />
          </button>
        </div>
      </div>
    </div>

    <hr />

    <div v-if="hasApiError" class="error-message">
      {{ apiErrorMessage }}
    </div>

    <div ref="table" class="table-container"></div>
  </div>

  <!-- Loading spinner overlay -->
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <div v-if="showToast" class="toast-message">
    {{ toastMessage }}
    <button @click="showToast = false">Close</button>
  </div>
  <div v-if="showErrorToast" class="toast-error-message">
    {{ toastErrorMessage }}
    <button @click="showToast = false">Close</button>
  </div>
</template>

<style scoped>
  .top-nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1030; /* Ensure it stays on top of other content */
    height: 45px;
  }

  .ft-scope-editor {
    overflow-y: auto; /* Enables vertical scrolling if content overflows */
    height: 100vh; /* Optional: Adjust if you want a specific height */
    margin-top: 62px;
  }
  .header-body {
    width: 100%;
    padding: 10px 30px;
    min-width: 350px;
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

  .breadcrumb-nav {
    font-size: 16px;
    color: #3c3c3c;
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

  .link-type-button {
    background: none;
    border: none;
    color: #19a7af;
    padding-left: 5px;
  }

  hr {
    margin: 0 15px;
    color: #7a7a7a;
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

  .toast-error-message {
    background-color: #dc3545 !important;
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

  .toast-message button,
  .toast-error-message button {
    border: none;
    background: none;
    color: white;
    font-size: 1.2em;
    cursor: pointer;
  }

  .error-message {
    color: #dc3545;
    padding: 10px 30px;
    text-align: center;
    width: 100%;
    background-color: #f8d7da;
  }

  .table-container {
    min-height: 300px;
    max-height: 85vh;
    overflow-y: auto;
    width: 95%;
    margin-left: 2.5%;
    margin-right: 2.5%;
    margin-top: 50px;
  }

  :deep(.tabulator-header) {
    color: #3c3c3c;
    font-weight: 700;
  }

  :deep(.tabulator) {
    /* font-size: 14px; */
    color: rgb(60, 60, 60);
    font-size: 13.5px;
  }

  :deep(.tabulator-row .tabulator-cell) {
    overflow: hidden;
    border-right: 1px solid #dee2e6;
  }

  :deep(.tabulator .tabulator-header .tabulator-col) {
    border-right: 1px solid #dee2e6;
    text-align: center;
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

  :deep(.tabulator .tabulator-header .tabulator-col-group[aria-title='Prime']),
  :deep(.tabulator .tabulator-header .tabulator-col-group[aria-title='Detail']),
  :deep(.tabulator .tabulator-header .tabulator-col-group[aria-title='Base Installation Rates']),
  :deep(
      .tabulator .tabulator-header .tabulator-col-group[aria-title='Proposed Installation Rates']
    ),
  :deep(.tabulator-col[tabulator-field='primeCode']),
  :deep(.tabulator-col[tabulator-field='primeCodeDescription']),
  :deep(.tabulator-col[tabulator-field='scopeDetailCode']),
  :deep(.tabulator-col[tabulator-field='scopeDetailDescription']),
  :deep(.tabulator-col[tabulator-field='defaultManHoursQuantity']),
  :deep(.tabulator-col[tabulator-field='manHoursQuantityOverride']),
  :deep(.tabulator-col[tabulator-field='budgetedManHours']) {
    border-right: 1px solid #b0b0b0;
    color: #19a7af;
  }

  :deep(.tabulator .tabulator-header .tabulator-col-group[aria-title='Sub-Prime']),
  :deep(.tabulator .tabulator-header .tabulator-col-group[aria-title='Unit of Measure']),
  :deep(.tabulator .tabulator-header .tabulator-col-group[aria-title='Install Factor']),
  :deep(.tabulator-col[tabulator-field='subPrimeCode']),
  :deep(.tabulator-col[tabulator-field='subPrimeCodeDescription']),
  :deep(.tabulator-col[tabulator-field='uomType']),
  :deep(.tabulator-col[tabulator-field='defaultInstallFactor']),
  :deep(.tabulator-col[tabulator-field='installFactorOverride']) {
    background-color: #f8f8f8;
    border-right: 1px solid #b0b0b0;
    color: #19a7af;
  }

  :deep(.tabulator-cell[tabulator-field='primeCodeDescription']),
  :deep(.tabulator-cell[tabulator-field='subPrimeCodeDescription']),
  :deep(.tabulator-cell[tabulator-field='scopeDetailDescription']),
  :deep(.tabulator-cell[tabulator-field='uomType']),
  :deep(.tabulator-cell[tabulator-field='quantityPerHour']),
  :deep(.tabulator-cell[tabulator-field='installFactorOverride']),
  :deep(.tabulator-cell[tabulator-field='proposedQuantityPerHour']) {
    border-right: 1px solid #b0b0b0;
  }

  :deep(.tabulator-cell[tabulator-field='manHoursQuantityOverride']),
  :deep(.tabulator-cell[tabulator-field='installFactorOverride']) {
    color: #19a7af;
    font-weight: 600;
    border: 1px solid #b0b0b0;
  }

  :deep(.tabulator-col[tabulator-field='quantityPerHour']),
  :deep(.tabulator-cell[tabulator-field='quantityPerHour']),
  :deep(.tabulator-col[tabulator-field='proposedManHoursQuantity']),
  :deep(.tabulator-cell[tabulator-field='proposedManHoursQuantity']),
  :deep(.tabulator-col[tabulator-field='proposedQuantityPerHour']),
  :deep(.tabulator-cell[tabulator-field='proposedQuantityPerHour']) {
    background-color: #ededed;
  }
</style>
