# 📱 Mobile App - Admin Warnings Integration Guide

> **Complete Guide for Handling Admin Warnings in AgriConnect Mobile App**  
> **For: Mobile App Developers (React Native / Flutter)**

**Last Updated:** October 30, 2025 | Version: 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What Admin Can Send](#what-admin-can-send)
3. [Database Collections](#database-collections)
4. [Quick Integration (30 min)](#quick-integration-30-min)
5. [Full Integration](#full-integration)
6. [Code Examples](#code-examples)
7. [UI Implementation](#ui-implementation)
8. [Testing](#testing)

---

## 🎯 Overview

The admin panel can now send **two types of warnings** to users in the mobile app:

1. **👤 User Warnings** - Warnings about user behavior/account issues
2. **📦 Product Warnings** - Warnings about specific product listings

Both are sent via Firestore `notifications` collection and can be listened to in real-time.

---

## ⚠️ What Admin Can Send

### User Warnings (👤 Account Level)

**When:** Admin sends warning from Users page  
**Where:** Notification appears in user's app  
**Collections Updated:**
- ✅ `notifications` (app reads this)
- ✅ `user_warnings` (audit trail)
- ✅ `users/{userId}` (warning count updated)

**Categories:**
- Inappropriate Content
- Spam or Misleading Posts
- Suspected Fraud
- Harassment or Abuse
- Policy Violation
- Payment Issues
- Fake or Counterfeit Products
- Poor Customer Service
- Multiple Accounts
- Other

**Severity Levels:**
- 🟢 Low - Minor Issue
- 🟡 Medium - Moderate Concern  
- 🟠 High - Serious Violation
- 🔴 Critical - Immediate Action Required

**Possible Actions:**
- Warning only
- Warning + 24h suspension
- Warning + 7 day suspension
- Warning + account disable
- **Auto-disable after 5 warnings**

---

### Product Warnings (📦 Listing Level)

**When:** Admin sends warning from Products page  
**Where:** Notification appears in seller's app  
**Collections Updated:**
- ✅ `notifications` (app reads this)
- ✅ `product_warnings` (audit trail)
- ✅ `products/{productId}` (warning count updated)

**Categories:**
- Overpriced Product
- Misleading Description
- Poor Quality Images
- Incorrect Category
- Missing Information
- Inappropriate Content
- Policy Violation
- Suspected Counterfeit
- Other

**Issues Flagged:**
- 💰 Price needs adjustment
- 📝 Description needs improvement
- 📸 Images need updating
- 📂 Category needs correction
- 🔧 Specifications incomplete

---

## 🗂️ Database Collections

### Collection 1: `notifications`

**This is what your app should listen to** ← **Most Important**

#### User Warning Notification

```javascript
// notifications/{notificationId}
{
  "type": "user_warning",              // ← Filter by this
  "userId": "abc123",                  // Your user's ID
  "title": "⚠️ Warning: Inappropriate Product Images",
  "message": "Your product listing 'Fresh Tomatoes' contains inappropriate images. Please update your listing to follow our community guidelines.",
  "severity": "medium",                // low, medium, high, critical
  "category": "inappropriate_content", 
  "warningId": "xyz789",              // Reference to full warning details
  "timestamp": Timestamp,
  "read": false,                       // Update to true when read
  "actionRequired": true,
  "deepLink": "app://warnings/xyz789"
}
```

#### Product Warning Notification

```javascript
// notifications/{notificationId}
{
  "type": "product_warning",           // ← Filter by this
  "userId": "abc123",                  // Seller's ID
  "productId": "prod456",              // Affected product
  "productName": "Fresh Tomatoes",
  "title": "⚠️ Product Warning: Fresh Tomatoes",
  "message": "Your product listing has misleading description. Please update: ...",
  "category": "misleading_description",
  "severity": "medium",
  "issues": ["price", "description"],  // Array of issues
  "timestamp": Timestamp,
  "read": false,
  "actionRequired": true,
  "deepLink": "app://products/prod456"
}
```

---

### Collection 2: `user_warnings` (Optional - For History)

Full warning details with admin info:

```javascript
// user_warnings/{warningId}
{
  "userId": "abc123",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "category": "inappropriate_content",
  "severity": "medium",
  "title": "Inappropriate Product Listing",
  "message": "Your product listing contains...",
  "warningNumber": 2,                  // 1st, 2nd, 3rd warning
  "actionTaken": "warning_only",
  "issuedBy": "admin@agriconnect.com",
  "issuedByName": "Admin",
  "issuedAt": Timestamp,
  "acknowledged": false,
  "acknowledgedAt": null,
  "relatedProductId": "prod456",
  "adminNotes": "Internal notes"       // Not visible to user
}
```

---

### Collection 3: `product_warnings` (Optional - For History)

```javascript
// product_warnings/{warningId}
{
  "productId": "prod456",
  "productName": "Fresh Tomatoes",
  "sellerId": "abc123",
  "sellerName": "John Doe",
  "sellerEmail": "user@example.com",
  "category": "misleading_description",
  "severity": "medium",
  "issues": ["price", "description"],
  "message": "Your product has...",
  "warningNumber": 1,
  "issuedBy": "admin@agriconnect.com",
  "issuedByName": "Admin",
  "issuedAt": Timestamp,
  "acknowledged": false,
  "acknowledgedAt": null,
  "adminNotes": "Internal notes"
}
```

---

### Collection 4: `users/{userId}` - Updated Fields

```javascript
// users/{userId}
{
  // ... existing fields ...
  
  "warnings": {
    "count": 2,                        // Total warnings received
    "lastWarningDate": Timestamp,
    "warningLevel": "medium",          // none, low, medium, high, critical
    "strikes": 2,                      // Active strikes
    "suspended": false,
    "suspendedUntil": Timestamp or null
  }
}
```

---

### Collection 5: `products/{productId}` - Updated Fields

```javascript
// products/{productId}
{
  // ... existing fields ...
  
  "warningCount": 1,
  "lastWarningDate": Timestamp,
  "warningLevel": "medium"
}
```

---

## ⚡ Quick Integration (30 minutes)

### Minimal Implementation

Just add this to your existing notification handling code:

```javascript
// In your NotificationService or similar
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

function listenToWarnings() {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const notification = change.doc.data();
        
        // Handle user warnings
        if (notification.type === 'user_warning') {
          showWarningAlert(notification, change.doc.id);
        }
        
        // Handle product warnings
        if (notification.type === 'product_warning') {
          showProductWarningAlert(notification, change.doc.id);
        }
      }
    });
  });

  return unsubscribe;
}

function showWarningAlert(notification, notificationId) {
  Alert.alert(
    notification.title || '⚠️ Account Warning',
    notification.message,
    [
      { 
        text: 'View Details', 
        onPress: () => {
          navigation.navigate('Warnings');
          markAsRead(notificationId);
        }
      },
      { 
        text: 'OK', 
        onPress: () => markAsRead(notificationId)
      }
    ]
  );
}

function showProductWarningAlert(notification, notificationId) {
  Alert.alert(
    notification.title || '⚠️ Product Warning',
    notification.message,
    [
      { 
        text: 'View Product', 
        onPress: () => {
          navigation.navigate('ProductDetails', { 
            productId: notification.productId 
          });
          markAsRead(notificationId);
        }
      },
      { 
        text: 'OK', 
        onPress: () => markAsRead(notificationId)
      }
    ]
  );
}

async function markAsRead(notificationId) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}
```

**That's it!** Warnings will now show as alerts. ✅

---

## 🚀 Full Integration

### Step 1: Create Warnings Screen

```javascript
// screens/WarningsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export default function WarningsScreen({ navigation }) {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWarnings();
  }, []);

  const loadWarnings = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Listen to user_warnings collection (full history)
    const q = query(
      collection(db, 'user_warnings'),
      where('userId', '==', userId),
      orderBy('issuedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const warningsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'user'
      }));
      setWarnings(warningsData);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  const acknowledgeWarning = async (warningId) => {
    try {
      await updateDoc(doc(db, 'user_warnings', warningId), {
        acknowledged: true,
        acknowledgedAt: new Date()
      });
      Alert.alert('Success', 'Warning acknowledged');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderWarning = ({ item }) => {
    const severityColor = {
      low: '#ff9800',
      medium: '#ff5722',
      high: '#f44336',
      critical: '#d32f2f'
    }[item.severity] || '#666';

    return (
      <TouchableOpacity style={styles.warningCard}>
        <View style={[styles.severityBar, { backgroundColor: severityColor }]} />
        
        <View style={styles.warningContent}>
          <View style={styles.warningHeader}>
            <Text style={styles.warningNumber}>Warning #{item.warningNumber}</Text>
            <Text style={[styles.severity, { color: severityColor }]}>
              {item.severity?.toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.title}>{item.title || item.category}</Text>
          <Text style={styles.category}>
            Category: {item.category?.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.message}>{item.message}</Text>
          
          <Text style={styles.date}>
            Issued: {item.issuedAt?.toDate().toLocaleDateString()}
          </Text>
          
          {!item.acknowledged && (
            <TouchableOpacity
              style={styles.acknowledgeBtn}
              onPress={() => acknowledgeWarning(item.id)}
            >
              <Text style={styles.acknowledgeBtnText}>Acknowledge Warning</Text>
            </TouchableOpacity>
          )}
          
          {item.acknowledged && (
            <Text style={styles.acknowledgedText}>
              ✓ Acknowledged on {item.acknowledgedAt?.toDate().toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading warnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {warnings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No warnings</Text>
          <Text style={styles.emptySubtext}>Keep up the good work!</Text>
        </View>
      ) : (
        <>
          <View style={styles.warningStats}>
            <Text style={styles.warningStatsText}>
              Total Warnings: {warnings.length}
            </Text>
          </View>
          
          <FlatList
            data={warnings}
            renderItem={renderWarning}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadWarnings} />
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningStats: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ff9800',
  },
  warningStatsText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#e65100',
  },
  list: {
    padding: 16,
  },
  warningCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  severityBar: {
    width: 4,
  },
  warningContent: {
    flex: 1,
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  warningNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  severity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  message: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  acknowledgeBtn: {
    backgroundColor: '#ff5722',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acknowledgeBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#4caf50',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});
```

---

### Step 2: Show Warning Badge in Profile

```javascript
// In your ProfileScreen or similar
const [warningCount, setWarningCount] = useState(0);

useEffect(() => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  // Listen to user document for warning count
  const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
    const data = doc.data();
    setWarningCount(data?.warnings?.count || 0);
  });

  return unsubscribe;
}, []);

// In your UI
{warningCount > 0 && (
  <TouchableOpacity 
    style={styles.warningBanner}
    onPress={() => navigation.navigate('Warnings')}
  >
    <Text style={styles.warningIcon}>⚠️</Text>
    <View style={styles.warningTextContainer}>
      <Text style={styles.warningBannerTitle}>
        You have {warningCount} warning{warningCount > 1 ? 's' : ''}
      </Text>
      <Text style={styles.warningBannerSubtext}>Tap to view details</Text>
    </View>
  </TouchableOpacity>
)}
```

---

### Step 3: Show Product Warning Badge

```javascript
// In ProductCard component
const [productWarnings, setProductWarnings] = useState(0);

useEffect(() => {
  if (!product.id) return;

  // Listen to product document
  const unsubscribe = onSnapshot(
    doc(db, 'products', product.id), 
    (doc) => {
      const data = doc.data();
      setProductWarnings(data?.warningCount || 0);
    }
  );

  return unsubscribe;
}, [product.id]);

// In your ProductCard UI
{productWarnings > 0 && (
  <View style={styles.warningBadge}>
    <Text style={styles.warningBadgeText}>
      ⚠️ {productWarnings} Warning{productWarnings > 1 ? 's' : ''}
    </Text>
  </View>
)}
```

---

## 🎨 UI Implementation

### Warning Banner Style (Profile/Home)

```javascript
const styles = StyleSheet.create({
  warningBanner: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 4,
  },
  warningBannerSubtext: {
    fontSize: 13,
    color: '#666',
  },
});
```

---

### Product Warning Badge

```javascript
const styles = StyleSheet.create({
  warningBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff5722',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warningBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
```

---

## 🧪 Testing

### Test Checklist

#### 1. User Warning

- [ ] Admin sends user warning from admin panel
- [ ] Notification appears in `notifications` collection
- [ ] Mobile app receives real-time notification
- [ ] Alert/banner shows correctly
- [ ] Navigating to Warnings screen works
- [ ] Warning details display correctly
- [ ] Acknowledge warning works
- [ ] Warning count updates in profile

#### 2. Product Warning

- [ ] Admin sends product warning from products page
- [ ] Notification appears in mobile app
- [ ] Product warning badge shows on product card
- [ ] Warning details accessible
- [ ] Seller can view warning message
- [ ] Product warning count updates

#### 3. Edge Cases

- [ ] Multiple warnings show correctly
- [ ] Warning severity colors display properly
- [ ] Offline handling (warnings show when back online)
- [ ] No duplicate warnings
- [ ] Acknowledged warnings don't show alerts again

---

## 📞 Support

### Firestore Indexes Required

Create these composite indexes in Firebase Console:

```
Collection: notifications
Fields: userId (Ascending), read (Ascending), timestamp (Descending)

Collection: notifications
Fields: userId (Ascending), timestamp (Descending)

Collection: user_warnings
Fields: userId (Ascending), issuedAt (Descending)

Collection: product_warnings
Fields: productId (Ascending), issuedAt (Descending)

Collection: product_warnings
Fields: sellerId (Ascending), issuedAt (Descending)
```

### Common Issues

**Issue:** Notifications not appearing  
**Solution:** Check Firestore security rules allow reading `notifications` where `userId == auth.uid`

**Issue:** Real-time not working  
**Solution:** Verify `onSnapshot` listener is active and not being unsubscribed prematurely

**Issue:** Warning count not updating  
**Solution:** Make sure you're listening to the user/product document, not just fetching once

---

## ✨ Summary

### What You Need to Do

**Minimum (30 min):**
1. Add notification listener for `type === "user_warning"` and `type === "product_warning"`
2. Show alerts when warnings received
3. Mark notifications as read

**Recommended (2-3 hours):**
1. Create Warnings screen
2. Show warning badges in profile/products
3. Allow users to acknowledge warnings
4. Display warning history

**All notifications flow through the `notifications` collection - just filter by `type`!**

---

**Admin Panel Status:** ✅ Fully Implemented & Sending Warnings  
**Your Task:** Receive and display them in mobile app

---

*Guide Version 1.0 - Last Updated: October 30, 2025*

