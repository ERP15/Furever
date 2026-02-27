import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const StarDisplay = ({ rating }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= rating ? 'star' : 'star-outline'}
        size={14}
        color="#FFD43B"
      />
    ))}
  </View>
);

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      const res = await axios.get(`${baseURL}products/admin/reviews/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data);
    } catch (err) {
      console.log('Fetch reviews error:', err.message);
      Toast.show({ type: 'error', text1: 'Failed to load reviews' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [fetchReviews])
  );

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => r.rating === star).length
  );

  const renderReview = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Product info */}
        <View style={styles.productRow}>
          {item.productImage ? (
            <Image
              source={{ uri: item.productImage }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={20} color="#ccc" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.productName || 'Product'}
            </Text>
            <Text style={styles.reviewerName}>
              by {item.user?.name || item.name || 'Anonymous'}
            </Text>
          </View>
        </View>

        {/* Rating + date */}
        <View style={styles.ratingRow}>
          <StarDisplay rating={item.rating} />
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.reviewText}>{item.text || 'No comment'}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.statMain}>
          <Text style={styles.avgRating}>{avgRating}</Text>
          <StarDisplay rating={Math.round(parseFloat(avgRating))} />
          <Text style={styles.totalText}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.statBars}>
          {[5, 4, 3, 2, 1].map((star, idx) => (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}</Text>
              <Ionicons name="star" size={10} color="#FFD43B" />
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { width: totalReviews > 0 ? `${(ratingCounts[idx] / totalReviews) * 100}%` : '0%' },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{ratingCounts[idx]}</Text>
            </View>
          ))}
        </View>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No reviews yet</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={renderReview}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReviews();
              }}
              colors={['#FF8C42']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statMain: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    minWidth: 80,
  },
  avgRating: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
  },
  totalText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statBars: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    width: 12,
    textAlign: 'right',
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFD43B',
    borderRadius: 4,
  },
  barCount: {
    fontSize: 11,
    color: '#999',
    width: 24,
    textAlign: 'right',
  },
  list: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewerName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: '#aaa',
  },
  reviewText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default Reviews;
