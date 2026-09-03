/**
 * Local typed-evidence path for FAMILLE.
 *
 * Consumes schema/juge.v0.json. Same four cards as JUGE.md.
 * Preview only — not a receipt, not QUANTUM, not a second MASTER.
 * Reference seal stays off Git. unforge-check verifies a file against a card.
 *
 * MODE is the collapse: quantique only when the four cards hold.
 */

export const QUELLE = Object.freeze(['os', 'qrng', 'qkd'])
export const TEMOIN = Object.freeze(['aucun', 'stat', 'fabricant', 'di'])
export const HORIZON_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/

const PHRASE = Object.freeze({
  lie: 'Error margin zero is a lie',
  horizon: 'Guarantee end date must be a future calendar day',
  cards: 'Unknown quelle or temoin',
  transcript: 'Device-independent needs a transcript',
  simule: 'A simulated witness is not di',
  classique: 'Ça ne tient pas. Classique.',
  apercu: 'Preview allow — not a receipt',
  carte: 'Where the bits came from is missing',
})

export function jourUTC(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

function lireEpsilon(value) {
  if (value == null || value === '') return { kind: 'manque' }
  if (value === 0 || value === '0' || value === 'none' || value === 'iid') {
    return { kind: 'lie' }
  }
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n <= 0) return { kind: 'lie' }
  return { kind: 'ok', value: n }
}

function verdict({ quantique, manques, refus, phrase }) {
  return {
    quantique,
    mode: quantique ? 'quantique' : 'classique',
    manques,
    phrase,
    refus,
    preview: true,
  }
}

/**
 * Decide what a card may say. Pure. No network. No data/.
 *
 * @param {object} carte
 * @param {{ today?: string }} [opts]  inject YYYY-MM-DD for tests
 */
export function peutDire(carte, opts = {}) {
  const today = opts.today || jourUTC()
  const manques = []

  if (!carte || typeof carte !== 'object' || Array.isArray(carte)) {
    return verdict({
      quantique: false,
      manques: ['carte'],
      refus: { code: 'cards', phrase: PHRASE.carte },
      phrase: PHRASE.carte,
    })
  }

  const quelle = carte.quelle
  const temoin = !carte.temoin || carte.temoin === 'none' ? 'aucun' : carte.temoin
  const horizon = carte.horizon
  const temoinPresent = carte.temoin != null && carte.temoin !== ''

  if (quelle == null || quelle === '') {
    manques.push('quelle')
  } else if (!QUELLE.includes(quelle)) {
    return verdict({
      quantique: false,
      manques,
      refus: { code: 'cards', phrase: PHRASE.cards },
      phrase: PHRASE.cards,
    })
  }

  if (!temoinPresent) {
    manques.push('temoin')
  } else if (!TEMOIN.includes(temoin)) {
    return verdict({
      quantique: false,
      manques,
      refus: { code: 'cards', phrase: PHRASE.cards },
      phrase: PHRASE.cards,
    })
  }

  if (temoin === 'di' && !carte.transcript) {
    return verdict({
      quantique: false,
      manques,
      refus: { code: 'transcript', phrase: PHRASE.transcript },
      phrase: PHRASE.transcript,
    })
  }

  if (temoin === 'di' && carte.simule === true) {
    return verdict({
      quantique: false,
      manques,
      refus: { code: 'simule', phrase: PHRASE.simule },
      phrase: PHRASE.simule,
    })
  }

  const eps = lireEpsilon(carte.epsilon)
  if (eps.kind === 'lie') {
    return verdict({
      quantique: false,
      manques,
      refus: { code: 'lie', phrase: PHRASE.lie },
      phrase: PHRASE.lie,
    })
  }
  if (eps.kind === 'manque') manques.push('epsilon')

  if (horizon == null || horizon === '') {
    manques.push('horizon')
  } else if (horizon === 'UFHY1' || !HORIZON_DATE.test(String(horizon))) {
    return verdict({
      quantique: false,
      manques,
      refus: { code: 'horizon', phrase: PHRASE.horizon },
      phrase: PHRASE.horizon,
    })
  } else if (horizon < today) {
    return verdict({
      quantique: false,
      manques,
      refus: { code: 'horizon', phrase: PHRASE.horizon },
      phrase: PHRASE.horizon,
    })
  }

  const temoinTient =
    temoinPresent &&
    (quelle === 'qkd' ? temoin === 'di' && Boolean(carte.transcript) : temoin !== 'aucun')

  const tient =
    manques.length === 0 &&
    (quelle === 'qrng' || quelle === 'qkd') &&
    temoinTient &&
    eps.kind === 'ok' &&
    HORIZON_DATE.test(String(horizon)) &&
    horizon >= today &&
    carte.simule !== true

  if (!tient) {
    if (quelle === 'os' && !manques.includes('quelle')) {
      /* os is a valid classical card, not a missing field */
    } else if ((quelle === 'qrng' || quelle === 'qkd') && !temoinTient && !manques.includes('temoin')) {
      manques.push('temoin')
    }
    if (carte.simule === true && !manques.includes('simule')) manques.push('simule')
    return verdict({
      quantique: false,
      manques,
      refus: null,
      phrase: PHRASE.classique,
    })
  }

  return verdict({
    quantique: true,
    manques: [],
    refus: null,
    phrase: PHRASE.apercu,
  })
}
