import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = admin.initializeApp();
const db = app.firestore();
const dentistCol = db.collection("Dentists");

export const addSampleDentist = functions
  .region("southamerica-east1")
  .https.onRequest(async (request, response) => {
    const dentist = {
      nome: "Lucas Perin Malvestiti",
      telefone: "(19)999999999",
      email: "emaillucas@email.com",
    };
    try {
      const docRef = await dentistCol.add(dentist);
      response.send("Sample Dentist has been succefulyadded. Reference:" +
      docRef.id);
    } catch (e) {
      functions.logger.error("Error while adding Sample Dentist");
      response.send("Error while adding Sample Dentist");
    }
  });

export const deleteSampleDentist = functions
  .region("southamerica-east1")
  .https.onRequest(async (request, response) => {
    const dentistId = "wo0j54jnrEcLQ98FEJqR";
    await dentistCol.doc(dentistId).delete();
    response.send("Deleting dentist probably done");
  });

export const showSampleDentistsLucas = functions
  .region("southamerica-east1")
  .https.onRequest(async (request, response) => {
    const Dentists : FirebaseFirestore.DocumentData = [];
    const snapshot = await dentistCol.where("nome", "==", "Lucas").get();
    snapshot.forEach((doc) => {
      Dentists.push(doc.data());
    });
    response.status(200).json(Dentists);
  });
  