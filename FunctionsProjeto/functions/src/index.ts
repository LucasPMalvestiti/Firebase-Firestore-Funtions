import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const Firebase = admin.initializeApp();

// Inicializa o Firestore Database
const db = Firebase.firestore();

const colecaoUsuarios = db.collection("users");
const colecaoSocorristas = db.collection("DadosSocorristas");
const colecaoResultadoEmergencias = db.collection("ResultadoEmergencias");

type Socorrista = {
  nome: string;
  telefone: string;
  fcmToken: string | undefined;
  status: string;
  foto: string;
};

type CustomResponse = {
  status: string | unknown;
  message: string | unknown;
  payload: unknown;
};


function hasEmergencyData(data: Socorrista) {
  if (
    data.nome != undefined &&
    data.telefone != undefined &&
    data.fcmToken != undefined &&
    data.status != undefined &&
    data.foto != undefined
  ) {
    return true;
  } else {
    return false;
  }
}

// function responsavel por adicionar socorrista no firebase chamada no flutter
export const SetDadosSocorristas = functions
  .region("southamerica-east1")
  .https.onCall(async (data) => {
    const CResponse: CustomResponse = {
      status: "Error",
      message: "Dados nao recebidos",
      payload: undefined,
    };

    const emergency: Socorrista = {
      nome: data.nome,
      telefone: data.telefone,
      fcmToken: data.fcmToken,
      foto: data.foto,
      status: "new",
    };

    if (hasEmergencyData(emergency)) {
      try {
        const doc = await colecaoSocorristas.add(emergency);
        if (doc.id != undefined) {
          CResponse.status = "SUCCESS";
          CResponse.message = "Emergência adicionada com sucesso";
          CResponse.payload = JSON.stringify({docId: doc.id});
        } else {
          CResponse.status = "ERROR";
          CResponse.message = "Não foi possível adicionar a emergência";
          CResponse.payload = JSON.stringify({errorDetail: doc.parent});
        }
      } catch (e) {
        let exMessage;
        if (e instanceof Error) {
          exMessage = e.message;
        }
        functions.logger.error(
          "Erro ao adicionar emergência:",
          emergency.telefone
        );
        functions.logger.error("Exception: ", exMessage);
        CResponse.status = "ERROR";
        CResponse.message = "Erro ao adicionar emergência";
        CResponse.payload = null;
      }
    }

    return JSON.stringify(CResponse);
  });

// function trigger responsavel por Mandar notificação de emergência
// precisa pegar os dados que foram recentemente adicionados na colecao:
// nome, telefone, fotos para enviar as notificacoes
// snap pra pegar o recem adicionado no "DadosSocorristas" e context para
// mostrar o conteudo dentro do snap
export const setMandarNotificacao = functions
  .region("southamerica-east1")
  // esse é o tipe de chamada de funcao
  .firestore.document("DadosSocorristas/{emergenciaID}")
  .onCreate(async (snap, context) => {
    const CResponse: CustomResponse = {
      status: "ERROR",
      message: "Dados não fornecidos",
      payload: undefined,
    };

    const NovaEmergencia = snap.data();
    const DentistDisp = await colecaoUsuarios.where("status", "==", true).get();
    const JuntarTokens = DentistDisp.docs.map((doc) => doc.data().fcmToken);
    const message = {
      data: {
        nome: NovaEmergencia.nome,
        telefone: NovaEmergencia.telefone,
        foto: NovaEmergencia.foto,
        emergenciaID: context.params.emergenciaID,
      },
      tokens: JuntarTokens,
    };

    try {
      const messageId = await Firebase.messaging().sendMulticast(message);
      if (messageId != undefined) {
        CResponse.status = "SUCCESS";
        CResponse.message = "Emergência notificada";
        CResponse.payload = JSON.stringify({messageId: messageId});
      } else {
        CResponse.status = "ERROR";
        CResponse.message = "Não foi possível notificar os dentistas";
        CResponse.payload = JSON.stringify({errorDetail: messageId});
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao notificar os dentistas:", exMessage);
      CResponse.status = "ERROR";
      CResponse.message = "Erro ao notificar dentistas";
      CResponse.payload = null;
    }

    return JSON.stringify(CResponse);
  });

// functions responsavel por criar a colecao de respostas
export const setRespostaDentistas = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https.onCall(async (data) => {
    const CResponse: CustomResponse = {
      status: "Error",
      message: "Dados nao recebidos",
      payload: undefined,
    };

    const dadoDentista = await colecaoUsuarios
      .where("uid", "==", data.uid)
      .get();

    const resposta = {
      emergenciaID: data.emergenciaID,
      Dentistauid: data.Dentistauid,
      status: data.status,
      nome: dadoDentista.docs[0].data().nome,
      telefone: dadoDentista.docs[0].data().telefone,
    };

    try {
      const doc = await colecaoResultadoEmergencias.add(resposta);
      if (doc.id != undefined) {
        CResponse.status = "SUCCESS";
        CResponse.message = "Resposta inserida";
        CResponse.payload = JSON.stringify({docId: doc.id});
      } else {
        CResponse.status = "ERROR";
        CResponse.message = "Não foi possível inserir a resposta";
        CResponse.payload = JSON.stringify({errorDetail: "doc.id"});
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao incluir resposta:", data.email);
      functions.logger.error("Exception: ", exMessage);
      CResponse.status = "ERROR";
      CResponse.message = "Erro ao incluir resposta - Verificar Logs";
      CResponse.payload = null;
    }

    // Mensagem com informações sobre o resultado da função
    return JSON.stringify(CResponse);
  });