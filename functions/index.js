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
            winnerId: "",
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
    //gameInstance.gameId
    //currentUserId
    //playedCard
        //value
        //color
        //cardID
exports.playCard = functions.https.onCall(async (data,context)=>{

    const uid = isAuthenticated(data, context);
    // const uid = "qSGojlsFe6QIHC5vCNxpa8enXUh2";
    // lAHXdvzoSsZK8QytLB7f3HPSCiB3
    if (uid) {
        const gameId = data.gameId;
        // const gameId = "pFeeWbMhvY4MLUPh57Qz"
        const currentUserId = data.uid;
        // const currentUserId = "lAHXdvzoSsZK8QytLB7f3HPSCiB3";
        const playedCard = data.card;
        // const playedCard = {
        //     value: "1",
        //     id:1,
        //     type:"num",
        //     color:"red",
        // }

        const snapshot = await admin.firestore().collection(base_collection).doc(gameId).get();
        var gameModel = snapshot.data();
        if(!snapshot.empty){
            if(gameModel.turn == currentUserId){
                console.log("Your Turn");
                let flag = 1;               
                if(currentUserId == gameModel.user1Id){
                    flag = 0;
                }
                var topCard = [];
                var topColl = await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).get();
                topColl.docs.forEach((card)=>{
                    topCard.push(card.data());
                });
                const topDeck = topCard[0];
                console.log("top card", topDeck);
                if(topDeck.type == "draw4"){
                    console.log('on draw4 ');
                    if(playedCard.type == "skip"){
                        updateResult = cardSkipSuccessful(playedCard,flag,gameModel,gameId);
                    }
                    else if(playedCard.type == "num"){
                        updateResult = cardNumSuccessful(playedCard,flag,gameModel,gameId);
                    }
                    else{
                        updateResult = cardDraw4Successful(playedCard,flag,gameModel,gameId);
                    }
                }
                else if(playedCard.type == "skip"){
                    console.log('skip');
                    if(topDeck.color == playedCard.color){
                        //same colour skip
                        updateResult = cardSkipSuccessful(playedCard,flag,gameModel,gameId);
                    }
                    else{
                        if(playedCard.value == topDeck.value){
                            updateResult = cardSkipSuccessful(playedCard,flag,gameModel,gameId);
                        }
                        else{
                            //Card can not be played
                            throw new functions.https.HttpsError("aborted", "You can not play this card");
                        }

                    }
                }
                else if(playedCard.type == "num"){
                    console.log('num');
                    if(playedCard.color == topDeck.color){
                        //same colour
                        updateResult = cardNumSuccessful(playedCard,flag,gameModel,gameId);
                    }
                    else{
                        if(playedCard.value == topDeck.value){
                            updateResult = cardNumSuccessful(playedCard,flag,gameModel,gameId);
                        }
                        else{
                            //Card can not be played
                            throw new functions.https.HttpsError("aborted", "You can not play this card");
                        }
                    }
                }
                else{
                    console.log('draw 4');
                    //draw 4
                    updateResult = cardDraw4Successful(playedCard,flag,gameModel,gameId);
                }
                // console.log(updateResult);
                // if(updateResult.result == "success"){
                //     return {result: "success"};
                // }
                // else{
                //     throw new functions.https.HttpsError("aborted", "Error Occured");
                // }
                return {result: "success"};
            }
            else{
                console.log("Not your turn");
                throw new functions.https.HttpsError("aborted", "Not your turn");
            }
        }
        throw new functions.https.HttpsError("aborted", "Error Occured");
    }
    else{
        throw new functions.https.HttpsError("aborted", "Transcation Error!!");
        return {};
    }
    
});

//data required
    //gameInstance.gameId
    //currentUserId
exports.drawCards = functions.https.onCall(async (data,context)=>{
    const uid = isAuthenticated(data, context);
    // const uid = "qSGojlsFe6QIHC5vCNxpa8enXUh2";
    // lAHXdvzoSsZK8QytLB7f3HPSCiB3
    if (uid) {
        const gameId = data.gameId;
        const currentUserId = data.uid;
        // const gameId = "pFeeWbMhvY4MLUPh57Qz"
        // const currentUserId = "lAHXdvzoSsZK8QytLB7f3HPSCiB3";
        const snapshot = await admin.firestore().collection(base_collection).doc(gameId).get();
        const gameModel = snapshot.data();
        if(!snapshot.empty){
            let flag = 1;               
            if(currentUserId == gameModel.user1Id){
                flag = 0;
            }
            if(gameModel.turn == currentUserId){
                //remove 1 card from deck
                //add 1 card to user card

                var deckColl = await admin.firestore().collection(base_collection).doc(gameId).collection(deckCollection).get();
                var cardsToAdd = [];
                var deckSize;
                await admin.firestore().collection(base_collection).doc(gameId).collection(deckCollection).get().then(function(querySnapshot){
                    deckSize = querySnapshot.size;
                });
                if(deckSize > 1){
                    var x=0;
                    deckColl.docs.every((card)=>{
                        cardsToAdd.push(card.data());
                        x++;
                        if(x>0){
                            return false;
                        }
                        return true;
                    });
                    cardsToAdd.forEach(async (card)=>{
                        await admin.firestore().collection(base_collection).doc(gameId).collection(deckCollection).doc(card.id.toString()).delete();
                        if(flag == 0){
                            await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).doc(card.id.toString()).set(card);
                        }
                        else{
                            await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).doc(card.id.toString()).set(card);
                        }
                    });
                }
                else{
                    return{
                        "result": "Not enough cards in deck",
                    }
                }
                return {result: "success"};
            }
            else{
                console.log("Not your turn");
                throw new functions.https.HttpsError("aborted", "Not your turn");
            }
        }
    }
    else{
        throw new functions.https.HttpsError("aborted", "Transcation Error!!");
        return {};
    }
});

exports.leaveGame = functions.https.onCall(async(data,context)=>{
    const uid = isAuthenticated(data, context);
    if (uid) {
        const docRef = admin.firestore().collection(base_collection).doc(data.gameId);

        const firebaseData = {
            winnerId: uid,
            status: false,
            exitStatus: true
        };

        await docRef.update(firebaseData);
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

// function checkCard(playedCard,topCard,deckCards,myCards,oppCards,gameModel){
//     const topDeck = topCard[0];
//     if(topDeck.type == "draw4"){
//         if(playedCard.type == "skip"){
//             gameModel = cardSkipSuccessful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//         }
//         else if(playedCard.type == "num"){
//             gameModel = cardNumSuccessful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//         }
//         else{
//             gameModel = cardDraw4Successful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//         }
//     }
//     else if(playedCard.type == "skip"){
//         if(topDeck.color == playedCard.color){
//             //same colour skip
//             gameModel = cardSkipSuccessful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//         }
//         else{
//             if(playedCard.value == topDeck.value){
//                 gameModel = cardSkipSuccessful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//             }
//             else{
//                 //Card can not be played
//                 throw new functions.https.HttpsError("aborted", "You can not play this card");
//             }

//         }
//     }
//     else if(playedCard.type == "num"){
//         if(playedCard.color == topDeck.color){
//             //same colour
//             gameModel = cardNumSuccessful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//         }
//         else{
//             if(playedCard.value == topDeck.value){
//                 gameModel = cardNumSuccessful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//             }
//             else{
//                 //Card can not be played
//                 throw new functions.https.HttpsError("aborted", "You can not play this card");
//             }
//         }
//     }
//     else{
//         //draw 4
//         gameModel = cardDraw4Successful(playedCard,topCard,deckCards,myCards,oppCards,gameModel);
//     }
//     // console.log("In check Card");
//     // console.log("my cards");
//     // myCards.forEach((card)=>{
//     //     console.log(card);
//     // });
//     // console.log("opp cards");
//     // oppCards.forEach((card)=>{
//     //     console.log(card);
//     // });
//     return gameModel;
// }

async function cardSkipSuccessful(playedCard,flag,gameModel,gameId){
    // data required
    // playedCard, flag, gameModel

    try{
        var topColl = await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).get();
    
        //Delete played card from user deck
        if(flag==0){
            await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).doc(playedCard.id.toString()).delete();
        }
        else{
            await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).doc(playedCard.id.toString()).delete();
        }


        //Delete top card from top deck
        //add played card to top deck
        topColl.docs.forEach(async (card)=>{
            await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).doc(card.id.toString()).delete();
        });
        await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).doc(playedCard.id.toString()).set(playedCard);
        
        
        //check if user deck is empty
        var size;
        if(flag == 0){
            // user1DeckCollection
            await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).get().then(function(querySnapshot){
                size = querySnapshot.size;
            });
        }
        else{
            // user2DeckCollection
            await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).get().then(function(querySnapshot){
                size = querySnapshot.size;
            });
        }
        console.log("Size: ", size);
        if(size == 0){
            gameModel.winnerId = gameModel.turn;
            gameModel.exitStatus = true;
        }

        await admin.firestore().collection(base_collection).doc(gameId).update(gameModel);

        return {
            "result": "success",
        };
    }
    
    catch(err){
        throw new functions.https.HttpsError("aborted", err);
    }
}

async function cardDraw4Successful(playedCard,flag,gameModel,gameId){
    // data required
    // playedCard, flag, gameModel

    try{
        var topColl = await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).get();
        var deckColl = await admin.firestore().collection(base_collection).doc(gameId).collection(deckCollection).get();
    
        //Delete played card from user deck
        if(flag==0){
            await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).doc(playedCard.id.toString()).delete();
        }
        else{
            await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).doc(playedCard.id.toString()).delete();
        }
     
        //Delete top card from top deck
        //add played card to top deck
        topColl.docs.forEach(async (card)=>{
            await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).doc(card.id.toString()).delete();
        });
        await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).doc(playedCard.id.toString()).set(playedCard);
    
    
        //pop 4 cards from deck
        //add these 4 cards to other player deck
        var deckColl = await admin.firestore().collection(base_collection).doc(gameId).collection(deckCollection).get();
        var cardsToAdd = []
        var deckSize;
        await admin.firestore().collection(base_collection).doc(gameId).collection(deckCollection).get().then(function(querySnapshot){
            deckSize = querySnapshot.size;
        });
        if(deckSize > 4){
            var x=0;
            deckColl.docs.every((card)=>{
                cardsToAdd.push(card.data());
                x++;
                if(x>3){
                    return false;
                }
                return true;
            });
            cardsToAdd.forEach(async (card)=>{
                await admin.firestore().collection(base_collection).doc(gameId).collection(deckCollection).doc(card.id.toString()).delete();
                if(flag == 0){
                    await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).doc(card.id.toString()).set(card);
                }
                else{
                    await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).doc(card.id.toString()).set(card);
                }
            });
        }
        else{
            throw new functions.https.HttpsError("aborted", "Not enough cards in deck");
        }
        
        
        //check if user deck is empty
        var size;
        if(flag == 0){
            // user1DeckCollection
            await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).get().then(function(querySnapshot){
                size = querySnapshot.size;
            });
        }
        else{
            // user2DeckCollection
            await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).get().then(function(querySnapshot){
                size = querySnapshot.size;
            });
        }
        console.log("Size: ", size);
        if(size==0){
            gameModel.winnerId = gameModel.turn;
            gameModel.exitStatus = true;
        }
        await admin.firestore().collection(base_collection).doc(gameId).update(gameModel);
    
        return {
            "result": "success",
        };
    }
    catch(err){
        throw new functions.https.HttpsError("aborted", err);
    }
}

async function cardNumSuccessful(playedCard,flag,gameModel,gameId){
    // data required
    // playedCard, flag, gameModel

    try{
        var topColl = await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).get();

        //Delete played card from user deck
        if(flag==0){
            await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).doc(playedCard.id.toString()).delete();
            // await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).
        }
        else{
            await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).doc(playedCard.id.toString()).delete();
        }
        
        //Delete top card from top deck
        //add played card to top deck
        topColl.docs.forEach(async (card)=>{
            await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).doc(card.id.toString()).delete();
        });
        await admin.firestore().collection(base_collection).doc(gameId).collection(topCollection).doc(playedCard.id.toString()).set(playedCard);
    
    
        //update turn
        //check if user deck is empty
        var size;
        if(flag == 0){
            // user1DeckCollection
            await admin.firestore().collection(base_collection).doc(gameId).collection(user1DeckCollection).get().then(function(querySnapshot){
                size = querySnapshot.size;
            });
        }
        else{
            // user2DeckCollection
            await admin.firestore().collection(base_collection).doc(gameId).collection(user2DeckCollection).get().then(function(querySnapshot){
                size = querySnapshot.size;
            });
        }
        console.log("Size: ", size);
        if(size==0){
            gameModel.winnerId = gameModel.turn;
            gameModel.exitStatus = true;
        }
        else {
            gameModel = updateTurn(gameModel);
        }
    
        await admin.firestore().collection(base_collection).doc(gameId).update(gameModel);
    
        return {
            "result": "success",
        };
    }
    catch(err){
        throw new functions.https.HttpsError("aborted", err);
    }
    
}

function updateTurn(gameModel){
    if(gameModel.turn == gameModel.user1Id){
        gameModel.turn = gameModel.user2Id;
    }
    else{
        gameModel.turn = gameModel.user1Id;
    }
    return gameModel;
}