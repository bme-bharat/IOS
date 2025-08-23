import React, { useEffect, useState, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image
} from 'react-native';
import Video from 'react-native-video';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/MaterialIcons';

let openViewerFn = null;
const fallbackAssets = ['buliding.jpg', 'dummy.png', 'female.jpg'];

export const openMediaViewer = (mediaArray = [], startIndex = 0) => {
    if (openViewerFn) openViewerFn({ mediaArray, startIndex });
};

const { width, height } = Dimensions.get('window');

const MediaViewer = () => {
    const [visible, setVisible] = useState(false);
    const [mediaArray, setMediaArray] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [bufferingStates, setBufferingStates] = useState({});
    const videoRefs = useRef({});
    const [currentTimes, setCurrentTimes] = useState({});
    const [videoDurations, setVideoDurations] = useState({});
    const [pausedStates, setPausedStates] = useState({});

    const updateBuffering = (index, isBuffering) => {
        setBufferingStates(prev => ({
            ...prev,
            [index]: isBuffering,
        }));
    };

    useEffect(() => {
        openViewerFn = ({ mediaArray = [], startIndex = 0 }) => {
            if (!Array.isArray(mediaArray) || mediaArray.length === 0) return;

            setMediaArray(mediaArray);
            setCurrentIndex(Math.min(startIndex, mediaArray.length - 1));
            setVisible(true);
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: startIndex, animated: false });
            }, 50);
        };
        return () => {
            openViewerFn = null;
        };
    }, []);

    const handleClose = () => {
        setVisible(false);
        setCurrentIndex(0);
        setMediaArray([]);
    };

    const renderItem = ({ item, index }) => {
        if (!item || typeof item !== 'object' || !item.url || !item.type) {
            return (
                <View style={styles.centeredMediaWrapper}>
                    <Text style={styles.noImageText}>Invalid Media</Text>
                </View>
            );
        }

        const isCurrent = index === currentIndex;
        const isBuffering = bufferingStates[index];
        const isFallback = fallbackAssets.some(name => (item?.url || '').includes(name));

        if (isFallback) {
            return (
                <View style={styles.centeredMediaWrapper}>
                    <Text style={styles.noImageText}>No Image Available</Text>
                </View>
            );
        }

        if (item.type === 'image') {
            return (
                <View style={{ width, height }}>
                    <ImageViewer
                        imageUrls={[{ url: item.url }]}
                        backgroundColor="black"
                        enableSwipeDown
                        onSwipeDown={handleClose}
                        saveToLocalByLongPress={false}
                        renderIndicator={() => null}
                    />
                </View>
            );
        }

        return (
            <View style={styles.centeredMediaWrapper}>
                <Video
                    controls={false}
                    hideShutterView={true}
                    ref={(ref) => {
                        if (ref) videoRefs.current[index] = ref;
                    }}
                    source={{ uri: item.url }}
                    style={[styles.media, isBuffering && styles.buffering]}
                    resizeMode="contain"
                    paused={pausedStates[index] ?? index !== currentIndex}
                    muted={isMuted}
                    onLoadStart={() => updateBuffering(index, true)}
                    onReadyForDisplay={() => updateBuffering(index, false)}
                    onProgress={({ currentTime }) => {
                        setCurrentTimes(prev => ({ ...prev, [index]: currentTime }));
                    }}
                    onLoad={({ duration }) => {
                        setVideoDurations(prev => ({ ...prev, [index]: duration }));
                    }}
                    onEnd={() => {
                        videoRefs.current[index]?.seek(0);
                    }}
                />
                {isBuffering && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    const renderThumbnail = ({ item, index }) => {
        if (!item || !item.url || !item.type || fallbackAssets.some(name => item.url.includes(name))) return null;

        return (
            <TouchableOpacity
                onPress={() => {
                    setCurrentIndex(index);
                    flatListRef.current?.scrollToIndex({ index, animated: true });
                }}
                style={[
                    styles.thumbnailWrapper,
                    currentIndex === index && styles.activeThumbnailWrapper,
                ]}
            >
                {item.type === 'image' ? (
                    <Image
                        source={{ uri: item.url }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.thumbnail}>
                        <Video
                            source={{ uri: item.url }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            paused
                        />
                        <View style={styles.playIconOverlay}>
                            <Icon name="play-arrow" size={20} color="white" />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent onRequestClose={handleClose}>
            <View style={styles.modalContainer}>
                {/* TOP BAR */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                    {mediaArray?.[currentIndex]?.type === 'video' && (
                        <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.muteButton}>
                            <Icon name={isMuted ? 'volume-off' : 'volume-up'} size={22} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* MAIN CONTENT */}
                <FlatList
                    ref={flatListRef}
                    data={mediaArray}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    onMomentumScrollEnd={e => {
                        const index = Math.round(e.nativeEvent.contentOffset.x / width);
                        setCurrentIndex(index);
                    
                        // Optional: reset paused state for new video
                        setPausedStates(prev => ({
                            ...prev,
                            [index]: false, // autoplay current video
                        }));
                    }}
                    
                />

                {/* BOTTOM CONTROLS */}
                <View style={styles.bottomBar}>
                    {mediaArray?.[currentIndex]?.type === 'video' && (
                        <>
                            <View style={styles.progressBarWrapper}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: videoDurations[currentIndex]
                                                ? `${(currentTimes[currentIndex] / videoDurations[currentIndex]) * 100}%`
                                                : '0%',
                                        },
                                    ]}
                                />
                            </View>

                            <View style={styles.controlOverlay}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const currentTime = currentTimes[currentIndex] || 0;
                                        videoRefs.current[currentIndex]?.seek(Math.max(0, currentTime - 5));
                                    }}
                                    style={styles.controlButton}
                                >
                                    <Icon name="replay-5" size={32} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setPausedStates(prev => ({
                                            ...prev,
                                            [currentIndex]: !prev[currentIndex],
                                        }));
                                    }}
                                    style={styles.controlButton}
                                >
                                    <Icon
                                        name={pausedStates[currentIndex] ? 'play-arrow' : 'pause'}
                                        size={40}
                                        color="white"
                                    />
                                </TouchableOpacity>


                                <TouchableOpacity
                                    onPress={() => {
                                        const currentTime = currentTimes[currentIndex] || 0;
                                        videoRefs.current[currentIndex]?.seek(currentTime + 5);
                                    }}
                                    style={styles.controlButton}
                                >
                                    <Icon name="forward-5" size={32} color="white" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* THUMBNAILS */}
                    <View style={styles.thumbnailListWrapper}>
                        <FlatList
                            data={mediaArray}
                            horizontal
                            keyExtractor={(_, idx) => `thumb-${idx}`}
                            renderItem={renderThumbnail}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailList}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default MediaViewer;

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    topBar: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        // backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: 'transparent',
    },
    centeredMediaWrapper: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    media: {
        width,
        height,
    },
    loaderOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    noImageText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    muteButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    progressBarWrapper: {
        height: 4,
        backgroundColor: '#555',
        borderRadius: 2,
        overflow: 'hidden',
        width: '90%',
        alignSelf: 'center',
        marginTop: 10,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#00aced',
    },
    controlOverlay: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 8,
        marginVertical: 10,
    },
    controlButton: {
        padding: 10,
    },
    thumbnailListWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
    },
    thumbnailList: {
        flexDirection: 'row',
    },
    thumbnailWrapper: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        marginHorizontal: 5,
    },
    activeThumbnailWrapper: {
        borderColor: 'white',
    },
    thumbnail: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#111',
    },
    playIconOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 6,
    },
});