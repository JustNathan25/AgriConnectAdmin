# Chat Integration Guide

> **Version:** 2.0  
> **Last Updated:** January 2025  
> **Related Docs:** 
> - [USER_WARNING_SYSTEM_GUIDE.md](./USER_WARNING_SYSTEM_GUIDE.md)
> - [FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md)
> - [FIRESTORE_RULES_UPDATE_GUIDE.md](./FIRESTORE_RULES_UPDATE_GUIDE.md)

---

## Table of Contents

1. [Purpose](#purpose)
2. [Firestore Collections](#firestore-collections)
3. [Admin Website Flow](#admin-website-flow)
4. [Mobile App Consumption](#mobile-app-consumption)
5. [Message Types Reference](#message-types-reference)
6. [Unread Counts](#unread-counts)
7. [Security Rules](#security-rules)
8. [Error Handling](#error-handling)
9. [Testing Recommendations](#testing-recommendations)
10. [Troubleshooting](#troubleshooting)

---

## Purpose

This guide explains how admin-triggered chat messages are created from the website and how the mobile app should consume them. It documents the `chats` data model, message payloads, and the helper functions used when an admin sends warnings for both products and users.

### Where messages are sent from

#### Product Warnings
- **File:** `src/javascript_files/products.js`
- **Helper:** `sendSystemChatMessageToSellerOnProductWarning(...)`
- **When:** After an admin issues a product warning, a system message is posted to a chat thread targeting the product seller

#### User Warnings
- **File:** `src/javascript_files/users.js`
- **Helper:** `sendSystemChatMessageToUserOnWarning(...)`
- **When:** After an admin issues a user warning, a system message is posted to the user's admin chat thread

---

## Firestore Collections

### chats (root collection)

#### Product Warning Chats
- **Document ID:** `agriconnect_warning_{productId}_{sellerId}`
- **Example fields:**
  - `chatId` (string): same as document ID
  - `buyerId` (string): the seller's user id (recipient)
  - `participants` (array<string>): `[sellerId]` for system threads
  - `isAdminChat` (bool): `true` for system/admin-initiated chats
  - `productId` (string): reference to the product
  - `productName` (string): display name of the product
  - `lastMessage` (string): preview of latest message
  - `lastSenderId` (string): e.g., `"AGRICONNECT_SYSTEM"`
  - `lastTimestamp` (timestamp): last activity
  - `createdAt` (timestamp): set on first creation only with `merge: true`
  - `deletedBy` (nullable string): reserved
  - `unreadCount_{userId}` (optional number): cached unread count for performance

#### User Warning Chats
- **Document ID:** `admin_chat_{userId}`
- **Example fields:**
  - `chatId` (string): same as document ID
  - `buyerId` (string): the user's id (recipient)
  - `participants` (array<string>): `[userId]` for system threads
  - `isAdminChat` (bool): `true` for system/admin-initiated chats
  - `lastMessage` (string): preview of latest message
  - `lastSenderId` (string): e.g., `"AGRICONNECT_SYSTEM"`
  - `lastTimestamp` (timestamp): last activity
  - `createdAt` (timestamp): set on first creation only with `merge: true`
  - `deletedBy` (nullable string): reserved
  - `unreadCount_{userId}` (optional number): cached unread count for performance

### chats/{chatId}/messages (subcollection)

#### Product Warning Message
- **Example fields:**
  - `type` (string): `"product_warning"`
  - `system` (bool): `true`
  - `text` (string): human-readable warning message
  - `productId` (string): reference to the product
  - `productName` (string): display name of the product
  - `category` (string): warning category
  - `severity` (string): `low|medium|high|critical`
  - `issues` (array<string>): selected issue keys (e.g., `["price", "description", "images"]`)
  - `senderId` (string): `"AGRICONNECT_SYSTEM"`
  - `senderName` (string): `"AGRICONNECT_SYSTEM"`
  - `createdAt` (timestamp): server-generated
  - `readBy` (array<string>): user ids who have read the message

#### User Warning Message
- **Example fields:**
  - `type` (string): `"user_warning"`
  - `system` (bool): `true`
  - `text` (string): human-readable warning message
  - `title` (string): warning title
  - `category` (string): warning category
  - `severity` (string): `low|medium|high|critical`
  - `relatedProductId` (string|null): optional reference to related product
  - `senderId` (string): `"AGRICONNECT_SYSTEM"`
  - `senderName` (string): `"AGRICONNECT_SYSTEM"`
  - `createdAt` (timestamp): server-generated
  - `readBy` (array<string>): user ids who have read the message

---

## Admin Website Flow (summary)

### Product Warning Flow

1. Admin opens product, fills warning modal, clicks Send.
2. Code writes to `product_warnings` and `notifications`.
3. Helper creates/updates a `chats/{chatId}` document and appends a system message to `messages`.
4. Product `warningCount` is incremented.

### User Warning Flow

1. Admin opens user profile, fills warning modal, clicks Send.
2. Code writes to `user_warnings` and `notifications`.
3. Helper creates/updates a `chats/{chatId}` document and appends a system message to `messages`.
4. User `warnings.count` and `warnings.strikes` are incremented.

### Helper Signatures

#### Product Warning Helper

```javascript
/**
 * Creates or updates a chat thread and posts a system message for a product warning.
 * 
 * @param {string} sellerId - The seller's user ID
 * @param {string} productId - The product ID
 * @param {string} productName - Display name of the product
 * @param {string} warningMessage - Human-readable warning message
 * @param {string} warningType - Warning category
 * @param {string} warningSeverity - Severity level (low|medium|high|critical)
 * @param {string[]} issues - Array of issue keys
 * @returns {Promise<void>} Resolves when chat and message are created/updated
 * @throws {Error} If Firestore write fails
 * 
 * Side Effects:
 * - Creates or updates chats document with merge: true
 * - Adds new message to messages subcollection
 * - Updates lastTimestamp on each call
 * - Preserves createdAt on subsequent calls
 */
async function sendSystemChatMessageToSellerOnProductWarning(
  sellerId: string,
  productId: string,
  productName: string,
  warningMessage: string,
  warningType: string,
  warningSeverity: string,
  issues: string[]
)
```

#### User Warning Helper

```javascript
/**
 * Creates or updates a per-user admin chat and posts a system message for a user warning.
 * 
 * @param {string} userId - The user's ID
 * @param {string} warningTitle - Warning title
 * @param {string} warningMessage - Human-readable warning message
 * @param {string} warningCategory - Warning category
 * @param {string} warningSeverity - Severity level (low|medium|high|critical)
 * @param {string|null} relatedProductId - Optional related product ID
 * @returns {Promise<void>} Resolves when chat and message are created/updated
 * @throws {Error} If Firestore write fails
 * 
 * Side Effects:
 * - Creates or updates chats document with merge: true
 * - Adds new message to messages subcollection
 * - Updates lastTimestamp on each call
 * - Preserves createdAt on subsequent calls
 */
async function sendSystemChatMessageToUserOnWarning(
  userId: string,
  warningTitle: string,
  warningMessage: string,
  warningCategory: string,
  warningSeverity: string,
  relatedProductId: string | null
)
```

**Notes:**
- Chat ID convention ensures 1 chat thread per product–seller pair or per user for warnings.
- `setDoc(..., { merge: true })` is used so repeated warnings keep the same chat and only update metadata.
- With `merge: true`, `createdAt` is only set on the first creation and preserved on subsequent merges.
- `lastTimestamp` is updated on every merge to reflect the latest activity.

---

## Mobile App Consumption

### 1. Query User's Chat Threads

**Collection:** `chats`  
**Filter:** `where('participants', 'array-contains', userId)` or `where('buyerId', '==', userId)`  
**Sort:** `orderBy('lastTimestamp', 'desc')`

#### Example: Flutter Implementation

```dart
import 'package:cloud_firestore/cloud_firestore.dart';

Future<Stream<QuerySnapshot>> getUserChats(String userId) async {
  return FirebaseFirestore.instance
    .collection('chats')
    .where('participants', arrayContains: userId)
    .orderBy('lastTimestamp', descending: true)
    .snapshots();
}
```

#### Example: React Native Implementation

```javascript
import firestore from '@react-native-firebase/firestore';

const userChatsQuery = firestore()
  .collection('chats')
  .where('participants', 'array-contains', userId)
  .orderBy('lastTimestamp', 'desc')
  .onSnapshot(snapshot => {
    // Handle chat list updates
  });
```

### 2. Subscribe to Messages for a Chat

**Collection:** `chats/{chatId}/messages`  
**Sort:** `orderBy('createdAt', 'asc')`

#### Example: Flutter Implementation

```dart
Future<Stream<QuerySnapshot>> getChatMessages(String chatId) async {
  return FirebaseFirestore.instance
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('createdAt')
    .snapshots();
}
```

### 3. Mark Messages as Read

Update message document with `arrayUnion(userId)` into `readBy` when the user views the message.

#### Example: Flutter Implementation

```dart
Future<void> markMessageAsRead(String chatId, String messageId, String userId) async {
  await FirebaseFirestore.instance
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .doc(messageId)
    .update({
      'readBy': FieldValue.arrayUnion([userId])
    });
}
```

**Optional:** Update parent `chats` document with `lastReadAt_{userId}` and `unreadCount_{userId}` for unread badges.

### 4. Deep Linking

**Product Warnings:**
- Deep link format: `app://products/{productId}`
- The chat message also carries `productId` and `productName` for in-app navigation
- Fallback: If product is deleted, show appropriate error message in chat

**User Warnings:**
- Deep link format: `app://warnings/{warningId}`
- If `relatedProductId` exists, optionally link to product detail
- Handle cases where related product may be deleted

#### Example Deep Link Handling

```dart
void handleDeepLink(String deepLink) {
  final uri = Uri.parse(deepLink);
  
  if (uri.scheme == 'app') {
    switch (uri.host) {
      case 'products':
        navigateToProduct(uri.pathSegments[0]);
        break;
      case 'warnings':
        navigateToWarning(uri.pathSegments[0]);
        break;
      default:
        break;
    }
  }
}
```

---

## Message Types Reference

| Type | Chat ID Pattern | File Location | Special Fields | Use Case |
|------|----------------|---------------|----------------|----------|
| `product_warning` | `agriconnect_warning_{productId}_{sellerId}` | `products.js` | `issues[]`, `productId`, `productName` | Product listing issues |
| `user_warning` | `admin_chat_{userId}` | `users.js` | `title`, `relatedProductId` | User account/behavior warnings |

---

## Unread Counts

### Recommended Pattern

- Use `readBy` on each message to track read status
- Unread for a user = messages where `readBy` does not contain `userId`
- For performance, cache an `unreadCount_{userId}` on the `chats` document

### Implementation Approaches

#### Client-Side Updates (Suitable for small apps)

```javascript
// Update unread count when marking message as read
await updateDoc(doc(db, 'chats', chatId), {
  [`unreadCount_${userId}`]: increment(-1)
});
```

**Pros:** Simple, immediate  
**Cons:** Not atomic, may conflict with concurrent updates

#### Cloud Functions (Recommended for production)

```javascript
// cloud-functions/markMessageRead.js
exports.markMessageRead = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Check if userId was added to readBy
    const userId = context.auth?.uid;
    if (userId && !oldData.readBy?.includes(userId) && newData.readBy?.includes(userId)) {
      // Decrement unread count atomically
      return admin.firestore()
        .doc(`chats/${context.params.chatId}`)
        .update({
          [`unreadCount_${userId}`]: admin.firestore.FieldValue.increment(-1)
        });
    }
    
    return null;
  });
```

**Pros:** Atomic, reliable, handles race conditions  
**Cons:** Requires Cloud Functions setup, slight latency

### Firestore Indexes Required

```javascript
// Required composite index
{
  collectionGroup: 'messages',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'createdAt', order: 'ASCENDING' }
  ]
}
```

### Performance Considerations

- For chats with < 100 messages: Query `readBy` array directly
- For chats with > 100 messages: Use cached `unreadCount_{userId}`
- Maximum recommended messages per chat: 500
- Consider archiving old messages to a separate collection

---

## Security Rules

### Requirements

- Users may read chats where `participants` contains their uid
- Users may read messages under chats they participate in
- Only privileged contexts (admin/Cloud Functions) may write `system: true` messages or set `isAdminChat`

### Complete Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check admin role
    function isAdmin(auth) {
      // Option 1: Using custom claims (recommended for production)
      return auth.token.admin == true;
      
      // Option 2: Check in Firestore users collection
      // return get(/databases/$(database)/documents/users/$(auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is participant
    function isParticipant(chatData) {
      return request.auth != null && 
             request.auth.uid in chatData.participants;
    }
    
    match /chats/{chatId} {
      // Read: Users can read chats they participate in
      allow read: if isParticipant(resource.data);
      
      // Create/Update: Admins can create system chats, or users can create non-system chats they participate in
      allow create, update: if (
        // Admin can do anything
        isAdmin(request.auth) ||
        // Non-admin can only create/update non-system chats where they are a participant
        (
          request.resource.data.isAdminChat != true &&
          request.auth.uid in request.resource.data.participants
        )
      );
      
      // Subcollection: messages
      match /messages/{messageId} {
        // Read: Users can read messages in chats they participate in
        allow read: if isParticipant(get(/databases/$(database)/documents/chats/$(chatId)).data);
        
        // Create: Admins can create system messages, or users can create non-system messages in chats they participate in
        allow create: if request.auth != null && (
          (
            request.resource.data.system == true &&
            isAdmin(request.auth)
          ) ||
          (
            request.resource.data.system != true &&
            request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
          )
        );
        
        // Update: Only users can update their own messages (mark as read, etc.)
        // System messages cannot be updated
        allow update: if request.auth != null && (
          resource.data.system != true &&
          request.auth.uid == resource.data.senderId
        );
      }
    }
  }
}
```

**Important Notes:**
- Custom claims require Firebase Authentication Admin SDK to set
- Firestore Rules have a 10-document read limit per rule (consider using `get()` carefully)
- Test rules thoroughly in the Firebase Console Rules Playground before deploying

---

## Error Handling

### Common Error Scenarios

#### 1. Invalid User ID

**Problem:** `sellerId` or `userId` doesn't exist in `users` collection

**Handling:**
```javascript
async function sendSystemChatMessageWithValidation(sellerId, ...args) {
  try {
    // Validate user exists before creating chat
    const userRef = doc(db, 'users', sellerId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error(`User ${sellerId} not found`);
    }
    
    // Proceed with chat creation
    await sendSystemChatMessageToSellerOnProductWarning(sellerId, ...args);
  } catch (error) {
    console.error('Failed to send chat message:', error);
    // Log to error tracking service (e.g., Sentry, Cloud Logging)
    // Alert admin of failure
  }
}
```

#### 2. Network Failure

**Problem:** Firestore write fails due to network issues

**Handling:**
```javascript
async function sendWithRetry(operation, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        if (attempt >= maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

#### 3. Partial Write Failure

**Problem:** Chat document created but message creation fails

**Handling:**
```javascript
async function sendSystemChatMessageAtomic(sellerId, productId, productName, ...args) {
  const batch = writeBatch(db);
  
  try {
    const chatId = `agriconnect_warning_${productId}_${sellerId}`;
    const chatRef = doc(collection(db, 'chats'), chatId);
    const messageRef = doc(collection(chatRef, 'messages'));
    
    // Prepare both writes in batch
    batch.set(chatRef, {
      chatId: chatId,
      buyerId: sellerId,
      isAdminChat: true,
      participants: [sellerId],
      productId: productId,
      productName: productName,
      lastMessage: `⚠️ ${productName}: ${args[0]}`,
      lastSenderId: 'AGRICONNECT_SYSTEM',
      lastTimestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      deletedBy: null
    }, { merge: true });
    
    batch.set(messageRef, {
      type: 'product_warning',
      system: true,
      text: args[0],
      productId: productId,
      productName: productName,
      category: args[1],
      severity: args[2],
      issues: args[3] || [],
      senderId: 'AGRICONNECT_SYSTEM',
      senderName: 'AGRICONNECT_SYSTEM',
      createdAt: serverTimestamp(),
      readBy: []
    });
    
    // Commit atomically
    await batch.commit();
  } catch (error) {
    console.error('Failed to send chat message atomically:', error);
    throw error;
  }
}
```

#### 4. Concurrent Writes

**Problem:** Multiple admins warn the same user simultaneously

**Handling:** Firestore handles this naturally with `merge: true`. Only `lastTimestamp` and `lastMessage` will be updated with the latest write. Consider adding:
- `lastWarningById`: track which admin issued the most recent warning
- `warningHistory`: append-only array to preserve all warnings

### Logging Recommendations

```javascript
// Comprehensive error logging
async function sendSystemChatMessageWithLogging(sellerId, productId, ...args) {
  const logContext = {
    sellerId,
    productId,
    timestamp: new Date().toISOString(),
    adminId: auth.currentUser?.uid
  };
  
  try {
    await sendSystemChatMessageToSellerOnProductWarning(sellerId, productId, ...args);
    
    // Success log
    console.log('Chat message sent successfully', logContext);
    
  } catch (error) {
    // Error log with full context
    const errorLog = {
      ...logContext,
      error: error.message,
      stack: error.stack,
      code: error.code
    };
    
    console.error('Failed to send chat message', errorLog);
    
    // Send to error tracking service
    // Sentry.captureException(error, { extra: errorLog });
    
    // Re-throw to allow UI to handle
    throw error;
  }
}
```

---

## Testing Recommendations

### Unit Tests

#### Test Chat Creation

```javascript
describe('sendSystemChatMessageToSellerOnProductWarning', () => {
  it('creates chat with correct structure', async () => {
    const sellerId = 'seller123';
    const productId = 'product456';
    const productName = 'Test Product';
    
    await sendSystemChatMessageToSellerOnProductWarning(
      sellerId,
      productId,
      productName,
      'Test message',
      'overpriced',
      'medium',
      ['price']
    );
    
    const chatId = `agriconnect_warning_${productId}_${sellerId}`;
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    expect(chatDoc.exists()).toBe(true);
    expect(chatDoc.data().buyerId).toBe(sellerId);
    expect(chatDoc.data().productId).toBe(productId);
    expect(chatDoc.data().isAdminChat).toBe(true);
  });
  
  it('updates existing chat on second warning', async () => {
    // Send first warning
    await sendSystemChatMessageToSellerOnProductWarning(...);
    
    // Send second warning
    await sendSystemChatMessageToSellerOnProductWarning(...);
    
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    // Should only have one chat document
    const chatSnapshot = await getDocs(collection(db, 'chats'));
    const matchingChats = chatSnapshot.docs.filter(doc => doc.id === chatId);
    expect(matchingChats.length).toBe(1);
  });
});
```

#### Test Message Structure

```javascript
it('creates message with all required fields', async () => {
  await sendSystemChatMessageToSellerOnProductWarning(...);
  
  const messagesSnapshot = await getDocs(
    collection(db, 'chats', chatId, 'messages')
  );
  
  const message = messagesSnapshot.docs[0].data();
  expect(message.type).toBe('product_warning');
  expect(message.system).toBe(true);
  expect(message.severity).toBe('medium');
  expect(Array.isArray(message.issues)).toBe(true);
});
```

### Integration Tests

#### Test Full Warning Flow

```javascript
describe('Full Product Warning Flow', () => {
  it('completes all steps: warning + notification + chat', async () => {
    // 1. Create product warning
    const warningRef = await addDoc(collection(db, 'product_warnings'), warningData);
    
    // 2. Create notification
    const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
    
    // 3. Send chat message
    await sendSystemChatMessageToSellerOnProductWarning(...);
    
    // 4. Verify all three were created
    expect(warningRef.id).toBeDefined();
    expect(notificationRef.id).toBeDefined();
    
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    expect(chatDoc.exists()).toBe(true);
  });
});
```

### Manual Testing Checklist

#### Verify in Firestore Console

- [ ] Chat document created with correct ID pattern
- [ ] All chat fields populated correctly
- [ ] Message subcollection created under chat
- [ ] Message fields populated correctly
- [ ] `createdAt` is server timestamp (not client time)
- [ ] `lastTimestamp` updates on subsequent warnings
- [ ] Participants array contains correct user ID

#### Verify in Mobile App

- [ ] Chat appears in user's chat list
- [ ] Chat is sorted by `lastTimestamp` correctly
- [ ] Message displays with correct warning content
- [ ] Unread count updates when message is read
- [ ] Deep link navigates to correct screen
- [ ] Multiple warnings to same product show in same chat thread

### Performance Tests

```javascript
describe('Performance', () => {
  it('creates chat within acceptable time', async () => {
    const startTime = Date.now();
    
    await sendSystemChatMessageToSellerOnProductWarning(...);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000); // 2 seconds max
  });
  
  it('handles 100 concurrent warning messages', async () => {
    const promises = Array(100).fill(null).map(() =>
      sendSystemChatMessageToSellerOnProductWarning(...)
    );
    
    await expect(Promise.all(promises)).resolves.not.toThrow();
  });
});
```

---

## Troubleshooting

### Mobile App Does Not Show Chat Thread

**Checklist:**

1. **Participants Array**
   - Verify `participants` array contains the intended userId
   - Check for typos or extra whitespace in user ID
   - Ensure user ID matches exactly between collections

2. **Timestamp**
   - Confirm `lastTimestamp` is set (required for sorting)
   - Verify timestamps are server-generated via `serverTimestamp()`
   - Check for timezone issues

3. **Security Rules**
   - Verify rules allow the user to read the chat and messages
   - Test rules in Firebase Console Rules Playground
   - Check for missing indexes

4. **Query Logic**
   - Ensure mobile app is using correct query filters
   - Verify `orderBy` clause matches a defined index
   - Check for query limits or pagination issues

5. **Chat ID Format**
   - Verify chat ID follows expected pattern
   - Check for special characters in productId or sellerId
   - Ensure no collisions with other chat IDs

### Messages Not Appearing in Chat

**Possible Causes:**

- `createdAt` not set or invalid
- Missing sort order in query (`orderBy('createdAt', 'asc')`)
- Security rules blocking message reads
- Firestore offline persistence not synced

### Unread Count Incorrect

**Possible Causes:**

- Race condition with concurrent reads
- `readBy` array not updated atomically
- Cached count out of sync (if using Cloud Functions)
- User ID mismatch in `readBy` array

### Performance Issues

**Symptoms:** Slow chat list loading, high Firestore read costs

**Solutions:**

- Implement pagination for large message lists
- Use composite indexes for complex queries
- Cache unread counts on chat documents
- Consider archiving old messages
- Limit query results with `.limit()`

### Migration Considerations

#### Schema Changes

**Adding New Fields:**

✅ **Safe (Non-Breaking):**
- Adding optional fields to chat documents
- Adding optional fields to message documents
- These won't affect existing data

❌ **Breaking:**
- Changing chat ID format (requires migration script)
- Removing required fields
- Changing field types

**Example Migration for Chat ID Change:**

```javascript
// Migration script to rename chat IDs
async function migrateChatIds() {
  const batch = writeBatch(db);
  const snapshot = await getDocs(collection(db, 'chats'));
  let batchCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const oldId = docSnap.id;
    const newId = oldId.replace('agriconnect_user_warning_', 'admin_chat_');
    
    if (oldId !== newId) {
      const newRef = doc(collection(db, 'chats'), newId);
      batch.set(newRef, docSnap.data());
      batch.delete(doc(db, 'chats', oldId));
      batchCount++;
      
      if (batchCount === 500) {
        await batch.commit();
        batchCount = 0;
      }
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
}
```

#### Handling Existing Chats

- Existing chats without new fields will work fine (merge behavior)
- Optional fields can be added gradually
- Use `merge: true` to preserve existing data

---

## Extending the Pattern

### Additional Message Types

You can extend the pattern to support additional message types:

#### Product Deletion Message

```javascript
// Add to chats/{chatId}/messages
{
  type: "product_deleted",
  system: true,
  text: "Your product has been removed",
  productId: "...",
  productName: "...",
  reason: "...",
  deletedAt: serverTimestamp(),
  senderId: "AGRICONNECT_SYSTEM",
  senderName: "AGRICONNECT_SYSTEM",
  createdAt: serverTimestamp(),
  readBy: []
}
```

#### Account Suspension Message

```javascript
// Add to chats/admin_chat_{userId}/messages
{
  type: "account_suspended",
  system: true,
  text: "Your account has been suspended",
  suspendedUntil: serverTimestamp(),
  reason: "...",
  senderId: "AGRICONNECT_SYSTEM",
  senderName: "AGRICONNECT_SYSTEM",
  createdAt: serverTimestamp(),
  readBy: []
}
```

### Multi-Participant Admin Chats

For chat rooms with multiple admins and one user:

```javascript
{
  chatId: "support_chat_user123",
  participants: ["user123", "admin1", "admin2"],
  isAdminChat: true,
  lastSenderId: "admin1",
  // ... other fields
}
```

**Security Rules Adaptation:**

```javascript
allow read: if request.auth != null && 
            request.auth.uid in resource.data.participants;

allow create, update: if request.auth != null && (
  isAdmin(request.auth) ||
  request.auth.uid in request.resource.data.participants
);
```

---

## Summary

This guide documents the complete chat integration system for admin-triggered messages. Key points:

- **Two chat types:** Product warnings and user warnings use different chat ID patterns
- **Merge strategy:** `merge: true` preserves existing data while updating metadata
- **Security:** Tight rules ensure only participants can read chats
- **Scalability:** Use Cloud Functions for unread count management at scale
- **Testing:** Comprehensive unit, integration, and performance tests recommended
- **Extensibility:** Pattern can be extended for additional message types

For related documentation, see:
- [USER_WARNING_SYSTEM_GUIDE.md](./USER_WARNING_SYSTEM_GUIDE.md)
- [FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md)
- [FIRESTORE_RULES_UPDATE_GUIDE.md](./FIRESTORE_RULES_UPDATE_GUIDE.md)
