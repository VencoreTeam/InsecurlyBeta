
// Constants
const defaultProfilePicture = 'https://chatster.drippysellers.repl.co/Image%20Assets/default-pfp.png'; // Default image path
// Firebase Configuration
const firebaseConfig = {
	apiKey: "AIzaSyDbVlcraw16y4Tn0An6WePlBnJhml1T4Cs",
	authDomain: "mysticleaks-b2f15.firebaseapp.com",
	databaseURL: "https://mysticleaks-b2f15-default-rtdb.firebaseio.com",
	projectId: "mysticleaks-b2f15",
	storageBucket: "mysticleaks-b2f15.appspot.com",
	messagingSenderId: "226213194326",
	appId: "1:226213194326:web:4eddf427262817708da9f7",
	measurementId: "G-3DGY7HKBQG"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const db = firebase.firestore();
// Emoji Mappings
const emojiMappings = {
	':)': '😊',
};
// Utility Functions
function escapeRegExp(string) {
	return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function formatTimestamp(timestamp) {
	const messageDate = new Date(timestamp);
	const today = new Date();
	if (messageDate.toDateString() === today.toDateString()) {
		// Message was sent today
		const hours = messageDate.getHours();
		const minutes = messageDate.getMinutes();
		const amOrPm = hours >= 12 ? "PM" : "AM";
		const formattedHours = hours % 12 || 12;
		const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
		return `Today at ${formattedHours}:${formattedMinutes} ${amOrPm}`;
	} else {
		// Message was sent on a different day
		const options = {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "numeric",
			hour12: true
		};
		return messageDate.toLocaleDateString(undefined, options);
	}
}

function handleEmojiReplacement() {
	const messageInput = document.getElementById("message-input");
	let message = messageInput.value;
	for (const [emoji, replacement] of Object.entries(emojiMappings)) {
		const regex = new RegExp(escapeRegExp(emoji), 'g');
		message = message.replace(regex, replacement);
	}
	messageInput.value = message;
}

function replaceTextWithLinksAndImages(text) {
	const urlRegex = /(https?:\/\/[^\s]+)/gi;
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.svg', '.heic', '.heif', '.ico'];
	const supportedImageTypes = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif'];
	// Function to check if URL is an image
	function isImageUrl(url) {
		return imageExtensions.some(ext => url.toLowerCase().includes(ext));
	}
	// Replace function to handle both URLs and image links
	return text.replace(urlRegex, function(url) {
		// If the URL is an image
		if (isImageUrl(url)) {
			const fileType = url.slice(-4).toLowerCase();
			if (supportedImageTypes.includes(fileType)) {
				// For supported image types, return the image tag
				return `<img src="${url}" alt="Image" width="100px" height="fit-content">`;
			} else {
				// For blacklisted image types, disable clicking
				return `<span style="color: red; cursor: not-allowed;">This File Type Has Been Removed As Its File Extension Is Blacklisted.</span>`;
			}
		}
		// If the URL is not an image, convert it into a clickable link
		return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
	});
}
// Event Listeners
const emojiToggle = document.getElementById("emoji-toggle");
emojiToggle.addEventListener("change", () => {
	const isEnabled = emojiToggle.checked;
	const messageInput = document.getElementById("message-input");
	if (isEnabled) {
		messageInput.addEventListener("input", handleEmojiReplacement);
		localStorage.setItem("emojiToggle", "enabled");
	} else {
		messageInput.removeEventListener("input", handleEmojiReplacement);
		localStorage.setItem("emojiToggle", "disabled");
	}
});
const storedToggleState = localStorage.getItem("emojiToggle");
if (storedToggleState === "enabled") {
	emojiToggle.checked = true;
	document.getElementById("message-input").addEventListener("input", handleEmojiReplacement);
} else {
	emojiToggle.checked = false;
	document.getElementById("message-input").removeEventListener("input", handleEmojiReplacement);
}

// Display Message Function
function displayMessage(username, message, timestamp, profilePicture, messageId, userId) {
	const chatMessages = document.getElementById("chat-messages");
	const messageDiv = document.createElement("div");
    const user = firebase.auth().currentUser; // Get the currently logged-in user
	messageDiv.id = messageId;
	profilePicture = profilePicture || defaultProfilePicture;
	message = replaceTextWithLinksAndImages(message);
	const formattedTimestamp = formatTimestamp(timestamp);
	// Process Message Content
	if (message.toLowerCase().includes("i hate furrys")) {
		message = message.replace(/i hate furrys/gi, "grr rawr uuw furry");
	}
	if (message.toLowerCase().includes("emoji:joibridge")) {
		const ImageUrl = '/StaticMedia/Emojis/joi-bridge.png';
		message = message.replace(/emoji:joibridge/gi, `<img src="${ImageUrl}" width="10%" height="fit-content" alt="Cool Image">`);
	}
	// Blacklisted Words
	const blacklistedWords = ["nigga", "anotherword", "yetanotherword"];
	for (const word of blacklistedWords) {
		const regex = new RegExp(word, 'gi');
		if (message.toLowerCase().includes(word)) {
			message = message.replace(regex, `Blacklisted Word: ${word}`);
		}
	}
	// User Status Badges
	function addBadge(className, text) {
		const badge = document.createElement("span");
		badge.className = className;
		badge.textContent = text;
		const usernameSpan = messageDiv.querySelector(".username");
		usernameSpan.appendChild(badge);
	}

	function checkUsernameVerification(username, callback) {
		db.collection("users").where("Username", "==", username).get().then(snapshot => callback(!snapshot.empty && snapshot.docs[0].data().UserVerified)).catch(
			error => {
				console.error("Error checking username verification:", error);
				callback(false);
			});
	}
	// Function to check if a username is Owner
	function checkUsernameOwner(username, callback) {
		// Implement your logic to check verified usernames in the Firebase Realtime Database
		// Here's a basic example:
		database.ref("OwnerUsers").child(username).once("value", (snapshot) => {
			callback(snapshot.exists());
		});
	}
	// Function to check if a username is Owner
	function checkUsernameDev(username, callback) {
		// Implement your logic to check verified usernames in the Firebase Realtime Database
		// Here's a basic example:
		database.ref("DevUsers").child(username).once("value", (snapshot) => {
			callback(snapshot.exists());
		});
	}
	// Function to check if a username is AI
	function checkUsernameAI(username, callback) {
		// Implement your logic to check AI usernames in the Firebase Realtime Database
		// Here's a basic example:
		database.ref("AIUsers").child(username).once("value", (snapshot) => {
			callback(snapshot.exists());
		});
	}
	// Function to check if a username is System
	function checkUsernameGuest(username, callback) {
		// Implement your logic to check System usernames in the Firebase Realtime Database
		// Here's a basic example:
		database.ref("GuestUsers").child(username).once("value", (snapshot) => {
			callback(snapshot.exists());
		});
	}

	function addBadge(className, textContent = '') {
		const usernameSpan = messageDiv.querySelector(".username");
		const badge = document.createElement("span");
		badge.className = className;
		if (textContent) badge.textContent = textContent;
		usernameSpan.appendChild(badge);
	}
	checkUsernameVerification(username, (isVerified) => {
		if (isVerified) addBadge("verified-badge");
	});
	checkUsernameOwner(username, (isOwner) => {
		if (isOwner) addBadge("owner-badge");
	});
	checkUsernameDev(username, (isDev) => {
		if (isDev) addBadge("dev-badge");
	});
	checkUsernameAI(username, (isAI) => {
		if (isAI) addBadge("special-badge", "✓ AI");
	});
	checkUsernameGuest(username, (isGuest) => {
		if (isGuest) addBadge("guest-badge", " - Guest");
	});
	// Create Message Content
	const messageOptions =
		`
      <div class="message-options">
          &nbsp; ${userId === firebase.auth().currentUser.uid ? '<button class="delete-button">Delete</button>' : ''}
          &nbsp; <button class="view-user-button">Profile</button>
          <button class="reply-button custom-icon">Reply</button>
          &nbsp; ${userId === firebase.auth().currentUser.uid ? '' : '<button class="report-button">Report</button>'}
          <br>
          &nbsp;
          </div>
          <div class="report-form" style="display: none;">
              <label for="report-reason">Why do you want to report this content?</label>
              <select id="report-reason" required>
                  <option value="Inappropriate Message">Inappropriate Message</option>
                  <option value="Spam">Spam Message</option>
                  <option value="Harassment To Me Or Other Users">Harassment</option>
              </select>
              <button class="report-submit">Submit Report</button>
              <button class="report-close">Cancel Report</button>
      </div>
    `;
	messageDiv.innerHTML =
		`
      <div class="message">
          <div class="user-info">
              <br><br>
              &nbsp; &nbsp; <img src="${profilePicture}" alt="Profile Picture">
              <span class="username">${username} </span>
              <span class="timestamp"> • ${formattedTimestamp}</span>
          </div>
          <div class="message-content">${message}</div>
          <br>
          <p id="loading-message" class="hover-text"> &nbsp; <img src="/StaticMedia/sent.png" width="10" height="10"><span class="timestamp"> Hover For Message Options</span></p>
          <br>
          ${messageOptions}
      </div>
    `;
	messageDiv.classList.add("message-container");
	// Event Listeners for Hover Effects
	chatMessages.addEventListener("mouseover", (event) => {
		const messageDiv = event.target.closest(".message-container");
		if (messageDiv) {
			const hoverText = messageDiv.querySelector(".hover-text");
			if (hoverText) {
				hoverText.classList.add("hide-hover-text");
			}
		}
	});
	chatMessages.addEventListener("mouseout", (event) => {
		const messageDiv = event.target.closest(".message-container");
		if (messageDiv) {
			const hoverText = messageDiv.querySelector(".hover-text");
			if (hoverText) {
				hoverText.classList.remove("hide-hover-text");
			}
		}
	});
	// Event Listeners for Buttons
	const reportButton = messageDiv.querySelector(".report-button");
	const reportForm = messageDiv.querySelector(".report-form");
	const reportCloseButton = messageDiv.querySelector(".report-close");
	const reportSubmitButton = messageDiv.querySelector(".report-submit");
	const deleteButton = messageDiv.querySelector(".delete-button");
	if (reportButton && reportForm && reportCloseButton && reportSubmitButton) {
		reportButton.addEventListener("click", () => {
			reportForm.style.display = "block";
		});
		reportCloseButton.addEventListener("click", () => {
			reportForm.style.display = "none";
		});
        const replyButton = messageDiv.querySelector(".reply-button");
        replyButton.addEventListener("click", () => {
            const messageInput = document.getElementById("message-input");
            messageInput.value = `Reply To @${username} • "${message}" → \u000A e`; // Prepend @username to the input
            messageInput.focus(); // Focus on the input for easy typing
        });    
        reportSubmitButton.addEventListener("click", () => {
            const reportReason = reportForm.querySelector("#report-reason").value;
    
            // Store the report in the "reports" collection
            const reportRef = database.ref("reports").push();
            reportRef.set({
                ReporterUserID: firebase.auth().currentUser.uid,
                ReporterUsername: firebase.auth().currentUser.displayName,
                reportReason: reportReason,
                ReportedMessageSenderUserID: userId,
                ReportedMessageSenderUsername: username,
                ReportedUserMessageID: messageId,
                ReportedMessage: message,
            });
    
            // Hide the report form after submission
            reportForm.style.display = "none";
            alert("Your report has been submitted")
        });
	}
    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            const currentUserId = user.uid; // Function to get the current user's ID
            const messageRef = database.ref("messages").child(messageId);
    
            // Check if the message belongs to the current user
            messageRef.once("value")
                .then(snapshot => {
                    const messageData = snapshot.val();
                    if (messageData && messageData.userId === currentUserId) {
                        // Confirm deletion
                        if (confirm("Are you sure you want to delete this message?")) {
                            messageRef.remove()
                                .then(() => {
                                    // Add fade-out class before removing
                                    messageDiv.classList.add('fade-out');
                                    // Wait for the animation to complete before removing the element
                                    setTimeout(() => {
                                        messageDiv.remove();
                                        console.log(`Message ${messageId} deleted`);
                                    }, 500); // Match the duration of the fade-out animation
                                })
                                .catch(error => {
                                    console.error("Error deleting message:", error);
                                });
                        }
                    } else {
                        console.log("You do not have permission to delete this message.");
                    }
                })
                .catch(error => {
                    console.error("Error retrieving message data:", error);
                });
        });
    }
    
    
	chatMessages.appendChild(messageDiv);
}
// Event listener for pressing Enter to send a message
document.getElementById("message-input").addEventListener("keydown", function(event) {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault(); // Prevent Enter from creating a new line
		document.getElementById("send-button").click(); // Simulate a click on the Send button
	}
});
// Event listener for sending a message
document.getElementById("send-button").addEventListener("click", () => {
	const messageInput = document.getElementById("message-input");
	const message = messageInput.value;
	const user = firebase.auth().currentUser;
	if (message.trim() !== "" && user) {
		const username = user.displayName;
		const profilePicture = user.photoURL;
		const timestamp = Date.now(); // Use the current timestamp
		// Check if the user is blacklisted
		checkBlacklist(username, (isBlacklisted) => {
			if (!isBlacklisted) {
				// Save the message to the Firebase Realtime Database
				const newMessageRef = database.ref("messages").push({
					username,
					message,
					timestamp,
					profilePicture,
					userId: user.uid
				});
				const messageId = newMessageRef.key;
				console.log("Message sent with ID:", messageId);
				messageInput.value = "";
			} else {
				// User is blacklisted, disable input and show a message
				messageInput.value = "";
				messageInput.disabled = true;
				document.getElementById("send-button").disabled = true;
				messageInput.placeholder = "ⓘ Error: You are blacklisted from messaging. (Error Code: BlacklistedUser)";
			}
		});
	} else {
		// Handle the case where the message is empty or the user is not authenticated
		if (message.trim() === "") {
			messageInput.placeholder = "ⓘ Error: Message cannot be empty.";
		} else if (!user) {
			messageInput.placeholder = "ⓘ Error: User not authenticated.";
		}
	}
});
// Function to check if the user is blacklisted
function checkBlacklist(username, callback) {
	const blacklistRef = database.ref("ChatBlacklist");
	blacklistRef.on("value", (snapshot) => {
		const blacklistData = snapshot.val();
		if (blacklistData && blacklistData[username]) {
			// The user is blacklisted, disable the send button
			const sendButton = document.getElementById("send-button");
			const messageInput = document.getElementById("message-input");
			const blacklistMessage = "";
			sendButton.disabled = true;
			messageInput.disabled = true;
			messageInput.placeholder = blacklistMessage;
		} else {
			// The user is not blacklisted, enable the send button
			const sendButton = document.getElementById("send-button");
			const messageInput = document.getElementById("message-input");
			sendButton.disabled = false;
			messageInput.disabled = false;
			messageInput.placeholder = "";
		}
		callback(!!blacklistData && !!blacklistData[username]);
	});
}
// Function to handle the emoji popup and sending the selected emoji
function openEmojiPopup() {
	const emojiPopup = document.getElementById("emoji-popup");
	emojiPopup.style.display = "block";
	// Add event listeners to each emoji image
	const emojiImages = emojiPopup.querySelectorAll('img');
	emojiImages.forEach((emojiImage) => {
		emojiImage.addEventListener('click', () => {
			const selectedEmoji = emojiImage.getAttribute('data-emoji');
			const messageInput = document.getElementById('message-input');
			messageInput.value += selectedEmoji; // Append the selected emoji to the message input
			emojiPopup.style.display = 'none'; // Close the emoji popup
		});
	});
	// Close button event listener
	const closeBtn = emojiPopup.querySelector('.close-btn');
	closeBtn.addEventListener('click', () => {
		emojiPopup.style.display = 'none';
	});
}
// Event listener for the message input
document.getElementById("message-input").addEventListener("input", function(event) {
	const messageInput = event.target.value.toLowerCase().trim();
	const emojiPopup = document.getElementById("emoji-popup");
	if (messageInput === "/emoji") {
		openEmojiPopup();
		event.target.value = ""; // Clear the message input after typing /emoji
	} else {
		emojiPopup.style.display = 'none'; // Close the emoji popup if /emoji is not entered
	}
});

// Additional function to display a pinned message with a close button
function displayPinnedMessage() {
    const chatMessagesContainer = document.getElementById("chat-messages");

    let pinnedMessageElement = document.getElementById("pinned-message");
    if (!pinnedMessageElement) {
        pinnedMessageElement = document.createElement("div");
        pinnedMessageElement.id = "pinned-message";
        pinnedMessageElement.classList.add("message", "pinned");
        chatMessagesContainer.insertBefore(pinnedMessageElement, chatMessagesContainer.firstChild);
    }

    // Example pinned message content (you should replace this with the actual content)
    const pinnedContent = {
        username: "Mystic Team ",
        message: "Welcome to Mystic Hub chat <b>Beta</b>.",
        timestamp: new Date().getTime(),
        profilePicture: "/StaticMedia/Content/darkanimegirl1.jpg"
    };

    const formattedTimestamp = formatTimestamp(pinnedContent.timestamp);

    // Create and append the close button to the pinned message
    const closeButton = document.createElement("button");
    closeButton.textContent = "✖";
    closeButton.className = "close-pinned";
    closeButton.textContent = "✖";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.border = "none";
    closeButton.style.background = "red";
    closeButton.style.color = "#fff";
    closeButton.style.cursor = "pointer";
    closeButton.style.outline = "none";
    closeButton.style.fontSize = "20px";

    closeButton.onclick = function() {
        pinnedMessageElement.remove();
    };

    // Set the innerHTML for the pinned message including the close button
    pinnedMessageElement.innerHTML = `
        <div class="user-info">
            <img src="${pinnedContent.profilePicture}" alt="Profile Picture" class="profile-picture">
            <span class="username">${pinnedContent.username} <span class="verified-badge" data-tooltip="Verified User">ㅤ</span></span>
            <span class="timestamp">${formattedTimestamp}</span>
        </div>
        <div class="message-content"><img src="/StaticMedia/Content/darkanimegirl4.jpg" width="20" height="20"> ${pinnedContent.message}</div>
    `;
    pinnedMessageElement.appendChild(closeButton);
}

// Call the function to display the pinned message
document.addEventListener('DOMContentLoaded', (event) => {
    displayPinnedMessage();
});


// Main Functionality
function loadMessages() {
	const messagesRef = database.ref('messages');
	messagesRef.on('child_added', (snapshot) => {
		const messageData = snapshot.val();
		displayMessage(messageData.username, messageData.message, messageData.timestamp, messageData.profilePicture, snapshot.key, messageData.userId);
	});
}
// Load Messages on Page Load
loadMessages();