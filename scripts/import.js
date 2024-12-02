import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'
import unzipper from 'unzipper'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { format, addMonths } from 'date-fns'
import { Readable, pipeline } from 'stream'
import { promisify } from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Promisify pipeline für asynchrone Verwendung
const pipelineAsync = promisify(pipeline)

async function fetchJwPubUrl(langwritten, issue) {
  const apiUrl = `https://app.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?langwritten=${langwritten}&pub=mwb&fileformat=JWPUB&issue=${issue}`
  try {
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`HTTP-Fehler! Status: ${response.status}`)
    }
    const data = await response.json()
    const jwpubUrl = data.files[langwritten].JWPUB[0].file.url
    return jwpubUrl
  } catch (error) {
    throw new Error(`Fehler beim Abrufen der JWPUB-URL: ${error.message}`)
  }
}

async function downloadJwPub(jwpubUrl, downloadPath) {
  const response = await fetch(jwpubUrl)
  if (!response.ok) {
    throw new Error(
      `Fehler beim Herunterladen der JWPUB-Datei! Status: ${response.status}`
    )
  }

  if (!response.body) {
    throw new Error('Keine Daten im Antwortkörper.')
  }

  // Manuelle Konvertierung des Web ReadableStream zu einem Node.js Readable Stream
  const reader = response.body.getReader()
  const nodeReadable = new Readable({
    read() {},
  })

  ;(async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        // Push die empfangenen Daten in den Node.js Stream
        nodeReadable.push(Buffer.from(value))
      }
      // Signalisiere das Ende des Streams
      nodeReadable.push(null)
    } catch (err) {
      nodeReadable.destroy(err)
    }
  })()

  // Schreibstream für die heruntergeladene Datei
  const fileStream = fs.createWriteStream(downloadPath)

  try {
    // Verwende die promisifizierte Pipeline
    await pipelineAsync(nodeReadable, fileStream)
    console.log('Pipeline erfolgreich abgeschlossen.')
  } catch (err) {
    console.error('Pipeline fehlgeschlagen:', err)
    throw err
  }
}

async function extractDbFile(jwpubPath, extractDir) {
  // Entpacken der .jwpub-Datei
  await fs
    .createReadStream(jwpubPath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise()

  const contentsPath = path.join(extractDir, 'contents')

  // Entpacken der contents-Datei
  await fs
    .createReadStream(contentsPath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise()

  const files = fs.readdirSync(extractDir)
  const dbFile = files.find((file) => file.endsWith('.db'))
  if (!dbFile) {
    throw new Error('Keine .db-Datei gefunden.')
  }
  return path.join(extractDir, dbFile)
}

async function extractDataFromDb(dbPath) {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  const documents = await db.all('SELECT Title FROM Document')
  const extracts = await db.all('SELECT Caption FROM Extract')

  await db.close()

  return {
    documents,
    extracts,
  }
}

async function saveDataAsJson(data, outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
}

async function main() {
  // Dynamisches Berechnen des issue-Werts (aktuelles Datum + 1 Monat)
  const currentDate = new Date()
  const futureDate = addMonths(currentDate, 1)
  const issue = format(futureDate, 'yyyyMM')

  // Umgebungsvariable für langwritten verwenden
  const langwritten = process.env.LANGWRITTEN || 'X' // Standardwert 'X'

  console.log(`Langwritten: ${langwritten}`)
  console.log(`Issue: ${issue}`)

  try {
    // Schritt 1: JWPUB-URL abrufen
    const jwpubUrl = await fetchJwPubUrl(langwritten, issue)
    console.log(`JWPUB-URL: ${jwpubUrl}`)

    // Schritt 2: JWPUB-Datei herunterladen
    const downloadPath = path.join(__dirname, 'downloaded.jwpub')
    await downloadJwPub(jwpubUrl, downloadPath)
    console.log('JWPUB-Datei heruntergeladen.')

    // Schritt 3: .jwpub entpacken und .db-Datei extrahieren
    const extractDir = path.join(__dirname, 'extracted')
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir)
    }
    const dbPath = await extractDbFile(downloadPath, extractDir)
    console.log(`Datenbank-Datei gefunden: ${dbPath}`)

    // Schritt 4: Daten aus der Datenbank extrahieren
    const data = await extractDataFromDb(dbPath)
    console.log('Daten aus der Datenbank extrahiert.')

    // Schritt 5: Daten als JSON speichern
    const outputPath = path.join(__dirname, `data_${issue}.json`)
    await saveDataAsJson(data, outputPath)
    console.log(`Daten als JSON gespeichert: ${outputPath}`)
  } catch (error) {
    console.error(`Fehler: ${error.message}`)
  }
}

main()
