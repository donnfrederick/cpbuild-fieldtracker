<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';
  import { Modal } from 'bootstrap';
  import axios from 'axios';
  import FileUpload from '@/components/FileUpload.vue';
  import { InstallTrackerService } from '@/services/installTracker';
  import type { UnstagedUnits } from '@/interfaces/installTracker';

  interface BlockingIssueTypes {
    id: number;
    name: string;
    description: string;
  }

  interface BlockingIssueResponsiblePartyTypes {
    id: number;
    name: string;
    description: string;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const props = defineProps({
    showModal: {
      type: Boolean,
      default: false,
    },
    blockingIssueUnitId: {
      type: Number,
      default: 0,
    },
    projectByScopeId: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Number,
      default: 0,
    },
    userRoles: {
      type: String,
      default: '',
    },
  });

  const emit = defineEmits(['onClose', 'onSubmit', 'onSuccess', 'onFailed']);

  const installTrackerService = new InstallTrackerService();

  const modalRef = ref<HTMLElement | null>(null);
  let modalInstance: Modal | null = null;

  const blockingIssueTypes = ref<BlockingIssueTypes[]>([]);
  const blockingIssueResponsiblePartyTypes = ref<BlockingIssueResponsiblePartyTypes[]>([]);

  const submissionLocation = ref('');
  const submissionId = ref(0);

  const blockingIssueUnstagedUnitId = ref<number>(0);
  const blockingIssueTypeId = ref<number>(0);
  const blockingIssueResponsiblePartyTypeId = ref<number>(0);
  const blockingIssueIssueDetails = ref<string>('');

  const unstagedUnits = ref<UnstagedUnits[]>([]);

  watch(
    () => props.showModal,
    async (newVal) => {
      if (newVal) {
        if (props.blockingIssueUnitId == 0) {
          unstagedUnits.value = [];
          await getUnstagedUnitList();
        }

        modalInstance?.show();
      } else {
        blockingIssueUnstagedUnitId.value = 0;
        blockingIssueTypeId.value = 0;
        blockingIssueResponsiblePartyTypeId.value = 0;
        blockingIssueIssueDetails.value = '';
        unstagedUnits.value = [];
        modalInstance?.hide();
      }
    },
    { immediate: true }
  );

  async function getBlockingIssueTypes() {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: props.userRoles,
          targetUrl: `${apiBaseUrl}/blocking-issue/types`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      blockingIssueTypes.value = data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getBlockingIssueResponsiblePartyTypes() {
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api-proxy`,
        {
          userRoles: props.userRoles,
          targetUrl: `${apiBaseUrl}/blocking-issue/responsible-party/types`,
          targetMethodType: 'GET',
        },
        {
          timeout: 120000,
        }
      );

      blockingIssueResponsiblePartyTypes.value = data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getUnstagedUnitList() {
    try {
      const data = await installTrackerService.getUnstagedUnits(props.projectByScopeId);

      unstagedUnits.value = data;
    } catch (error) {
      console.log(error);
    }
  }

  onMounted(async () => {
    await getBlockingIssueTypes();
    await getBlockingIssueResponsiblePartyTypes();

    if (modalRef.value) {
      modalInstance = new Modal(modalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
  });

  const closeModal = () => {
    const xconfirm = confirm('Do you want to cancel? Changes will not be saved');

    if (xconfirm) {
      blockingIssueTypeId.value = 0;
      blockingIssueResponsiblePartyTypeId.value = 0;
      blockingIssueIssueDetails.value = '';

      emit('onClose');
    }
  };

  const submitNewIssue = async () => {
    const xconfirm = confirm('Do you want to continue?');

    if (xconfirm) {
      emit('onSubmit');

      if (
        blockingIssueIssueDetails.value != '' &&
        blockingIssueTypeId.value != 0 &&
        blockingIssueResponsiblePartyTypeId.value != 0
      ) {
        let unitId = 0;
        if (props.blockingIssueUnitId > 0) {
          unitId = props.blockingIssueUnitId;
        } else {
          unitId = blockingIssueUnstagedUnitId.value;
        }

        const updateProjectRequestBody = {
          issueType: blockingIssueTypeId.value,
          responsibleParty: blockingIssueResponsiblePartyTypeId.value,
          issueDetails: blockingIssueIssueDetails.value,
          statusId: 1,
          createdBy: props.userId,
          userRoles: props.userRoles,
          targetUrl: `${apiBaseUrl}/unit-by-scope/${unitId}/blocking-issues/create`,
          targetMethodType: 'POST',
        };

        try {
          const { data } = await axios.post(`${apiBaseUrl}/api-proxy`, updateProjectRequestBody, {
            timeout: 10000,
          });

          submissionLocation.value = 'field_tracker.blocking_issues';
          submissionId.value = data.submissionId;

          emit('onClose');
        } catch (error) {
          console.error('Error creating new blocking issue:', error);
        }
      } else {
        let errMessage;

        if (blockingIssueTypeId.value == 0) {
          errMessage = 'Issue Type is required';
        } else if (blockingIssueResponsiblePartyTypeId.value == 0) {
          errMessage = 'Responsible Party is required';
        } else {
          errMessage = 'Issue Details is required';
        }

        emit('onFailed', errMessage);
      }
    }
  };

  const uploadSuccess = async () => {
    emit('onSuccess');
  };
</script>
<template>
  <div ref="modalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">CREATE BLOCKING ISSUE</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <div v-if="props.projectByScopeId > 0" class="form-group">
            <label for="dropdownSelect">* Blocked Unit</label>
            <select v-model="blockingIssueUnstagedUnitId" class="form-control blocked-unit-select">
              <option value="0">Select Blocked Unit</option>
              <option v-for="unit in unstagedUnits" :key="unit.id" :value="unit.id">
                Building: {{ unit.building }}, Level: {{ unit.level }}, Unit: {{ unit.unit }}, Unit
                Type: {{ unit.unitType }}, Unit ID: {{ unit.id }}
              </option>
            </select>
          </div>
          <div :class="['form-group', props.projectByScopeId > 0 ? 'mt-3' : '']">
            <label for="dropdownSelect">* Issue Type</label>
            <select v-model="blockingIssueTypeId" class="form-control">
              <option value="0">Select From Available Types</option>
              <option
                v-for="issueType in blockingIssueTypes"
                :key="issueType.id"
                :value="issueType.id"
              >
                {{ issueType.name }}
              </option>
            </select>
          </div>
          <div class="form-group mt-3">
            <label for="dropdownSelect">* Responsible Party</label>
            <select v-model="blockingIssueResponsiblePartyTypeId" class="form-control">
              <option value="0">Select From Available Types</option>
              <option
                v-for="issueResponsiblePartyTypes in blockingIssueResponsiblePartyTypes"
                :key="issueResponsiblePartyTypes.id"
                :value="issueResponsiblePartyTypes.id"
              >
                {{ issueResponsiblePartyTypes.name }}
              </option>
            </select>
          </div>
          <div class="form-group mt-3">
            <label for="dropdownSelect">* Issue Details</label>
            <textarea v-model="blockingIssueIssueDetails" class="form-control"></textarea>
          </div>
          <div class="form-group mt-5">
            <label for="dropdownSelect"
              ><strong>Upload any images</strong> that define the blocking issue</label
            >
            <FileUpload
              id="blocking-issue-create-image-upload"
              :submission-type-id="5"
              :submission-location="submissionLocation"
              :submission-id="submissionId"
              @upload-success="uploadSuccess"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="
              (props.projectByScopeId > 0 && blockingIssueUnstagedUnitId == 0) ||
              blockingIssueTypeId == 0 ||
              blockingIssueResponsiblePartyTypeId == 0 ||
              blockingIssueIssueDetails == ''
            "
            @click="submitNewIssue"
          >
            Create Issue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
  @media (max-width: 768px) {
    .blocked-unit-select {
      font-size: 11px;
    }
  }
  @media (max-width: 480px) {
    .blocked-unit-select {
      font-size: 9px;
    }
  }
</style>
