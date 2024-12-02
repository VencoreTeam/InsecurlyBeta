// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

let currentUser;
let selectedUser;
let unreadCounts = {};
let currentMessageListener = null;
let currentTypingListener = null;
let typingTimeout;
let isTyping = false;
let typingTimer;
const TYPING_TIMEOUT = 1000; // Time in ms to wait before considering user stopped typing
const MIN_TYPING_INTERVAL = 100; // Minimum time between keypresses to be considered typing
let lastKeypress = 0;

// DOM elements
const userList = document.getElementById('userList');
const chatHeader = document.getElementById('chatHeader');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const imageInput = document.getElementById('imageInput');
const cancelImageButton = document.getElementById('cancelImageButton');
const userListToggle = document.querySelector('.user-list-toggle');
const userListClose = document.querySelector('.user-list-close');
const userListElement = document.querySelector('.user-list');

// Sign in anonymously (for simplicity)
auth.signInAnonymously().catch((error) => {
    console.error("Error signing in:", error);
});

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUsers();
        setupTypingIndicator();
        
        // Load the previously selected user, if any
        const savedSelectedUser = localStorage.getItem('selectedUser');
        if (savedSelectedUser) {
            selectUser(savedSelectedUser);
        }
    }
});

function loadUsers() {
    db.collection('users').onSnapshot((snapshot) => {
        userList.innerHTML = `
            <li class="clear-storage" onclick="clearStorageAndRefresh()">
                <div class="user-avatar">
                    <i class="fas fa-trash"></i>
                </div>
                <div class="user-info">
                    <div class="username">Clear Chat History</div>
                    <div class="last-message">Reset selected user and refresh</div>
                </div>
            </li>
        `;
        
        snapshot.forEach((doc) => {
            if (doc.id !== currentUser.uid) {
                const li = document.createElement('li');
                li.dataset.userId = doc.id;
                li.onclick = () => selectUser(doc.id);
                
                // Create user avatar with loading state
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'user-avatar loading';
                
                // Try to fetch the profile picture
                fetchProfilePicture(doc.id)
                    .then(url => {
                        if (url) {
                            avatarDiv.innerHTML = `<img src="${url}" alt="Profile picture">`;
                        } else {
                            avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
                        }
                        avatarDiv.classList.remove('loading');
                    })
                    .catch(() => {
                        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
                        avatarDiv.classList.remove('loading');
                    });
                
                // Add verified and admin badges if user is admin
                const isAdmin = doc.data().isAdmin === true;
                const verifiedBadge = isAdmin ? '<i class="fas fa-check-circle verified-badge"></i>' : '';
                const adminBadge = isAdmin ? '<i class="fas fa-shield-alt admin-badge"></i>&nbsp;<span class="staff-text">Staff</span>' : '';
                
                li.innerHTML = `
                    <div class="user-info">
                        <div class="username">
                            ${doc.data().Username || 'Anonymous'}
                            ${verifiedBadge} &nbsp; ${adminBadge}
                        </div>
                        <div class="last-message">Click to start chatting</div>
                    </div>
                    <span class="unread-badge" style="display: none;"></span>
                `;
                
                li.insertBefore(avatarDiv, li.firstChild);
                userList.appendChild(li);
                
                setupUnreadMessagesListener(doc.id, li.querySelector('.unread-badge'));
            }
        });
        updateUserListSelection();
    });
}

function setupUnreadMessagesListener(userId, badgeElement) {
    const chatId = [currentUser.uid, userId].sort().join('_');
    db.collection('chats').doc(chatId).collection('messages')
        .where('sender', '==', userId)
        .where('read', '==', false)
        .onSnapshot((snapshot) => {
            let unreadCount = 0;
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' && 
                    !change.doc.data().suppressBubble && 
                    userId !== selectedUser) {
                    unreadCount++;
                } else if (change.type === 'removed') {
                    unreadCount--;
                }
            });
            unreadCounts[userId] = (unreadCounts[userId] || 0) + unreadCount;
            updateUnreadBadge(badgeElement, unreadCounts[userId]);
        });
}

function updateUnreadBadge(badgeElement, count) {
    console.log('Updating badge:', badgeElement, 'Count:', count); // Debug log
    if (count > 0) {
        badgeElement.textContent = count;
        badgeElement.style.display = 'inline';
    } else {
        badgeElement.style.display = 'none';
    }
}

function selectUser(userId) {
    if (window.innerWidth <= 768) {
        userListElement.classList.remove('active');
    }
    
    cleanup();
    
    db.collection('users').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const blockedUsers = userData.BlockedUsers || [];
            
            if (blockedUsers.includes(currentUser.uid)) {
                displayBlockedNotice(userId);
            } else {
                // Check if the current user has blocked this user
                const currentUserRef = db.collection('users').doc(currentUser.uid);
                currentUserRef.get().then((currentDoc) => {
                    const isBlocked = currentDoc.data()?.BlockedUsers?.includes(userId);
                    
                    if (isBlocked) {
                        displayBlockedByYouNotice(userId);
                    } else {
                        selectedUser = userId;
                        
                        const blockButton = `
                            <button class="block-button" onclick="showBlockModal('${userId}', ${isBlocked})">
                                <i class="fas ${isBlocked ? 'fa-user-check' : 'fa-user-slash'}"></i>
                                ${isBlocked ? 'Unblock' : 'Block'}
                            </button>
                        `;

                        // Add verified badge if user is admin
                        const isAdmin = doc.data().isAdmin === true;
                        const verifiedBadge = isAdmin ? '<i class="fas fa-check-circle verified-badge"></i>' : '';
                        const adminBadge = isAdmin ? '<i class="fas fa-shield-alt admin-badge"></i><span class="staff-text">Staff</span>' : '';
                        
                        chatHeader.innerHTML = `
                            <span style="justify-content: space-between;">
                                <i class="fas fa-user"></i> 
                                ${userData.Username || 'Anonymous'} 
                                ${verifiedBadge} 
                                ${adminBadge}
                            </span>
                            ${blockButton}
                        `;

                        // Add this line to mark messages as read when selecting a user
                        markMessagesAsRead(userId);

                        loadMessages();
                        
                        // Clear unread count for selected user
                        const chatId = [currentUser.uid, userId].sort().join('_');
                        db.collection('chats').doc(chatId).collection('messages')
                            .where('sender', '==', userId)
                            .where('read', '==', false)
                            .get()
                            .then((snapshot) => {
                                const batch = db.batch();
                                snapshot.docs.forEach((doc) => {
                                    batch.update(doc.ref, { read: true });
                                });
                                return batch.commit();
                            })
                            .then(() => {
                                unreadCounts[userId] = 0;
                                updateUnreadBadge(document.querySelector(`li[data-user-id="${userId}"] .unread-badge`), 0);
                            });
                        
                        localStorage.setItem('selectedUser', userId);
                        updateUserListSelection();
                        
                        messageInput.disabled = false;
                        sendButton.disabled = false;
                        imageInput.disabled = false;

                        // Show message input when chat is selected
                        document.querySelector('.message-input').classList.add('active');
                        
                        // Add typing indicator listener specific to this chat
                        currentTypingListener = db.collection('chats').doc(chatId)
                            .onSnapshot((doc) => {
                                if (doc.exists && doc.data()[`${userId}_typing`] === true) {
                                    // Get user data and update typing indicator
                                    db.collection('users').doc(userId).get()
                                        .then(userDoc => {
                                            if (userDoc.exists) {
                                                updateTypingIndicator(userId, userDoc.data(), true);
                                            }
                                        });
                                } else {
                                    // Remove typing indicator if user is not typing
                                    updateTypingIndicator(userId, null, false);
                                }
                            });
                    }
                });
            }
        } else {
            console.error("User document does not exist");
        }
    }).catch((error) => {
        console.error("Error getting user document:", error);
    });
}   

function showBlockModal(userId, isBlocked) {
    // Remove any existing modal
    const existingModal = document.querySelector('.block-modal');
    if (existingModal) existingModal.remove();
    
    db.collection('users').doc(userId).get().then((doc) => {
        const username = doc.data()?.Username || 'Anonymous';
        
        const modal = document.createElement('div');
        modal.className = 'block-modal';
        modal.innerHTML = `
            <div class="block-modal-content">
                <h3>${isBlocked ? 'Unblock' : 'Block'} User</h3>
                <p>Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${username}?</p>
                ${!isBlocked ? '<p class="block-warning">They will no longer be able to message you.</p>' : ''}
                <div class="block-modal-buttons">
                    <button class="cancel-block" onclick="this.closest('.block-modal').remove()">
                        Cancel
                    </button>
                    <button class="confirm-block" onclick="toggleBlockUser('${userId}', ${isBlocked})">
                        ${isBlocked ? 'Unblock' : 'Block'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    });
}

function toggleBlockUser(userId, isBlocked) {
    const userRef = db.collection('users').doc(currentUser.uid);
    
    userRef.get().then((doc) => {
        const blockedUsers = doc.data()?.BlockedUsers || [];
        let newBlockedUsers;
        
        if (isBlocked) {
            newBlockedUsers = blockedUsers.filter(id => id !== userId);
        } else {
            newBlockedUsers = [...blockedUsers, userId];
        }
        
        userRef.update({
            BlockedUsers: newBlockedUsers
        }).then(() => {
            // Update the UI
            document.querySelector('.block-modal')?.remove();
            selectUser(userId);
        });
    });
}

function updateUserListSelection() {
    const userItems = userList.querySelectorAll('li');
    userItems.forEach(li => {
        if (li.dataset.userId === selectedUser) {
            li.classList.add('selected-user');
        } else {
            li.classList.remove('selected-user');
        }
    });
}

function loadMessages() {
    cleanup();
    
    const chatId = [currentUser.uid, selectedUser].sort().join('_');
    
    currentMessageListener = db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            let hasMessages = false;
            
            // Process all changes in a single batch
            const changes = [];
            snapshot.docChanges().forEach(change => {
                changes.push(change);
            });

            // Sort changes by timestamp before processing
            changes.sort((a, b) => {
                const timeA = a.doc.data().timestamp?.toMillis() || 0;
                const timeB = b.doc.data().timestamp?.toMillis() || 0;
                return timeA - timeB;
            });

            changes.forEach(change => {
                if (change.type === 'added') {
                    hasMessages = true;
                    displayMessage(change.doc.data(), change.doc.id);
                } else if (change.type === 'modified') {
                    // Handle modified messages
                    const messageElement = document.getElementById(`message-${change.doc.id}`);
                    if (messageElement) {
                        const messageData = change.doc.data();
                        // Update message text
                        const messageText = messageElement.querySelector('.message-text');
                        if (messageText) {
                            messageText.textContent = messageData.text;
                        }
                        // Update edited status
                        const messageInfo = messageElement.querySelector('.message-info');
                        if (messageInfo && messageData.edited && !messageInfo.textContent.includes('(edited)')) {
                            messageInfo.textContent += ' (edited)';
                        }
                        // Update read status if needed
                        updateMessageStatus(change.doc.id, messageData.read);
                    }
                } else if (change.type === 'removed') {
                    const messageElement = document.getElementById(`message-${change.doc.id}`);
                    if (messageElement) {
                        messageElement.remove();
                    }
                }
            });
            
            // Check if there are any messages after processing all changes
            if (!hasMessages && chatMessages.children.length === 0) {
                displayNoMessagesPrompt();
            } else if (hasMessages) {
                // Remove the no messages prompt if it exists and we have messages
                const noMessagesPrompt = chatMessages.querySelector('.no-messages-prompt');
                if (noMessagesPrompt) {
                    noMessagesPrompt.remove();
                }
            }
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
}

function displayMessage(message, messageId) {
    if (document.getElementById(`message-${messageId}`)) {
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.id = `message-${messageId}`;
    
    // Use a consistent timestamp source
    const timestamp = message.timestamp?.toMillis() || 
                     (message.localTimestamp || Date.now());
    messageElement.dataset.timestamp = timestamp;
    
    if (message.sender === currentUser.uid) {
        messageElement.classList.add('sent');
        
        // Add click event for sent messages
        messageElement.onclick = (e) => {
            e.stopPropagation();
            showOptionsMenu(messageId, messageElement);
        };
    } else {
        messageElement.classList.add('received');
    }
    
    let messageContent = '';
    if (message.imageUrl) {
        messageContent += `<img src="${message.imageUrl}" alt="Shared image" class="message-image">`;
    }
    if (message.text) {
        messageContent += `<span class="message-text">${message.text}</span>`;
    }
    
    messageElement.innerHTML = `
        ${messageContent}
        <div class="message-info">
            ${message.sender === currentUser.uid ? `<span class="message-status">${message.read ? 'Read' : 'Sent'}</span>` : ''}
            <span class="message-time">${formatTimestamp(message.timestamp)}</span>
            ${message.edited ? ' (edited)' : ''}
        </div>
    `;
    
    // Insert message in correct chronological order
    let inserted = false;
    for (const child of chatMessages.children) {
        const childTimestamp = parseInt(child.dataset.timestamp);
        if (messageElement.dataset.timestamp < childTimestamp) {
            chatMessages.insertBefore(messageElement, child);
            inserted = true;
            break;
        }
    }
    
    if (!inserted) {
        chatMessages.appendChild(messageElement);
    }
    
    // Make sure typing indicator stays at bottom after new messages
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        chatMessages.appendChild(typingIndicator);
    }
}

function showOptionsMenu(messageId, messageElement) {
    const existingMenu = document.querySelector('.message-options-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'message-options-menu';
    optionsMenu.innerHTML = `
        <button class="edit-message">
            <i class="fas fa-edit"></i>
            <span>Edit</span>
        </button>
        <button class="delete-message">
            <i class="fas fa-trash"></i>
            <span>Delete</span>
        </button>
        <button class="cancel-option">
            <i class="fas fa-times"></i>
            <span>Cancel</span>
        </button>
    `;

    optionsMenu.querySelector('.edit-message').onclick = (e) => {
        e.stopPropagation();
        editMessage(messageId, messageElement);
    };
    optionsMenu.querySelector('.delete-message').onclick = (e) => {
        e.stopPropagation();
        deleteMessage(messageId);
    };
    optionsMenu.querySelector('.cancel-option').onclick = (e) => {
        e.stopPropagation();
        optionsMenu.remove();
    };

    messageElement.appendChild(optionsMenu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!optionsMenu.contains(e.target) && !messageElement.contains(e.target)) {
            optionsMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

function editMessage(messageId, messageElement) {
    const messageText = messageElement.querySelector('.message-text');
    const originalText = messageText.textContent;
    
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.value = originalText;
    inputElement.className = 'edit-message-input';
    
    messageText.replaceWith(inputElement);
    inputElement.focus();

    inputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveEditedMessage(messageId, inputElement.value, messageElement);
        }
    });

    inputElement.addEventListener('blur', () => {
        saveEditedMessage(messageId, inputElement.value, messageElement);
    });
}

function saveEditedMessage(messageId, newText, messageElement) {
    const chatId = [currentUser.uid, selectedUser].sort().join('_');
    
    // Create the update object
    const updateData = {
        text: newText,
        edited: true,
        lastModified: firebase.firestore.FieldValue.serverTimestamp() // Add timestamp for sorting
    };

    // Update the message in Firestore
    db.collection('chats').doc(chatId).collection('messages').doc(messageId).update(updateData)
        .then(() => {
            // Local UI update
            const newMessageText = document.createElement('span');
            newMessageText.className = 'message-text';
            newMessageText.textContent = newText;
            messageElement.querySelector('.edit-message-input').replaceWith(newMessageText);
            
            // Update edited status in UI
            const messageInfo = messageElement.querySelector('.message-info');
            if (!messageInfo.textContent.includes('(edited)')) {
                messageInfo.textContent += ' (edited)';
            }
        })
        .catch((error) => {
            console.error("Error updating message: ", error);
            // Revert to original text if update fails
            const newMessageText = document.createElement('span');
            newMessageText.className = 'message-text';
            newMessageText.textContent = messageElement.querySelector('.edit-message-input').value;
            messageElement.querySelector('.edit-message-input').replaceWith(newMessageText);
        });
}

function deleteMessage(messageId) {
    const chatId = [currentUser.uid, selectedUser].sort().join('_');
    db.collection('chats').doc(chatId).collection('messages').doc(messageId).delete()
        .then(() => {
            console.log("Message successfully deleted");
        })
        .catch((error) => {
            console.error("Error removing message: ", error);
        });
}

function updateMessageStatus(messageId, isRead) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
        const statusElement = messageElement.querySelector('.message-status');
        if (statusElement) {
            statusElement.textContent = isRead ? 'Read' : 'Sent';
        }
    }
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    let date;
    if (timestamp instanceof Date) {
        date = timestamp;
    } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else {
        console.warn('Invalid timestamp format:', timestamp);
        return '';
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const debouncedSendMessage = debounce(() => {
    if (!selectedUser || (!messageInput.value.trim() && !imageInput.files[0])) return;

    // Remove the no messages prompt if it exists
    const noMessagesPrompt = chatMessages.querySelector('.no-messages-prompt');
    if (noMessagesPrompt) {
        noMessagesPrompt.remove();
    }

    const chatId = [currentUser.uid, selectedUser].sort().join('_');
    const message = {
        sender: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    };

    const sendPromises = [];

    if (messageInput.value.trim()) {
        message.text = messageInput.value.trim();
        sendPromises.push(sendTextMessage(chatId, {...message}));
    }

    if (imageInput.files[0]) {
        sendPromises.push(
            uploadImage(imageInput.files[0]).then((imageUrl) => {
                const imageMessage = {...message, imageUrl};
                return sendTextMessage(chatId, imageMessage);
            })
        );
    }

    Promise.all(sendPromises)
        .then(() => {
            messageInput.value = '';
            imageInput.value = '';
        })
        .catch((error) => {
            console.error("Error sending message:", error);
        });
}, 300);

// Remove any existing event listeners
sendButton.removeEventListener('click', debouncedSendMessage);
messageInput.removeEventListener('keypress', debouncedSendMessage);
imageInput.removeEventListener('change', debouncedSendMessage);

// Add new event listeners
sendButton.addEventListener('click', (event) => {
    event.preventDefault();
    debouncedSendMessage();
});

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        debouncedSendMessage();
    }
});

imageInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        debouncedSendMessage();
    }
});

function sendTextMessage(chatId, message) {
    return db.collection('chats').doc(chatId).collection('messages').add(message);
}

function uploadImage(file) {
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`chat_images/${Date.now()}_${file.name}`);
    return imageRef.put(file).then(() => imageRef.getDownloadURL());
}

function displayNoMessagesPrompt() {
    db.collection('users').doc(selectedUser).get().then((doc) => {
        if (doc.exists) {
            const username = doc.data().Username || 'Anonymous';
            const promptElement = document.createElement('div');
            promptElement.classList.add('no-messages-prompt');
            promptElement.innerHTML = `
                <p>No messages yet. Start the conversation!</p>
                <p>Say hello to ${username}.</p>
            `;
            chatMessages.appendChild(promptElement);
        }
    }).catch((error) => {
        console.error("Error getting user document:", error);
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add this new function to display notice when you've blocked someone
function displayBlockedByYouNotice(userId) {
    chatHeader.innerHTML = `
        <span>
            <i class="fas fa-user-slash"></i> 
            You've blocked this user
        </span>
        <button class="block-button" onclick="showBlockModal('${userId}', true)">
            <i class="fas fa-user-check"></i>
            Unblock
        </button>
    `;
    
    chatMessages.innerHTML = `
        <div class="blocked-notice">
            <i class="fas fa-user-slash"></i>
            <p>You've blocked this user. Unblock them to resume messaging.</p>
        </div>
    `;
    
    // Disable message input
    messageInput.disabled = true;
    sendButton.disabled = true;
    imageInput.disabled = true;
    document.querySelector('.message-input').classList.remove('active');
}

function displayBlockedNotice(userId) {
    db.collection('users').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const username = doc.data().Username || 'Anonymous';
            selectedUser = null;
            chatHeader.innerHTML = `<i class="fas fa-user-slash"></i> ${username}`;
            chatMessages.innerHTML = `
                <div class="blocked-notice">
                    <i class="fas fa-user-slash"></i>
                    <p>You can't send messages to this user.</p>
                    <p>You have been blocked by ${username}.</p>
                </div>
            `;
            
            messageInput.disabled = true;
            sendButton.disabled = true;
            imageInput.disabled = true;
            
            localStorage.removeItem('selectedUser');
            updateUserListSelection();
        }
    }).catch((error) => {
        console.error("Error getting user document:", error);
    });
}

function autoResizeMessageInput() {
  messageInput.style.height = 'auto';
  messageInput.style.height = (messageInput.scrollHeight) + 'px';
}

messageInput.addEventListener('input', autoResizeMessageInput);

// Add this new function to fetch profile pictures
function fetchProfilePicture(userId) {
    const profilePicRef = storage.ref().child(`profile-pictures/${userId}`);
    return profilePicRef.getDownloadURL()
        .catch(error => {
            if (error.code === 'storage/object-not-found') {
                return null; // Return null if no profile picture exists
            }
            throw error; // Rethrow other errors
        });
}

function cleanup() {
    // Unsubscribe from current message listener if it exists
    if (currentMessageListener) {
        currentMessageListener();
        currentMessageListener = null;
    }
    
    // Unsubscribe from current typing listener if it exists
    if (currentTypingListener) {
        currentTypingListener();
        currentTypingListener = null;
    }
    
    // Clear typing status when switching chats
    if (selectedUser) {
        const oldChatId = [currentUser.uid, selectedUser].sort().join('_');
        db.collection('chats').doc(oldChatId).set({
            [`${currentUser.uid}_typing`]: false
        }, { merge: true });
    }
    
    // Clear typing timeout
    clearTimeout(typingTimeout);
    isTyping = false;
    
    // Clear messages display
    chatMessages.innerHTML = '';
    
    // Remove any existing typing indicators
    const existingIndicators = document.querySelectorAll('.typing-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Clear typing timer
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
    
    // Reset typing state
    isTyping = false;
    lastKeypress = 0;
}

userListToggle.addEventListener('click', () => {
    userListElement.classList.add('active');
    userListToggle.style.cssText = 'display: none !important;';
});

userListClose.addEventListener('click', () => {
    userListElement.classList.remove('active');
    userListToggle.style.cssText = 'display: flex !important;';
});

// Handle feedback link clicks
document.getElementById('feedbackLink').addEventListener('click', (e) => {
    e.preventDefault();
    
    // You can customize this to your needs - either open a feedback form,
    // redirect to a feedback page, or show a modal
    const feedbackEmail = 'feedback@example.com'; // Replace with your feedback email
    window.location.href = `mailto:${feedbackEmail}?subject=Chat Beta Feedback`;
});

function setupTypingIndicator() {
    messageInput.addEventListener('keydown', (e) => {
        const now = Date.now();
        const timeSinceLastKeypress = now - lastKeypress;
        
        // Only trigger typing if we're actually typing (not holding down a key)
        // and enough time has passed since last keypress
        if (!e.repeat && timeSinceLastKeypress > MIN_TYPING_INTERVAL) {
            lastKeypress = now;
            
            if (!isTyping) {
                isTyping = true;
                const chatId = [currentUser.uid, selectedUser].sort().join('_');
                
                // Update typing status in Firebase
                db.collection('chats').doc(chatId).update({
                    [`${currentUser.uid}_typing`]: true
                });
            }
            
            // Clear any existing timer
            clearTimeout(typingTimer);
            
            // Set new timer
            typingTimer = setTimeout(() => {
                isTyping = false;
                const chatId = [currentUser.uid, selectedUser].sort().join('_');
                
                // Update typing status in Firebase
                db.collection('chats').doc(chatId).update({
                    [`${currentUser.uid}_typing`]: false
                });
            }, TYPING_TIMEOUT);
        }
    });

    // Also clear typing status when sending a message
    sendButton.addEventListener('click', () => {
        if (!selectedUser) return;
        
        clearTimeout(typingTimer);
        isTyping = false;
        const chatId = [currentUser.uid, selectedUser].sort().join('_');
        db.collection('chats').doc(chatId).set({
            [`${currentUser.uid}_typing`]: false,
            lastTypingUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });
}

// Add this new function to mark messages as read
function markMessagesAsRead(userId) {
    const chatId = [currentUser.uid, userId].sort().join('_');
    
    // Get all unread messages from this sender
    db.collection('chats').doc(chatId).collection('messages')
        .where('sender', '==', userId)
        .where('read', '==', false)
        .get()
        .then((snapshot) => {
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.update(doc.ref, { 
                    read: true,
                    // Add this to suppress the bubble notification
                    suppressBubble: true
                });
            });
            return batch.commit();
        })
        .then(() => {
            // Clear unread count and update badge
            unreadCounts[userId] = 0;
            updateUnreadBadge(document.querySelector(`li[data-user-id="${userId}"] .unread-badge`), 0);
        });
}

// Add this function to handle typing indicator updates
function updateTypingIndicator(userId, userData, isTyping) {
    // Remove any existing typing indicators first
    const existingIndicators = document.querySelectorAll('.typing-indicator');
    existingIndicators.forEach(indicator => indicator.remove());

    // Only proceed if user is typing
    if (!isTyping) return;

    // Create new typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'typing-indicator';
    
    // Add verified and admin badges if user is admin
    const isAdmin = userData.isAdmin === true;
    const verifiedBadge = isAdmin ? '<i class="fas fa-check-circle verified-badge"></i>' : '';
    const adminBadge = isAdmin ? '<i class="fas fa-shield-alt admin-badge"></i>' : '';
    
    // Fetch profile picture
    fetchProfilePicture(userId)
        .then(url => {
            const avatarHtml = url ? 
                `<img src="${url}" alt="Profile picture">` : 
                '<i class="fas fa-user"></i>';
            
            typingDiv.innerHTML = `
                <div class="typing-user-info">
                    <div class="typing-avatar">${avatarHtml}</div>
                    <div class="typing-text">
                        <span class="typing-username">
                            ${userData.Username || 'Anonymous'}
                            ${verifiedBadge}
                            ${adminBadge}
                        </span>
                        is typing
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
}
// Add this new function
function clearStorageAndRefresh() {
    localStorage.removeItem('selectedUser');
    location.reload();
}
