import { createSeedState } from '../demo/seed.js';

export function runFormAction(service, formName, data) {
  if (formName === 'new-profile') {
    const entity = service.createProfile({ ...data, skills: splitList(data.skills), needs: splitList(data.needs) });
    return { entity, route: '/', message: `Bienvenido/a, ${entity.name}. Tenés 4 CT para empezar.` };
  }
  if (formName === 'new-offer') {
    const entity = service.createOffer({ ...data, durationCt: Number(data.durationCt), skill: data.category });
    return { entity, route: `/ofertas/${entity.id}`, message: 'Oferta publicada en la demo.' };
  }
  if (formName === 'new-request') {
    const entity = service.createRequest({ ...data, durationCt: Number(data.durationCt) });
    return { entity, route: `/solicitudes/${entity.id}`, message: 'Solicitud publicada. Ya podés revisar matches.' };
  }
  if (formName === 'propose-exchange') {
    const entity = service.proposeExchange({ ...data, durationCt: Number(data.durationCt) });
    return { entity, route: `/intercambios/${entity.id}`, message: 'Propuesta enviada. Cambiá al prestador para aceptarla.' };
  }
  if (formName === 'extension') {
    const entity = service.proposeExtension(data.exchangeId, Number(data.additionalCt));
    return { entity, message: 'Extensión propuesta. La contraparte debe aprobarla.' };
  }
  if (formName === 'chat') {
    const entity = service.sendMessage(data.exchangeId, data.text);
    return { entity, focus: 'chat' };
  }
  if (formName === 'review') {
    const entity = service.submitReview(data.exchangeId, {
      quality: data.quality ? Number(data.quality) : null,
      clarity: data.clarity ? Number(data.clarity) : null,
      communication: Number(data.communication),
      punctuality: Number(data.punctuality),
      wouldRepeat: data.wouldRepeat === true || data.wouldRepeat === 'true',
      comment: data.comment,
    });
    return { entity, message: 'Valoración enviada. Gracias por construir confianza.' };
  }
  throw new Error(`Formulario no soportado: ${formName}`);
}

export function runClickAction(service, action, data = {}) {
  const exchangeId = data.exchangeId;
  if (action === 'switch-user') {
    const entity = service.switchUser(data.userId);
    return { entity, message: 'Cambiaste de usuario demo.' };
  }
  if (action === 'reset-demo') {
    service.reset(createSeedState());
    return { route: '/', message: 'Demo restablecida.' };
  }
  if (!exchangeId) throw new Error('exchangeId requerido');
  if (action === 'accept-exchange') return { entity: service.acceptExchange(exchangeId), message: 'Intercambio actualizado.' };
  if (action === 'decline-exchange') return { entity: service.declineExchange(exchangeId), message: 'Intercambio actualizado.' };
  if (action === 'start-exchange') return { entity: service.startExchange(exchangeId), message: 'Intercambio actualizado.' };
  if (action === 'complete-exchange') return { entity: service.completeByProvider(exchangeId), message: 'Intercambio actualizado.' };
  if (action === 'confirm-exchange') return { entity: service.confirmExchange(exchangeId), message: 'Intercambio actualizado.' };
  if (action === 'accept-extension') return { entity: service.acceptExtension(exchangeId), message: 'Intercambio actualizado.' };
  if (action === 'dispute-exchange') return { entity: service.openDispute(exchangeId, 'Disputa abierta desde la simulación UX.'), message: 'Intercambio actualizado.' };
  if (action === 'cancel-normal') return { entity: service.cancelExchange(exchangeId, { hoursUntilStart: 3 }), message: 'Excepción aplicada en la simulación.' };
  if (action === 'cancel-late') return { entity: service.cancelExchange(exchangeId, { hoursUntilStart: 1 }), message: 'Excepción aplicada en la simulación.' };
  if (action === 'noshow-requester') return { entity: service.recordNoShow(exchangeId, 'REQUESTER'), message: 'Excepción aplicada en la simulación.' };
  if (action === 'noshow-provider') return { entity: service.recordNoShow(exchangeId, 'PROVIDER'), message: 'Excepción aplicada en la simulación.' };
  throw new Error(`Acción no soportada: ${action}`);
}

function splitList(value = '') {
  if (Array.isArray(value)) return value.slice(0, 3);
  return String(value).split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3);
}
