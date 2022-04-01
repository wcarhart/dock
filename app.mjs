import axios from 'axios'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import helmet from 'helmet'
import http from 'http'
import https from 'https'
import mongoose from 'mongoose'
import morgan from 'morgan'
import passport from 'passport'

import { Pages } from './pages.mjs'
import { Routes } from './routes.mjs'

// we can't use ESModule imports to get JSON content, so we use
// good ol' `require`
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const CONFIG = require('./config.json')

// validate CONFIG format and contents
const validate = async () => {
	const requiredKeys = ['tugs']

	// verify required keys are present
	let keys = Object.keys(CONFIG)
	if (!requiredKeys.every(k => keys.includes(k))) {
		console.error(`Missing at least one required option in config.json: ${requiredKeys.join(', ')}`)
		process.exit(1)
	}

	// verify tugs are properly defined
	for (let [index, tug] of CONFIG.tugs.entries()) {
		if (!tug.node) {
			console.error(`Missing tug name at config.json index ${index}`)
			process.exit(1)
		}

		if (!tug.origin) {
			console.error(`Missing tug origin at config.json index ${index}`)
			process.exit(1)
		}
	}
}

// validate app configuration
await validate()

// create app
dotenv.config()
const app = express()
const port = process.env.PORT || 12147
app.use(express.json())
app.set('json spaces', 2)
app.use(passport.initialize())
app.use(compression())
app.use(cookieParser())
app.use(helmet())
app.use(cors())

// configure logging
app.use(
	morgan((tokens, req, res) => {
		return [
			tokens.date(req, res, 'iso'),
			tokens.method(req, res),
			tokens.url(req, res),
			tokens.status(req, res),
			`- ${tokens['response-time'](req, res)}ms`
		].join(' ')
	})
)

// set up CORS
app.use(cors({ origin: true, credentials: true }))

// connect to db
mongoose.connect(process.env.DB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	tls: true,
	tlsCAFile: process.env.DB_CERT
})

// set up authentication and authorization
// import './auth.mjs'

// set up static routing
app.use(express.static('public'))

// set up API routes
app.use(Routes())

// set up static pages
app.use(Pages())

// start production server (HTTP + HTTPS)
if (process.env.NODE_ENV === 'prod') {
	// set up SSL cert
	const key = fs.readFileSync(process.env.CA_PK, 'utf8')
	const cert = fs.readFileSync(process.env.CA_CERT, 'utf8')
	const ca = fs.readFileSync(process.env.CA_CHAIN, 'utf8')
	const credentials = { key, cert, ca }
	const httpServer = http.createServer(app)
	const httpsServer = https.createServer(credentials, app)

	// start server
	httpServer.listen(80, () => {
		console.log(`HTTP server running on 80`)
	})
	httpsServer.listen(443, () => {
		console.log(`HTTPS server running on 443`)
	})
} else {

	// start server on local network
	if (process.env.NODE_ENV === 'host') {
		app.listen(port, '0.0.0.0', () => {
			console.log(`Server running on http://0.0.0.0:${port}`)
		})

	// start localhost dev server
	} else {
		app.listen(port, () => {
			console.log(`Server running on http://localhost:${port}`)
		})
	}
}