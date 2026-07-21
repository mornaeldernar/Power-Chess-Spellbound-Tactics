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
        promotingPawn: null,
        enPassantTarget: null,
        skipNextTurn: false,
        positionHistory: []  // For threefold repetition detection
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
    const btnChaos = document.getElementById('btn-chaos');
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
        gameState.enPassantTarget = null;
        gameState.skipNextTurn = false;
        gameState.positionHistory = [];
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
                // En passant
                if (gameState.enPassantTarget) {
                    const ep = gameState.enPassantTarget;
                    for (const dc of [-1, 1]) {
                        const r = row + dir, c = col + dc;
                        if (r === ep.row && c === ep.col) {
                            moves.push({ row: r, col: c, enPassant: true });
                        }
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
                // Castling
                if (!piece.hasMoved && !isSquareAttacked(row, col, enemy, board)) {
                    // King-side castling (short)
                    const rookKS = board[row][7];
                    if (rookKS && rookKS.type === PIECE_TYPES.ROOK && rookKS.color === color && !rookKS.hasMoved) {
                        if (!board[row][5] && !board[row][6]) {
                            if (!isSquareAttacked(row, 5, enemy, board) && !isSquareAttacked(row, 6, enemy, board)) {
                                moves.push({ row, col: 6, castling: 'kingside' });
                            }
                        }
                    }
                    // Queen-side castling (long)
                    const rookQS = board[row][0];
                    if (rookQS && rookQS.type === PIECE_TYPES.ROOK && rookQS.color === color && !rookQS.hasMoved) {
                        if (!board[row][1] && !board[row][2] && !board[row][3]) {
                            if (!isSquareAttacked(row, 2, enemy, board) && !isSquareAttacked(row, 3, enemy, board)) {
                                moves.push({ row, col: 2, castling: 'queenside' });
                            }
                        }
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
                const moves = getAttackMoves(p, board);
                if (moves.some(m => m.row === row && m.col === col)) return true;
            }
        }
        return false;
    }

    // getAttackMoves returns squares a piece attacks (NO castling, NO en passant target check)
    // This avoids infinite recursion since castling validation calls isSquareAttacked
    function getAttackMoves(piece, board) {
        const moves = [];
        const { type, color, row, col } = piece;
        const enemy = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

        // Pawns attack diagonally regardless of occupancy
        if (type === PIECE_TYPES.PAWN) {
            const dir = color === COLORS.WHITE ? -1 : 1;
            for (const dc of [-1, 1]) {
                const r = row + dir, c = col + dc;
                if (isInBounds(r, c)) moves.push({ row: r, col: c });
            }
            return moves;
        }

        function addMove(r, c) {
            if (!isInBounds(r, c)) return;
            const target = board[r][c];
            if (!target || target.color === enemy) moves.push({ row: r, col: c });
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
                // King attacks adjacent squares only (no castling)
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

    function simulateMove(piece, toRow, toCol, board, moveFlags) {
        // Create a shallow copy of the board to test a move
        const newBoard = board.map(row => row.slice());
        newBoard[piece.row][piece.col] = null;
        // Create a temporary piece at the destination
        const movedPiece = { ...piece, row: toRow, col: toCol };
        newBoard[toRow][toCol] = movedPiece;

        // Simulate en passant capture
        if (moveFlags && moveFlags.enPassant && piece.type === PIECE_TYPES.PAWN) {
            const capturedRow = piece.color === COLORS.WHITE ? toRow + 1 : toRow - 1;
            newBoard[capturedRow][toCol] = null;
        }

        // Simulate castling rook move
        if (moveFlags && moveFlags.castling && piece.type === PIECE_TYPES.KING) {
            if (moveFlags.castling === 'kingside') {
                const rook = newBoard[piece.row][7];
                newBoard[piece.row][7] = null;
                newBoard[piece.row][5] = rook ? { ...rook, col: 5 } : null;
            } else if (moveFlags.castling === 'queenside') {
                const rook = newBoard[piece.row][0];
                newBoard[piece.row][0] = null;
                newBoard[piece.row][3] = rook ? { ...rook, col: 3 } : null;
            }
        }

        return newBoard;
    }

    function getLegalMoves(piece, board) {
        if (!piece) return [];
        const raw = getValidMoves(piece, board);
        // Filter: only moves that don't leave own king in check
        return raw.filter(move => {
            const flags = {};
            if (move.enPassant) flags.enPassant = true;
            if (move.castling) flags.castling = move.castling;
            const simBoard = simulateMove(piece, move.row, move.col, board, flags);
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

    // ========== DRAW DETECTION ==========
    function getBoardHash(board, turn) {
        // Create a string representation of the board position + whose turn
        let hash = turn === COLORS.WHITE ? 'w' : 'b';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p) {
                    hash += p.color[0] + p.type[0] + r + c;
                } else {
                    hash += '.';
                }
            }
        }
        return hash;
    }

    function recordPosition() {
        const hash = getBoardHash(gameState.board, gameState.currentTurn);
        gameState.positionHistory.push(hash);
    }

    function isThreefoldRepetition() {
        const current = getBoardHash(gameState.board, gameState.currentTurn);
        let count = 0;
        for (const pos of gameState.positionHistory) {
            if (pos === current) count++;
            if (count >= 3) return true;
        }
        return false;
    }

    function isInsufficientMaterial(board) {
        const pieces = { white: [], black: [] };
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p) pieces[p.color].push(p.type);
            }
        }

        const w = pieces.white.filter(t => t !== PIECE_TYPES.KING);
        const b = pieces.black.filter(t => t !== PIECE_TYPES.KING);

        // King vs King
        if (w.length === 0 && b.length === 0) return true;
        // King + Bishop vs King
        if (w.length === 1 && w[0] === PIECE_TYPES.BISHOP && b.length === 0) return true;
        if (b.length === 1 && b[0] === PIECE_TYPES.BISHOP && w.length === 0) return true;
        // King + Knight vs King
        if (w.length === 1 && w[0] === PIECE_TYPES.KNIGHT && b.length === 0) return true;
        if (b.length === 1 && b[0] === PIECE_TYPES.KNIGHT && w.length === 0) return true;
        // King + Bishop vs King + Bishop (same color diagonals)
        if (w.length === 1 && w[0] === PIECE_TYPES.BISHOP && b.length === 1 && b[0] === PIECE_TYPES.BISHOP) {
            // Find bishop positions
            let wBishopLight = false, bBishopLight = false;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = board[r][c];
                    if (p && p.type === PIECE_TYPES.BISHOP) {
                        if (p.color === COLORS.WHITE) wBishopLight = (r + c) % 2 === 0;
                        else bBishopLight = (r + c) % 2 === 0;
                    }
                }
            }
            if (wBishopLight === bBishopLight) return true;
        }

        return false;
    }

    function checkDrawConditions() {
        if (isInsufficientMaterial(gameState.board)) {
            addLog('Empate por material insuficiente.', 'power-log');
            triggerDraw('Material insuficiente para jaque mate.');
            return true;
        }
        if (isThreefoldRepetition()) {
            addLog('Empate por triple repetición.', 'power-log');
            triggerDraw('Posición repetida 3 veces.');
            return true;
        }
        return false;
    }

    function triggerDraw(reason) {
        gameState.gameOver = true;
        AudioSystem.play('gameover');

        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('powerChessHighScore', gameState.highScore.toString());
        }

        document.querySelector('#draw-reason').textContent = reason;
        document.querySelector('#draw-level span').textContent = gameState.level;
        document.querySelector('#draw-score span').textContent = gameState.score;
        document.getElementById('draw-modal').classList.remove('hidden');
        updateUI();
    }

    // ========== MOVE EXECUTION ==========
    function movePiece(piece, toRow, toCol, moveFlags) {
        const board = gameState.board;
        const captured = board[toRow][toCol];
        if (!moveFlags) moveFlags = {};

        // Check shield
        if (captured && isShielded(captured)) {
            addLog(`${PIECE_SYMBOLS[captured.color][captured.type]} protegido por Escudo Sagrado!`, 'power-log');
            return false;
        }

        const fromRow = piece.row;
        const fromCol = piece.col;
        board[piece.row][piece.col] = null;

        // Handle en passant capture
        if (moveFlags.enPassant && piece.type === PIECE_TYPES.PAWN) {
            const capturedPawnRow = piece.color === COLORS.WHITE ? toRow + 1 : toRow - 1;
            const capturedPawn = board[capturedPawnRow][toCol];
            if (capturedPawn) {
                board[capturedPawnRow][toCol] = null;
                if (piece.color === COLORS.WHITE) {
                    gameState.playerCaptured.push(capturedPawn);
                    gameState.score += PIECE_VALUES[capturedPawn.type] * 10;
                } else {
                    gameState.aiCaptured.push(capturedPawn);
                }
                AudioSystem.play('capture');
                addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} captura al paso ${PIECE_SYMBOLS[capturedPawn.color][capturedPawn.type]}`, 'capture-log');
            }
        } else if (captured) {
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
        } else if (!moveFlags.enPassant) {
            AudioSystem.play('move');
            addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} mueve a ${String.fromCharCode(97 + toCol)}${8 - toRow}`);
        }

        piece.row = toRow;
        piece.col = toCol;
        piece.hasMoved = true;
        board[toRow][toCol] = piece;

        // Handle castling - move the rook
        if (moveFlags.castling && piece.type === PIECE_TYPES.KING) {
            if (moveFlags.castling === 'kingside') {
                const rook = board[fromRow][7];
                if (rook) {
                    board[fromRow][7] = null;
                    rook.row = fromRow;
                    rook.col = 5;
                    rook.hasMoved = true;
                    board[fromRow][5] = rook;
                }
                addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} enroque corto`, 'power-log');
            } else if (moveFlags.castling === 'queenside') {
                const rook = board[fromRow][0];
                if (rook) {
                    board[fromRow][0] = null;
                    rook.row = fromRow;
                    rook.col = 3;
                    rook.hasMoved = true;
                    board[fromRow][3] = rook;
                }
                addLog(`${PIECE_SYMBOLS[piece.color][piece.type]} enroque largo`, 'power-log');
            }
        }

        // Update en passant target
        if (piece.type === PIECE_TYPES.PAWN && Math.abs(toRow - fromRow) === 2) {
            // Pawn moved 2 squares - set en passant target
            const epRow = (fromRow + toRow) / 2;
            gameState.enPassantTarget = { row: epRow, col: toCol, color: piece.color };
        } else {
            gameState.enPassantTarget = null;
        }

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
    function randomizeBoard() {
        // Create a valid random position: both kings present, pieces placed randomly
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));
        const allSquares = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                allSquares.push({ row: r, col: c });
            }
        }

        // Shuffle squares
        for (let i = allSquares.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allSquares[i], allSquares[j]] = [allSquares[j], allSquares[i]];
        }

        let idx = 0;

        // Place kings first (mandatory) - kings can't be on rows 0/7 adjacent to each other
        const wKingPos = allSquares[idx++];
        board[wKingPos.row][wKingPos.col] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, wKingPos.row, wKingPos.col);

        // Place black king at least 2 squares away from white king
        let bKingPos = null;
        for (let i = idx; i < allSquares.length; i++) {
            const s = allSquares[i];
            const dist = Math.abs(s.row - wKingPos.row) + Math.abs(s.col - wKingPos.col);
            if (dist >= 2) {
                bKingPos = s;
                allSquares.splice(i, 1);
                break;
            }
        }
        if (!bKingPos) bKingPos = allSquares[idx++];
        board[bKingPos.row][bKingPos.col] = createPiece(PIECE_TYPES.KING, COLORS.BLACK, bKingPos.row, bKingPos.col);

        // Collect remaining pieces from current board (excluding kings)
        const whitePieces = [];
        const blackPieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = gameState.board[r][c];
                if (p && p.type !== PIECE_TYPES.KING) {
                    if (p.color === COLORS.WHITE) whitePieces.push(p.type);
                    else blackPieces.push(p.type);
                }
            }
        }

        // Place white pieces
        for (const type of whitePieces) {
            if (idx >= allSquares.length) break;
            const pos = allSquares[idx++];
            // Pawns can't be on rank 0 or 7
            let finalPos = pos;
            if (type === PIECE_TYPES.PAWN && (pos.row === 0 || pos.row === 7)) {
                // Find a valid square
                for (let i = idx; i < allSquares.length; i++) {
                    if (allSquares[i].row !== 0 && allSquares[i].row !== 7) {
                        finalPos = allSquares[i];
                        allSquares[i] = pos;
                        break;
                    }
                }
            }
            board[finalPos.row][finalPos.col] = createPiece(type, COLORS.WHITE, finalPos.row, finalPos.col);
        }

        // Place black pieces
        for (const type of blackPieces) {
            if (idx >= allSquares.length) break;
            const pos = allSquares[idx++];
            let finalPos = pos;
            if (type === PIECE_TYPES.PAWN && (pos.row === 0 || pos.row === 7)) {
                for (let i = idx; i < allSquares.length; i++) {
                    if (allSquares[i].row !== 0 && allSquares[i].row !== 7) {
                        finalPos = allSquares[i];
                        allSquares[i] = pos;
                        break;
                    }
                }
            }
            board[finalPos.row][finalPos.col] = createPiece(type, COLORS.BLACK, finalPos.row, finalPos.col);
        }

        gameState.board = board;
        gameState.shieldedPieces = [];
        gameState.enPassantTarget = null;
        gameState.selectedPiece = null;
        gameState.validMoves = [];
    }

    function activatePower(powerType) {
        if (gameState.currentTurn !== COLORS.WHITE) return;

        // Chaos doesn't require a selected piece
        if (powerType === 'chaos') {
            if (gameState.mana < 1000) return;
            gameState.mana -= 1000;
            randomizeBoard();
            AudioSystem.play('power');
            addLog('¡Caos Dimensional! El tablero ha sido alterado. Pierdes un turno.', 'power-log');
            gameState.skipNextTurn = true;
            endTurn();
            updateUI();
            return;
        }

        const piece = gameState.selectedPiece;
        if (!piece) return;

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

            // Record position and check draw
            recordPosition();
            if (checkDrawConditions()) return;

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

            // Record position and check draw
            recordPosition();
            if (checkDrawConditions()) return;

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

            // Skip player turn if chaos was used
            if (gameState.skipNextTurn) {
                gameState.skipNextTurn = false;
                addLog('Turno perdido por Caos Dimensional.', 'power-log');
                gameState.currentTurn = COLORS.BLACK;
                updateUI();
                drawBoard();
                gameState.aiThinking = true;
                setTimeout(() => {
                    aiTurn();
                    gameState.aiThinking = false;
                }, 500 + Math.random() * 300);
                return;
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
            const flags = {};
            if (bestMove.move.enPassant) flags.enPassant = true;
            if (bestMove.move.castling) flags.castling = bestMove.move.castling;
            movePiece(bestMove.piece, bestMove.move.row, bestMove.move.col, flags);
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
        btnChaos.disabled = true;

        // Chaos is available anytime with enough mana (no piece selection needed)
        if (gameState.currentTurn === COLORS.WHITE && gameState.mana >= 1000 && !gameState.gameOver) {
            btnChaos.disabled = false;
        }

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
        const colors = getThemeColors();
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw tiles
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isLight = (r + c) % 2 === 0;
                ctx.fillStyle = isLight ? colors.tileLight : colors.tileDark;
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
            } else if (move.castling) {
                // Castling indicator (blue-green)
                ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
                ctx.fillRect(move.col * TILE_SIZE, move.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (move.enPassant) {
                // En passant indicator (orange)
                ctx.fillStyle = 'rgba(251, 146, 60, 0.45)';
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
                    ctx.fillStyle = piece.color === COLORS.WHITE ? colors.pieceWhite : colors.pieceBlack;
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
                // Find the move to get flags (enPassant, castling)
                const matchedMove = gameState.validMoves.find(m => m.row === row && m.col === col);
                const flags = {};
                if (matchedMove && matchedMove.enPassant) flags.enPassant = true;
                if (matchedMove && matchedMove.castling) flags.castling = matchedMove.castling;
                const success = movePiece(gameState.selectedPiece, row, col, flags);
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
    btnChaos.addEventListener('click', () => activatePower('chaos'));

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

    document.getElementById('btn-draw-retry').addEventListener('click', () => {
        document.getElementById('draw-modal').classList.add('hidden');
        resetGame(false);
    });

    btnNextLevel.addEventListener('click', () => {
        levelUpModal.classList.add('hidden');
        gameState.level++;
        gameState.gameOver = false;
        resetGame(true);
        addLog(`--- Nivel ${gameState.level} ---`, 'power-log');
    });

    // ========== THEME TOGGLE ==========
    const btnTheme = document.getElementById('btn-theme');
    let currentTheme = localStorage.getItem('powerChessTheme') || 'default';
    if (currentTheme === 'codigofacilito') {
        document.body.classList.add('theme-codigofacilito');
    }

    btnTheme.addEventListener('click', () => {
        document.body.classList.toggle('theme-codigofacilito');
        currentTheme = document.body.classList.contains('theme-codigofacilito') ? 'codigofacilito' : 'default';
        localStorage.setItem('powerChessTheme', currentTheme);
        drawBoard();
    });

    function getThemeColors() {
        const style = getComputedStyle(document.body);
        return {
            tileLight: style.getPropertyValue('--tile-light').trim(),
            tileDark: style.getPropertyValue('--tile-dark').trim(),
            pieceWhite: style.getPropertyValue('--piece-white').trim(),
            pieceBlack: style.getPropertyValue('--piece-black').trim(),
            accent: style.getPropertyValue('--accent').trim(),
            borderAccent: style.getPropertyValue('--border-accent').trim()
        };
    }

    // ========== INITIALIZATION ==========
    function init() {
        highscoreDisplay.textContent = gameState.highScore;
        resetGame(false);
        addLog('Bienvenido a Power Chess: Spellbound Tactics!', 'power-log');
        addLog('Selecciona una pieza y mueve o usa poderes.');
    }

    init();
})();
