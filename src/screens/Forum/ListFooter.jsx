import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import ShimmerSkeleton from '../Skeleton';


export default function ListFooter({ loading, loadingMore, hasMorePosts }) {
  if (loading && !loadingMore) {
    // First load → shimmer skeleton
    return (
      <View>
        <ShimmerSkeleton />
      </View>
    );
  }

  if (!loadingMore) {
    // Pagination load → footer spinner
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#075cab" />
      </View>
    );
  }

  if (!hasMorePosts) {
    // End of list → no more posts message (optional)
    return (
      <View style={{ padding: 15, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="transparent" /> 
        {/* Keeps spacing consistent */}
      </View>
    );
  }

  return null;
}
