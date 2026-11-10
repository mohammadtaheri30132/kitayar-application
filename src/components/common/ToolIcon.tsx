import React, { useState } from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { getToolIconConfig, ToolIconConfig } from '../../assets/icons';

export interface ToolIconProps {
  /** Identifier of the tool or category to resolve from toolIcons registry */
  toolId?: string;
  /** Explicit custom background color to override registry */
  backgroundColor?: string;
  /** Explicit custom vector icon component to override fallback */
  icon?: any;
  /** Explicit custom image source (e.g. require or uri) */
  imageSource?: any;
  /** Size of the rounded square icon (width and height). Default is 48 */
  size?: number;
  /** Inner icon size. Default is approx 52% of size */
  iconSize?: number;
  /** Corner radius. Default is size * 0.28 (Samsung squircle style) */
  borderRadius?: number;
  /** Foreground icon color. Default is '#FFFFFF' */
  iconColor?: string;
  /** Additional container style */
  style?: ViewStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * Samsung-style rounded square icon component.
 * Ensures consistent visual hierarchy, centered foreground icon/image,
 * harmonious background colors, and graceful fallback handling.
 */
export const ToolIcon: React.FC<ToolIconProps> = React.memo(({
  toolId = 'defaultTool',
  backgroundColor,
  icon,
  imageSource,
  size = 48,
  iconSize,
  borderRadius,
  iconColor = '#FFFFFF',
  style,
  accessibilityLabel,
}) => {
  const [imageError, setImageError] = useState(false);

  // Resolve config from central registry
  const config: ToolIconConfig = getToolIconConfig(toolId);

  const finalBgColor = backgroundColor || config.backgroundColor || '#3B82F6';
  const finalRadius = borderRadius !== undefined ? borderRadius : Math.round(size * 0.28);
  const finalIconSize = iconSize !== undefined ? iconSize : Math.round(size * 0.52);

  // Determine whether to render an image or vector icon
  const resolvedImage = !imageError && (imageSource || config.image);
  const FallbackIconComponent = icon || config.fallbackIcon;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: finalRadius,
          backgroundColor: finalBgColor,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || config.label || toolId}
    >
      {resolvedImage ? (
        <Image
          source={typeof resolvedImage === 'string' ? { uri: resolvedImage } : resolvedImage}
          style={[
            styles.image,
            {
              width: finalIconSize,
              height: finalIconSize,
            } as ImageStyle,
          ]}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
      ) : FallbackIconComponent ? (
        <FallbackIconComponent size={finalIconSize} color={iconColor} strokeWidth={2.2} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    alignSelf: 'center',
  },
});

export default ToolIcon;
