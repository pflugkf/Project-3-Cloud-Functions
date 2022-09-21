const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const DEBUG = true;
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onCall((data, context) => {
  console.log("Data: ", data);
  return "Hello World";
});

exports.addMessage = functions.https.onCall(async (data,context) =>{
    const msgTxt = data.msgTxt;
    const docRef = admin.firestore().collection("test").doc();

    //Async calls
    const writeResult = await docRef.set({
        "docId": docRef.id,
        "msgTxt": msgTxt,
        // "uid": context.auth.uid,
        "createdAt": new Date(),
    });
    console.log(writeResult);
    return docRef.id;
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
            return "OK";
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
            return documentReference.id;
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