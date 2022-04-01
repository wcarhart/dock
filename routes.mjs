import axios from 'axios'
import express from 'express'
import passport from 'passport'
import { generateJwt, configureCookie, expireCookie, Auth } from './auth.mjs'
import { ApiResponse, ERROR, ApiError } from './utilities.mjs'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const CONFIG = require('./config.json')

const Routes = () => {
	const router = express.Router()

	// create a new account
	router.post('/account', Auth('create'), async (req, res, next) => {
		const token = await generateJwt(req.user.username)
		await configureCookie(token, req, res)
		let account = { username: req.user.username }
		let response = new ApiResponse({
			message: `Created account for username '${req.body.username}'`,
			status: 201,
			details: account
		})
		await response.send(res)
	})

	// login to an existing account
	router.post('/login', Auth('login'), async (req, res, next) => {
		// grant JWT
		const token = await generateJwt(req.user.username)
		await configureCookie(token, req, res)
		let response = new ApiResponse({
			message: `Successfully logged in '${req.body.username}'`,
			status: 200,
			details: {}
		})
		await response.send(res)
	})

	// invalidate JWT to force logout
	router.post('/logout', async (req, res, next) => {
		// grant logout JWT
		await expireCookie(req, res)
		let response = new ApiResponse({
			message: `Successfully logged out in '${req.body.username}'`,
			status: 200,
			details: {}
		})
		await response.send(res)
	})

	// get application status
	router.get('/status', Auth('jwt'), async (req, res, next) => {
		let tugs = CONFIG.tugs
		let statuses = []
		for (let tug of tugs) {
			try {
				let tugStatus = await axios.get(`${tug.origin}/status`)
				statuses = statuses.concat(tugStatus.data.map(v => ({...v, origin: tug.origin})))
			} catch (e) {
				let error = new ApiError({
					error: ERROR.OPERATION_FAILED,
					message: `Could not tug origin ${tug.origin}, is it configured correctly?`
				})
				await error.send(res)
				return
			}
		}
		res.status(200).json(statuses)
	})

	// create a new tug on user/repository - dock acts as a proxy
	router.post('/:user/:repository', Auth('jwt'), async (req, res, next) => {
		if (!req.body.origin) {
			let error = new ApiError({
				error: ERROR.INVALID_REQUEST,
				message: 'Missing origin in POST body'
			})
			await error.send(res)
			return
		}

		let url = `${req.body.origin}/${req.params.user}/${req.params.repository}`
		try {
			let response = await axios.post(url)
		} catch (e) {
			res.status(e.response.status).json(e.response.data)
		}
		res.status(200).json('')
	})

	return router
}

export { Routes }
