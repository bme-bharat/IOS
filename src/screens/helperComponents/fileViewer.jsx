import { Alert, Platform, Share } from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import apiClient from '../ApiClient';

export const useFileOpener = () => {
    const openFile = async (key = '') => {

        if (!key) {
            Alert.alert('Error', 'File key not provided.');
            return;
        }

        try {

            const response = await apiClient.post('/getObjectSignedUrl', {
                command: 'getObjectSignedUrl',
                key,
            });

            const url = response?.data;
            if (!url) {
                Alert.alert('Error', 'Signed URL not available.');
                return;
            }

            const extensionMap = {
                'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
                'vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
                'application/pdf': 'pdf',
                'vnd.ms-excel': 'xls',
                'application/msword': 'doc',
                'application/vnd.ms-excel': 'xls',
                'application/vnd.ms-powerpoint': 'ppt',
                'text/plain': 'txt',
                'image/webp': 'webp',
                'sheet': 'xlsx',
                'presentation': 'pptx',
                'msword': 'doc',
                'document': 'docx',
                'ms-excel': 'xls',
                'ms-powerpoint': 'ppt',
                'plain': 'txt',
            };

            const cleanKey = key.split('?')[0] ?? '';
            const rawExt = cleanKey.split('.').pop()?.toLowerCase();
            const finalExt = extensionMap[rawExt] || rawExt || 'pdf';

            const baseName = cleanKey.split('.')[0];
            const localFile = `${RNFS.DocumentDirectoryPath}/temp_${baseName}.${finalExt}`;


            const downloadResult = await RNFS.downloadFile({
                fromUrl: url,
                toFile: localFile,
            }).promise;

            try {
                await FileViewer.open(localFile, {
                    showOpenWithDialog: Platform.OS === 'android',
                });
            } catch (viewerError) {

                if (Platform.OS === 'ios') {
                    await Share.share({
                        url: `file://${localFile}`,
                        title: 'Open file in another app',
                    });
                } else {
                    Alert.alert('Unable to open file', 'Try using a different viewer app.');
                }
            }

        } catch (error) {
            console.error('[useFileOpener] General error:', error);
            Alert.alert('Error', 'Could not open the file. Please try again later.');
        }
    };

    return { openFile };
};
