/**
 * 🧪 NOTIFICATION TEST FILE
 * 
 * Copy this entire file to your mobile app and run it
 * to diagnose notification issues
 * 
 * Usage:
 * 1. Copy this file to your mobile app project
 * 2. Import and call testNotifications() when app starts
 * 3. Check console logs for results
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig'; // Adjust path as needed

// =============================
// 🧪 TEST 1: Check User Authentication
// =============================
export function testUserAuth() {
  console.log('\n========== TEST 1: User Authentication ==========');
  
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ FAIL: No authenticated user');
    console.log('   → Make sure user is signed in before testing');
    return false;
  }
  
  console.log('✅ PASS: User is authenticated');
  console.log('   User ID:', user.uid);
  console.log('   Email:', user.email);
  return true;
}

// =============================
// 🧪 TEST 2: Check Notifications Exist
// =============================
export async function testNotificationsExist() {
  console.log('\n========== TEST 2: Notifications Exist ==========');
  
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('❌ FAIL: No user ID');
    return false;
  }
  
  try {
    // Query ALL notifications for this user (read and unread)
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.warn('⚠️  WARNING: No notifications found for this user');
      console.log('   → Send a test warning from admin panel');
      console.log('   → Check Firebase Console to verify notification was created');
      console.log('   → Verify userId in notification matches:', userId);
      return false;
    }
    
    console.log(`✅ PASS: Found ${snapshot.size} notification(s)`);
    
    // Show details of each notification
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n   Notification ${index + 1}:`);
      console.log('   - ID:', doc.id);
      console.log('   - Type:', data.type);
      console.log('   - Title:', data.title);
      console.log('   - Read:', data.read);
      console.log('   - Timestamp:', data.timestamp?.toDate?.() || data.timestamp);
    });
    
    return true;
  } catch (error) {
    console.error('❌ FAIL: Error fetching notifications');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n   📝 FIX: Update Firestore security rules');
      console.log('   Add this rule:');
      console.log('   match /notifications/{notificationId} {');
      console.log('     allow read: if request.auth.uid == resource.data.userId;');
      console.log('   }');
    }
    
    return false;
  }
}

// =============================
// 🧪 TEST 3: Check Unread Notifications
// =============================
export async function testUnreadNotifications() {
  console.log('\n========== TEST 3: Unread Notifications ==========');
  
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('❌ FAIL: No user ID');
    return false;
  }
  
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('ℹ️  INFO: No unread notifications');
      console.log('   → All notifications have been read, or none exist');
      console.log('   → Send a new warning from admin panel to test');
      return true; // Not a failure, just informational
    }
    
    console.log(`✅ PASS: Found ${snapshot.size} unread notification(s)`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n   Unread Notification ${index + 1}:`);
      console.log('   - Type:', data.type);
      console.log('   - Title:', data.title);
      console.log('   - Message:', data.message?.substring(0, 50) + '...');
    });
    
    return true;
  } catch (error) {
    console.error('❌ FAIL: Error fetching unread notifications');
    console.error('   Error:', error.message);
    
    if (error.code === 'failed-precondition') {
      console.log('\n   📝 FIX: Create Firestore index');
      console.log('   1. Click the link in the full error message');
      console.log('   2. Or create manually in Firebase Console → Indexes');
      console.log('   Collection: notifications');
      console.log('   Fields: userId (Asc), read (Asc), timestamp (Desc)');
    }
    
    return false;
  }
}

// =============================
// 🧪 TEST 4: Real-time Listener
// =============================
export function testRealtimeListener() {
  console.log('\n========== TEST 4: Real-time Listener ==========');
  
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('❌ FAIL: No user ID');
    return null;
  }
  
  console.log('⏳ Setting up real-time listener...');
  console.log('   Listening for userId:', userId);
  
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('\n📬 SNAPSHOT RECEIVED');
        console.log('   Total documents:', snapshot.size);
        console.log('   Changes:', snapshot.docChanges().length);
        
        snapshot.docChanges().forEach((change) => {
          console.log(`\n   ${change.type.toUpperCase()}:`);
          console.log('   - Doc ID:', change.doc.id);
          console.log('   - Data:', change.doc.data());
          
          if (change.type === 'added') {
            console.log('   🔔 NEW NOTIFICATION DETECTED!');
            console.log('   → This should trigger an alert in your app');
          }
        });
        
        console.log('\n✅ PASS: Listener is working');
        console.log('   → Send a warning from admin panel to test real-time updates');
      },
      (error) => {
        console.error('\n❌ FAIL: Listener error');
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
      }
    );
    
    console.log('✅ Listener setup complete');
    console.log('   → Listener will log when new notifications arrive');
    console.log('   → To stop: call the returned unsubscribe function');
    
    // Return unsubscribe function
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ FAIL: Error setting up listener');
    console.error('   Error:', error.message);
    return null;
  }
}

// =============================
// 🧪 TEST 5: Write Test (Mark as Read)
// =============================
export async function testMarkAsRead() {
  console.log('\n========== TEST 5: Mark as Read ==========');
  
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('❌ FAIL: No user ID');
    return false;
  }
  
  try {
    // Get first unread notification
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('ℹ️  SKIP: No unread notifications to mark');
      return true;
    }
    
    const firstDoc = snapshot.docs[0];
    console.log('⏳ Attempting to mark notification as read...');
    console.log('   Notification ID:', firstDoc.id);
    
    await updateDoc(doc(db, 'notifications', firstDoc.id), {
      read: true
    });
    
    console.log('✅ PASS: Successfully marked as read');
    console.log('   → Your app can update notifications');
    return true;
    
  } catch (error) {
    console.error('❌ FAIL: Error marking as read');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n   📝 FIX: Update Firestore security rules');
      console.log('   Add this rule:');
      console.log('   match /notifications/{notificationId} {');
      console.log('     allow update: if request.auth.uid == resource.data.userId');
      console.log('                   && request.resource.data.diff(resource.data)');
      console.log('                     .affectedKeys().hasOnly(["read"]);');
      console.log('   }');
    }
    
    return false;
  }
}

// =============================
// 🚀 RUN ALL TESTS
// =============================
export async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     🧪 NOTIFICATION SYSTEM DIAGNOSTIC TESTS           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  let results = {
    auth: false,
    notificationsExist: false,
    unreadNotifications: false,
    realtimeListener: false,
    markAsRead: false
  };
  
  // Test 1: Authentication
  results.auth = testUserAuth();
  
  if (!results.auth) {
    console.log('\n⛔ STOP: Cannot continue without authentication');
    return results;
  }
  
  // Test 2: Check notifications exist
  results.notificationsExist = await testNotificationsExist();
  
  // Test 3: Check unread notifications
  results.unreadNotifications = await testUnreadNotifications();
  
  // Test 4: Real-time listener
  const unsubscribe = testRealtimeListener();
  results.realtimeListener = !!unsubscribe;
  
  // Keep listener active for 5 seconds to test
  if (unsubscribe) {
    console.log('\n⏳ Keeping listener active for 5 seconds...');
    console.log('   Send a warning NOW from admin panel to test real-time!');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔴 Stopping listener...');
    unsubscribe();
  }
  
  // Test 5: Mark as read
  results.markAsRead = await testMarkAsRead();
  
  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`   1. User Auth:             ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   2. Notifications Exist:   ${results.notificationsExist ? '✅ PASS' : '⚠️  WARN'}`);
  console.log(`   3. Unread Notifications:  ${results.unreadNotifications ? '✅ PASS' : 'ℹ️  INFO'}`);
  console.log(`   4. Real-time Listener:    ${results.realtimeListener ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   5. Mark as Read:          ${results.markAsRead ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.auth && results.realtimeListener;
  
  if (allPassed) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
    console.log('   Your notification system should be working.');
    console.log('   If you still don\'t see alerts, check your Alert/notification display code.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('   Review the error messages above for solutions.');
  }
  
  return results;
}

// =============================
// 📖 USAGE INSTRUCTIONS
// =============================

/*

HOW TO USE THIS TEST FILE:
==========================

1. Copy this entire file to your mobile app project
   Example: /src/utils/testNotifications.js

2. Import in your main App.js or test screen:
   
   import { runAllTests } from './utils/testNotifications';

3. Call the function when your app starts or on a button press:
   
   // Option A: On app start (for quick testing)
   useEffect(() => {
     runAllTests();
   }, []);
   
   // Option B: On button press (better for production)
   <Button title="Test Notifications" onPress={runAllTests} />

4. Check your console/logs for detailed results

5. Follow the FIX suggestions in the output


INDIVIDUAL TESTS:
=================

You can also run tests individually:

import { 
  testUserAuth,
  testNotificationsExist,
  testUnreadNotifications,
  testRealtimeListener,
  testMarkAsRead 
} from './utils/testNotifications';

// Test just authentication
testUserAuth();

// Test if notifications exist
await testNotificationsExist();

// Set up listener and keep it active
const unsubscribe = testRealtimeListener();
// Later: unsubscribe(); to stop


WHAT TO EXPECT:
===============

✅ PASS = Test succeeded
❌ FAIL = Test failed (check error message)
⚠️  WARN = Not critical but needs attention
ℹ️  INFO = Informational only

Each test provides specific FIX instructions if it fails.

*/

export default runAllTests;

