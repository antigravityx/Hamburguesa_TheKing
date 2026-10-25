/**
 * 👑 THE KING BURGER — MOTOR DE RANKINGS ARCADE Y CORONAS
 * Conexión universal de videojuegos (Stacker, Tetrix, RPG) con Firestore
 * v1.0 — Tiempo Real + Sistema de Recompensas
 */

(function () {
    'use strict';

    // Firebase config de respaldo si no está cargada previamente
    const firebaseConfig = {
        apiKey: "AIzaSyB2S21A2BfQbpJSG3KaT3t8IiH5ViMZZmc",
        authDomain: "theking-burger.firebaseapp.com",
        projectId: "theking-burger",
        storageBucket: "theking-burger.firebasestorage.app",
        messagingSenderId: "647398051589",
        appId: "1:647398051589:web:17655a8455a8f9539df16c"
    };

    class KingArcadeRankings {
        constructor() {
            this.db = null;
            this.auth = null;
            this.init();
        }

        init() {
            try {
                if (typeof firebase !== 'undefined') {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    this.db = firebase.firestore();
                    this.auth = firebase.auth();
                } else {
                    console.warn('[KingRankings] Firebase SDK no cargado en este juego.');
                }
            } catch (e) {
                console.error('[KingRankings] Error inicializando Firebase:', e);
            }
        }

        /**
         * Enviar puntaje de una partida jugada
         * @param {string} gameId - 'stacker', 'tetrix', 'rpg'
         * @param {number} score - Puntos o pisos alcanzados
         * @param {number} coronasEarned - Coronas ganadas en la partida
         */
        async submitScore(gameId, score, coronasEarned = 0) {
            if (!this.db) {
                console.warn('[KingRankings] Base de datos no disponible, guardando solo local');
                this._saveLocalScore(gameId, score, coronasEarned);
                return { success: false, reason: 'offline' };
            }

            try {
                const currentUser = this.auth ? this.auth.currentUser : null;
                const playerName = currentUser 
                    ? (currentUser.displayName || 'Rey Anónimo') 
                    : (localStorage.getItem('king_player_name') || 'Visitante de la Corona');
                
                const photoURL = currentUser ? (currentUser.photoURL || '') : '';
                const uid = currentUser ? currentUser.uid : ('anon_' + Math.random().toString(36).substring(2, 10));

                const scoreData = {
                    game: gameId,
                    score: Number(score),
                    coronas: Number(coronasEarned),
                    playerName: playerName,
                    photoURL: photoURL,
                    uid: uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    dateStr: new Date().toLocaleDateString('es-AR')
                };

                // 1. Guardar en la colección de rankings
                await this.db.collection('arcade_scores').add(scoreData);
                console.log(`[KingRankings] ✅ Puntaje de ${gameId} (${score}) registrado en la nube.`);

                // 2. Si el usuario está autenticado, sumarle las coronas a su perfil
                if (currentUser && coronasEarned > 0) {
                    await this._rewardCoronas(currentUser.uid, coronasEarned);
                }

                // 3. Guardar en LocalStorage como respaldo
                this._saveLocalScore(gameId, score, coronasEarned);

                return { success: true, scoreData };
            } catch (err) {
                console.error('[KingRankings] Error al guardar puntaje:', err);
                this._saveLocalScore(gameId, score, coronasEarned);
                return { success: false, error: err.message };
            }
        }

        /**
         * Recompensar coronas en Firestore
         */
        async _rewardCoronas(uid, amount) {
            try {
                const batch = this.db.batch();
                const semillaRef = this.db.collection('semillas').doc(uid);
                const userRef = this.db.collection('users').doc(uid);

                batch.set(semillaRef, {
                    coronas: firebase.firestore.FieldValue.increment(amount),
                    ultima_victoria: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                batch.set(userRef, {
                    coronas: firebase.firestore.FieldValue.increment(amount)
                }, { merge: true });

                await batch.commit();
                console.log(`[KingRankings] 👑 +${amount} Coronas acreditadas a ${uid}`);
            } catch (e) {
                console.warn('[KingRankings] Error acreditando coronas:', e);
            }
        }

        /**
         * Guardar respaldo en LocalStorage
         */
        _saveLocalScore(gameId, score, coronas) {
            try {
                const key = `king_highscore_${gameId}`;
                const prev = parseInt(localStorage.getItem(key) || '0');
                if (score > prev) {
                    localStorage.setItem(key, score.toString());
                }

                let totalCoronas = parseInt(localStorage.getItem('king_coronas') || '0');
                totalCoronas += Number(coronas);
                localStorage.setItem('king_coronas', totalCoronas.toString());
            } catch (e) { }
        }

        /**
         * Escuchar en tiempo real el Top de un juego (Para comunidad.html)
         */
        listenLeaderboard(gameId, limitCount = 5, callback) {
            if (!this.db) {
                callback([]);
                return null;
            }

            return this.db.collection('arcade_scores')
                .where('game', '==', gameId)
                .orderBy('score', 'desc')
                .limit(limitCount)
                .onSnapshot((snapshot) => {
                    const leaderboard = [];
                    snapshot.forEach((doc) => {
                        leaderboard.push({ id: doc.id, ...doc.data() });
                    });
                    callback(leaderboard);
                }, (error) => {
                    console.warn(`[KingRankings] Error escuchando leaderboard de ${gameId}:`, error);
                    // Fallback sin índice ordenado si fuera necesario
                    this.db.collection('arcade_scores')
                        .where('game', '==', gameId)
                        .limit(20)
                        .get()
                        .then(snap => {
                            const list = [];
                            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                            list.sort((a, b) => (b.score || 0) - (a.score || 0));
                            callback(list.slice(0, limitCount));
                        })
                        .catch(() => callback([]));
                });
        }
    }

    // Instancia global
    window.KingRankings = new KingArcadeRankings();
})();
