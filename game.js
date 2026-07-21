// Power Chess: Spellbound Tactics - Game Logic
(function() {
    'use strict';

    // ========== CONSTANTS ==========
    const BOARD_SIZE = 8;
    const TILE_SIZE = 70;
    const CANVAS_SIZE = BOARD_SIZE * TILE_SIZE;

    const PIECE_TYPES = { KING: 'king', QUEEN: 'queen', ROOK: 'rook', BISHOP: 'bishop', KNIGHT: 'knight', PAWN: 'pawn' };
    const COLORS = { WHITE: 'white', BLACK: 'black' };

    const PIECE_VALUES = { king: 1000, queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };

    const PIECE_SYMBOLS = {
        white: { king: '\u2654', queen: '\u2655', rook: '\u2656', bishop: '\u2657', knight: '\u2658', pawn: '\u2659' },
        black: { king: '\u265A', queen: '\u265B', rook: '\u265C', bishop: '\u265D', knight: '\u265E', pawn: '\u265F' }
    };

    // ========== AUDIO SYSTEM ==========
    const AudioSystem = {
        ctx: null,
        init() {
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        },
        play(type) {
            if (!this.ctx) this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;

            if (type === 'move') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.linearRampToValueAtTime(660, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
            } else if (type === 'capture') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.2);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now); osc.stop(now + 0.25);
            } else if (type === 'power') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(900, now + 0.15);
                osc.frequency.linearRampToValueAtTime(600, now + 0.3);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now); osc.stop(now + 0.35);
            } else if (type === 'gameover') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.6);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
                osc.start(now); osc.stop(now + 0.7);
            } else if (type === 'levelup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.1);
                osc.frequency.setValueAtTime(784, now + 0.2);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            }
        }
    };

    // ========== GAME STATE ==========
    let gameState = {
        board: [],
        currentTurn: COLORS.WHITE,
        selectedPiece: null,
        validMoves: [],
        mana: 0,
        score: 0,
        highScore: parseInt(localStorage.getItem('powerChessHighScore')) || 0,
        level: 1,
        playerCaptured: [],
        aiCaptured: [],
        shieldedPieces: [],
        activePower: null,
        powerTargets: [],
        gameOver: false,
        aiThinking: false,
        inCheck: false,
        promotingPawn: null
    };

    // ========== DOM ELEMENTS ==========
    const canvas = document.getElementById('chessCanvas');
    const ctx = canvas.getContext('2d');
    const turnIndicator = document.getElementById('turn-indicator');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    const highscoreDisplay = document.getElementById('highscore-display');
    const manaDisplay = document.getElementById('mana-display');
    const actionLog = document.getElementById('action-log');
    const powerHint = document.getElementById('power-hint');
    const btnShadowJump = document.getElementById('btn-shadow-jump');
    const btnThunderStrike = document.getElementById('btn-thunder-strike');
    const btnSacredShield = document.getElementById('btn-sacred-shield');
    const btnDefenseShout = document.getElementById('btn-defense-shout');
    const btnFireball = document.getElementById('btn-fireball');
    const btnSpectralDash = document.getElementById('btn-spectral-dash');
    const gameOverModal = document.getElementById('game-over-modal');
    const levelUpModal = document.getElementById('level-up-modal');
    const promotionModal = document.getElementById('promotion-modal');
    const btnRetry = document.getElementById('btn-retry');
    const btnNextLevel = document.getElementById('btn-next-level');

    // ========== BOARD INITIALIZATION ==========
    function createPiece(type, color, row, col) {
        return { type, color, row, col, hasMoved: false };
    }

    function initBoard() {
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));
        // Black pieces (top)
        const backRow = [PIECE_TYPES.ROOK, PIECE_TYPES.KNIGHT, PIECE_TYPES.BISHOP, PIECE_TYPES.QUEEN,
                         PIECE_TYPES.KING, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT, PIECE_TYPES.ROOK];
        for (let c = 0; c < 8; c++) {
            board[0][c] = createPiece(backRow[c], COLORS.BLACK, 0, c);
            board[1][c] = createPiece(PIECE_TYPES.PAWN, COLORS.BLACK, 1, c);
            board[7][c] = createPiece(backRow[c], COLORS.WHITE, 7, c);
            board[6][c] = createPiece(PIECE_TYPES.PAWN, COLORS.WHITE, 6, c);
        }
        return board;
    }

    function resetGame(keepScore) {
        gameState.board = initBoard();
        gameState.currentTurn = COLORS.WHITE;
        gameState.selectedPiece = null;
        gameState.validMoves = [];
        gameState.shieldedPieces = [];
        gameState.activePower = null;
        gameState.powerTargets = [];
        gameState.gameOver = false;
        gameState.aiThinking = false;
        gameState.inCheck = false;
        gameState.promotingPawn = null;
        gameState.aiCaptured = [];
        if (!keepScore) {
            gameState.mana = 0;
            gameState.score = 0;
            gameState.level = 1;
            gameState.playerCaptured = [];
        } else {
            gameState.mana += 1;
        }
        updateUI();
        drawBoard();
    }

    // ========== MOVEMENT LOGIC ==========
    function isInBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

    function getValidMoves(piece, board) {
        if (!piece) return [];
        const moves = [];
        const { type, color, row, col } = piece;
        const enemy = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

        function addMove(r, c) {
            if (!isInBounds(r, c)) return false;
            const target = board[r][c];
            if (!target) { moves.push({ row: r, col: c }); return true; }
            if (target.color === enemy) { moves.push({ row: r, col: c }); }
            return false;
        }

        function addSlide(dr, dc) {
            for (let i = 1; i < 8; i++) {
                const r = row + dr * i, c = col + dc * i;
                if (!isInBounds(r, c)) break;
                const target = board[r][c];
                if (!target) { moves.push({ row: r, col: c }); }
                else { if (target.color === enemy) moves.push({ row: r, col: c }); break; }
            }
        }

        switch (type) {
            case PIECE_TYPES.PAWN: {
                const dir = color === COLORS.WHITE ? -1 : 1;
                const startRow = color === COLORS.WHITE ? 6 : 1;
                // Forward
                if (isInBounds(row + dir, col) && !board[row + dir][col]) {
                    moves.push({ row: row + dir, col });
                    if (row === startRow && !board[row + 2 * dir][col]) {
                        moves.push({ row: row + 2 * dir, col });
                    }
                }
                // Captures
                for (const dc of [-1, 1]) {
                    const r = row + dir, c = col + dc;
                    if (isInBounds(r, c) && board[r][c] && board[r][c].color === enemy) {
                        moves.push({ row: r, col: c });
                    }
                }
                break;
            }
            case PIECE_TYPES.KNIGHT:
                for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
                    addMove(row + dr, col + dc);
                }
                break;
            case PIECE_TYPES.BISHOP:
                addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
                break;
            case PIECE_TYPES.ROOK:
                addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
                break;
            case PIECE_TYPES.QUEEN:
                addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
                addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
                break;
            case PIECE_TYPES.KING:
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        addMove(row + dr, col + dc);
                    }
                }
                break;
        }
        return moves;
    }

    // ========== CHECK / CHECKMATE LOGIC ==========
    function isSquareAttacked(row, col, byColor, board) {
        // Check if square (row,col) is attacked by any piece of 'byColor'
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p || p.color !== byColor) continue;
                const moves = getRawMoves(p, board);
                if (moves.some(m => m.row === row && m.col === col)) return true;
            }
        }
        return false;
    }

    // getRawMoves is getValidMoves without check filtering (to avoid recursion)
    function getRawMoves(piece, board) {
        return getValidMoves(piece, board);
    }

    function findKing(color, board) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.type === PIECE_TYPES.KING && p.color === color) return p;
            }
        }
        return null;
    }

    function isInCheck(color, board) {
        const king = findKing(color, board);
        if (!king) return false;
        const enemy = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        return isSquareAttacked(king.row, king.col, enemy, board);
    }

    function simulateMove(piece, toRow, toCol, board) {
        // Create a shallow copy of the board to test a move
        const newBoard = board.map(row => row.slice());
        newBoard[piece.row][piece.col] = null;
        // Create a temporary piece at the destination
        const movedPiece = { ...piece, row: toRow, col: toCol };
        newBoard[toRow][toCol] = movedPiece;
        return newBoard;
    }

    function getLegalMoves(piece, board) {
        if (!piece) return [];
        const raw = getValidMoves(piece, board);
        // Filter: only moves that don't leave own king in check
        return raw.filter(move => {
            const simBoard = simulateMove(piece, move.row, move.col, board);
            return !isInCheck(piece.color, simBoard);
        });
    }

    function isCheckmate(color, board) {
        // Color is in checkmate if in check and has no legal moves
        if (!isInCheck(color, board)) return false;
        return hasNoLegalMoves(color, board);
    }

    function isStalemate(color, board) {
        // Color is in stalemate if NOT in check but has no legal moves
        if (isInCheck(color, board)) return false;
        return hasNoLegalMoves(color, board);
    }

    function hasNoLegalMoves(color, board) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.color === color) {
                    const legal = getLegalMoves(p, board);
                    if (legal.length > 0) return false;
                }
            }
        }
        return true;
    }

    // ========== MOVE EXECUTION ==========
    function movePiece(piece, toRow, toCol) {
        const board = gameState.board;
        const captured = board[toRow][toCol];

        // Check shield
        if (captured && isShielded(captured)) {
            addLog(`${PIECE_SYMBOLS[captured.color][captured.type]} protegido por Escudo Sagrado!`, 'power-log');
            return false;
        }

        board[piece.row][piece.col] = null;

        if (captured) {
            if (piece.color === COLORS.WHITE) {
                gameState.playerCaptured.push(captured);
                gameState.score += PIECE_VALUES[captured.type] * 10;
            } else {
                gameState.aiCaptured.push(captured);
            }
            AudioSystem.play('capture');
            addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} captura ${PIECE_SYMBOLS[captured.color][captured.type]}`, 'capture-log');

            // Check if king captured
            if (captured.type === PIECE_TYPES.KING) {
                if (captured.color === COLORS.WHITE) {
                    endGame();
                    return true;
                } else {
                    levelComplete();
                    return true;
                }
            }
        } else {
            AudioSystem.play('move');
            addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} mueve a ${String.fromCharCode(97 + toCol)}${8 - toRow}`);
        }

        piece.row = toRow;
        piece.col = toCol;
        piece.hasMoved = true;
        board[toRow][toCol] = piece;

        // Pawn promotion
        if (piece.type === PIECE_TYPES.PAWN) {
            if ((piece.color === COLORS.WHITE && toRow === 0) || (piece.color === COLORS.BLACK && toRow === 7)) {
                if (piece.color === COLORS.WHITE) {
                    // Player promotion - show modal
                    gameState.promotingPawn = piece;
                    drawBoard();
                    showPromotionModal();
                    return 'promoting'; // Special return to pause turn
                } else {
                    // AI always promotes to queen
                    piece.type = PIECE_TYPES.QUEEN;
                    addLog(`${PIECE_SYMBOLS[piece.color].pawn} promociona a ${PIECE_SYMBOLS[piece.color].queen}!`, 'power-log');
                }
            }
        }

        return true;
    }

    function isShielded(piece) {
        return gameState.shieldedPieces.some(s => s.row === piece.row && s.col === piece.col && s.color === piece.color);
    }

    // ========== POWER SYSTEM ==========
    function activatePower(powerType) {
        const piece = gameState.selectedPiece;
        if (!piece || gameState.currentTurn !== COLORS.WHITE) return;

        if (powerType === 'shadowJump') {
            if (piece.type !== PIECE_TYPES.KNIGHT || gameState.mana < 2) return;
            gameState.activePower = 'shadowJump';
            // Show all empty squares as valid targets
            gameState.powerTargets = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (!gameState.board[r][c]) {
                        gameState.powerTargets.push({ row: r, col: c });
                    }
                }
            }
            gameState.validMoves = gameState.powerTargets;
            addLog('Salto Sombra activado - elige destino', 'power-log');
            drawBoard();
        } else if (powerType === 'thunderStrike') {
            if (piece.type !== PIECE_TYPES.ROOK || gameState.mana < 3) return;
            gameState.activePower = 'thunderStrike';
            // Show adjacent enemy pieces as targets
            gameState.powerTargets = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const r = piece.row + dr, c = piece.col + dc;
                    if (isInBounds(r, c) && gameState.board[r][c] && gameState.board[r][c].color === COLORS.BLACK) {
                        gameState.powerTargets.push({ row: r, col: c });
                    }
                }
            }
            gameState.validMoves = gameState.powerTargets;
            addLog('Golpe de Trueno activado - elige objetivo', 'power-log');
            drawBoard();
        } else if (powerType === 'sacredShield') {
            if (piece.type !== PIECE_TYPES.KING || gameState.mana < 3) return;
            gameState.mana -= 3;
            gameState.shieldedPieces.push({ row: piece.row, col: piece.col, color: piece.color, turnsLeft: 1 });
            AudioSystem.play('power');
            addLog(`Escudo Sagrado aplicado a ${PIECE_SYMBOLS[piece.color][piece.type]}!`, 'power-log');
            endTurn();
        } else if (powerType === 'defenseShout') {
            if (piece.type !== PIECE_TYPES.KING || gameState.mana < 4) return;
            gameState.mana -= 4;
            // Shield all friendly pawns
            let shieldedCount = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = gameState.board[r][c];
                    if (p && p.color === COLORS.WHITE && p.type === PIECE_TYPES.PAWN) {
                        // Don't duplicate shield
                        if (!isShielded(p)) {
                            gameState.shieldedPieces.push({ row: p.row, col: p.col, color: p.color, turnsLeft: 1 });
                            shieldedCount++;
                        }
                    }
                }
            }
            AudioSystem.play('power');
            addLog(`¡Grito de Defensa! ${shieldedCount} peones protegidos.`, 'power-log');
            endTurn();
        } else if (powerType === 'fireball') {
            if (piece.type !== PIECE_TYPES.QUEEN || gameState.mana < 4) return;
            gameState.activePower = 'fireball';
            // Valid targets: adjacent squares in 4 cardinal directions (the direction start point)
            gameState.powerTargets = [];
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
            for (const [dr, dc] of directions) {
                const r = piece.row + dr, c = piece.col + dc;
                if (isInBounds(r, c)) {
                    gameState.powerTargets.push({ row: r, col: c, dr, dc });
                }
            }
            gameState.validMoves = gameState.powerTargets.map(t => ({ row: t.row, col: t.col }));
            addLog('Bola de Fuego activada - elige dirección (casilla adyacente)', 'power-log');
            drawBoard();
        } else if (powerType === 'spectralDash') {
            if (piece.type !== PIECE_TYPES.BISHOP || gameState.mana < 2) return;
            gameState.activePower = 'spectralDash';
            // All empty squares on any diagonal from the bishop (ignoring blocking pieces)
            gameState.powerTargets = [];
            for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
                for (let i = 1; i < 8; i++) {
                    const r = piece.row + dr * i, c = piece.col + dc * i;
                    if (!isInBounds(r, c)) break;
                    if (!gameState.board[r][c]) {
                        gameState.powerTargets.push({ row: r, col: c });
                    }
                }
            }
            gameState.validMoves = gameState.powerTargets;
            addLog('Paso Espectral activado - elige destino diagonal', 'power-log');
            drawBoard();
        }
        updateUI();
    }

    function executePower(targetRow, targetCol) {
        const piece = gameState.selectedPiece;
        const board = gameState.board;

        if (gameState.activePower === 'shadowJump') {
            gameState.mana -= 2;
            board[piece.row][piece.col] = null;
            piece.row = targetRow;
            piece.col = targetCol;
            board[targetRow][targetCol] = piece;
            AudioSystem.play('power');
            addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} usa Salto Sombra a ${String.fromCharCode(97 + targetCol)}${8 - targetRow}!`, 'power-log');
            gameState.activePower = null;
            gameState.powerTargets = [];
            endTurn();
        } else if (gameState.activePower === 'thunderStrike') {
            const target = board[targetRow][targetCol];
            if (target) {
                gameState.mana -= 3;
                // Check if king
                if (target.type === PIECE_TYPES.KING) {
                    board[targetRow][targetCol] = null;
                    gameState.playerCaptured.push(target);
                    gameState.score += PIECE_VALUES[target.type] * 10;
                    AudioSystem.play('power');
                    addLog(`Golpe de Trueno destruye ${PIECE_SYMBOLS[target.color][target.type]}!`, 'power-log');
                    gameState.activePower = null;
                    gameState.powerTargets = [];
                    levelComplete();
                    return;
                }
                board[targetRow][targetCol] = null;
                gameState.playerCaptured.push(target);
                gameState.score += PIECE_VALUES[target.type] * 10;
                AudioSystem.play('power');
                addLog(`Golpe de Trueno destruye ${PIECE_SYMBOLS[target.color][target.type]}!`, 'power-log');
            }
            gameState.activePower = null;
            gameState.powerTargets = [];
            endTurn();
        } else if (gameState.activePower === 'fireball') {
            gameState.mana -= 4;
            // Find the direction from the selected target
            const targetInfo = gameState.powerTargets.find(t => t.row === targetRow && t.col === targetCol);
            if (targetInfo) {
                const { dr, dc } = targetInfo;
                let destroyed = 0;
                let hitKing = false;
                // Destroy 3 squares in that direction starting from the adjacent square
                for (let i = 0; i < 3; i++) {
                    const r = piece.row + dr * (i + 1), c = piece.col + dc * (i + 1);
                    if (!isInBounds(r, c)) break;
                    const target = board[r][c];
                    if (target && target.color !== COLORS.WHITE) {
                        if (target.type === PIECE_TYPES.KING) {
                            hitKing = true;
                        }
                        gameState.playerCaptured.push(target);
                        gameState.score += PIECE_VALUES[target.type] * 10;
                        board[r][c] = null;
                        destroyed++;
                    } else if (target && target.color === COLORS.WHITE) {
                        // Friendly fire - also destroys own pieces (except doesn't score)
                        board[r][c] = null;
                        destroyed++;
                    }
                }
                AudioSystem.play('power');
                addLog(`¡Bola de Fuego! ${destroyed} piezas destruidas en línea.`, 'power-log');
                if (hitKing) {
                    gameState.activePower = null;
                    gameState.powerTargets = [];
                    levelComplete();
                    return;
                }
            }
            gameState.activePower = null;
            gameState.powerTargets = [];
            endTurn();
        } else if (gameState.activePower === 'spectralDash') {
            gameState.mana -= 2;
            board[piece.row][piece.col] = null;
            piece.row = targetRow;
            piece.col = targetCol;
            board[targetRow][targetCol] = piece;
            AudioSystem.play('power');
            addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} usa Paso Espectral a ${String.fromCharCode(97 + targetCol)}${8 - targetRow}!`, 'power-log');
            gameState.activePower = null;
            gameState.powerTargets = [];
            endTurn();
        }
    }

    // ========== TURN MANAGEMENT ==========
    function endTurn() {
        gameState.selectedPiece = null;
        gameState.validMoves = [];
        gameState.activePower = null;
        gameState.powerTargets = [];

        if (gameState.gameOver) return;

        if (gameState.currentTurn === COLORS.WHITE) {
            // Remove expired shields for the enemy turn about to happen
            gameState.shieldedPieces = gameState.shieldedPieces.filter(s => {
                if (s.color === COLORS.WHITE) {
                    s.turnsLeft--;
                    return s.turnsLeft >= 0;
                }
                return true;
            });
            gameState.currentTurn = COLORS.BLACK;

            // Check if AI is in checkmate or stalemate
            if (isCheckmate(COLORS.BLACK, gameState.board)) {
                addLog('¡Jaque Mate! La IA ha sido derrotada.', 'power-log');
                levelComplete();
                return;
            }
            if (isStalemate(COLORS.BLACK, gameState.board)) {
                addLog('Ahogado - la IA no tiene movimientos legales. ¡Victoria!', 'power-log');
                levelComplete();
                return;
            }
            if (isInCheck(COLORS.BLACK, gameState.board)) {
                addLog('¡Jaque al Rey negro!', 'power-log');
            }

            updateUI();
            drawBoard();
            // AI turn
            gameState.aiThinking = true;
            setTimeout(() => {
                aiTurn();
                gameState.aiThinking = false;
            }, 500 + Math.random() * 300);
        } else {
            // Remove expired shields for player pieces
            gameState.shieldedPieces = gameState.shieldedPieces.filter(s => {
                if (s.color === COLORS.BLACK) {
                    s.turnsLeft--;
                    return s.turnsLeft >= 0;
                }
                return true;
            });
            gameState.currentTurn = COLORS.WHITE;
            gameState.mana += 1;

            // Check if player is in checkmate or stalemate
            if (isCheckmate(COLORS.WHITE, gameState.board)) {
                addLog('¡Jaque Mate! Tu Rey ha caído.', 'capture-log');
                endGame();
                return;
            }
            if (isStalemate(COLORS.WHITE, gameState.board)) {
                addLog('Ahogado - no tienes movimientos legales.', 'capture-log');
                endGame();
                return;
            }
            if (isInCheck(COLORS.WHITE, gameState.board)) {
                addLog('¡Tu Rey está en Jaque! Debes protegerlo.', 'capture-log');
                gameState.inCheck = true;
            } else {
                gameState.inCheck = false;
            }

            updateUI();
            drawBoard();
        }
    }

    // ========== AI SYSTEM ==========
    function aiTurn() {
        if (gameState.gameOver) return;
        const board = gameState.board;
        const aiPieces = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] && board[r][c].color === COLORS.BLACK) {
                    aiPieces.push(board[r][c]);
                }
            }
        }

        if (aiPieces.length === 0) { levelComplete(); return; }

        const level = gameState.level;
        // AI parameters scale with level
        const aggressiveness = Math.min(level * 0.12 + 0.3, 0.95);
        const randomFactor = Math.max(60 - level * 8, 5); // Less random at higher levels
        const useLookahead = level >= 3; // From level 3+, AI considers opponent responses
        const prioritizeKingAttack = level >= 5; // From level 5+, hunts the king

        let bestMove = null;
        let bestScore = -Infinity;

        for (const piece of aiPieces) {
            const moves = getLegalMoves(piece, board);
            for (const move of moves) {
                let moveScore = 0;
                const target = board[move.row][move.col];

                // === CAPTURE EVALUATION ===
                if (target) {
                    if (isShielded(target)) {
                        moveScore -= 100;
                    } else {
                        moveScore += PIECE_VALUES[target.type] * 100 * (1 + aggressiveness);
                        if (target.type === PIECE_TYPES.KING) moveScore += 50000;
                    }
                }

                // === POSITIONAL SCORING ===
                // Center control
                const centerDist = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
                moveScore += (7 - centerDist) * (2 + level * 0.5);

                // Pawn advancement (stronger at higher levels)
                if (piece.type === PIECE_TYPES.PAWN) {
                    moveScore += (move.row - piece.row) * (5 + level * 2);
                    // Bonus for pawns near promotion
                    if (move.row >= 5) moveScore += (move.row - 4) * 15 * aggressiveness;
                }

                // === KING HUNTING (level 5+) ===
                if (prioritizeKingAttack) {
                    const playerKing = findKing(COLORS.WHITE, board);
                    if (playerKing) {
                        const distToKing = Math.abs(move.row - playerKing.row) + Math.abs(move.col - playerKing.col);
                        moveScore += (14 - distToKing) * (3 + level);
                    }
                }

                // === PIECE DEVELOPMENT ===
                // Encourage moving pieces off back rank early
                if (piece.row === 0 && piece.type !== PIECE_TYPES.PAWN) {
                    moveScore += 8 * aggressiveness;
                }

                // Knights and bishops benefit from central positions
                if (piece.type === PIECE_TYPES.KNIGHT || piece.type === PIECE_TYPES.BISHOP) {
                    moveScore += (7 - centerDist) * (1 + level * 0.3);
                }

                // === SAFETY EVALUATION (level 2+) ===
                if (level >= 2) {
                    // Check if the destination is attacked by player
                    if (isSquareAttacked(move.row, move.col, COLORS.WHITE, board)) {
                        moveScore -= PIECE_VALUES[piece.type] * 30 * aggressiveness;
                    }
                    // Bonus for moving away from attacked squares
                    if (isSquareAttacked(piece.row, piece.col, COLORS.WHITE, board)) {
                        moveScore += PIECE_VALUES[piece.type] * 20;
                    }
                }

                // === CHECK BONUS (level 3+) ===
                if (level >= 3) {
                    const simBoard = simulateMove(piece, move.row, move.col, board);
                    if (isInCheck(COLORS.WHITE, simBoard)) {
                        moveScore += 80 + level * 10; // Big bonus for giving check
                    }
                }

                // === LOOKAHEAD (level 3+): consider opponent's best response ===
                if (useLookahead && level >= 4) {
                    const simBoard = simulateMove(piece, move.row, move.col, board);
                    let worstLoss = 0;
                    // See if opponent can capture our piece after we move
                    for (let pr = 0; pr < 8; pr++) {
                        for (let pc = 0; pc < 8; pc++) {
                            const pp = simBoard[pr][pc];
                            if (pp && pp.color === COLORS.WHITE) {
                                const pMoves = getValidMoves(pp, simBoard);
                                for (const pm of pMoves) {
                                    if (pm.row === move.row && pm.col === move.col) {
                                        worstLoss = Math.max(worstLoss, PIECE_VALUES[piece.type] * 50);
                                    }
                                }
                            }
                        }
                    }
                    moveScore -= worstLoss;
                }

                // === COORDINATION (level 6+): support allies ===
                if (level >= 6) {
                    // Bonus if we protect another piece
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = move.row + dr, nc = move.col + dc;
                            if (isInBounds(nr, nc) && board[nr][nc] && board[nr][nc].color === COLORS.BLACK) {
                                moveScore += 5;
                            }
                        }
                    }
                }

                // === RANDOMNESS (decreases with level) ===
                moveScore += Math.random() * randomFactor;

                if (moveScore > bestScore) {
                    bestScore = moveScore;
                    bestMove = { piece, move };
                }
            }
        }

        if (bestMove) {
            movePiece(bestMove.piece, bestMove.move.row, bestMove.move.col);
            if (!gameState.gameOver) {
                endTurn();
            }
        } else {
            addLog('IA sin movimientos - victoria por ahogado!', 'power-log');
            levelComplete();
        }
        drawBoard();
    }

    // ========== GAME FLOW ==========
    function endGame() {
        gameState.gameOver = true;
        AudioSystem.play('gameover');

        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('powerChessHighScore', gameState.highScore.toString());
        }

        document.querySelector('#modal-level span').textContent = gameState.level;
        document.querySelector('#modal-score span').textContent = gameState.score;
        document.querySelector('#modal-highscore span').textContent = gameState.highScore;

        const capturedStr = gameState.aiCaptured.map(p => PIECE_SYMBOLS[p.color][p.type]).join(' ');
        document.getElementById('captured-list').textContent = capturedStr || 'Ninguna';

        gameOverModal.classList.remove('hidden');
        updateUI();
    }

    function levelComplete() {
        gameState.gameOver = true;
        AudioSystem.play('levelup');
        gameState.score += gameState.level * 50; // Level bonus

        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('powerChessHighScore', gameState.highScore.toString());
        }

        document.querySelector('#levelup-text span').textContent = gameState.level + 1;
        levelUpModal.classList.remove('hidden');
        updateUI();
    }

    // ========== UI UPDATES ==========
    function updateUI() {
        levelDisplay.textContent = gameState.level;
        scoreDisplay.textContent = gameState.score;
        highscoreDisplay.textContent = gameState.highScore;
        manaDisplay.textContent = gameState.mana;

        if (gameState.currentTurn === COLORS.WHITE) {
            turnIndicator.textContent = 'Turno: Jugador (Blanco)';
            turnIndicator.style.borderColor = '#6d28d9';
        } else {
            turnIndicator.textContent = 'Turno: IA (Negro)';
            turnIndicator.style.borderColor = '#dc2626';
        }

        updatePowerButtons();
    }

    function updatePowerButtons() {
        const piece = gameState.selectedPiece;
        btnShadowJump.disabled = true;
        btnThunderStrike.disabled = true;
        btnSacredShield.disabled = true;
        btnDefenseShout.disabled = true;
        btnFireball.disabled = true;
        btnSpectralDash.disabled = true;

        if (!piece || gameState.currentTurn !== COLORS.WHITE || piece.color !== COLORS.WHITE) {
            powerHint.textContent = 'Selecciona una pieza para ver sus poderes';
            return;
        }

        powerHint.textContent = `Pieza: ${PIECE_SYMBOLS[piece.color][piece.type]} ${piece.type}`;

        if (piece.type === PIECE_TYPES.KNIGHT && gameState.mana >= 2) {
            btnShadowJump.disabled = false;
        }
        if (piece.type === PIECE_TYPES.ROOK && gameState.mana >= 3) {
            btnThunderStrike.disabled = false;
        }
        if (piece.type === PIECE_TYPES.KING && gameState.mana >= 3) {
            btnSacredShield.disabled = false;
        }
        if (piece.type === PIECE_TYPES.KING && gameState.mana >= 4) {
            btnDefenseShout.disabled = false;
        }
        if (piece.type === PIECE_TYPES.QUEEN && gameState.mana >= 4) {
            btnFireball.disabled = false;
        }
        if (piece.type === PIECE_TYPES.BISHOP && gameState.mana >= 2) {
            btnSpectralDash.disabled = false;
        }
    }

    function addLog(message, className) {
        const li = document.createElement('li');
        li.textContent = message;
        if (className) li.className = className;
        actionLog.insertBefore(li, actionLog.firstChild);
        // Keep max 30 entries
        while (actionLog.children.length > 30) {
            actionLog.removeChild(actionLog.lastChild);
        }
    }

    // ========== RENDERING ==========
    function drawBoard() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw tiles
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isLight = (r + c) % 2 === 0;
                ctx.fillStyle = isLight ? '#2d1b4e' : '#1a0f2e';
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw selected highlight
        if (gameState.selectedPiece) {
            const p = gameState.selectedPiece;
            ctx.fillStyle = 'rgba(124, 58, 237, 0.4)';
            ctx.fillRect(p.col * TILE_SIZE, p.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        // Draw valid moves
        for (const move of gameState.validMoves) {
            const target = gameState.board[move.row][move.col];
            if (gameState.activePower === 'thunderStrike') {
                // Red indicator for thunder targets
                ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
                ctx.fillRect(move.col * TILE_SIZE, move.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (target) {
                // Capture indicator
                ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
                ctx.fillRect(move.col * TILE_SIZE, move.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
                // Move dot
                ctx.fillStyle = 'rgba(167, 139, 250, 0.5)';
                ctx.beginPath();
                ctx.arc(move.col * TILE_SIZE + TILE_SIZE / 2, move.row * TILE_SIZE + TILE_SIZE / 2, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw shielded indicators
        for (const shield of gameState.shieldedPieces) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(shield.col * TILE_SIZE + TILE_SIZE / 2, shield.row * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw check indicator (red glow on king in check)
        if (gameState.inCheck && gameState.currentTurn === COLORS.WHITE) {
            const king = findKing(COLORS.WHITE, gameState.board);
            if (king) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                ctx.fillRect(king.col * TILE_SIZE, king.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                ctx.strokeRect(king.col * TILE_SIZE + 2, king.row * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }
        // Also show check on AI king for visual feedback
        if (isInCheck(COLORS.BLACK, gameState.board) && !gameState.gameOver) {
            const king = findKing(COLORS.BLACK, gameState.board);
            if (king) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                ctx.fillRect(king.col * TILE_SIZE, king.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                ctx.strokeRect(king.col * TILE_SIZE + 2, king.row * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }

        // Draw pieces
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '44px serif';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = gameState.board[r][c];
                if (piece) {
                    // Piece shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillText(PIECE_SYMBOLS[piece.color][piece.type], c * TILE_SIZE + TILE_SIZE / 2 + 2, r * TILE_SIZE + TILE_SIZE / 2 + 2);
                    // Piece
                    ctx.fillStyle = piece.color === COLORS.WHITE ? '#93c5fd' : '#fca5a5';
                    ctx.fillText(PIECE_SYMBOLS[piece.color][piece.type], c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }

        // Draw coordinates
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6b7280';
        for (let i = 0; i < 8; i++) {
            ctx.textAlign = 'left';
            ctx.fillText(String.fromCharCode(97 + i), i * TILE_SIZE + 4, CANVAS_SIZE - 4);
            ctx.textAlign = 'right';
            ctx.fillText(8 - i, CANVAS_SIZE - 4, i * TILE_SIZE + 14);
        }
    }

    // ========== INPUT HANDLING ==========
    canvas.addEventListener('click', function(e) {
        if (gameState.gameOver || gameState.aiThinking || gameState.currentTurn !== COLORS.WHITE || gameState.promotingPawn) return;

        // Ensure audio context is initialized on user interaction
        if (!AudioSystem.ctx) AudioSystem.init();

        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const col = Math.floor((e.clientX - rect.left) * scaleX / TILE_SIZE);
        const row = Math.floor((e.clientY - rect.top) * scaleY / TILE_SIZE);

        if (!isInBounds(row, col)) return;

        // If a power is active, handle power target
        if (gameState.activePower) {
            const isValidTarget = gameState.powerTargets.some(t => t.row === row && t.col === col);
            if (isValidTarget) {
                executePower(row, col);
            } else {
                // Cancel power
                gameState.activePower = null;
                gameState.powerTargets = [];
                gameState.validMoves = gameState.selectedPiece ? getLegalMoves(gameState.selectedPiece, gameState.board) : [];
                drawBoard();
            }
            return;
        }

        const clickedPiece = gameState.board[row][col];

        // If we have a selected piece and clicked a valid move
        if (gameState.selectedPiece) {
            const isValidMove = gameState.validMoves.some(m => m.row === row && m.col === col);
            if (isValidMove) {
                const success = movePiece(gameState.selectedPiece, row, col);
                if (success === 'promoting') {
                    // Wait for promotion choice before ending turn
                    drawBoard();
                    return;
                }
                if (success && !gameState.gameOver) {
                    endTurn();
                }
                drawBoard();
                return;
            }
        }

        // Select a piece
        if (clickedPiece && clickedPiece.color === COLORS.WHITE) {
            gameState.selectedPiece = clickedPiece;
            gameState.validMoves = getLegalMoves(clickedPiece, gameState.board);
            updatePowerButtons();
        } else {
            gameState.selectedPiece = null;
            gameState.validMoves = [];
            updatePowerButtons();
        }

        drawBoard();
    });

    // Power buttons
    btnShadowJump.addEventListener('click', () => activatePower('shadowJump'));
    btnThunderStrike.addEventListener('click', () => activatePower('thunderStrike'));
    btnSacredShield.addEventListener('click', () => activatePower('sacredShield'));
    btnDefenseShout.addEventListener('click', () => activatePower('defenseShout'));
    btnFireball.addEventListener('click', () => activatePower('fireball'));
    btnSpectralDash.addEventListener('click', () => activatePower('spectralDash'));

    // Promotion modal
    function showPromotionModal() {
        promotionModal.classList.remove('hidden');
    }

    document.querySelectorAll('.promo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const chosenType = this.getAttribute('data-piece');
            const pawn = gameState.promotingPawn;
            if (pawn) {
                pawn.type = chosenType;
                addLog(`${PIECE_SYMBOLS[pawn.color].pawn} promociona a ${PIECE_SYMBOLS[pawn.color][chosenType]}!`, 'power-log');
                gameState.promotingPawn = null;
                promotionModal.classList.add('hidden');
                drawBoard();
                if (!gameState.gameOver) {
                    endTurn();
                }
            }
        });
    });

    // Modal buttons
    btnRetry.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        resetGame(false);
    });

    btnNextLevel.addEventListener('click', () => {
        levelUpModal.classList.add('hidden');
        gameState.level++;
        gameState.gameOver = false;
        resetGame(true);
        addLog(`--- Nivel ${gameState.level} ---`, 'power-log');
    });

    // ========== INITIALIZATION ==========
    function init() {
        highscoreDisplay.textContent = gameState.highScore;
        resetGame(false);
        addLog('Bienvenido a Power Chess: Spellbound Tactics!', 'power-log');
        addLog('Selecciona una pieza y mueve o usa poderes.');
    }

    init();
})();
