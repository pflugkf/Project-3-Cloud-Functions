const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const DEBUG = true;

//Constants
const base_collection = "unoGames";
const user1DeckCollection = "user1";
const user2DeckCollection = "user2";
const topCollection = "top";
const deckCollection = "deck";

//createGame({uid: "Eqc3cZoOlyW15uNuIic05vO0nGH2"})
exports.createGame = functions.https.onCall(async (data, context) => {
    const uid = isAuthenticated(data, context);
    if (uid) {
        const docRef = admin.firestore().collection(base_collection).doc();

        const data = {
            user1Id: uid,
            docId: docRef.id,
            status: false,
            exitStatus: false,
            turn: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await docRef.set(data);

        var deckCards = getDeckCards();
        var usersCards = getUserCards(deckCards);
        var topCard = getTopCard(deckCards);
        var deckArray = getArrayFromMap(deckCards);
        var user1Array = getArrayFromMap(usersCards.user1);
        var user2Array = getArrayFromMap(usersCards.user2);
        
        for(let i = 0; i < deckArray.length; i++){
            await admin.firestore().collection(base_collection).doc(data.docId).collection(deckCollection).doc(deckArray[i].id.toString()).set(deckArray[i]);
        }

        for(let i = 0; i < user1Array.length; i++){
            await admin.firestore().collection(base_collection).doc(data.docId).collection(user1DeckCollection).doc(user1Array[i].id.toString()).set(user1Array[i]);
        }

        for(let i = 0; i < user2Array.length; i++){
            await admin.firestore().collection(base_collection).doc(data.docId).collection(user2DeckCollection).doc(user2Array[i].id.toString()).set(user2Array[i]);
        }
        
        await admin.firestore().collection(base_collection).doc(data.docId).collection(topCollection).doc(topCard.id.toString()).set(topCard);

        return { docId: docRef.id };
    } else {
        //throw an exception ..
        throw new functions.https.HttpsError("aborted", "Error!!");
        return {};
    }
});

//joinGame({uid: "zCg0Trvok5egs2ZWikhEK1wngtN2", gameId: "yR6lvyf5IP8lVKRjAQKF"})
exports.joinGame = functions.https.onCall(async (data, context) => {
    const uid = isAuthenticated(data, context);
    if (uid) {
        const docRef = admin.firestore().collection(base_collection).doc(data.gameId);

        const firebaseData = {
            user2Id: uid,
            status: true,
            exitStatus: false
        };

        await docRef.update(firebaseData);

        return { result: "success" };
    } else {
        //throw an exception ..
        throw new functions.https.HttpsError("aborted", "Error!!");
        return {};
    }
});

//data required
    //gameInstance.gameID
    //newTopCard
        //value
        //color
        //cardID
exports.playCard = functions.https.onCall(async (data,context)=>{
    // const gameID = data.gameID;
    // const newTopCard = data.newTopCard;
    const uid = isAuthenticated(data, context);
    if (uid) {
        try{
            // const gameID = "ABC";
            // const newTopCard = {
            //     value:"2",
            //     color:"Red",
            //     cardID:"card1"
            // }
            const cardDocRef = admin.firestore().collection("games").doc(gameID).collection("topCard").doc("current");
            const writeResult = await cardDocRef.set(newTopCard);
            console.log("Write Result: ",writeResult);
            return {result: "success"};
        }
        catch(err){
            throw new functions.HttpsError("aborted",err);
        }
    }
    else{
        throw new functions.https.HttpsError("aborted", "Transcation Error!!");
        return {};
    }
    
});

//data required
    //gameInstance.gameID
    //collection name (String collectionName = "hand-" + player)
    //card
        //value
        //color
        //cardID
exports.addCards = functions.https.onCall(async(data,context)=>{
    const uid = isAuthenticated(data, context);
    if (uid) {
        const gameID = data.gameID;
        const collectionName = data.collectionName;
        const card = data.card;

        try{
            const documentReference = admin.firestore().collection("games").doc(gameID).collection(collectionName).doc();
            card.cardID = documentReference.id;
            const writeResult = await documentReference.set(card);
            return {result: documentReference.id};
        }
        catch(err){
            throw new functions.HttpsError("aborted",err);
        }
    }
    else{
        throw new functions.https.HttpsError("aborted", "Transcation Error!!");
        return {};
    }
});

function isAuthenticated(data, context) {
    if (DEBUG) {
      if (data.uid) {
        return data.uid;
      }
      return undefined;
    } else {
      if (context.auth) {
        return context.auth.uid;
      }
      return undefined;
    }
}

function getDeckCards() {
    let deck = new Map();
    deck.set(0, { id: 0, color: "red", value: "0", type: "num" });
    deck.set(1, { id: 1, color: "red", value: "1", type: "num" });
    deck.set(2, { id: 2, color: "red", value: "2", type: "num" });
    deck.set(3, { id: 3, color: "red", value: "3", type: "num" });
    deck.set(4, { id: 4, color: "red", value: "4", type: "num" });
    deck.set(5, { id: 5, color: "red", value: "5", type: "num" });
    deck.set(6, { id: 6, color: "red", value: "6", type: "num" });
    deck.set(7, { id: 7, color: "red", value: "7", type: "num" });
    deck.set(8, { id: 8, color: "red", value: "8", type: "num" });
    deck.set(9, { id: 9, color: "red", value: "9", type: "num" });
    deck.set(10, { id: 10, color: "red", value: "skip", type: "skip" });

    deck.set(11, { id: 11, color: "green", value: "0", type: "num" });
    deck.set(12, { id: 12, color: "green", value: "1", type: "num" });
    deck.set(13, { id: 13, color: "green", value: "2", type: "num" });
    deck.set(14, { id: 14, color: "green", value: "3", type: "num" });
    deck.set(15, { id: 15, color: "green", value: "4", type: "num" });
    deck.set(16, { id: 16, color: "green", value: "5", type: "num" });
    deck.set(17, { id: 17, color: "green", value: "6", type: "num" });
    deck.set(18, { id: 18, color: "green", value: "7", type: "num" });
    deck.set(19, { id: 19, color: "green", value: "8", type: "num" });
    deck.set(20, { id: 20, color: "green", value: "9", type: "num" });
    deck.set(21, { id: 21, color: "green", value: "skip", type: "skip" });


    deck.set(22, { id: 22, color: "blue", value: "0", type: "num" });
    deck.set(23, { id: 23, color: "blue", value: "1", type: "num" });
    deck.set(24, { id: 24, color: "blue", value: "2", type: "num" });
    deck.set(25, { id: 25, color: "blue", value: "3", type: "num" });
    deck.set(26, { id: 26, color: "blue", value: "4", type: "num" });
    deck.set(27, { id: 27, color: "blue", value: "5", type: "num" });
    deck.set(28, { id: 28, color: "blue", value: "6", type: "num" });
    deck.set(29, { id: 29, color: "blue", value: "7", type: "num" });
    deck.set(30, { id: 30, color: "blue", value: "8", type: "num" });
    deck.set(31, { id: 31, color: "blue", value: "9", type: "num" });
    deck.set(32, { id: 32, color: "blue", value: "skip", type: "skip" });


    deck.set(33, { id: 33, color: "yellow", value: "0", type: "num" });
    deck.set(34, { id: 34, color: "yellow", value: "1", type: "num" });
    deck.set(35, { id: 35, color: "yellow", value: "2", type: "num" });
    deck.set(36, { id: 36, color: "yellow", value: "3", type: "num" });
    deck.set(37, { id: 37, color: "yellow", value: "4", type: "num" });
    deck.set(38, { id: 38, color: "yellow", value: "5", type: "num" });
    deck.set(39, { id: 39, color: "yellow", value: "6", type: "num" });
    deck.set(40, { id: 40, color: "yellow", value: "7", type: "num" });
    deck.set(41, { id: 41, color: "yellow", value: "8", type: "num" });
    deck.set(42, { id: 42, color: "yellow", value: "9", type: "num" });
    deck.set(43, { id: 43, color: "yellow", value: "skip", type: "skip" });

    deck.set(44, { id: 44, color: "black", value: "Draw 4", type: "draw4" });
    deck.set(45, { id: 45, color: "black", value: "Draw 4", type: "draw4" });
    deck.set(46, { id: 46, color: "black", value: "Draw 4", type: "draw4" });
    deck.set(47, { id: 47, color: "black", value: "Draw 4", type: "draw4" });

    return deck;
}

function getUserCards(deck) {
    var cnt = 0;
    var userMap = new Map();
    var userCards = {}
    while (cnt < 14) {
        var key = Math.floor(Math.random() * 48);
        if (!userMap.has(key)) {
            userMap.set(key, deck.get(key));
            deck.delete(key);
            cnt++;
        }
    }
    cnt = 0;
    var user1Map = new Map();
    var user2Map = new Map();
    userMap.forEach(function (value, key) {
        if (cnt < 7) {
            user1Map.set(key, value);
        }
        else {
            user2Map.set(key, value);
        }
        cnt++;
    });
    userCards.user1 = user1Map;
    userCards.user2 = user2Map;
    return userCards;
}

function getTopCard(deck) {
    var topCard = {};
    var flag = false;
    if (deck.size > 0) {
        deck.forEach(function (value, key) {
            if (!flag) {
                topCard = value;
                flag = true;
                deck.delete(key);
            }
        });
        return topCard
    }
}

function getArrayFromMap(cards) {
    let cardsArray = [];
    cards.forEach(function (value, key) {
        cardsArray.push(value);
    });
    return cardsArray;
}