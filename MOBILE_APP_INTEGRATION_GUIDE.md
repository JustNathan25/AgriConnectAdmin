# Mobile App Integration Guide
## Product Notifications & Warnings

This guide explains how to fetch and display product-related notifications in your mobile app.

---

## 📊 Firestore Collection: `notifications`

All product warnings and deletion notifications are stored in this collection.

### Notification Types

#### 1. Product Warning (`type: "product_warning"`)

**Document Structure**:
```json
{
  "type": "product_warning",
  "userId": "user123",
  "productId": "product456",
  "productName": "Fresh Tomatoes",
  "warningType": "overpriced",
  "issues": ["price", "description", "images"],
  "message": "Your product price is significantly higher than market average. Please review and adjust.",
  "timestamp": "Firebase Timestamp",
  "read": false,
  "actionRequired": true
}
```

**Fields Explanation**:
- `type`: Always `"product_warning"`
- `userId`: The seller's user ID (your app user)
- `productId`: ID of the product that received the warning
- `productName`: Name of the product for display
- `warningType`: Category of warning (see list below)
- `issues`: Array of specific issues that need fixing
- `message`: Admin's custom message with details
- `timestamp`: When the warning was issued
- `read`: Boolean to track if user has seen it
- `actionRequired`: Always `true` for warnings

**Warning Types**:
- `"overpriced"` - Product price too high
- `"misleading_description"` - Description doesn't match product
- `"poor_quality"` - Images are low quality
- `"incorrect_category"` - Wrong category selected
- `"missing_info"` - Important details missing
- `"policy_violation"` - Violates platform policies
- `"other"` - Other issues

**Issue Types** (in `issues` array):
- `"price"` - Price needs adjustment
- `"description"` - Description needs improvement
- `"images"` - Images need updating
- `"category"` - Category needs correction
- `"specifications"` - Specifications incomplete

---

#### 2. Product Deleted (`type: "product_deleted"`)

**Document Structure**:
```json
{
  "type": "product_deleted",
  "userId": "user123",
  "productId": "product456",
  "productName": "Fresh Tomatoes",
  "reason": "fake_product",
  "details": "This product has been identified as counterfeit and violates our marketplace policies.",
  "timestamp": "Firebase Timestamp",
  "read": false
}
```

**Fields Explanation**:
- `type`: Always `"product_deleted"`
- `userId`: The seller's user ID
- `productId`: ID of the deleted product
- `productName`: Name of the deleted product
- `reason`: Category reason for deletion (see list below)
- `details`: Admin's detailed explanation
- `timestamp`: When the product was deleted
- `read`: Boolean to track if user has seen it

**Deletion Reasons**:
- `"overpriced"` - Overpriced Product
- `"fake_product"` - Fake/Counterfeit Product
- `"misleading"` - Misleading Information
- `"prohibited"` - Prohibited Item
- `"spam"` - Spam/Duplicate Listing
- `"poor_quality"` - Poor Quality/Damaged
- `"policy_violation"` - Policy Violation
- `"seller_request"` - Seller Request
- `"fraud"` - Fraudulent Activity
- `"other"` - Other reason

---

## 🔍 How to Query Notifications

### Get All Unread Notifications for User

**JavaScript/TypeScript (React Native + Firebase)**:
```javascript
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';

// Real-time listener (recommended)
const notificationsRef = collection(db, 'notifications');
const q = query(
  notificationsRef,
  where('userId', '==', currentUserId),
  where('read', '==', false),
  orderBy('timestamp', 'desc')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const notifications = [];
  snapshot.forEach((doc) => {
    notifications.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Update your app state/UI
  setNotifications(notifications);
  setBadgeCount(notifications.length);
});

// Don't forget to unsubscribe when component unmounts
return () => unsubscribe();
```

### Get All Notifications (Read + Unread)

```javascript
const q = query(
  notificationsRef,
  where('userId', '==', currentUserId),
  orderBy('timestamp', 'desc')
);
```

### Mark Notification as Read

```javascript
import { doc, updateDoc } from 'firebase/firestore';

const markAsRead = async (notificationId) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true
  });
};
```

### Delete Notification

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

const deleteNotification = async (notificationId) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
};
```

---

## 📱 UI/UX Recommendations

### Notification Badge
```javascript
// Show badge count on products tab
const unreadCount = notifications.filter(n => !n.read).length;
```

### Warning Notification Display

**Example Layout**:
```
┌─────────────────────────────────────┐
│ ⚠️  Action Required                 │
├─────────────────────────────────────┤
│ Product Warning                      │
│                                      │
│ Product: Fresh Tomatoes              │
│ Type: Overpriced Product             │
│                                      │
│ Issues to Fix:                       │
│ • Price needs adjustment             │
│ • Description needs improvement      │
│ • Images need updating               │
│                                      │
│ Message from Admin:                  │
│ "Your product price is significantly │
│ higher than market average..."       │
│                                      │
│ [Edit Product]  [Mark as Read]       │
└─────────────────────────────────────┘
```

**Color Scheme**:
- Background: Warning yellow/orange (#FFF3E0)
- Border: Orange (#FF9800)
- Icon: ⚠️
- Action Required badge: Red

### Deletion Notification Display

**Example Layout**:
```
┌─────────────────────────────────────┐
│ 🗑️  Product Removed                │
├─────────────────────────────────────┤
│ Product: Fresh Tomatoes              │
│                                      │
│ Reason: Fake/Counterfeit Product     │
│                                      │
│ Details:                             │
│ "This product has been identified    │
│ as counterfeit and violates our      │
│ marketplace policies."               │
│                                      │
│ [Understand]  [Contact Support]      │
└─────────────────────────────────────┘
```

**Color Scheme**:
- Background: Light red (#FFEBEE)
- Border: Red (#F44336)
- Icon: 🗑️
- Non-dismissible (requires acknowledgment)

---

## 🎯 User Actions

### When User Receives Warning

1. **Show prominent notification**
2. **Provide "Edit Product" button** that:
   - Opens product edit screen
   - Pre-fills current data
   - Highlights fields that need attention (based on `issues` array)
3. **Show checklist of issues** to address
4. **Allow marking as read** after user acknowledges

### When User Receives Deletion Notice

1. **Show non-dismissible alert** (user must acknowledge)
2. **Explain reason clearly**
3. **Provide "Understand" button**
4. **Offer "Contact Support"** if user wants to appeal
5. **Mark as read automatically** after acknowledgment
6. **Remove product from user's listings**

---

## 🔔 Push Notifications (Optional)

If using Firebase Cloud Messaging (FCM), you can send push notifications:

### When Admin Sends Warning
```javascript
{
  title: "⚠️ Product Warning",
  body: "Your product 'Fresh Tomatoes' needs attention",
  data: {
    type: "product_warning",
    notificationId: "notif123",
    productId: "product456"
  }
}
```

### When Admin Deletes Product
```javascript
{
  title: "🗑️ Product Removed",
  body: "Your product 'Fresh Tomatoes' has been removed",
  data: {
    type: "product_deleted",
    notificationId: "notif123",
    productId: "product456"
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Notifications appear in real-time
- [ ] Badge count updates correctly
- [ ] Warning notifications show all issues
- [ ] Deletion notifications are non-dismissible
- [ ] "Edit Product" button works from warning
- [ ] Mark as read works correctly
- [ ] Notifications persist after app restart
- [ ] Push notifications work (if implemented)
- [ ] Multiple notifications display correctly
- [ ] Timestamp formatting is correct
- [ ] Empty state shows when no notifications

---

## 📋 Example React Native Component

```jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const NotificationsScreen = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  const renderNotification = ({ item }) => {
    if (item.type === 'product_warning') {
      return (
        <View style={styles.warningCard}>
          <Text style={styles.title}>⚠️ Action Required</Text>
          <Text>Product: {item.productName}</Text>
          <Text>Type: {item.warningType}</Text>
          <Text>Issues:</Text>
          {item.issues.map((issue, index) => (
            <Text key={index}>• {issue}</Text>
          ))}
          <Text>{item.message}</Text>
          <TouchableOpacity 
            onPress={() => navigateToEditProduct(item.productId)}
          >
            <Text>Edit Product</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.type === 'product_deleted') {
      return (
        <View style={styles.deletionCard}>
          <Text style={styles.title}>🗑️ Product Removed</Text>
          <Text>Product: {item.productName}</Text>
          <Text>Reason: {item.reason}</Text>
          <Text>{item.details}</Text>
          <TouchableOpacity onPress={() => handleAcknowledge(item.id)}>
            <Text>Understand</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text>No notifications</Text>
      }
    />
  );
};

export default NotificationsScreen;
```

---

## 🆘 Support & Questions

For any integration issues or questions:
1. Check Firestore security rules allow read access
2. Verify user ID matches between systems
3. Test with Firebase Emulator Suite first
4. Check console for any error messages

---

*Last Updated: October 24, 2025*
*Version: 1.0*


