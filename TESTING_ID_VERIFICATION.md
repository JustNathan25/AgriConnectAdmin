# Testing the ID Verification Feature

## Quick Start Guide

### Step 1: Add Test Data to Firestore

To test the new ID verification feature, add the following fields to a user document in your Firebase Firestore `users` collection:

```javascript
{
  // Existing user fields
  displayName: "John Doe",
  email: "john.doe@example.com",
  profileImage: "https://example.com/profile.jpg",
  verificationStatus: "pending",
  verificationRequestDate: new Date(),
  
  // NEW: ID Verification fields
  identificationType: "Driver's License",
  idFrontImage: "https://example.com/id-front.jpg",
  idBackImage: "https://example.com/id-back.jpg",
  userFaceImage: "https://example.com/selfie.jpg"
}
```

### Step 2: View the Feature

1. Open the admin panel
2. Navigate to **Pending Verifications** page
3. You should see verification cards with a new **🆔 View ID** button
4. Click the button to open the ID verification modal

### Step 3: Test Modal Features

The modal should display:
- ✅ User's profile picture, name, and email
- ✅ ID Type (e.g., "Driver's License")
- ✅ ID Front image with download button
- ✅ ID Back image with download button
- ✅ User Selfie image with download button

### Step 4: Test Modal Interactions

Try the following:
- ✅ Click the X button to close
- ✅ Click the "Close" button at bottom
- ✅ Click outside the modal (on overlay) to close
- ✅ Press ESC key to close
- ✅ Click download buttons to open images in new tab
- ✅ Hover over images to see zoom effect

### Step 5: Test Responsive Design

Resize your browser window or test on different devices:
- ✅ Desktop (1920x1080): 3-column grid layout
- ✅ Tablet (768px): 2-column grid layout
- ✅ Mobile (375px): Single column, full screen modal

## Sample Firestore Data Structure

### Example 1: Complete Verification Data
```json
{
  "displayName": "Maria Garcia",
  "email": "maria.garcia@example.com",
  "profileImage": "https://i.pravatar.cc/150?img=1",
  "phone": "+1-555-0123",
  "location": "California, USA",
  "verificationStatus": "pending",
  "verificationRequestDate": "2025-10-24T10:00:00Z",
  "identificationType": "Passport",
  "idFrontImage": "https://via.placeholder.com/600x400/667eea/ffffff?text=Passport+Front",
  "idBackImage": "https://via.placeholder.com/600x400/764ba2/ffffff?text=Passport+Back",
  "userFaceImage": "https://i.pravatar.cc/400?img=1",
  "totalProducts": 15
}
```

### Example 2: Missing Some Images (Test Error Handling)
```json
{
  "displayName": "John Smith",
  "email": "john.smith@example.com",
  "verificationStatus": "pending",
  "identificationType": "National ID",
  "idFrontImage": "https://via.placeholder.com/600x400/4facfe/ffffff?text=ID+Front",
  "idBackImage": "",
  "userFaceImage": ""
}
```
This will show placeholders for missing images.

### Example 3: Different ID Types to Test
```javascript
// Driver's License
identificationType: "Driver's License"

// Passport
identificationType: "Passport"

// National ID
identificationType: "National ID"

// Government ID
identificationType: "Government ID"

// Other
identificationType: "Other Official ID"
```

## Using Placeholder Images for Testing

If you don't have real ID images, use these placeholder services:

```javascript
// Placeholder ID images
idFrontImage: "https://via.placeholder.com/600x400/667eea/ffffff?text=ID+Front+Side"
idBackImage: "https://via.placeholder.com/600x400/764ba2/ffffff?text=ID+Back+Side"

// Placeholder profile/selfie images
userFaceImage: "https://i.pravatar.cc/400?img=5"
profileImage: "https://i.pravatar.cc/150?img=5"
```

## Firebase Console Steps

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to `users` collection
5. Select a user document (or create new one)
6. Click **Add field** or **Edit document**
7. Add the required fields:
   - `identificationType` (string)
   - `idFrontImage` (string - URL)
   - `idBackImage` (string - URL)
   - `userFaceImage` (string - URL)
8. Save the document

## Expected Behavior

### When Images Load Successfully:
- Images display in proper containers
- Hover effect shows slight zoom
- Download buttons work correctly
- Images maintain aspect ratio

### When Images Fail or Missing:
- Shows red dashed border placeholder
- Displays "❌ No [image type] uploaded" message
- Download button is hidden
- No console errors

### All Verification Statuses:
The "🆔 View ID" button appears for:
- ⏳ **Pending** verifications
- ✅ **Approved** verifications
- ❌ **Rejected** verifications

## Troubleshooting

### Modal doesn't open:
- Check browser console for errors
- Verify user data exists in `allVerifications` array
- Ensure user has an ID in Firestore

### Images don't load:
- Verify URLs are valid and accessible
- Check CORS settings on image hosting
- Open browser DevTools Network tab to see failed requests
- Try placeholder images first

### Styling looks wrong:
- Clear browser cache
- Check if CSS file is loaded properly
- Verify no CSS conflicts with other styles
- Test in incognito/private mode

## Demo Data Script

You can use this script in Firebase Console to quickly add test data:

```javascript
// Run in Firebase Console > Firestore > Query Editor
const testUser = {
  displayName: "Test Seller",
  email: "test@seller.com",
  profileImage: "https://i.pravatar.cc/150?img=10",
  phone: "+1-555-9999",
  location: "Test City, USA",
  verificationStatus: "pending",
  verificationRequestDate: new Date(),
  identificationType: "Driver's License",
  idFrontImage: "https://via.placeholder.com/600x400/667eea/ffffff?text=Driver+License+Front",
  idBackImage: "https://via.placeholder.com/600x400/764ba2/ffffff?text=Driver+License+Back",
  userFaceImage: "https://i.pravatar.cc/400?img=10",
  totalProducts: 8,
  role: "seller"
};

// Add to users collection
db.collection('users').add(testUser);
```

## Success Criteria

✅ "View ID" button appears on all verification cards  
✅ Modal opens when button is clicked  
✅ All three image sections display correctly  
✅ ID Type is shown prominently  
✅ User information displays correctly  
✅ Download buttons work (open images in new tab)  
✅ Modal can be closed multiple ways  
✅ Responsive on mobile devices  
✅ No console errors  
✅ Smooth animations when opening/closing  

## Next Steps After Testing

1. Test with real user verification data
2. Train admin team on how to use the feature
3. Document acceptance/rejection criteria
4. Set up image storage policies
5. Consider adding image validation rules
6. Monitor performance with large images

---

**Happy Testing!** 🎉

