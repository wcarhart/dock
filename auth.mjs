import express from 'express'
import crypto from 'crypto'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import passportLocal from 'passport-local'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { Account } from './account.mjs'
import { ERROR, ApiError, isSupportedBrowser } from './utilities.mjs'

const LocalStrategy = passportLocal.Strategy
dotenv.config()

const generateJwt = async (username) => {
	const payload = { username }
	const token = jwt.sign(payload, `${process.env.JWT_SECRET}`, { expiresIn: `${process.env.JWT_EXPIRY}` })
	return token
}

const configureCookie = async (token, req, res) => {
	if (await isSupportedBrowser(req)) {
		let options = {
			expires: new Date(Date.now() + 86400e3),
			httpOnly: true,
			path: '/',
			sameSite: 'lax'
		}
		if (process.env.NODE_ENV === 'prod') {
			options.secure = true
		}
		res.cookie(process.env.JWT_NAME, String(token), options)
	}
}

const expireCookie = async (req, res) => {
	if (await isSupportedBrowser(req)) {
		let options = {
			expires: new Date(0),
			httpOnly: true,
			path: '/',
			sameSite: 'lax'
		}
		if (process.env.NODE_ENV === 'prod') {
			options.secure = true
		}
		res.cookie(process.env.JWT_NAME, String({}), options)
	}
}

const createHash = async (password, salt) => {
	return new Promise((resolve, reject) => {
		crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hash) => {
			if (err) { reject(err) }
			resolve(hash)
		})
	})
}

const checkPass = async (password, salt, expectedHash) => {
	return new Promise((resolve, reject) => {
		crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hash) => {
			if (err) { reject(err) }

			if (!crypto.timingSafeEqual(expectedHash, hash)) {
				reject('password hash mismatch')
			}

			resolve()
		})
	})
}

// TODO: consider adding ability to generate ACCOUNT_CREATION_SALT via dock CLI

// create a new account
// requires 2 things:
//  1. in POST body, must have 'username', 'password' for new account
//  2. in headers, must have 'creation', which contains the special account creation password
passport.use('create', new LocalStrategy({ usernameField: 'username', passwordField: 'password', passReqToCallback: true }, async (req, username, password, done) => {
	try {
		// make sure account creation includes special password
		if (!Object.keys(req.headers).includes('creation')) {
			console.error('Missing special account creation password')
			req.authError = new ApiError({
				error: ERROR.INVALID_REQUEST,
				message: `Could not create new account for username '${username}'`
			})
			return done('Missing special account creation password', {})
		}

		// generate special account creation password hash
		let ACCOUNT_CREATION_HASH
		try {
			ACCOUNT_CREATION_HASH = await createHash(process.env.ACCOUNT_CREATION_PASS, process.env.ACCOUNT_CREATION_SALT)
		} catch (e) {
			console.error(e)
			req.authError = new ApiError({
				error: ERROR.OPERATION_FAILED,
				message: `Could not create new account for username '${username}'`
			})
			return done(e, {})
		}

		// validate special account creation password
		try {
			await checkPass(req.headers.creation, process.env.ACCOUNT_CREATION_SALT, ACCOUNT_CREATION_HASH)
		} catch (e) {
			console.error(e)
			req.authError = new ApiError({
				error: ERROR.INVALID_REQUEST,
				message: `Could not create new account for username '${username}'`
			})
			return done(e, {})
		}
		
		// check for duplicates
		let account = await Account.findOne({ username })
		if (account) {
			req.authError = new ApiError({
				error: ERROR.INVALID_REQUEST,
				message: `Account with username '${username}' already exists`
			})
			return done(`Account with username '${username}' already exists`, {})
		}

		// hash password, create account
		const salt = crypto.randomBytes(16)
		await crypto.pbkdf2(password, salt, 310000, 32, 'sha256', async (err, hash) => {
			if (err) { throw new Error(err) }
				
			// attempt to create account
			try {
				account = await Account.create({ username, passwordHash: hash, salt })
			} catch (e) {
				throw new Error(e)
			}

			return done(null, account)
		})
	} catch (e) {
		console.error(e)
		req.authError = new ApiError({
			error: ERROR.OPERATION_FAILED,
			message: `Could not create new account for username '${username}'`
		})
		return done(e, {})
	}
}))

passport.use('login', new LocalStrategy({ passReqToCallback: true }, async (req, username, password, done) => {
	try {
		// pull account for username
		let account = await Account.findOne({ username }, { createdAt: 0, updatedAt: 0 })

		// make sure account exists
		if (!account) {
			req.authError = new ApiError({
				error: ERROR.UNAUTHORIZED,
				message: 'Incorrect username or password'
			})
			return done('Incorrect username or password', {})
		}

		// authenticate
		await crypto.pbkdf2(password, account.salt, 310000, 32, 'sha256', (err, hash) => {
			if (err) {
				console.error(err)
				req.authError = new ApiError({
					error: ERROR.OPERATION_FAILED,
					message: 'Could not authenticate'
				})
				return done(err, {})
			}

			if (!crypto.timingSafeEqual(account.passwordHash, hash)) {
				req.authError = new ApiError({
					error: ERROR.UNAUTHORIZED,
					message: 'Incorrect username or password'
				})
				return done('Incorrect username or password', {})
			}

			return done(null, account)
		})
	} catch (e) {
		console.error(e)
		return done(e)
	}
}))

passport.use(new JwtStrategy({
	secretOrKey: process.env.JWT_SECRET,
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	passReqToCallback: true
}, async (req, token, done) => {
	try {
		let account = await Account.findOne({ username: token.username }, { createdAt: 0, updatedAt: 0 })
		if (!account) {
			req.authUser = null
			return done('Invalid JWT', done)	
		}
		req.authUser = account
		return done(null, done)
	} catch (e) {
		console.error(e)
		req.authUser = null
		return done(e, done)
	}
}))

const AuthHandler = (mode) => {
	const router = express.Router()

	// first, use appropriate default Passport.js router
	router.use(passport.authenticate(mode, { failWithError: true }))

	// Passport.js doesn't support JSON responses (because it's got trash UX), so we wrap errors ourselves
	router.use(async (err, req, res, next) => {
		// handle errors that may have occurred while attempting auth
		if (req.authError) {
			await req.authError.send(res)
			return
		}

		// handle errors raised by Passport.js (invalid request, etc.)
		let error
		switch (err.status) {
			case 401:
				error = new ApiError({
					error: ERROR.UNAUTHORIZED,
					message: err.message
				})
				break
			case 403:
				error = new ApiError({
					error: ERROR.FORBIDDEN,
					message: err.message
				})
				break
			case 404:
				error = new ApiError({
					error: ERROR.NOT_FOUND,
					message: err.message
				})
				break
			case 400:
			default:
				error = new ApiError({
					error: ERROR.INVALID_REQUEST,
					message: err.message
				})
		}
		await error.send(res)
		return
	})

	return router
}

const JwtChecker = (redirect) => {
	const router = express.Router()

	// if we receive the JWT as an HTTP-only cookie, we'll need to treat it as an auth BEARER token
	// we should not overwrite the default auth BEARER token
	router.use(async (req, res, next) => {
		if (!Object.keys(req.headers).includes('authorization') && process.env.JWT_NAME in req.cookies) {
			req.headers.authorization = `Bearer ${req.cookies[process.env.JWT_NAME]}`
		}
		next()
	})

	// handle regular JWT processing with Passport.js
	router.use(passport.authenticate('jwt', { session: false, failWithError: true }))

	// Passport.js doesn't support JSON responses (because it's got trash UX), so we wrap errors ourselves
	router.use(async (req, res, next) => {
		if (!req.authUser) {
			if (redirect !== undefined) {
				res.redirect(redirect)
				return
			} else {
				let error = new ApiError({
					error: ERROR.UNAUTHORIZED,
					message: `Invalid or expired JWT, please reauthenticate`
				})
				await error.send(res)
			}
			return
		}
		next()
	})

	router.use(async (err, req, res, next) => {
		if (redirect !== undefined) {
			res.redirect(redirect)
		} else {
			let error = new ApiError({
				error: ERROR.UNAUTHORIZED,
				message: `Invalid or expired JWT, please reauthenticate`
			})
			await error.send(res)
		}
	})

	return router
}

const Auth = (method) => {
	switch (method) {
		case 'create':
		case 'login':
			return AuthHandler(method)
			break
		case 'jwt':
			return JwtChecker()
			break
		case 'jwt-relogin':
			return JwtChecker('/login')
			break
		default:
			throw new Error(`Unknown authorization strategy: '${method}'`)
	}
}

passport.serializeUser((user, done) => {
	done(null, user)
})

passport.deserializeUser((user, done) => {
	done(null, user)
})

export {
	JwtChecker,
	generateJwt,
	configureCookie,
	expireCookie,
	Auth
}
