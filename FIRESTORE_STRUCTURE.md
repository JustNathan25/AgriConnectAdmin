# Firestore Database Structure
## Product Management Collections

---

## 📚 Collections Overview

### 1. `notifications` Collection
**Purpose**: Store all notifications for users (warnings, deletions, etc.)

**Documents**: Auto-generated IDs

**Used By**: Mobile App (read), Admin Panel (write)

---

### 2. `product_deletions` Collection  
**Purpose**: Admin audit log for all deleted products

**Documents**: Auto-generated IDs

**Used By**: Admin Panel only (for internal tracking)

---

## 📋 Document Schemas

### `notifications` Collection

#### Product Warning Document
```javascript
{
  // Document ID: Auto-generated (e.g., "abc123xyz")
  
  // Required Fields
  "type": "product_warning",              // String: notification type
  "userId": "seller_user_id",             // String: target user ID
  "productId": "product_id",              // String: related product ID
  "productName": "Fresh Tomatoes",        // String: product name
  "warningType": "overpriced",            // String: warning category
  "issues": [                             // Array: specific issues
    "price",
    "description",
    "images"
  ],
  "message": "Admin's message here",      // String: detailed message
  "timestamp": Timestamp(2025, 10, 24),   // Firebase Timestamp
  "read": false,                          // Boolean: notification status
  "actionRequired": true                  // Boolean: requires action
}
```

**Index Requirements**:
- Composite index on: `userId` (Ascending) + `read` (Ascending) + `timestamp` (Descending)
- Composite index on: `userId` (Ascending) + `timestamp` (Descending)

**Warning Types**:
- `overpriced`
- `misleading_description`
- `poor_quality`
- `incorrect_category`
- `missing_info`
- `policy_violation`
- `other`

**Issue Types**:
- `price`
- `description`
- `images`
- `category`
- `specifications`

---

#### Product Deletion Document
```javascript
{
  // Document ID: Auto-generated (e.g., "xyz789abc")
  
  // Required Fields
  "type": "product_deleted",              // String: notification type
  "userId": "seller_user_id",             // String: target user ID
  "productId": "product_id",              // String: deleted product ID
  "productName": "Fresh Tomatoes",        // String: product name
  "reason": "fake_product",               // String: deletion reason
  "details": "Detailed explanation",      // String: admin's explanation
  "timestamp": Timestamp(2025, 10, 24),   // Firebase Timestamp
  "read": false                           // Boolean: notification status
}
```

**Index Requirements**:
- Composite index on: `userId` (Ascending) + `timestamp` (Descending)

**Deletion Reasons**:
- `overpriced`
- `fake_product`
- `misleading`
- `prohibited`
- `spam`
- `poor_quality`
- `policy_violation`
- `seller_request`
- `fraud`
- `other`

---

### `product_deletions` Collection

#### Deletion Log Document
```javascript
{
  // Document ID: Auto-generated (e.g., "log123xyz")
  
  // Required Fields
  "productId": "product_id",              // String: deleted product ID
  "productName": "Fresh Tomatoes",        // String: product name
  "sellerId": "seller_user_id",           // String: seller's user ID
  "reason": "fake_product",               // String: deletion reason (same as above)
  "details": "Detailed explanation",      // String: admin's explanation
  "deletedBy": "admin@email.com",         // String: admin who deleted
  "deletedAt": Timestamp(2025, 10, 24),   // Firebase Timestamp
  "notificationSent": true                // Boolean: if user was notified
}
```

**Index Requirements**:
- Single field index on: `deletedAt` (Descending)
- Single field index on: `sellerId` (Ascending)

**Purpose**: 
- Internal admin tracking
- Audit trail
- Statistics and reporting
- Dispute resolution

---

## 🔐 Security Rules

### Recommended Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Notifications - Users can read their own, only admins can write
    match /notifications/{notificationId} {
      allow read: if request.auth != null 
                  && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null 
                   && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Product Deletions - Admin only (internal log)
    match /product_deletions/{deletionId} {
      allow read, write: if request.auth != null 
                         && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Products - Users can read all, write their own, admins can delete any
    match /products/{productId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null 
                            && request.auth.uid == request.resource.data.sellerId;
      allow delete: if request.auth != null 
                    && (request.auth.uid == resource.data.sellerId 
                        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

---

## 📊 Example Queries

### Mobile App Queries

#### Get Unread Notifications
```javascript
const notificationsRef = collection(db, 'notifications');
const q = query(
  notificationsRef,
  where('userId', '==', currentUserId),
  where('read', '==', false),
  orderBy('timestamp', 'desc')
);
```

#### Get All Notifications (Paginated)
```javascript
const q = query(
  notificationsRef,
  where('userId', '==', currentUserId),
  orderBy('timestamp', 'desc'),
  limit(20)
);

// For next page
const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
const nextQ = query(
  notificationsRef,
  where('userId', '==', currentUserId),
  orderBy('timestamp', 'desc'),
  startAfter(lastVisible),
  limit(20)
);
```

#### Get Warning Notifications Only
```javascript
const q = query(
  notificationsRef,
  where('userId', '==', currentUserId),
  where('type', '==', 'product_warning'),
  where('actionRequired', '==', true),
  orderBy('timestamp', 'desc')
);
```

### Admin Queries

#### Get All Deletions in Date Range
```javascript
const deletionsRef = collection(db, 'product_deletions');
const q = query(
  deletionsRef,
  where('deletedAt', '>=', startDate),
  where('deletedAt', '<=', endDate),
  orderBy('deletedAt', 'desc')
);
```

#### Get Deletions by Seller
```javascript
const q = query(
  deletionsRef,
  where('sellerId', '==', sellerUserId),
  orderBy('deletedAt', 'desc')
);
```

#### Get Deletions by Reason
```javascript
const q = query(
  deletionsRef,
  where('reason', '==', 'fake_product'),
  orderBy('deletedAt', 'desc')
);
```

---

## 📈 Data Flow Diagram

```
┌─────────────────┐
│  Admin Panel    │
│  (Web)          │
└────────┬────────┘
         │
         │ Write
         ↓
┌─────────────────────────────┐
│  Firestore Collections      │
│                             │
│  • notifications            │
│  • product_deletions        │
│  • products (delete)        │
└────────┬────────────────────┘
         │
         │ Read (Real-time)
         ↓
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└─────────────────┘
```

---

## 🔄 Notification Lifecycle

```
1. Admin Action (Warning/Delete)
   ↓
2. Create document in 'notifications' collection
   ↓
3. Mobile app listener triggers
   ↓
4. Show notification to user
   ↓
5. User acknowledges
   ↓
6. Update 'read: true'
   ↓
7. (Optional) Delete notification after X days
```

---

## 💾 Storage Estimates

### Per Warning Notification
- Average size: ~500 bytes
- With indexes: ~750 bytes

### Per Deletion Notification  
- Average size: ~400 bytes
- With indexes: ~600 bytes

### Per Deletion Log
- Average size: ~450 bytes
- With indexes: ~700 bytes

### Cost Estimates (Firebase Pricing)
- **Free tier**: 1GB storage, 50K reads/day, 20K writes/day
- **Paid tier**: 
  - $0.18 per GB storage/month
  - $0.06 per 100K reads
  - $0.18 per 100K writes

**Example**: 10,000 notifications stored:
- Storage: ~7.5 MB (negligible cost)
- Reads: If each user checks 10 times/day = 100K reads ($0.06)
- Writes: 1000 new notifications/month ($0.002)

---

## 🧹 Maintenance

### Cleanup Old Notifications (Optional)

**Cloud Function** (runs daily):
```javascript
exports.cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days old
    
    const q = query(
      collection(db, 'notifications'),
      where('read', '==', true),
      where('timestamp', '<', cutoffDate)
    );
    
    const snapshot = await getDocs(q);
    const batch = db.batch();
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${snapshot.size} old notifications`);
  });
```

---

## 📝 Best Practices

1. **Indexes**: Create composite indexes as mentioned above
2. **Real-time Listeners**: Use `onSnapshot()` for real-time updates
3. **Pagination**: Implement pagination for notifications list
4. **Cleanup**: Regularly delete old read notifications
5. **Testing**: Use Firebase Emulator for local development
6. **Security**: Always validate user permissions
7. **Error Handling**: Implement proper try-catch blocks
8. **Offline Support**: Firebase SDK handles offline caching

---

## 🚨 Troubleshooting

### Common Issues

**Issue**: "Missing index" error
- **Solution**: Click the link in console to create index automatically

**Issue**: User can't see notifications
- **Solution**: Check security rules and userId matching

**Issue**: Notifications not real-time
- **Solution**: Verify `onSnapshot()` listener is active

**Issue**: Too many reads
- **Solution**: Implement local caching and pagination

---

*Last Updated: October 24, 2025*
*Version: 1.0*


