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
const HomeOption = document.getElementById("home-option");
const CommunityOption = document.getElementById("community-option");
const newBioInput = document.getElementById("new-bio");
const newLinkInput = document.getElementById("new-link");
const forbiddenUsernames = ["Guest", "wavee", "null"]; // Banned Accounts From Changing Settings

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

    // Function to update profile picture
    const updateProfilePicture = async (file) => {
      if (file) {
        try {
          const storageRef = ref(storage, `profile-pictures/${user.uid}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          await updateProfile(auth.currentUser, {
            photoURL: downloadURL,
          });
          location.reload();
          console.log("Profile picture updated successfully!");
        } catch (error) {
          console.error("Error updating profile picture:", error);
        }
      }
    };

    // Update profile picture when form is submitted
    if (profilePictureForm) {
      profilePictureForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = profilePictureInput.files[0];
        await updateProfilePicture(file);
      });
    }

    // Update profile picture when file is selected (without form submission)
  //  profilePictureInput.addEventListener("change", async (e) => {
    //  const file = e.target.files[0];
     // await updateProfilePicture(file);
    // });

    // Limit username changes to one per account
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.usernameChangeCount >= 10) {
        newUsernameInput.disabled = true;
        document.getElementById("username-error").textContent = "Username change limit reached.";
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
      const newUsername = newUsernameInput ? newUsernameInput.value.trim().toLowerCase() : "";
      const newBio = newBioInput ? newBioInput.value : "";
      const newLink = newLinkInput ? newLinkInput.value : "";
      const newProfilePicture = profilePictureInput.files[0];

      // Check if the username is already taken
      if (newUsername) {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usernames = querySnapshot.docs.map((doc) => doc.data().Username.toLowerCase());

        if (usernames.includes(newUsername.toLowerCase())) {
          document.getElementById("username-error").textContent = "Username is already taken.";
          return; // Don't proceed with the form submission
        }
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

        // Update user profile with new username
        if (newUsername) {
          await updateProfile(auth.currentUser, {
            displayName: newUsername,
          });
        }
        
        // Update the existing user document in Firestore
        const existingData = userDoc.data();

        if (newUsername) {
          existingData.Username = newUsername;
          if (!existingData.usernameChangeCount) {
            existingData.usernameChangeCount = 1;
          } else {
            existingData.usernameChangeCount += 1;
          }
        }

        // Set the bio in the Firestore document
        if (newBio) {
          existingData.bio = newBio;
        }

        // Set the link in the Firestore document
        if (newLink) {
          existingData.link = newLink;
        }

        await setDoc(userDocRef, existingData);

        // Update profile picture if a new one is selected
        if (newProfilePicture) {
          await updateProfilePicture(newProfilePicture);
        }

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


// Function to display username in a span element
const displayUsername = () => {
  const usernameSpan = document.getElementById('username');
  if (usernameSpan) {
    usernameSpan.textContent = 'Loading username...';
    setTimeout(() => {
      usernameSpan.textContent = 'Hello, @' + (auth.currentUser?.displayName || 'User');
    }, 1000); // Delay of 1 second
  }
};

// Call the function when the auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    displayUsername();
  }
});




// Check for developer tools
// const isDevToolsOpen = () => {
   // const threshold = 160; // Speed Of SpamRefresh

   // if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
     // alert('Sorry, Due to privacy reasons you cannot access the developer console on this page. Please exit the developer console to use this page.');
     // location.reload();
   // }
  // };

 // setInterval(isDevToolsOpen, 1000);
