<script setup lang="ts">
  import axios from 'axios';
  import { Modal } from 'bootstrap';
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';
  import { useAuthStore } from '@/stores/useAuthStore';
  import * as imageUploadService from '@/services/imageUpload';
  import * as fabric from 'fabric';

  import VueFilePond from 'vue-filepond';

  import 'filepond/dist/filepond.min.css';
  import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';

  import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
  import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
  import { useNetworkStore } from '@/stores/useNetworkStore';
  import { storeToRefs } from 'pinia';
  import { IdbImageService } from '@/shared/offlineDb/services/idbImageService';
  import { IStoredImage } from '@/shared/offlineDb/interfaces/IStoredImage';

  const FilePond = VueFilePond(FilePondPluginFileValidateType, FilePondPluginImagePreview);

  const myFiles = ref<File[]>([]);
  const pond: any = ref(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const isLoading = ref(true);
  const userId = ref<number | null>(0);
  const userRoleString = ref<string>('');

  const selectedFile = ref<File[]>([]);

  const authStore = useAuthStore();

  const imageMetaData: any = ref([]);

  const imageMetaModalRef = ref<HTMLElement | null>(null);
  let imageMetaModalInstance: Modal | null = null;

  // 🔹 Add optional `id` prop; other props unchanged
  const props = defineProps({
    id: {
      type: String,
      default: undefined,
    },
    submissionLocation: {
      type: String,
      default: '',
    },
    submissionId: {
      type: Number,
      default: 0,
    },
    submissionTypeId: {
      type: Number,
      default: 0,
    },
    forPunchWorkTask: {
      type: Boolean,
      default: false,
    },
  });

  // 🔹 Always-defined ID the template can bind to
  const inputId = computed(() => props.id ?? `filepond-${Math.random().toString(36).slice(2)}`);

  const emit = defineEmits(['uploadSuccess', 'hasChanged']);

  const isOnAdd = ref(false);

  const networkStore = useNetworkStore();
  const { isOffline } = storeToRefs(networkStore);

  watch(
    () => props.submissionId,
    (newVal) => {
      if (newVal != 0) {
        uploadFile();
      }
    },
    { immediate: false }
  );

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

  const uploadFile = async () => {
    if (selectedFile.value.length == 0) return;

    try {
      let uploadedFileCount = 0;

      if (isOffline.value) {
        IdbImageService.deleteUnSyncedImageBySubmissionIdAndLocation(
          props.submissionId,
          props.submissionLocation,
          props.forPunchWorkTask
        );
      }

      for (const file of selectedFile.value) {
        // Find metadata for this file
        const metaData = imageMetaData.value.find((metaData: any) => metaData.image === file.name);
        if (isOffline.value) {
          await IdbImageService.saveImage(file, {
            submissionTypeId: props.submissionTypeId || 0,
            submissionLocation: props.submissionLocation || 0,
            submissionId: props.submissionId || 0,
            sessionId: metaData.session_id,
            imageName: metaData.name || '',
            imageDescription: metaData.description || '',
            createdBy: userId.value || 0,
            forPunchWorkTask: props.forPunchWorkTask,
          } as IStoredImage);

          uploadedFileCount += 1;
          uploadSuccess(uploadedFileCount);

          continue;
        }

        // Build a FormData object
        const formData = new FormData();

        // Append the file
        formData.append('files', file, file.name);

        // Append other fields your Azure Function expects
        formData.append('submissionTypeId', props.submissionTypeId.toString() || '');
        formData.append('submissionLocation', props.submissionLocation || '');
        formData.append('submissionId', String(props.submissionId || 0));
        formData.append('sessionId', metaData.session_id); // server does `atob(...)` on this
        formData.append('imageName', metaData.name || '');
        formData.append('imageDescription', metaData.description || '');
        formData.append('createdBy', String(userId.value || 0));

        // Make the POST request
        try {
          await axios.post(`${apiBaseUrl}/blob/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'x-functions-key': import.meta.env.VITE_API_KEY as string,
            },
          });
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
          } else {
            console.error('Unknown error:', err);
          }
        }

        uploadedFileCount += 1;
        uploadSuccess(uploadedFileCount);
      }
    } catch (error) {
      isLoading.value = false;
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${(error as any).response?.data || (error as Error).message}`);
    }
  };

  const uploadSuccess = (count: number) => {
    if (count == selectedFile.value.length) {
      // Reset selected files / metadata
      selectedFile.value = [];
      imageMetaData.value = [];
      pond?.value?.removeFiles();

      isOnAdd.value = false;
      // Emit success
      emit('uploadSuccess');
    }
  };

  const processImageWithWatermark = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;

        img.onload = () => {
          // 🔹 Define max width and height
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          let width = img.width;
          let height = img.height;

          // 🔹 Resize image while maintaining aspect ratio
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const aspectRatio = width / height;
            if (width > height) {
              width = MAX_WIDTH;
              height = Math.round(MAX_WIDTH / aspectRatio);
            } else {
              height = MAX_HEIGHT;
              width = Math.round(MAX_HEIGHT * aspectRatio);
            }
          }

          // 🔹 Create an off-screen canvas
          const canvasEl = document.createElement('canvas');
          canvasEl.width = width;
          canvasEl.height = height;

          // 🔹 Initialize Fabric.js Canvas
          const canvas = new (fabric as any).Canvas(canvasEl);

          // 🔹 Load image into Fabric
          (fabric as any).FabricImage.fromURL(img.src)
            .then((fabricImg: any) => {
              if (!fabricImg) {
                reject(new Error('Failed to load image.'));
                return;
              }

              // Scale image to fit resized dimensions
              fabricImg.scaleToWidth(width);
              fabricImg.scaleToHeight(height);
              canvas.add(fabricImg);
              canvas.renderAll();

              // 🔹 Create watermark text
              const timestampText = new Date().toLocaleString();
              const watermark = new (fabric as any).FabricText(timestampText, {
                fontSize: 24,
                fill: 'white',
                fontWeight: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: 8,
              });

              watermark.scaleToWidth(width * 0.3);
              watermark.set({
                left: width - (watermark.width ?? 0) - 60,
                top: height - (watermark.height ?? 0) - 20,
              });

              canvas.add(watermark);
              canvas.renderAll();

              // 🔹 Convert to Blob and return as File
              canvasEl.toBlob((blob) => {
                if (blob) {
                  const watermarkedFile = new File([blob], file.name, { type: 'image/png' });
                  resolve(watermarkedFile);
                } else {
                  reject(new Error('Failed to generate watermarked image.'));
                }
              }, 'image/png');
            })
            .catch((error: any) => reject(error));
        };
      };

      reader.onerror = (error) => reject(error);
    });
  };

  const onAddFile = async () => {
    if (isOnAdd.value) return;

    isOnAdd.value = true;
    selectedFile.value = [];
    const oldMetaData = imageMetaData.value;
    imageMetaData.value = [];

    const uploadedFiles = pond.value.getFiles();

    for (const uploadedFile of uploadedFiles) {
      const originalFile = uploadedFile.file;

      try {
        // Process image before adding
        const watermarkedFile = await processImageWithWatermark(originalFile);
        selectedFile.value.push(watermarkedFile);

        // Maintain existing metadata structure
        const existingMeta = oldMetaData.find((meta: any) => meta.image === originalFile.name);
        imageMetaData.value.push({
          image: watermarkedFile.name,
          session_id: existingMeta?.session_id || imageUploadService.generateSessionID(),
          name: existingMeta?.name || '',
          description: existingMeta?.description || '',
          previewUrl: URL.createObjectURL(watermarkedFile),
        });
      } catch (error) {
        console.error('Error processing image:', error);
        selectedFile.value.push(originalFile); // Fall back to original file if watermarking fails
      } finally {
        isOnAdd.value = false;
      }
    }

    if (imageMetaModalInstance) {
      imageMetaModalInstance.show();
    }

    emit('hasChanged', selectedFile.value.length);
  };

  const onRemoveFile = (_error: any, file: any) => {
    selectedFile.value = [];

    const uploadedFiles = pond.value.getFiles();

    uploadedFiles.forEach((uploadedFile: any) => {
      selectedFile.value.push(uploadedFile.file);
    });

    const index = imageMetaData.value.findIndex((item: any) => item.image == file.file.name);

    if (index !== -1) {
      imageMetaData.value.splice(index, 1);
    }

    emit('hasChanged', selectedFile.value.length);
  };

  const addMetaData = () => {
    if (imageMetaModalInstance) {
      imageMetaModalInstance.hide();
    }
  };

  const openImageMetaModal = () => {
    if (imageMetaModalInstance) {
      imageMetaModalInstance.show();
    }
  };

  const checkOfflineImageForSubmissionIdAndLocation = async () => {
    console.log(
      'checkOfflineImageForSubmissionIdAndLocation',
      props.submissionId,
      props.submissionLocation,
      props.forPunchWorkTask
    );
    if (isOffline.value && props.submissionId && props.submissionLocation) {
      const offlineImages = await IdbImageService.getAllImagesBySubmissionIdWithLocation(
        props.submissionId,
        props.submissionLocation,
        props.forPunchWorkTask
      );

      if (offlineImages.length > 0) {
        for (const img of offlineImages) {
          if (img.file == null) {
            console.error('Image file is null for image:', img);
            continue;
          }

          const watermarkedFile = await processImageWithWatermark(img.file);
          selectedFile.value.push(watermarkedFile);

          imageMetaData.value.push({
            image: watermarkedFile.name,
            session_id: img.sessionId,
            name: img.imageName,
            description: img.imageDescription,
            previewUrl: URL.createObjectURL(watermarkedFile),
          });
        }
        pond.value.addFiles(...selectedFile.value);

        emit('hasChanged', selectedFile.value.length);
      }
    }
  };

  onMounted(async () => {
    checkOfflineImageForSubmissionIdAndLocation();
    if (imageMetaModalRef.value) {
      imageMetaModalInstance = new Modal(imageMetaModalRef.value, {
        backdrop: 'static',
        keyboard: false,
        focus: true,
      });
    }
    isLoading.value = false;
  });
</script>

<template>
  <div class="col-md-12 text-center">
    <div class="form-group">
      <file-pond
        :id="inputId"
        ref="pond"
        name="test"
        label-idle="Drop files here..."
        :allow-multiple="true"
        accepted-file-types="image/jpeg, image/png"
        :files="myFiles"
        @addfile="onAddFile"
        @removefile="onRemoveFile"
      />
    </div>
    <div class="form-group mt-3">
      <button
        v-if="imageMetaData.length > 0"
        class="btn btn-link"
        style="text-decoration: none"
        @click="openImageMetaModal"
      >
        <i class="bi bi-edit"></i> Update Image Details
      </button>
    </div>
  </div>

  <div ref="imageMetaModalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content text-muted">
        <div class="modal-header">
          <h5 id="pasteModalLabel" class="modal-title">Image Upload Details</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-for="metaData in imageMetaData" :key="metaData.image" class="mb-5">
            <div class="form-group">
              <label>Image Preview</label>
              <div class="col-md-12 text-center">
                <img :src="metaData.previewUrl" style="max-width: 80%; border-radius: 5px" />
              </div>
            </div>
            <div class="form-group mt-3">
              <label>Image Name</label>
              <input v-model="metaData.name" type="text" class="form-control" />
            </div>
            <div class="form-group mt-3">
              <label>Image Description</label>
              <textarea
                v-model="metaData.description"
                rows="2"
                class="form-control"
                style="resize: none"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" @click="addMetaData">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
