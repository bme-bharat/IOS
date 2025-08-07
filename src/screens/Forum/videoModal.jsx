import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Platform,
    StatusBar,
} from 'react-native';
import Video from 'react-native-video';

const VideoModal = ({ visible, onClose, videoUrl, thumbnailUrl }) => {
    return (
        <Modal
            visible={visible}
            onRequestClose={onClose}
            animationType="slide"
            presentationStyle="fullScreen"
            supportedOrientations={['portrait', 'landscape']}
        >
            <View style={styles.container}>
                <StatusBar hidden />
                {videoUrl && (
                    <Video
                        source={{ uri: videoUrl }}
                        style={styles.video}
                        controls
                        resizeMode="contain"
                        poster={thumbnailUrl}
                        posterResizeMode="contain"
                    />
                )}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignSelf: 'center',
        justifyContent: 'center'
    },
    video: {
        width: '100%',
        aspectRatio: 9 / 16,
        alignSelf: 'center'
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        padding: 10,
        zIndex: 10,
    },
    closeText: {
        color: '#fff',
        fontSize: 20,
    },
});

export default VideoModal;
