// Inside ReactionSheet.js
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Dimensions, View, Text, StyleSheet,
  TouchableWithoutFeedback, Keyboard, FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Image
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, useAnimatedReaction, interpolate, Extrapolation
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useForumReactionUsers } from './useForumReactionUsers';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT * 0.95;

const ReactionSheet = forwardRef(({ onClose }, ref) => {

  const navigation = useNavigation();
  const translateY = useSharedValue(0);
  const gestureContext = useSharedValue({ startY: 0 });
  const isActive = useSharedValue(false);
  const [active, setActive] = useState(false);
  const [reactionType, setReactionType] = useState('All');
  const [forumId, setForumId] = useState(null);
  const [highlightReactId, setHighlightReactId] = useState(null);

  const { usersByReaction, fetchUsers, loadMoreUsers, getting, lastEvaluatedKey, resetUsers } =
    useForumReactionUsers(forumId);

  const reactionCounts = useMemo(() => {
    const counts = {};
    usersByReaction.forEach(item => {
      counts[item.reaction_type] = (counts[item.reaction_type] || 0) + 1;
    });
    return counts;
  }, [usersByReaction]);

  const availableReactions = useMemo(() => {
    return [
      { type: 'Like', emoji: '👍', color: '#1e88e5', label: 'Like' },
      { type: 'Insightful', emoji: '💡', color: '#fbc02d', label: 'Insightful' },
      { type: 'Support', emoji: '🤝', color: '#43a047', label: 'Support' },
      { type: 'Funny', emoji: '😂', color: '#fdd835', label: 'Funny' },
      { type: 'Thanks', emoji: '🙏', color: '#e53935', label: 'Thanks' },
    ].filter(reaction => reactionCounts[reaction.type] > 0);
  }, [reactionCounts]);

  const flatListRef = useRef(null);
  const prevIsActive = useRef(false);

  const closeKeyboard = () => {
    Keyboard.dismiss();
  };

  const updatePrevIsActive = (val) => {
    prevIsActive.current = val;
  };

  const scrollTo = (destination) => {
    'worklet';
    const clamped = Math.max(destination, MAX_TRANSLATE_Y);
    const shouldClose = clamped === 0;

    if (shouldClose) {
      runOnJS(closeKeyboard)();
    }

    const wasActive = isActive.value;
    isActive.value = !shouldClose;
    runOnJS(setActive)(!shouldClose);

    translateY.value = withSpring(clamped, {
      damping: 20,
      stiffness: 200,
      overshootClamping: true,
    }, () => {
      if (shouldClose && onClose) {
        runOnJS(onClose)();
      }
    });

    runOnJS(updatePrevIsActive)(!shouldClose);
  };




  useEffect(() => {
    if (forumId && active) {

      fetchUsers(reactionType, highlightReactId);
    }
  }, [forumId, reactionType, active]);




  const closeSheet = () => {
    scrollTo(0);
    setForumId(null);
    setReactionType('All');
    setHighlightReactId(null);
    resetUsers(); // 👈 expose this from useForumReactionUsers if needed
  };


  useImperativeHandle(ref, () => ({
    open: (forumIdParam, type = 'All', highlightId = null) => {
      setForumId(forumIdParam);
      setReactionType(type);
      setHighlightReactId(highlightId); // <== store it
      scrollTo(MAX_TRANSLATE_Y);
      fetchUsers(type, highlightId);
    },
    close: closeSheet,
    isActive: () => isActive.value,
  }));


  const highlightedFlash = useSharedValue(0);


  useEffect(() => {
    if (!highlightReactId || usersByReaction.length === 0) return;

    // Trigger flash
    highlightedFlash.value = 1;
    setTimeout(() => {
      highlightedFlash.value = 0;
    }, 600); // reset after animation time
  }, [highlightReactId, usersByReaction]);

  const highlightAfterOpen = () => {
    if (!highlightReactId || usersByReaction.length === 0) return;

    // Flash animation
    highlightedFlash.value = 1;
    setTimeout(() => {
      highlightedFlash.value = 0;
    }, 600);

    // Optional: Scroll to item logic if needed
    // TODO: scroll to item if needed
  };


  const gesture = Gesture.Pan()
    .onStart(() => {
      gestureContext.value = { startY: translateY.value };
    })
    .onUpdate((event) => {
      const clampedY = gestureContext.value.startY + event.translationY;
      translateY.value = Math.max(clampedY, MAX_TRANSLATE_Y);
    })
    .onEnd((event) => {
      const SNAP_THRESHOLD = SCREEN_HEIGHT / 3;
      if (event.velocityY > 500 || translateY.value > -SNAP_THRESHOLD) {
        scrollTo(0);
      } else {
        scrollTo(MAX_TRANSLATE_Y);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [MAX_TRANSLATE_Y, 0],
      [25, 5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderRadius,
    };
  });

  const backdropOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(isActive.value ? 0.5 : 0, { duration: 150 }),
  }));


  const reactionConfig = [
    { type: 'All', emoji: '💬', color: '#999', label: 'All' }, // New "All" tab
    { type: 'Like', emoji: '👍', color: '#1e88e5', label: 'Like' },
    { type: 'Insightful', emoji: '💡', color: '#fbc02d', label: 'Insightful' },
    { type: 'Support', emoji: '🤝', color: '#43a047', label: 'Support' },
    { type: 'Funny', emoji: '😂', color: '#fdd835', label: 'Funny' },
    { type: 'Thanks', emoji: '🙏', color: '#e53935', label: 'Thanks' },
  ];

  const getEmojiForReaction = (type) => {
    const match = reactionConfig.find(r => r.type === type);
    return match ? { emoji: match.emoji, label: match.label } : { emoji: '', label: '' };
  };


  const handleNavigate = (item) => {

    closeSheet();
    setTimeout(() => {
      if (item.user_type === "company") {
        navigation.navigate('CompanyDetailsPage', { userId: item.user_id });
      } else if (item.user_type === "users") {
        navigation.navigate('UserDetailsPage', { userId: item.user_id });
      }
    }, 300);
  };

  const ReactionItem = ({ item, isHighlighted, highlightedFlash, onPress, getEmojiForReaction, reactionType }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const flash = highlightedFlash.value;
      return {
        backgroundColor: isHighlighted && flash ? '#e0f0ff' : '#ffffff',
        borderLeftWidth: isHighlighted && flash ? 4 : 0,
        borderLeftColor: isHighlighted && flash ? '#075cab' : 'transparent',
      };
    }, [highlightedFlash.value]);

    return (
      <TouchableOpacity onPress={onPress}>
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderRadius: 8,
            },
            animatedStyle,
          ]}
        >
          {item.fileKey ? (
            <FastImage
              source={{ uri: item.profileUrl }}
              style={{
                width: 35,
                height: 35,
                borderRadius: 20,
                marginRight: 12,
                backgroundColor: '#ddd',
              }}
            />
          ) : (
            <View
              style={{
                width: 35,
                height: 35,
                borderRadius: 20,
                marginRight: 12,
                backgroundColor: item.userAvatar?.backgroundColor || '#ccc',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: item.userAvatar?.textColor || '#000', fontSize: 14, fontWeight: 'bold' }}>
                {item.userAvatar?.initials || ''}
              </Text>
            </View>
          )}

          <View>
            <Text style={{ fontWeight: '500',fontSize:15,color:'black' }}>{item.author}</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>
              {(reactionType === 'All' || item.reaction_type !== reactionType)
                ? `${getEmojiForReaction(item.reaction_type).label}  ${getEmojiForReaction(item.reaction_type).emoji}`
                : ''}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };


  return (
    <>
      <TouchableWithoutFeedback onPress={closeSheet}>
        <Animated.View
          pointerEvents={active ? 'auto' : 'none'}
          style={[styles.backdrop, backdropOpacity]}
        />
      </TouchableWithoutFeedback>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.sheet, animatedStyle]}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <Text style={styles.title}>Reactions</Text>

              <Pressable onPress={closeSheet}>
                <Icon name="close" size={20} color="black" />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />
          <View style={styles.reactionTabsContainer}>
            {/* Show "All" tab first with total count */}
            <TouchableOpacity
              onPress={() => {
                setReactionType('All');
                fetchUsers('All', highlightReactId);
              }}
              style={[
                styles.reactionTab,
                {
                  backgroundColor: reactionType === 'All' ? '#e6effa' : '#f5f5f5',
                  borderColor: reactionType === 'All' ? '#075cab' : '#ddd',
                },
              ]}
            >
              <Text style={[
                styles.reactionTabText,
                { color: reactionType === 'All' ? '#075cab' : '#555' },
              ]}>
                💬 All ({usersByReaction.length})
              </Text>
            </TouchableOpacity>

            {/* Show available reaction tabs */}
            {availableReactions.map(({ type, emoji, label }) => {
              const selected = reactionType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setReactionType(type);
                    fetchUsers(type, highlightReactId);
                  }}
                  style={[
                    styles.reactionTab,
                    {
                      backgroundColor: selected ? '#e6effa' : '#f5f5f5',
                      borderColor: selected ? '#075cab' : '#ddd',
                    },
                  ]}
                >
                  <Text style={[
                    styles.reactionTabText,
                    { color: selected ? '#075cab' : '#555' },
                  ]}>
                    {emoji} {label} ({reactionCounts[type] || 0})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>


          <View style={styles.divider1} />

          {getting ? (
            <View style={{ paddingTop: 50 }}>
              <ActivityIndicator color="#075cab" size="small" />

            </View>
          ) : usersByReaction.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                No reactions found for "{reactionType}"
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={usersByReaction}
              keyExtractor={(item, index) => item.user_id + index}
              contentContainerStyle={{ paddingHorizontal: 10, marginBottom: 5, }}
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (lastEvaluatedKey && !getting) {
                  loadMoreUsers();
                }
              }}
              ListFooterComponent={
                lastEvaluatedKey && getting ? (
                  <ActivityIndicator style={{ marginTop: 16 }} color="#075cab" />
                ) : null
              }
              renderItem={({ item, index }) => {
                const isHighlighted = item.reaction_id === highlightReactId;

                return (
                  <ReactionItem
                    item={item}
                    isHighlighted={isHighlighted}
                    highlightedFlash={highlightedFlash}
                    onPress={() => handleNavigate(item)}
                    getEmojiForReaction={getEmojiForReaction}
                    reactionType={reactionType}
                  />
                );
              }}

            />

          )}

        </Animated.View>
      </GestureDetector>
    </>
  );
});

const styles = StyleSheet.create({
  reactionTabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  reactionTab: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },

  reactionTabText: {
    fontSize: 15,
    fontWeight: '500',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  sheet: {
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: 'white',
    zIndex: 1000,
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
  },
  header: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  divider1: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 5
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

  },

  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
});

export default ReactionSheet;
