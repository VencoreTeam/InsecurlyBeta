import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

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
// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Reference to the Firebase Authentication service
const auth = getAuth();

const db = getFirestore();

const storage = getStorage(app);

onAuthStateChanged(auth, async (user) => {
  const userUsername = document.getElementById("user-username");
  const userProfilePicture = document.getElementById("user-profile-picture");
  const myProfileLink = document.getElementById("my-profile-link"); // New line
  const accountSettingsOption = document.getElementById("account-settings-option");
  const logoutOption = document.getElementById("logout-option");

  if (user) {

    // Check the "AccountActive" field in the Firestore document
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const isAccountActive = userDoc.data() && userDoc.data().AccountActive;

    if (!isAccountActive) {
      // If the account is not active, redirect to the "/disabled" page
      window.location.href = "/denied";
      return;
    }
    
    // User is logged in
    userUsername.textContent = user.displayName || "User";
    userProfilePicture.src = user.photoURL || "/Image Assets/default-pfp.png";

    accountSettingsOption.addEventListener("click", () => {
      window.location.href = "/settings/profile";
    });

    myProfileLink.addEventListener("click", () => {
      window.location.href = `/profile/?@=${user.displayName}`;
    });

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
    // User is not logged in
    window.location.href = "/auth"; // Redirect to the login page
  }
});

const leaderboard = document.getElementById('leaderboard');
    
    // Function to format coin balance with custom formatting
function formatCoinBalance(balance) {
   if (balance >= 1000000000000) {
       // Trillions: Display up to 2 decimal places if needed
       const trillions = (balance / 1000000000000).toFixed(2);
       return `${trillions}T`;
   } else if (balance >= 1000000000) {
       // Billions: Display up to 2 decimal places if needed
       const billions = (balance / 1000000000).toFixed(2);
       return `${billions}B`;
   } else if (balance >= 1000000) {
       // Millions: Display up to 2 decimal places if needed
       const millions = (balance / 1000000).toFixed(2);
       return `${millions}M`;
   } else {
       // Regular formatting for smaller numbers
       return balance;
   }
}

    // Fetch users and their coin balances
// Function to add ribbons to the top 3 users
function addRibbon(userPosition, listItem) {
   const ribbon = document.createElement('span');
   ribbon.classList.add('ribbon');
   ribbon.style.margin = '10px'; // Add space from the coin text
   ribbon.style.color = '#000'; // Set the ribbon text color to black
   ribbon.style.borderRadius = '10px'; // Set the border radius
   switch (userPosition) {
       case 1:
           ribbon.textContent = 'ㅤ🥇 Gold ㅤ';
           ribbon.style.backgroundColor = '#FFD700'; // Gold color
           break;
       case 2:
           ribbon.textContent = 'ㅤ🥈 Silver ㅤ';
           ribbon.style.backgroundColor = '#C0C0C0'; // Silver color
           break;
       case 3:
           ribbon.textContent = 'ㅤ 🥉 Bronze ㅤ';
           ribbon.style.backgroundColor = '#CD7F32'; // Bronze color
           break;
       default:
           break;
   }
   listItem.appendChild(ribbon);
}

// Fetch users and their coin balances
getDocs(collection(db, 'users'))
       .then(async (querySnapshot) => {
           const users = [];
           querySnapshot.forEach((doc) => {
               const userData = doc.data();
               users.push({ id: doc.id, ...userData });
           });

           users.sort((a, b) => b.coinBalance - a.coinBalance);

           for (let i = 0; i < 10 && i < users.length; i++) {
               const user = users[i];
               const listItem = document.createElement('li');
               const userImage = document.createElement('img');
               const usernameSpan = document.createElement('span');
               const positionSpan = document.createElement('span');

               const storageRef = ref(storage, `profile-pictures/${user.id}`);
               try {
                   const imageUrl = await getDownloadURL(storageRef);
                   userImage.src = imageUrl;
               } catch (error) {
                   userImage.src = '/Assets/Image Assets/default-pfp.png';
               }

               usernameSpan.textContent = `${user.Username || 'Anonymous'} - ${formatCoinBalance(user.coinBalance)} Coins`;

               positionSpan.textContent = `${i + 1}.`;
               positionSpan.style.marginRight = '5px';

               listItem.appendChild(positionSpan);
               listItem.appendChild(userImage);
               listItem.appendChild(usernameSpan);
               leaderboard.appendChild(listItem);

               if (i < 3) {
                   addRibbon(i + 1, listItem);
               }
           }
       })
       .catch((error) => {
           console.error('Error getting users:', error);
       });

       document.addEventListener('DOMContentLoaded', function() {
var closeSidebarButton = document.getElementById('close-sidebar');
var openSidebarButton = document.getElementById('open-sidebar');
var sidebar = document.getElementById('sidebar');
var mainContent = document.querySelector('.main-content');

closeSidebarButton.addEventListener('click', function() {
sidebar.style.bottom = '-100%'; // Hide the sidebar by moving it off-screen
openSidebarButton.style.display = 'block'; // Show the open button
mainContent.classList.remove('with-bottom-bar'); // Adjust main content padding
});

openSidebarButton.addEventListener('click', function() {
sidebar.style.bottom = '0'; // Show the sidebar
openSidebarButton.style.display = 'none'; // Hide the open button
mainContent.classList.add('with-bottom-bar'); // Adjust main content padding
});
});

async function changeUsername() {
  const userId = document.getElementById('userIdInput').value.trim();
  const newUsername = document.getElementById('newUsernameInput').value.trim();
  const messageElement = document.getElementById('usernameUpdateMessage');

  if (!userId || !newUsername) {
    messageElement.textContent = 'Please enter both User ID and new username.';
    return;
  }

  try {
    // Update the display name in Firebase Authentication
    await admin.auth().updateUser(userId, { displayName: newUsername });
    console.log('Username updated successfully in Firebase Authentication.');

    // Update the username field in the user document in Firestore
    await db.collection('users').doc(userId).update({
      Username: newUsername,
      username: newUsername
    });
    console.log('Username updated successfully in Firestore.');

    messageElement.textContent = 'Username updated successfully.';
  } catch (error) {
    console.error('Error updating username:', error);
    messageElement.textContent = 'An error occurred while updating the username.';
  }
}


    // Notifcations JS Code Start

    // Get the notification form element and status message element
    const notificationForm = document.getElementById('notification-form');
    const notificationText = document.getElementById('notification-text');
    const statusMessage = document.getElementById('status-message');

    notificationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const user = getAuth().currentUser;

      if (user) {
        const adminNotification = {
          text: notificationText.value,
          sender: user.displayName,
          timestamp: new Date().toLocaleString()
        };

        const notificationsCollection = collection(db, 'notifications');

        addDoc(notificationsCollection, adminNotification)
          .then(() => {
            notificationText.value = '';
            statusMessage.textContent = 'Notification sent successfully.';
          })
          .catch((error) => {
            console.error('Error sending notification:', error);
            statusMessage.textContent = 'Error sending notification.';
          });
      } else {
        statusMessage.textContent = 'You must be logged in as an admin to send notifications.';
      }
    });
// Notifcations JS Code End