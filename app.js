const express = require('express')
const socket = require('socket.io')
const http = require("http")
const { Chess } = require("chess.js")
const path = require('path')
const { title } = require('process')
const app = express()

const server = http.createServer(app)
const io = socket(server)

const chess = new Chess()

let players = {};
let crntplayer = "w";
app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" })
})
io.on("connection", (uniquesocket) => {
    console.log("connected")
    //   who connects first gets white and stored in palyers={"white":"4yu7mjm,xc,xuijkk"} any unique socket id
    if (!players.White) {
        players.White = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    }
    //   who connects second gets black and stored in palyers={"white":"4yu7mjm,xc,xuijkk","black":"jh"} any unique socket id
    else if (!players.Black) {
        players.Black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    //  who connects later only can watch the game
    else {
        uniquesocket.emit("spectatorRole");
    }
    uniquesocket.on("disconnect", () => {
        //  when  white disconnects  uski role players wale se hta do
        if (uniquesocket.id == players.White) {
            delete players.White;
        }
        else if (uniquesocket.id == players.Black) {
            delete players.Black;
        }
        console.log("disconnected");
    })
    //  jab bhi like frontend se move function hoga jo socket recive krega 
    // first check k kis player ki turn hn black ya white
    // second hum check krenge ke vo valid move hn 
    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() == 'w' && uniquesocket.id != players.White) return;
            if (chess.turn() == 'b' && uniquesocket.id != players.Black) return;
            const result = chess.move(move);
            if (result) {
                crntplayer = chess.turn();
                //  agar vo valid move hn toh vo sabke board pe dikhyai de to 
                // frontend pe bhej rhe hn
                io.emit("move", move);
                // chess  board ki current state koi bhi jo hmare pass elements
                //  hn kha pe hn vo fen equation se pta chlti hn 
                io.emit("boardState", chess.fen())
            }
            else {
                console.log("Invalid move:", move);
                uniquesocket.emit("Invalid move, Please make valid move");
            }

        }
        catch (error) {
            console.log("error", error);
        }
    })
})

server.listen(3000, () => {
    console.log("server is listeing")
})