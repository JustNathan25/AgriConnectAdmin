# 🐛 Warning Notifications Not Showing - Troubleshooting Guide

> **Complete guide to fix notification issues in mobile app**

**Date:** October 30, 2025

---

## ✅ Admin Panel Status

The admin panel code is **CORRECT**. When a warning is sent, it creates:

```javascript
// notifications/{notificationId}
{
  type: "user_warning",        // or "product_warning"
  userId: "abc123",            // Target user ID
  title: "⚠️ Warning: ...",
  message: "Your warning message...",
  severity: "medium",
  category: "inappropriate_content",
  warningId: "xyz789",
  timestamp: serverTimestamp(),
  read: false,
  actionRequired: true,
  deepLink: "app://warnings/xyz789"
}
```

This is working correctly! ✅

---

## 🔍 Diagnosis Checklist

### Step 1: Verify Notification Was Created

1. **Send a test warning** from admin panel
2. **Open Firebase Console** → Firestore Database → `notifications` collection
3. **Check if notification document exists**

**If NO document exists:**
- Check admin panel browser console for errors
- Verify admin has write permissions to `notifications` collection
- Check Firestore security rules allow admin to create

**If YES document exists:** ✅ Admin panel is working! Issue is in mobile app.

---

### Step 2: Check User ID Match

**CRITICAL:** The `userId` in the notification **must exactly match** the user ID in your mobile app.

In Firebase Console, compare:
```
notifications/{id}/userId  = "abc123"
                             ↓ MUST MATCH ↓
users/{id}                 = "abc123"
```

**Common Issues:**
- ❌ Admin sent warning to wrong user
- ❌ Mobile app is signed in as different user
- ❌ Case sensitivity (userId vs UserId)

---

### Step 3: Check Firestore Security Rules

Your mobile app needs permission to read notifications.

**Test in Firebase Console:**
1. Go to **Firestore Database** → **Rules**
2. Check this rule exists:

```javascript
match /notifications/{notificationId} {
  allow read: if isSignedIn() && isOwner(resource.data.userId);
  allow create: if isAdmin();
}
```

3. Test by manually querying in Firebase Console

**If rule is missing:** Deploy the updated rules from `UPDATED_FIRESTORE_RULES.txt`

---

## 📱 Mobile App Implementation

### Issue: Mobile App Not Listening

Your mobile app needs a **real-time listener** for notifications. Here's the correct code:

#### Option 1: React Native (Recommended)

```javascript
// NotificationService.js or similar file
import { useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { Alert } from 'react-native';

export function useNotificationListener(navigation) {
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('❌ No user ID - not listening to notifications');
      return;
    }

    console.log('✅ Setting up notification listener for user:', userId);

    // Real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📬 Notification snapshot received:', snapshot.size, 'docs');
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = change.doc.data();
            const notificationId = change.doc.id;
            
            console.log('🔔 New notification:', notification);

            // Handle user warnings
            if (notification.type === 'user_warning') {
              Alert.alert(
                notification.title || '⚠️ Account Warning',
                notification.message,
                [
                  { 
                    text: 'View Details', 
                    onPress: () => {
                      markAsRead(notificationId);
                      navigation.navigate('Warnings');
                    }
                  },
                  { 
                    text: 'OK',
                    onPress: () => markAsRead(notificationId)
                  }
                ]
              );
            }

            // Handle product warnings
            if (notification.type === 'product_warning') {
              Alert.alert(
                notification.title || '⚠️ Product Warning',
                notification.message,
                [
                  { 
                    text: 'View Product', 
                    onPress: () => {
                      markAsRead(notificationId);
                      navigation.navigate('ProductDetails', { 
                        productId: notification.productId 
                      });
                    }
                  },
                  { 
                    text: 'OK',
                    onPress: () => markAsRead(notificationId)
                  }
                ]
              );
            }
          }
        });
      },
      (error) => {
        console.error('❌ Notification listener error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
    );

    return () => {
      console.log('🔴 Unsubscribing from notifications');
      unsubscribe();
    };
  }, []);
}

async function markAsRead(notificationId) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
    console.log('✅ Marked notification as read:', notificationId);
  } catch (error) {
    console.error('❌ Error marking as read:', error);
  }
}
```

**Usage in your App:**

```javascript
// In App.js or Main Screen
import { useNotificationListener } from './services/NotificationService';

function App() {
  const navigation = useNavigation();
  
  // Set up notification listener
  useNotificationListener(navigation);
  
  return (
    // Your app UI
  );
}
```

---

#### Option 2: Flutter

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class NotificationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  StreamSubscription<QuerySnapshot>? _notificationSubscription;
  
  void startListening(BuildContext context) {
    final userId = _auth.currentUser?.uid;
    if (userId == null) {
      print('❌ No user ID - not listening to notifications');
      return;
    }
    
    print('✅ Setting up notification listener for user: $userId');
    
    _notificationSubscription = _firestore
      .collection('notifications')
      .where('userId', isEqualTo: userId)
      .where('read', isEqualTo: false)
      .orderBy('timestamp', descending: true)
      .snapshots()
      .listen(
        (snapshot) {
          print('📬 Notification snapshot: ${snapshot.docChanges.length} changes');
          
          for (var change in snapshot.docChanges) {
            if (change.type == DocumentChangeType.added) {
              final notification = change.doc.data() as Map<String, dynamic>;
              final notificationId = change.doc.id;
              
              print('🔔 New notification: $notification');
              
              // Handle user warnings
              if (notification['type'] == 'user_warning') {
                _showWarningAlert(
                  context,
                  notificationId,
                  notification['title'] ?? '⚠️ Account Warning',
                  notification['message'] ?? '',
                );
              }
              
              // Handle product warnings
              if (notification['type'] == 'product_warning') {
                _showProductWarningAlert(
                  context,
                  notificationId,
                  notification['title'] ?? '⚠️ Product Warning',
                  notification['message'] ?? '',
                  notification['productId'],
                );
              }
            }
          }
        },
        onError: (error) {
          print('❌ Notification listener error: $error');
        },
      );
  }
  
  void _showWarningAlert(BuildContext context, String notificationId, String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _markAsRead(notificationId);
            },
            child: Text('OK'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _markAsRead(notificationId);
              Navigator.pushNamed(context, '/warnings');
            },
            child: Text('View Details'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _markAsRead(String notificationId) async {
    try {
      await _firestore
        .collection('notifications')
        .doc(notificationId)
        .update({'read': true});
      print('✅ Marked notification as read: $notificationId');
    } catch (error) {
      print('❌ Error marking as read: $error');
    }
  }
  
  void dispose() {
    _notificationSubscription?.cancel();
  }
}
```

---

## 🧪 Testing Steps

### Test 1: Check Firebase Console

1. Send warning from admin panel
2. Open **Firebase Console** → **Firestore** → `notifications`
3. **Verify notification exists** with correct `userId`

**Expected:**
```javascript
{
  type: "user_warning",
  userId: "YOUR_USER_ID",  // ← Should match your mobile app user
  title: "⚠️ Warning: Test",
  message: "This is a test warning",
  timestamp: Timestamp,
  read: false
}
```

---

### Test 2: Add Debug Logs

Add console logs in your mobile app:

```javascript
// In your notification listener
const userId = auth.currentUser?.uid;
console.log('🔍 Current User ID:', userId);

onSnapshot(q, (snapshot) => {
  console.log('📬 Received snapshot with', snapshot.size, 'documents');
  console.log('📬 Document changes:', snapshot.docChanges().length);
  
  snapshot.docs.forEach(doc => {
    console.log('📄 Document:', doc.id, doc.data());
  });
  
  snapshot.docChanges().forEach((change) => {
    console.log('🔔 Change type:', change.type);
    console.log('🔔 Notification:', change.doc.data());
  });
});
```

**Check your app logs for:**
- ✅ User ID matches Firebase
- ✅ Snapshot is received
- ✅ Documents are in the snapshot
- ✅ Change type is 'added'

---

### Test 3: Manual Query Test

Test if your app can read notifications at all:

```javascript
import { getDocs, collection, query, where } from 'firebase/firestore';

async function testNotificationAccess() {
  const userId = auth.currentUser?.uid;
  console.log('Testing for user:', userId);
  
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    console.log('✅ Found', snapshot.size, 'notifications');
    
    snapshot.forEach(doc => {
      console.log('📄', doc.id, doc.data());
    });
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error code:', error.code);
  }
}

// Call this function when app starts
testNotificationAccess();
```

**If error "permission-denied":** Security rules issue  
**If 0 documents:** No notifications or wrong userId  
**If > 0 documents:** Notifications exist, listener issue

---

## 🔧 Common Issues & Solutions

### Issue 1: "Permission Denied" Error

**Cause:** Firestore security rules blocking read access

**Solution:**
1. Deploy updated rules from `UPDATED_FIRESTORE_RULES.txt`
2. Verify rule exists:
```javascript
match /notifications/{notificationId} {
  allow read: if isSignedIn() && isOwner(resource.data.userId);
}
```

---

### Issue 2: User ID Mismatch

**Cause:** Warning sent to wrong user ID

**Solution:**
1. In mobile app, log current user ID:
```javascript
console.log('My User ID:', auth.currentUser?.uid);
```

2. In Firebase Console, check notification `userId` matches exactly

3. When sending warning, verify you're selecting correct user

---

### Issue 3: Listener Not Active

**Cause:** Notification listener not set up or unsubscribed too early

**Solution:**
1. Add listener in main app component (not in individual screens)
2. Don't unsubscribe until app closes
3. Check listener is called on app startup:
```javascript
useEffect(() => {
  console.log('🚀 App started, setting up listener');
  const unsubscribe = setupNotificationListener();
  return unsubscribe;
}, []); // Empty dependency array = run once
```

---

### Issue 4: Missing Index

**Cause:** Firestore composite index not created

**Solution:**
1. Check browser console for index error
2. Click the link in error to create index
3. Or manually create in Firebase Console → Indexes:
   - Collection: `notifications`
   - Fields: `userId` (Ascending), `read` (Ascending), `timestamp` (Descending)

---

### Issue 5: Offline/Network Issues

**Cause:** App not connected to internet

**Solution:**
1. Check device internet connection
2. Firebase works offline, but needs initial connection
3. Force reconnect:
```javascript
import { enableNetwork } from 'firebase/firestore';
await enableNetwork(db);
```

---

## 📋 Complete Working Example

Here's a complete, tested example:

```javascript
// services/NotificationService.js
import { useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Alert } from 'react-native';

export function useWarningNotifications(navigation) {
  useEffect(() => {
    // Get current user
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }

    console.log('✅ User authenticated:', user.uid);
    console.log('✅ Setting up warning notification listener...');

    // Query for unread notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📬 Snapshot received:', snapshot.size, 'unread notifications');

        // Process new notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const id = change.doc.id;

            console.log('🔔 NEW NOTIFICATION:', data.type);

            // Show alert for warnings
            if (data.type === 'user_warning' || data.type === 'product_warning') {
              Alert.alert(
                data.title,
                data.message,
                [
                  {
                    text: 'OK',
                    onPress: () => markAsRead(id)
                  },
                  {
                    text: 'View',
                    onPress: () => {
                      markAsRead(id);
                      if (data.type === 'user_warning') {
                        navigation.navigate('Warnings');
                      } else {
                        navigation.navigate('ProductDetails', {
                          productId: data.productId
                        });
                      }
                    }
                  }
                ]
              );
            }
          }
        });
      },
      (error) => {
        console.error('❌ Listener error:', error.code, error.message);
      }
    );

    // Cleanup
    return () => {
      console.log('🔴 Cleaning up notification listener');
      unsubscribe();
    };
  }, []); // Run once on mount
}

async function markAsRead(notificationId) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
    console.log('✅ Marked as read');
  } catch (error) {
    console.error('❌ Mark as read error:', error);
  }
}
```

**Use in App.js:**

```javascript
import { useWarningNotifications } from './services/NotificationService';

function App() {
  const navigation = useNavigation();
  
  // This will automatically listen for warnings
  useWarningNotifications(navigation);
  
  return (
    <NavigationContainer>
      {/* Your navigation */}
    </NavigationContainer>
  );
}
```

---

## ✅ Quick Checklist

- [ ] Notification created in Firebase (check Console)
- [ ] User ID matches between notification and mobile app
- [ ] Firestore security rules allow reading notifications
- [ ] Mobile app has real-time listener set up
- [ ] Listener uses `onSnapshot`, not `getDocs`
- [ ] Listener uses correct user ID in query
- [ ] Composite index created for query
- [ ] Mobile app is connected to internet
- [ ] Console logs show listener is active
- [ ] No permission errors in console

---

## 🆘 Still Not Working?

If you've tried everything above, provide these details:

1. **Firebase Console Screenshot** of notification document
2. **Mobile app console logs** when warning is sent
3. **Error messages** (if any)
4. **User ID** from mobile app vs. notification
5. **Code snippet** of your notification listener

---

**Most common issue:** Listener not set up in mobile app! Use the complete example above. ✅

---

**Last Updated:** October 30, 2025  
**Tested With:** Firebase 12.4.0, React Native 0.72

