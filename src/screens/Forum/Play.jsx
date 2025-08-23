import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
} from 'react';
import { View, Image, ImageBackground, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import playIcon from "../../images/homepage/PlayIcon.png";

const MAX_WIDTH = 1280;

// PlayOverlayThumbnail.js
const PlayOverlayThumbnail = forwardRef(
  ({ thumbnailUri, onCaptured }, ref) => {
    const viewShotRef = useRef();
    const [scaledDimensions, setScaledDimensions] = useState({ width: 0, height: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [iconLoaded, setIconLoaded] = useState(false);

    const reset = () => {
      setImageLoaded(false);
      setIconLoaded(false);
      setScaledDimensions({ width: 0, height: 0 });
    };

    useEffect(() => {

      if (imageLoaded && iconLoaded && scaledDimensions.width > 0) {
        (async () => {
          try {
            const base64Data = await viewShotRef.current.capture({
              format: "jpg",
              quality: 1.0,
              result: "base64",
            });
            const dataUri = `data:image/jpeg;base64,${base64Data}`;
          
            if (onCaptured) onCaptured(dataUri); // ✅ send base64 to parent
            reset();
          } catch (err) {
          
          }
        })();
      }
    }, [imageLoaded, iconLoaded, scaledDimensions]);

    // Fetch original thumbnail size
    useEffect(() => {
      if (thumbnailUri) {
        Image.getSize(
          thumbnailUri,
          (width, height) => {
            const scaledWidth = width > MAX_WIDTH ? MAX_WIDTH : width;
            const scaledHeight = (height / width) * scaledWidth;
            setScaledDimensions({ width: scaledWidth, height: scaledHeight });
          },
          (error) => console.error("❌ [Image.getSize] Failed:", error)
        );
      }
    }, [thumbnailUri]);

    if (!thumbnailUri || scaledDimensions.width === 0) return null;

    const resolvedIcon =
      typeof playIcon === "number"
        ? resolveAssetSource(playIcon).uri
        : playIcon;

    const iconSize = Math.min(scaledDimensions.width, scaledDimensions.height) * 0.4;

    return (
      <View style={[styles.hidden]}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 1.0, result: "base64" }}
        >
          <ImageBackground
            source={{ uri: thumbnailUri }}
            style={{ width: scaledDimensions.width, height: scaledDimensions.height }}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => console.error("❌ [ImageBackground] Failed:", e.nativeEvent)}
          >
            <View style={styles.iconWrapper}>
              <Image
                source={{ uri: resolvedIcon }}
                style={{ width: iconSize, height: iconSize, opacity: 0.8 }}
                resizeMode="contain"
                onLoad={() => setIconLoaded(true)}
              />
            </View>
          </ImageBackground>
        </ViewShot>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    top: -1000,
    left: 0,
    zIndex: -1,
    opacity: 0,
  },
  iconWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PlayOverlayThumbnail;
