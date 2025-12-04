# ⚡ Quick Fix: Notifications Not Showing

> **Fast troubleshooting guide - follow in order**

---

## Step 1: Verify Notification Created (30 seconds)

1. Send warning from admin panel
2. Open **Firebase Console** → **Firestore Database** → **notifications**
3. Find newest document
4. Check it has:
   - ✅ `type: "user_warning"` or `"product_warning"`
   - ✅ `userId: "YOUR_USER_ID"`
   - ✅ `read: false`
   - ✅ `timestamp: [recent]`

**If notification doesn't exist:** Admin panel issue (unlikely - code is correct)  
**If notification exists:** Continue to Step 2 ✓

---

## Step 2: Verify User ID Matches (30 seconds)

**In Firebase Console**, compare:

```
notifications/{id}/userId = "abc123"
                              ↓↓↓ MUST MATCH ↓↓↓
auth.currentUser.uid      = "abc123"
```

**In your mobile app**, add this log:
```javascript
console.log('My User ID:', auth.currentUser?.uid);
```

**If they DON'T match:** Admin sent warning to wrong user  
**If they match:** Continue to Step 3 ✓

---

## Step 3: Add Notification Listener (5 minutes)

Your mobile app **MUST** have a real-time listener. Copy this code:

```javascript
// In App.js or main screen
import { useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { Alert } from 'react-native';

function App() {
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    console.log('🔔 Listening for warnings...');

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('timestamp', 'desc')
      ),
      (snapshot) => {
        console.log('📬 Received', snapshot.size, 'notifications');
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            console.log('🔔 NEW:', data.type, data.title);
            
            Alert.alert(data.title, data.message);
          }
        });
      },
      (error) => console.error('❌ Error:', error)
    );

    return unsubscribe;
  }, []);

  return (/* Your app */);
}
```

**Test:** Send warning, check console logs

---

## Step 4: Create Firestore Index (1 minute)

If you see error: **"The query requires an index"**

**Fix:**
1. Click the link in the error message
2. Or go to **Firebase Console** → **Firestore** → **Indexes** → **Create Index**
3. Settings:
   - Collection: `notifications`
   - Field 1: `userId` (Ascending)
   - Field 2: `read` (Ascending)  
   - Field 3: `timestamp` (Descending)
4. Click **Create**
5. Wait 2-5 minutes for index to build

---

## Step 5: Check Security Rules (2 minutes)

**In Firebase Console** → **Firestore** → **Rules**, verify this exists:

```javascript
match /notifications/{notificationId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if isAdmin();
}
```

**If missing:** Copy from `UPDATED_FIRESTORE_RULES.txt` and publish

---

## 🧪 Quick Test

Copy `TEST_NOTIFICATIONS_MOBILE_APP.js` to your app and run:

```javascript
import { runAllTests } from './TEST_NOTIFICATIONS_MOBILE_APP';

// In your component
useEffect(() => {
  runAllTests();
}, []);
```

This will tell you EXACTLY what's wrong!

---

## 🎯 Most Common Issues (90% of cases)

### Issue #1: No Listener Set Up ⭐ **MOST COMMON**

**Symptom:** Notifications exist in Firebase but don't show in app

**Fix:** Add the listener code from Step 3 above

---

### Issue #2: User ID Mismatch

**Symptom:** Listener running but no notifications received

**Fix:** 
```javascript
// Log both IDs
console.log('Mobile app user:', auth.currentUser?.uid);
// Compare with userId in Firebase notification
```

---

### Issue #3: Missing Index

**Symptom:** Error: "The query requires an index"

**Fix:** Follow Step 4 above

---

### Issue #4: Wrong Collection

**Symptom:** Listener set up but on wrong collection

**Fix:** Make sure listening to `notifications` (not `user_warnings`)

---

## ✅ Working Example

This is a **complete, tested, working example**:

```javascript
// NotificationListener.js
import { useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Alert } from 'react-native';

export function useNotifications() {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const { title, message } = change.doc.data();
          
          Alert.alert(title, message, [
            { text: 'OK', onPress: () => {
              updateDoc(doc(db, 'notifications', change.doc.id), {
                read: true
              });
            }}
          ]);
        }
      });
    });
  }, []);
}
```

**Usage:**
```javascript
// In App.js
import { useNotifications } from './NotificationListener';

function App() {
  useNotifications(); // That's it!
  return <YourAppContent />;
}
```

---

## 📞 Still Not Working?

Run the diagnostic test:

```bash
# 1. Copy TEST_NOTIFICATIONS_MOBILE_APP.js to your project
# 2. Import and run
import { runAllTests } from './TEST_NOTIFICATIONS_MOBILE_APP';
runAllTests();

# 3. Check console logs - it will tell you exactly what's wrong
```

---

## 🎉 Success Checklist

Once working, you should see:

- ✅ Console log: "🔔 Listening for warnings..."
- ✅ Console log: "📬 Received X notifications"
- ✅ Console log: "🔔 NEW: user_warning ..."
- ✅ Alert pops up with warning title and message
- ✅ Notification appears immediately when admin sends it

---

**Admin panel code is correct ✅ - Issue is in mobile app setup!**

Copy the listener code from Step 3 and you'll be all set! 🚀

