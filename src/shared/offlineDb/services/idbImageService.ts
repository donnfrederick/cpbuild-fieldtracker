import { cpBuildIndexedDb } from '../CPBuildIndexedDb';
import { IStoredImage } from '../interfaces/IStoredImage';
import { IdbPunchWorkTaskCreateTSVService } from './idbPunchWorkTaskCreateTSVService';

export class IdbImageService {
  static async saveImage(
    file: File,
    input: Omit<IStoredImage, 'file' | 'tempId' | 'timestamp' | 'synced'>
  ) {
    const blobFile = this.fileToBlob(file);
    return cpBuildIndexedDb.images.put({
      ...input,
      submissionId: Number(input.submissionId),
      blobFile: blobFile,
      tempId: undefined, // let Dexie auto-increment
      synced: false,
      timestamp: Date.now(),
      file: undefined,
    });
  }

  static async getAllImages() {
    const images = await cpBuildIndexedDb.images.toArray();

    images.forEach((image) => {
      image.file = this.blobToFile(image.blobFile, image.imageName);
    });

    return images;
  }

  static async getAllImagesBySubmissionIdWithLocation(
    submissionId: number,
    submissionLocation: string,
    forPunchWorkTask?: boolean
  ): Promise<IStoredImage[]> {
    let images = [] as IStoredImage[];

    if (forPunchWorkTask) {
      const punchWorkTask = await IdbPunchWorkTaskCreateTSVService.getByParentTaskId(submissionId);
      if (punchWorkTask == null) return [];
      images = await cpBuildIndexedDb.images
        .where('[submissionId+submissionLocation]')
        .equals([Number(punchWorkTask.tempId), submissionLocation])
        .toArray();
    } else {
      images = await cpBuildIndexedDb.images
        .where('[submissionId+submissionLocation]')
        .equals([submissionId, submissionLocation])
        .toArray();
    }

    await Promise.all(
      images.map(async (image) => {
        image.imageName = image.imageName !== '' ? image.imageName : image.timestamp.toString();
        image.imageDescription =
          image.imageDescription !== '' ? image.imageDescription : image.timestamp.toString();
        image.file = this.blobToFile(image.blobFile, image.imageName);
        image.fileBytes = await this.fileToBase64(image.file);
      })
    );

    return images;
  }

  static async deleteImageByTempId(tempId: number) {
    return cpBuildIndexedDb.images
      .where('tempId')
      .equals(tempId)
      .filter((w) => w.synced === true)
      .delete();
  }
  static async deleteUnSyncedImageBySubmissionIdAndLocation(
    submissionId: number,
    submissionLocation: string,
    forPunchWorkTask = false
  ) {
    return cpBuildIndexedDb.images
      .where('[submissionId+submissionLocation]')
      .equals([Number(submissionId), submissionLocation])
      .filter((w) => w.synced === false && w.forPunchWorkTask === forPunchWorkTask)
      .delete();
  }

  static async deleteSyncedImageBySubmissionIdAndLocation(
    submissionId: number,
    submissionLocation: string,
    forPunchWorkTask = false
  ) {
    return cpBuildIndexedDb.images
      .where('[submissionId+submissionLocation]')
      .equals([Number(submissionId), submissionLocation])
      .filter((w) => w.synced === true && w.forPunchWorkTask == forPunchWorkTask)
      .delete();
  }

  static fileToBlob(file: File): Blob {
    return new Blob([file], { type: file.type });
  }

  static blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
  }

  static async markAsSynced(tempId: number): Promise<void> {
    await cpBuildIndexedDb.images.update(tempId, { synced: true });
  }

  static async markAsSyncedBySubmissionIdAndLocation(
    submissionId: number,
    submissionLocation: string,
    forPunchWorkTask?: boolean
  ): Promise<void> {
    await cpBuildIndexedDb.images
      .where('[submissionId+submissionLocation]')
      .equals([submissionId, submissionLocation])
      .filter((w) => w.forPunchWorkTask === forPunchWorkTask)
      .modify({ synced: true });
  }

  static async markAsNotSyncedBySubmissionIdAndLocation(
    submissionId: number,
    submissionLocation: string,
    forPunchWorkTask?: boolean
  ): Promise<void> {
    await cpBuildIndexedDb.images
      .where('[submissionId+submissionLocation]')
      .equals([submissionId, submissionLocation])
      .filter((w) => w.forPunchWorkTask === forPunchWorkTask)
      .modify({ synced: false });
  }

  static async markAsNotSynced(tempId: number): Promise<void> {
    await cpBuildIndexedDb.images.update(tempId, { synced: false });
  }

  static async markAllAsNotSynced(): Promise<void> {
    await cpBuildIndexedDb.images.toCollection().modify({ synced: false });
  }

  static async getUnsynced(): Promise<IStoredImage[]> {
    return cpBuildIndexedDb.images.filter((w) => w.synced === false).toArray();
  }

  static async fileToByteArray(file: File): Promise<number[]> {
    const buffer = await file.arrayBuffer(); // read file into ArrayBuffer
    return Array.from(new Uint8Array(buffer)); // convert to number[]
  }

  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // result looks like: "data:application/pdf;base64,AAAA..."
        const base64 = (reader.result as string).split(',')[1]; // strip prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
