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

export const addProfessional = functions.
  region("southamerica-east1")
  .https.onCall(async (data) => {
    try {
      await dentistCol.doc().set(data);
      return {text: "Inserido"};
    } catch (error) {
      return {text: "Erro ao inserir."};
    }
  });

export const addProf = functions
  .region("southamerica-east1")
  .https.onCall(async (data) => {
    if (!(typeof data.nome === "string") || data.nome.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A função deve ser chamada com " +
          "um argumento 'nome' contendo o nome do profissional a ser adcionado"
      );
    }

    // Checagem para ver se o parâmetro nome está vazio ou não
    if (!(typeof data.telefone === "string") || data.telefone.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A função deve ser chamada com " +
          "um argumento 'telefone' contendo " +
          "o telefone do profissional a ser adcionado"
      );
    }

    // Checagem para ver se o parâmetro nome está vazio ou não
    if (!(typeof data.email === "string") || data.email.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A função deve ser chamada com " +
          "um argumento 'email' contendo " +
          "o email do profissional a ser adcionado"
      );
    }
    try {
      await dentistCol.doc().set(data);
      return {text: "Profissional inserido!"};
    } catch (e) {
      functions.logger.error("Erro ao inserir profissional. Error: " + e);
      return {text: "Erro ao inserir profissional"};
    }
  });
