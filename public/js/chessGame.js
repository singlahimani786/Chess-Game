const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

//  jab bhi player connect hoga usse role and board assign krne ke liye
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowidx) => {

        //  ek row milekgi from total 8 rows 
        //  row 0,1 are black vale elements 
        //  row 6,7 white elemts baki null like khali
        //   har ek row mein jo bhi elent hoga like rani 
        row.forEach((piece_square, squareidx) => {
            //  yeh white and blavk squared pattern create krne ke liye
            const squareEle = document.createElement("div");
            squareEle.classList.add("square",
                (rowidx + squareidx) % 2 === 0 ? "light" : "dark");

            //  har ek square ke pass values hn like its row idx and col idx
            squareEle.dataset.row = rowidx;
            squareEle.dataset.col = squareidx;

            //   if square mein uss square pe koi piece hn toh 
            if (piece_square) {

                const pieceElement = document.createElement("div");
                console.log("piece color is", piece_square.color);
                pieceElement.classList.add("piece", piece_square.color === "w" ? "white" : "black")
                //  piece ko hum unicodewale function ke throgh prit krvayenge abhi ke liye
                pieceElement.innerText = getPieceUnicode(piece_square);
                //  jis bhi player ki turn hn vo playerRole mein set hogi toh uske piece hi draggable hone chahiye
                pieceElement.draggable = (playerRole === piece_square.color);

                pieceElement.addEventListener("dragstart", (event) => {
                    // agar vo piece draggable hn toh dekhenge k kis souce square se utha uska row and col
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowidx, col: squareidx };
                        event.dataTransfer.setData("text/plain", "");
                    }
                });


                pieceElement.addEventListener("dragend", (event) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareEle.appendChild(pieceElement);
            }
            squareEle.addEventListener("dragover", (e) => {
                e.preventDefault();
            });
            squareEle.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    //  target vale ka row and col set krdiya
                    const targetSource = {
                        row: parseInt(squareEle.dataset.row),
                        col: parseInt(squareEle.dataset.col),
                    }
                    //  source wae se target square par piece ko move krdo
                    handleMove(sourceSquare, targetSource);
                }
            });
            boardElement.appendChild(squareEle);
        });

    });


    if (playerRole == 'b') {
        boardElement.classList.add("flipped");
    }
    else {
        boardElement.classList.remove("flipped");
    }

};

//  moves ko dikhane ke liye like jo bhi valid elementsmove huhn abhi
const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    }
    socket.emit("move", move);
}

// elents ki shakal leke ana ke liye
const getPieceUnicode = (piece) => {
    const uniCodePieces = {
        'p': '♙',
        'r': '♜',
        'n': '♞',
        'b': '♝',
        'q': '♛',
        'k': '♚',
        'P': '♙',
        'R': '♖',
        'N': '♘',
        'B': '♗',
        'Q': '♕',
        'K': '♔',
    }
    return uniCodePieces[piece.type] || "";
}


socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
})


socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
})

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
})

socket.on("move", (fen) => {
    chess.move(fen);
    renderBoard();
})

renderBoard();