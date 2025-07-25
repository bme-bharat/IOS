import apiClient from "../ApiClient";

export const deleteS3KeyIfExists = async (key) => {
  if (!key) {
    console.log('🧼 [deleteS3KeyIfExists] No key provided. Skipping deletion.');
    return;
  }

  console.log(`🚀 [deleteS3KeyIfExists] Attempting to delete S3 key: ${key}`);

  try {
    const res = await apiClient.post('/deleteFileFromS3', {
      command: 'deleteFileFromS3',
      key,
    });

    const { statusCode, message } = res?.data || {};

    if (statusCode === 200) {
      console.log(`✅ [deleteS3KeyIfExists] ${message}`);
    } else {
      console.log(`⚠️ [deleteS3KeyIfExists] Unexpected statusCode: ${statusCode}`);
      console.log('[deleteS3KeyIfExists] Full response:', res?.data);
    }
  } catch (err) {
    console.log(`🔥 [deleteS3KeyIfExists] Exception while deleting key: ${key}`);
    console.log('[deleteS3KeyIfExists] Error details:', err);
  }
};
