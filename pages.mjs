import express from 'express'
import path from 'path'
import { Auth } from './auth.mjs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const Pages = () => {
	const router = express.Router()

	// login to the application
	router.get('/login', async (req, res, next) => {
		res.sendFile(path.join(__dirname, 'public/login.html'))
	})

	// landing page, check JWT and redirect if necessary
	router.get('/', Auth('jwt-relogin'), async (req, res, next) => {
		res.sendFile(path.join(__dirname, 'public/status.html'))
	})

	// handle invalid requests - 404
	router.use(async (req, res, next) => {
		res.status(404).sendFile(path.join(__dirname, 'public/404.html'))
	})

	return router
}

export { Pages }