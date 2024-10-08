import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, updateProfile, updateEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL  } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { doc, setDoc, getDoc, getDocs, collection, FieldValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

   // Insecurly CONFIG
   const firebaseConfig = {
    apiKey: "AIzaSyD9E3RbY5Jew5Xa_o5JuYzLwWLGDonFGB0",
    authDomain: "insecurly.firebaseapp.com",
    databaseURL: "https://insecurly-default-rtdb.firebaseio.com",
    projectId: "insecurly",
    storageBucket: "insecurly.appspot.com",
    messagingSenderId: "720308147008",
    appId: "1:720308147008:web:1965bbaee381b55fe620a5",
    measurementId: "G-L1KYG6M7WZ"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage(app);
const db = getFirestore(app);

// Your existing HTML elements
const profilePictureForm = document.getElementById("profile-picture-form");
const profilePictureInput = document.getElementById("profile-picture-input");
const profilePicturePreviewImage = document.getElementById("profile-picture-preview-image");
const userUsername = document.getElementById("user-username");
const userProfilePicture = document.getElementById("user-profile-picture");
const profileSettingsForm = document.getElementById("profile-settings-form");
const newUsernameInput = document.getElementById("new-username");
const newEmailInput = document.getElementById("new-email");
const HomeOption = document.getElementById("home-option");
const CommunityOption = document.getElementById("community-option");
const newBioInput = document.getElementById("new-bio");
const forbiddenUsernames = ["Guest", "null"]; // Banned Accounts From Changing Settings

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (forbiddenUsernames.includes(user.displayName)) {
      window.location.href = "/restricted";
      return;
    }

    userUsername.textContent = user.displayName || "User";
    userProfilePicture.src = user.photoURL || "/Image Assets/default-pfp.png";

    profilePictureInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          profilePicturePreviewImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    profilePictureForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const file = profilePictureInput.files[0];
      if (file) {
        try {
          const storageRef = ref(storage, `profile-pictures/${user.uid}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          await updateProfile(auth.currentUser, {
            photoURL: downloadURL,
          });
          window.location.href = "/@insecurly/settings";
          console.log("Profile picture updated successfully!");
        } catch (error) {
          console.error("Error updating profile picture:", error);
        }
      }
    });

    // Limit username changes to one per account
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.usernameChangeCount >= 1) {
        newUsernameInput.disabled = true;
        document.getElementById("username-error").textContent = "You Have Reached The Maximum Username Changeing Limit.";
      }
    }

    newUsernameInput.addEventListener("blur", async () => {
if (!newUsernameInput.disabled) {
const newUsername = newUsernameInput.value.trim().toLowerCase();
const querySnapshot = await getDocs(collection(db, "users"));
const usernames = querySnapshot.docs.map((doc) => doc.data().Username.toLowerCase());

if (usernames.includes(newUsername.toLowerCase())) {
  document.getElementById("username-error").textContent = "Username is already taken.";
  newUsernameInput.value = ""; // Clear the input field
} else {
  document.getElementById("username-error").textContent = "";
}
}
});


    profileSettingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newUsername = newUsernameInput.value.trim().toLowerCase();
      const newEmail = newEmailInput.value.trim();
      const newBio = newBioInput.value; // Get the bio value

       // Check if the username is already taken
const querySnapshot = await getDocs(collection(db, "users"));
const usernames = querySnapshot.docs.map((doc) => doc.data().Username.toLowerCase());

if (usernames.includes(newUsername.toLowerCase())) {
document.getElementById("username-error").textContent = "Username is already taken.";
return; // Don't proceed with the form submission
}

      try {
        // Check if the Firestore document for the user already exists
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.error("User document does not exist. Cannot update.");
          console.log(auth.currentUser.uid);
          return; // You can add proper error handling here
        }

        // Update user profile with new username and email
        if (newUsername.length > 0) {
          await updateProfile(auth.currentUser, {
            displayName: newUsername,
          });
        }

        if (newEmail.length > 0) {
          await updateEmail(auth.currentUser, newEmail);
        }

        // Update the existing user document in Firestore
        const existingData = userDoc.data();

        if (newUsername.length > 0) {
          existingData.Username = newUsername;
          if (!existingData.usernameChangeCount) {
            existingData.usernameChangeCount = 1;
          } else {
            existingData.usernameChangeCount += 1;
          }
        }

        if (newEmail.length > 0) {
          existingData.email = newEmail;
        }

          // Set the bio in the Firestore document
         if (newBio.length > 0) {
         existingData.bio = newBio;
         }

        await setDoc(userDocRef, existingData);

        console.log("Profile updated successfully!");
        window.location.reload();
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    });

    // Redirect to Home page when clicked
    HomeOption.addEventListener("click", () => {
      window.location.href = "/home";
    });

    // Redirect to Community page when clicked
    CommunityOption.addEventListener("click", () => {
      window.location.href = "/community";
    });

    const logoutOption = document.getElementById("logout-option");
    // Logout when logout option is clicked
    logoutOption.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("User logged out.");
          window.location.href = "/auth"; // Redirect to the login page
        })
        .catch((error) => {
          console.error("Logout error:", error.message);
        });
    });
  } else {
    console.error("User not authenticated.");
    window.location.href = "/auth";
  }
});





// ACCOUNT DELETION CODE START
const customPopup = document.getElementById('custom-popup');
const confirmDeleteButton = document.getElementById('confirm-delete-button');
const cancelDeleteButton = document.getElementById('cancel-delete-button');
const deleteAccountButton = document.getElementById('delete-account-button');

function showCustomPopup() {
customPopup.style.display = 'block';
}

function hideCustomPopup() {
customPopup.style.display = 'none';
}

deleteAccountButton.addEventListener('click', (e) => {
e.preventDefault();
showCustomPopup();
});

confirmDeleteButton.addEventListener('click', () => {
// Assuming you have initialized Firebase Authentication
const user = auth.currentUser; // Get the current user

if (user) {
// Call the Firebase Authentication method to delete the user
user.delete()
  .then(() => {
    // User account deleted successfully
    console.log('Account deleted');
    alert('Your account has been successfully deleted.');
    // You can redirect the user or perform other actions as needed
    hideCustomPopup();
  })
  .catch((error) => {
    console.error('Error deleting the account:', error);
    alert('An error occurred while deleting your account. Please try again. | This Most Likely is because you need to Re-Login To Your Account Then Try To Delete Your Account Again.');
    hideCustomPopup();
  });
} else {
console.error('User not authenticated');
alert('An error occurred. Please try again later.');
hideCustomPopup();
}
});

cancelDeleteButton.addEventListener('click', () => {
hideCustomPopup();
});
// ACCOUNT DELETION CODE END


// Mute Profile Audio Code


const muteToggle = document.getElementById('mute-toggle');
const muteCheckbox = document.getElementById('mute-checkbox');

// Function to save the mute state in local storage
function saveMuteState(muted) {
localStorage.setItem('muteState', JSON.stringify(muted));
}

// Function to retrieve the mute state from local storage
function getMuteState() {
const savedState = localStorage.getItem('muteState');
return savedState ? JSON.parse(savedState) : false; // Default to false if no state is found
}

// Function to stop all Profile Sounds
function stopAllSounds() {

// Bla Bla Nothing Needed Here

}

// Add an event listener to the mute checkbox
muteCheckbox.addEventListener('change', () => {
const muted = muteCheckbox.checked; // Check if the checkbox is checked

// Mute or unmute sounds based on the 'muted' variable
if (muted) {
stopAllSounds();
} else {
  // idk
}

// Save the mute state in local storage
saveMuteState(muted);
});

// Set the initial mute state based on the saved state
const initialMuteState = getMuteState();
muteCheckbox.checked = initialMuteState;

// Call the change event on the mute checkbox to apply the initial state
muteCheckbox.dispatchEvent(new Event('change'));

// Modify the playCustomSoundK function
function playCustomSoundK() {
// Get the audio element
const customAudioK = document.getElementById('custom-audio-k');

// Check if the audio element exists and the mute state is not enabled, then play the sound
if (customAudioK && !muteCheckbox.checked) {
customAudioK.play();
}
}

// Modify the playCustomSoundkiro function
function playCustomSoundkiro() {
// Get the audio element
const customAudiokiro = document.getElementById('custom-audio-kiro');

// Check if the audio element exists and the mute state is not enabled, then play the sound
if (customAudiokiro && !muteCheckbox.checked) {
customAudiokiro.play();
}
}

// Modify the playCustomSoundXeno function
function playCustomSoundXeno() {
// Get the audio element
const customAudioxeno = document.getElementById('custom-audio-xeno');

// Check if the audio element exists and the mute state is not enabled, then play the sound
if (customAudioxeno && !muteCheckbox.checked) {
customAudioxeno.play();
}
}
