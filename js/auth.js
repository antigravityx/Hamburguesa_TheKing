/**
 * 👑 THE KING BURGER - AUTENTICACIÓN
 * Integración de Firebase Auth (Google Sign-In)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias UI
    const userProfileBtn = document.getElementById('user-profile-btn');
    const userNameDisplay = document.getElementById('user-name-display');
    
    // Auth provider
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Escuchar estado de autenticación
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Usuario logueado
            console.log('Usuario autenticado:', user.displayName);
            
            // Actualizar UI
            userNameDisplay.textContent = user.displayName.split(' ')[0]; // Primer nombre
            userNameDisplay.style.display = 'inline';
            userProfileBtn.innerHTML = `
                <img src="${user.photoURL}" alt="${user.displayName}" style="width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--accent-color);">
                <span class="desktop-only" style="font-size: 0.9rem;">${user.displayName.split(' ')[0]}</span>
            `;
            
            // Guardar usuario en base de datos si no existe
            const userRef = firebase.firestore().collection('users').doc(user.uid);
            userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photo: user.photoURL,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
        } else {
            // Usuario no logueado
            console.log('No hay usuario autenticado');
            userNameDisplay.textContent = 'Entrar';
            userNameDisplay.style.display = 'none';
            userProfileBtn.innerHTML = `
                <i class="ri-google-fill" style="font-size: 1.5rem; color: var(--accent-color);"></i>
                <span class="desktop-only" style="font-size: 0.9rem;">Entrar</span>
            `;
        }
    });
    
    // Manejar click en botón de perfil
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', () => {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                // Si ya está logueado, confirmamos si quiere salir
                if(confirm(`¿Quieres cerrar sesión, ${currentUser.displayName.split(' ')[0]}?`)) {
                    firebase.auth().signOut().then(() => {
                        alert('Sesión cerrada correctamente. ¡Hasta pronto Reina/Rey!');
                    }).catch((error) => {
                        console.error('Error al cerrar sesión:', error);
                    });
                }
            } else {
                // Si no está logueado, iniciar login
                firebase.auth().signInWithPopup(provider).then((result) => {
                    const user = result.user;
                    // El listener de onAuthStateChanged se encargará de actualizar la UI
                    alert(`¡Bienvenido/a a The King Burger, ${user.displayName}! 👑`);
                }).catch((error) => {
                    console.error('Error en autenticación:', error);
                    alert('Hubo un problema al iniciar sesión. Inténtalo de nuevo.');
                });
            }
        });
    }
});
