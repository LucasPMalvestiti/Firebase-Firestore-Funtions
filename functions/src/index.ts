import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = admin.initializeApp();
const db = app.firestore();
const dentistCol = db.collection("Dentists");

export const salvarDadosDentista = functions.
    region("southamerica-east1")
    .https.onCall(async (data) => {
      try {
        await dentistCol.doc().set(data)
        return { text: "Inserido" }
      } catch (error) { 
        return {text: "Erro ao inserir."}
      }
});