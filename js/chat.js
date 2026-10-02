/**
 * 👑 THE KING BURGER - CHAT GLOBAL
 * Lógica para el muro de la comunidad
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    let currentUser = null;

    if (!chatMessages) return;

    // 1. Escuchar Auth State para habilitar el input
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            chatInput.disabled = false;
            chatInput.placeholder = "Escribí tu mensaje acá...";
            chatSendBtn.disabled = false;
            chatSendBtn.style.background = 'var(--accent-color)';
            chatSendBtn.style.color = '#000';
            chatSendBtn.style.cursor = 'pointer';
        } else {
            chatInput.disabled = true;
            chatInput.placeholder = "Iniciá sesión (Google) arriba para comentar...";
            chatSendBtn.disabled = true;
            chatSendBtn.style.background = 'rgba(255,255,255,0.1)';
            chatSendBtn.style.color = '#555';
            chatSendBtn.style.cursor = 'not-allowed';
        }
    });

    // 2. Escuchar mensajes en tiempo real desde Firestore
    const db = firebase.firestore();
    const chatRef = db.collection('global_chat').orderBy('timestamp', 'asc');

    chatRef.onSnapshot((snapshot) => {
        chatMessages.innerHTML = ''; // Limpiar
        
        if (snapshot.empty) {
            chatMessages.innerHTML = '<div style="text-align: center; color: #888; font-style: italic; margin: auto;">Sé el primero en dejar un mensaje en el Muro del Rey 👑</div>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const isMe = currentUser && data.uid === currentUser.uid;
            
            const msgDiv = document.createElement('div');
            msgDiv.style.display = 'flex';
            msgDiv.style.flexDirection = 'column';
            msgDiv.style.alignItems = isMe ? 'flex-end' : 'flex-start';
            msgDiv.style.marginBottom = '10px';

            // Formatear hora
            let timeStr = '';
            if (data.timestamp) {
                const date = data.timestamp.toDate();
                timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            msgDiv.innerHTML = `
                <div style="font-size: 0.75rem; color: #bbb; margin-bottom: 2px; padding: 0 5px;">
                    ${data.authorName} <span style="opacity: 0.5; margin-left: 5px;">${timeStr}</span>
                </div>
                <div style="background: ${isMe ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.05)'}; 
                            border: 1px solid ${isMe ? 'rgba(255, 183, 3, 0.3)' : 'rgba(255,255,255,0.1)'};
                            padding: 10px 15px; 
                            border-radius: ${isMe ? '15px 15px 0 15px' : '15px 15px 15px 0'};
                            color: #fff;
                            font-size: 0.95rem;
                            max-width: 85%;
                            word-wrap: break-word;">
                    ${data.text}
                </div>
            `;
            chatMessages.appendChild(msgDiv);
        });

        // Auto scroll al final
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, (error) => {
        console.error("Error al escuchar chat:", error);
    });

    // 3. Enviar mensaje
    function sendMessage() {
        if (!currentUser) return;
        const text = chatInput.value.trim();
        if (text === '') return;

        const userName = currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Rey Anónimo';

        db.collection('global_chat').add({
            uid: currentUser.uid,
            authorName: userName,
            photoURL: currentUser.photoURL || '',
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            chatInput.value = '';
        }).catch((err) => {
            console.error("Error al enviar msj:", err);
            alert("No se pudo enviar el mensaje.");
        });
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
