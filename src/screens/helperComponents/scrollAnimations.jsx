// hooks/useHideOnScroll.js
import { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming } from "react-native-reanimated";

export default function scrollAnimations(headerHeight = 60, bottomHeight = 60) {
    const headerTranslateY = useSharedValue(0);
    const bottomTranslateY = useSharedValue(0);
    const prevScrollY = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
          let y = event.contentOffset.y;
          const diff = y - prevScrollY.value;
      
          // If overscrolled or at top, clamp and keep visible
          if (y <= 0) {
            y = 0; // clamp so diff doesn't jump from negative
            headerTranslateY.value = withTiming(0, { duration: 200 });
            bottomTranslateY.value = withTiming(0, { duration: 200 });
            prevScrollY.value = 0;
            return;
          }
      
          if (diff > 5) {
            headerTranslateY.value = withTiming(-headerHeight, { duration: 200 });
            bottomTranslateY.value = withTiming(bottomHeight, { duration: 200 });
          } else if (diff < -5) {
            headerTranslateY.value = withTiming(0, { duration: 200 });
            bottomTranslateY.value = withTiming(0, { duration: 200 });
          }
      
          prevScrollY.value = y;
        },
      });
      

    const headerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: headerTranslateY.value }],
    }));

    const bottomStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bottomTranslateY.value }],
    }));


    return { onScroll, headerStyle, bottomStyle };
}
